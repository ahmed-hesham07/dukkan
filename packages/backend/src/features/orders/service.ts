import { db } from '../../db/client.js';
import type { CreateOrderInput } from '@dukkan/shared';

export async function createOrder(input: CreateOrderInput) {
  // Check idempotency: if client_id already synced, return existing
  const existing = await db
    .selectFrom('orders')
    .selectAll()
    .where('client_id', '=', input.clientId)
    .executeTakeFirst();

  if (existing) {
    const items = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', existing.id)
      .execute();
    return { ...existing, items, isDuplicate: true };
  }

  return db.transaction().execute(async (trx) => {
    const order = await trx
      .insertInto('orders')
      .values({
        id: input.clientId,
        client_id: input.clientId,
        customer_id: input.customerId ?? null,
        status: input.status ?? 'pending',
        total: input.total,
        notes: input.notes ?? null,
        created_at: input.createdAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const itemRows = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const items =
      itemRows.length > 0
        ? await trx
            .insertInto('order_items')
            .values(itemRows)
            .returningAll()
            .execute()
        : [];

    // Decrement stock for products
    for (const item of input.items) {
      if (item.productId) {
        await trx
          .updateTable('products')
          .set((eb) => ({ stock: eb('stock', '-', item.quantity) }))
          .where('id', '=', item.productId)
          .where('stock', '>=', item.quantity)
          .execute();
      }
    }

    // Log to sync_log for idempotency tracking
    await trx
      .insertInto('sync_log')
      .values({ client_id: input.clientId, entity_type: 'order' })
      .onConflict((oc) => oc.column('client_id').doNothing())
      .execute();

    return { ...order, items, isDuplicate: false };
  });
}

export async function getOrder(id: string) {
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
    .where('orders.id', '=', id)
    .executeTakeFirst();

  if (!order) return null;

  const items = await db
    .selectFrom('order_items')
    .selectAll()
    .where('order_id', '=', id)
    .execute();

  return { ...order, items };
}

export async function updateOrderStatus(id: string, status: string) {
  const validStatuses = ['pending', 'paid', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return null;

  return db
    .updateTable('orders')
    .set({ status })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
}

export async function listOrders(limit = 50, offset = 0) {
  const orders = await db
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
    .orderBy('orders.created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  return orders;
}
