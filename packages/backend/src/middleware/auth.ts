import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../features/auth/service.js';
import { db } from '../db/client.js';
import { logger } from '../lib/logger.js';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    username: string;
    role: string;
  };
}

export function getTenantId(req: Request): string {
  return (req as unknown as AuthenticatedRequest).user.tenantId;
}

export function getAuthUser(req: Request): AuthenticatedRequest['user'] {
  return (req as unknown as AuthenticatedRequest).user;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ url: req.url, method: req.method }, 'Auth: missing or malformed Bearer token');
    res.status(401).json({ data: null, error: 'غير مصرح بالوصول', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);

    // Verify the tenant still exists — catches stale tokens after a DB wipe or tenant deletion
    const tenant = await db
      .selectFrom('tenants')
      .select('id')
      .where('id', '=', payload.tenantId)
      .executeTakeFirst();

    if (!tenant) {
      logger.warn({ tenantId: payload.tenantId, url: req.url }, 'Auth: tenant not found — token is stale');
      res.status(401).json({ data: null, error: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً', code: 'TENANT_NOT_FOUND' });
      return;
    }

    (req as unknown as AuthenticatedRequest).user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      username: payload.username,
      role: payload.role,
    };

    logger.debug(
      { userId: payload.userId, tenantId: payload.tenantId, url: req.url },
      'Auth: request authenticated'
    );

    next();
  } catch (err) {
    next(err);
  }
}
