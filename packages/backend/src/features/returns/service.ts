import { db } from '../../db/client.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/AppError.js';
import type { CreateReturnInput } from '@dukkan/shared';

export async function createReturn(orderId: string, input: CreateReturnInput, tenantId: string) {
  const log = logger.child({ fn: 'createReturn', orderId, tenantId });

  // Verify order belongs to tenant
  const order = await db
    .selectFrom('orders')
    .selectAll()
    .where('id', '=', orderId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!order) throw new AppError('notFound', 'Order not found');

  // Fetch the relevant order items
  const orderItemIds = input.items.map((i) => i.orderItemId);
  const orderItems = await db
    .selectFrom('order_items')
    .selectAll()
    .where('order_id', '=', orderId)
    .where('id', 'in', orderItemIds)
    .execute();

  if (orderItems.length !== input.items.length) {
    throw new AppError('validation', 'One or more order items not found in this order');
  }

  // Validate quantities
  for (const returnItem of input.items) {
    const original = orderItems.find((oi) => oi.id === returnItem.orderItemId);
    if (!original) throw new AppError('validation', `Order item ${returnItem.orderItemId} not found`);
    if (returnItem.quantity > original.quantity) {
      throw new AppError('validation', `Cannot return more than ordered for item "${original.name}"`);
    }
  }

  const total = input.items.reduce((sum, ri) => {
    const original = orderItems.find((oi) => oi.id === ri.orderItemId)!;
    return sum + original.price * ri.quantity;
  }, 0);

  return db.transaction().execute(async (trx) => {
    const ret = await trx
      .insertInto('returns')
      .values({
        tenant_id: tenantId,
        order_id: orderId,
        total,
        refund_method: input.refundMethod,
        notes: input.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const itemRows = input.items.map((ri) => {
      const original = orderItems.find((oi) => oi.id === ri.orderItemId)!;
      return {
        return_id: ret.id,
        order_item_id: ri.orderItemId,
        product_id: original.product_id,
        name: original.name,
        price: original.price,
        quantity: ri.quantity,
      };
    });

    const items = await trx
      .insertInto('return_items')
      .values(itemRows)
      .returningAll()
      .execute();

    // Restore stock for each returned product
    for (const ri of input.items) {
      const original = orderItems.find((oi) => oi.id === ri.orderItemId)!;
      if (original.product_id) {
        await trx
          .updateTable('products')
          .set((eb) => ({ stock: eb('stock', '+', ri.quantity) }))
          .where('id', '=', original.product_id!)
          .where('tenant_id', '=', tenantId)
          .execute();
      }
    }

    log.info({ returnId: ret.id, total, items: items.length }, 'Return created');
    return { ...ret, items };
  });
}

export async function listOrderReturns(orderId: string, tenantId: string) {
  const returns = await db
    .selectFrom('returns')
    .selectAll()
    .where('order_id', '=', orderId)
    .where('tenant_id', '=', tenantId)
    .orderBy('created_at', 'desc')
    .execute();

  const result = await Promise.all(
    returns.map(async (ret) => {
      const items = await db
        .selectFrom('return_items')
        .selectAll()
        .where('return_id', '=', ret.id)
        .execute();
      return { ...ret, items };
    })
  );

  return result;
}

export async function getReturn(id: string, tenantId: string) {
  const ret = await db
    .selectFrom('returns')
    .selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!ret) return null;

  const items = await db
    .selectFrom('return_items')
    .selectAll()
    .where('return_id', '=', id)
    .execute();

  return { ...ret, items };
}
