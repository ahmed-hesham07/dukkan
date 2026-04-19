import { Router } from 'express';
import { createOrder, getOrder, updateOrderStatus, listOrders } from './service.js';
import type { CreateOrderInput } from '@dukkan/shared';

export const ordersRouter = Router();

ordersRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const orders = await listOrders(limit, offset);
    res.json({ data: orders, error: null });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const input = req.body as CreateOrderInput;
    if (!input.clientId || !input.items?.length) {
      res.status(400).json({ data: null, error: 'بيانات الطلب غير مكتملة' });
      return;
    }
    const order = await createOrder(input);
    const statusCode = order.isDuplicate ? 200 : 201;
    res.status(statusCode).json({ data: order, error: null });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ data: null, error: 'الطلب غير موجود' });
      return;
    }
    res.json({ data: order, error: null });
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    if (!status) {
      res.status(400).json({ data: null, error: 'الحالة مطلوبة' });
      return;
    }
    const order = await updateOrderStatus(req.params.id, status);
    if (!order) {
      res.status(404).json({ data: null, error: 'الطلب غير موجود أو الحالة غير صحيحة' });
      return;
    }
    res.json({ data: order, error: null });
  } catch (err) {
    next(err);
  }
});
