import { Router, Request, Response, NextFunction } from 'express';
import {
  searchCustomerByPhone,
  upsertCustomer,
  getCustomerOrders,
  getCustomerBalance,
  listCreditEvents,
  recordPayment,
} from './service.js';
import { getAuthUser } from '../../middleware/auth.js';
import { AppError } from '../../lib/AppError.js';

export const customersRouter = Router();

customersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const phone = String(req.query.phone || '').trim();
    if (!phone) {
      res.status(400).json({ data: null, error: 'رقم الهاتف مطلوب' });
      return;
    }
    const customers = await searchCustomerByPhone(phone, tenantId);
    res.json({ data: customers, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const { phone, name } = req.body as { phone: string; name: string };
    if (!phone || !name) {
      res.status(400).json({ data: null, error: 'الاسم ورقم الهاتف مطلوبان' });
      return;
    }
    const customer = await upsertCustomer(phone.trim(), name.trim(), tenantId);
    res.status(201).json({ data: customer, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const orders = await getCustomerOrders(req.params.id, tenantId);
    res.json({ data: orders, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/:id/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const balance = await getCustomerBalance(req.params.id, tenantId);
    res.json({ data: balance, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/:id/credit-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const events = await listCreditEvents(req.params.id, tenantId);
    res.json({ data: events, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = getAuthUser(req);
    const { amount, notes } = req.body as { amount?: number; notes?: string };
    if (!amount || typeof amount !== 'number') {
      throw new AppError('validation', 'amount must be a positive number');
    }
    const event = await recordPayment(req.params.id, amount, notes, tenantId);
    res.status(201).json({ data: event, error: null });
  } catch (err) {
    next(err);
  }
});
