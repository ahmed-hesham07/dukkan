import { Router } from 'express';
import { db } from '../../db/client.js';

export const invoicesRouter = Router();

invoicesRouter.get('/:orderId', async (req, res, next) => {
  try {
    const order = await db
      .selectFrom('orders')
      .leftJoin('customers', 'customers.id', 'orders.customer_id')
      .select([
        'orders.id',
        'orders.client_id',
        'orders.customer_id',
        'orders.status',
        'orders.total',
        'orders.notes',
        'orders.created_at',
        'orders.synced_at',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
      ])
      .where('orders.id', '=', req.params.orderId)
      .executeTakeFirst();

    if (!order) {
      res.status(404).json({ data: null, error: 'الطلب غير موجود' });
      return;
    }

    const items = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', order.id)
      .execute();

    const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
    const invoice = {
      invoiceNumber,
      generatedAt: new Date().toISOString(),
      order: { ...order, items },
      customer: order.customer_id
        ? {
            id: order.customer_id,
            name: order.customer_name,
            phone: order.customer_phone,
          }
        : null,
    };

    res.json({ data: invoice, error: null });
  } catch (err) {
    next(err);
  }
});
