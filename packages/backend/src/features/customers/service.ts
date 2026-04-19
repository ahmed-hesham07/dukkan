import { db } from '../../db/client.js';

export async function searchCustomerByPhone(phone: string) {
  return db
    .selectFrom('customers')
    .selectAll()
    .where('phone', 'like', `%${phone}%`)
    .limit(10)
    .execute();
}

export async function upsertCustomer(phone: string, name: string) {
  const existing = await db
    .selectFrom('customers')
    .selectAll()
    .where('phone', '=', phone)
    .executeTakeFirst();

  if (existing) {
    return db
      .updateTable('customers')
      .set({ name })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  return db
    .insertInto('customers')
    .values({ phone, name })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getCustomerOrders(customerId: string) {
  const orders = await db
    .selectFrom('orders')
    .selectAll()
    .where('customer_id', '=', customerId)
    .orderBy('created_at', 'desc')
    .limit(50)
    .execute();

  const orderIds = orders.map((o) => o.id);
  if (orderIds.length === 0) return orders.map((o) => ({ ...o, items: [] }));

  const items = await db
    .selectFrom('order_items')
    .selectAll()
    .where('order_id', 'in', orderIds)
    .execute();

  return orders.map((order) => ({
    ...order,
    items: items.filter((i) => i.order_id === order.id),
  }));
}
