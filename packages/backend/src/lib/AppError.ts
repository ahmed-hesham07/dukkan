/** Error codes that the client can act on programmatically */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DB_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly meta?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource = 'المورد') {
    return new AppError(`${resource} غير موجود`, 404, 'NOT_FOUND');
  }

  static unauthorized(message = 'غير مصرح بالوصول') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'ممنوع الوصول') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static validation(message: string, meta?: Record<string, unknown>) {
    return new AppError(message, 400, 'VALIDATION_ERROR', meta);
  }

  static internal(message = 'خطأ داخلي في الخادم') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

/** Classify PostgreSQL error codes into AppError */
export function fromDbError(err: unknown): AppError {
  const pgErr = err as { code?: string; constraint?: string; detail?: string };

  switch (pgErr.code) {
    case '23505': // unique_violation
      return new AppError(
        'يوجد تعارض في البيانات — السجل موجود بالفعل',
        409,
        'CONFLICT',
        { constraint: pgErr.constraint, detail: pgErr.detail }
      );
    case '23503': // foreign_key_violation
      return new AppError(
        'مرجع غير صالح — السجل المرتبط غير موجود',
        409,
        'CONFLICT',
        { constraint: pgErr.constraint }
      );
    case '23502': // not_null_violation
      return new AppError(
        'حقل مطلوب مفقود',
        400,
        'VALIDATION_ERROR',
        { constraint: pgErr.constraint }
      );
    case '22P02': // invalid_text_representation
      return new AppError('تنسيق البيانات غير صالح', 400, 'VALIDATION_ERROR');
    case '57014': // query_canceled (timeout)
      return new AppError('انتهت مهلة الاستعلام', 503, 'DB_ERROR');
    default:
      return new AppError('خطأ في قاعدة البيانات', 500, 'DB_ERROR', {
        pgCode: pgErr.code,
      });
  }
}
