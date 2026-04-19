import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev
    ? {
        transport: {
          target: 'pino/file',
          options: { destination: 1 }, // stdout with default formatter in dev
        },
        formatters: {
          level(label) {
            return { level: label.toUpperCase() };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        // Production: structured JSON for log aggregators
        formatters: {
          level(label) {
            return { level: label.toUpperCase() };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
          paths: ['req.headers.authorization', 'body.password', 'body.password_hash'],
          censor: '[REDACTED]',
        },
      }),
});

export default logger;
