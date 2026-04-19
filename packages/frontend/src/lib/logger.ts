const isDev = import.meta.env.DEV;

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: Level;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${ctx}`;
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (isDev) {
    const formatted = formatEntry(entry);
    switch (level) {
      case 'debug': console.debug(formatted); break;
      case 'info':  console.info(formatted);  break;
      case 'warn':  console.warn(formatted);  break;
      case 'error': console.error(formatted, context?.err || ''); break;
    }
  } else {
    // In production only log warn/error — silence debug/info noise
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    }
  }
}

export const log = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info:  (message: string, context?: Record<string, unknown>) => emit('info',  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => emit('warn',  message, context),
  error: (message: string, err?: unknown, context?: Record<string, unknown>) =>
    emit('error', message, {
      ...context,
      err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
    }),
};
