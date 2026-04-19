import { db } from '../../db/client.js';
import { sql } from 'kysely';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/AppError.js';

export async function listAllCustomers(tenantId: string) {
  return db
    .selectFrom('customers')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .orderBy('name', 'asc')
    .limit(500)
    .execute();
}

export async function searchCustomerByPhone(phone: string, tenantId: string) {
  return db
    .selectFrom('customers')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('phone', 'like', `%${phone}%`)
    .limit(10)
    .execute();
}

export async function upsertCustomer(phone: string, name: string, tenantId: string) {
  const existing = await db
    .selectFrom('customers')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('phone', '=', phone)
    .executeTakeFirst();

  if (existing) {
    return db
      .updateTable('customers')
      .set({ name })
      .where('id', '=', existing.id)
      .where('tenant_id', '=', tenantId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  return db
    .insertInto('customers')
    .values({ phone, name, tenant_id: tenantId })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getCustomerOrders(customerId: string, tenantId: string) {
  const orders = await db
    .selectFrom('orders')
    .selectAll()
    .where('tenant_id', '=', tenantId)
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

export async function getCustomerBalance(customerId: string, tenantId: string) {
  const row = await db
    .selectFrom('customer_credit_events')
    .select([
      sql<string>`COALESCE(
        SUM(CASE WHEN type = 'debit'   THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END),
        0
      )`.as('balance'),
    ])
    .where('customer_id', '=', customerId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  return {
    customerId,
    balance: Math.max(0, parseFloat(row?.balance ?? '0')),
  };
}

export async function listCreditEvents(customerId: string, tenantId: string) {
  return db
    .selectFrom('customer_credit_events')
    .selectAll()
    .where('customer_id', '=', customerId)
    .where('tenant_id', '=', tenantId)
    .orderBy('created_at', 'desc')
    .limit(100)
    .execute();
}

export async function recordPayment(
  customerId: string,
  amount: number,
  notes: string | undefined,
  tenantId: string,
) {
  if (!amount || amount <= 0) {
    throw new AppError('validation', 'Payment amount must be greater than zero');
  }

  // Verify customer belongs to tenant
  const customer = await db
    .selectFrom('customers')
    .select('id')
    .where('id', '=', customerId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!customer) throw new AppError('notFound', 'Customer not found');

  const event = await db
    .insertInto('customer_credit_events')
    .values({
      tenant_id: tenantId,
      customer_id: customerId,
      amount,
      type: 'payment',
      order_id: null,
      notes: notes ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  logger.info({ customerId, amount, tenantId }, 'Customer payment recorded');
  return event;
}
