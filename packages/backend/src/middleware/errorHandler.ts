import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack);
  res.status(500).json({ data: null, error: 'خطأ داخلي في الخادم' });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ data: null, error: 'المورد غير موجود' });
}
