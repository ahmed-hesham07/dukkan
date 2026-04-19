import { Router } from 'express';
import {
  searchCustomerByPhone,
  upsertCustomer,
  getCustomerOrders,
} from './service.js';
import { getAuthUser } from '../../middleware/auth.js';

export const customersRouter = Router();

customersRouter.get('/', async (req, res, next) => {
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

customersRouter.post('/', async (req, res, next) => {
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

customersRouter.get('/:id/orders', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const orders = await getCustomerOrders(req.params.id, tenantId);
    res.json({ data: orders, error: null });
  } catch (err) {
    next(err);
  }
});
