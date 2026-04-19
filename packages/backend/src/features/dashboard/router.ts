import { Router, Request, Response, NextFunction } from 'express';
import { getDashboardStats } from './service.js';
import { getAuthUser } from '../../middleware/auth.js';
import { logger } from '../../lib/logger.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const log = logger.child({ fn: 'GET /dashboard', tenantId });
    log.debug('Fetching dashboard stats');

    const stats = await getDashboardStats(tenantId);

    // Prevent browser caching — stats change with every order
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: stats, error: null });
  } catch (err) {
    next(err);
  }
});
