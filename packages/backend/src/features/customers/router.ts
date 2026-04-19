import { Router } from 'express';
import {
  searchCustomerByPhone,
  upsertCustomer,
  getCustomerOrders,
} from './service.js';

export const customersRouter = Router();

customersRouter.get('/', async (req, res, next) => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) {
      res.status(400).json({ data: null, error: 'رقم الهاتف مطلوب' });
      return;
    }
    const customers = await searchCustomerByPhone(phone);
    res.json({ data: customers, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/', async (req, res, next) => {
  try {
    const { phone, name } = req.body as { phone: string; name: string };
    if (!phone || !name) {
      res.status(400).json({ data: null, error: 'الاسم ورقم الهاتف مطلوبان' });
      return;
    }
    const customer = await upsertCustomer(phone.trim(), name.trim());
    res.status(201).json({ data: customer, error: null });
  } catch (err) {
    next(err);
  }
});

customersRouter.get('/:id/orders', async (req, res, next) => {
  try {
    const orders = await getCustomerOrders(req.params.id);
    res.json({ data: orders, error: null });
  } catch (err) {
    next(err);
  }
});
