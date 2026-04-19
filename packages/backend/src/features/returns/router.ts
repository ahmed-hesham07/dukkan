import { Router, Request, Response, NextFunction } from 'express';
import { createReturn, listOrderReturns, getReturn } from './service.js';
import { AppError } from '../../lib/AppError.js';

export const returnsRouter = Router();

// POST /api/v1/orders/:id/returns
returnsRouter.post('/orders/:id/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as unknown as Record<string, string>).tenantId;
    const orderId = req.params.id;
    const { items, refundMethod, notes } = req.body as {
      items?: unknown;
      refundMethod?: unknown;
      notes?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('validation', 'items must be a non-empty array');
    }
    if (!refundMethod || typeof refundMethod !== 'string') {
      throw new AppError('validation', 'refundMethod is required');
    }

    const result = await createReturn(orderId, { items, refundMethod, notes } as never, tenantId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id/returns
returnsRouter.get('/orders/:id/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as unknown as Record<string, string>).tenantId;
    const orderId = req.params.id;
    const result = await listOrderReturns(orderId, tenantId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/returns/:id
returnsRouter.get('/returns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as unknown as Record<string, string>).tenantId;
    const id = req.params.id;
    const result = await getReturn(id, tenantId);
    if (!result) throw new AppError('notFound', 'Return not found');
    res.json(result);
  } catch (err) {
    next(err);
  }
});
