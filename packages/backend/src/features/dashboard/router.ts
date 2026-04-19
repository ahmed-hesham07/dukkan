import { Router, Request, Response, NextFunction } from 'express';
import { getDashboardStats } from './service.js';
import { logger } from '../../lib/logger.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as unknown as Record<string, string>).tenantId;
    const log = logger.child({ fn: 'GET /dashboard', tenantId });
    log.debug('Fetching dashboard stats');

    const stats = await getDashboardStats(tenantId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});
