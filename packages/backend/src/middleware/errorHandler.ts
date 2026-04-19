import type { Request, Response, NextFunction } from 'express';
import { AppError, fromDbError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

/** Detect raw PostgreSQL errors from the `pg` driver */
function isPgError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    /^\d{5}$/.test((err as Record<string, unknown>).code as string)
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Wrap raw DB errors
  const appErr: AppError = err instanceof AppError
    ? err
    : isPgError(err)
      ? fromDbError(err)
      : new AppError(
          err instanceof Error ? err.message : 'خطأ غير معروف',
          500,
          'INTERNAL_ERROR'
        );

  // Log at appropriate level
  if (appErr.statusCode >= 500) {
    logger.error(
      {
        err: { message: appErr.message, stack: appErr.stack, code: appErr.code, meta: appErr.meta },
        req: { method: req.method, url: req.url, id: (req as unknown as Record<string, unknown>).id },
      },
      `[${appErr.code}] ${appErr.message}`
    );
  } else if (appErr.statusCode >= 400) {
    logger.warn(
      {
        code: appErr.code,
        statusCode: appErr.statusCode,
        meta: appErr.meta,
        req: { method: req.method, url: req.url },
      },
      `[${appErr.code}] ${appErr.message}`
    );
  }

  res.status(appErr.statusCode).json({
    data: null,
    error: appErr.message,
    code: appErr.code,
    ...(appErr.meta ? { meta: appErr.meta } : {}),
  });
}

export function notFound(req: Request, res: Response) {
  logger.warn({ method: req.method, url: req.url }, '404 Not Found');
  res.status(404).json({ data: null, error: 'المورد غير موجود', code: 'NOT_FOUND' });
}
