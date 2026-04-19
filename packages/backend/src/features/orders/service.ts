import { db } from '../../db/client.js';
import { logger } from '../../lib/logger.js';
import type { CreateOrderInput } from '@dukkan/shared';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate and resolve a customerId before inserting.
 * Returns null when:
 *   - the value is falsy
 *   - the value is not a valid UUID (e.g. old "local-<timestamp>" offline IDs)
 *   - the customer doesn't exist in the DB yet (avoids FK violation)
 *
 * This makes order sync idempotent and safe even when the customer
 * hasn't been synced yet or was created with an invalid local ID.
 */
async function resolveCustomerId(
  rawId: string | null | undefined,
  tenantId: string,
): Promise<string | null> {
  if (!rawId) return null;

  if (!UUID_REGEX.test(rawId)) {
    logger.warn({ rawCustomerId: rawId }, 'createOrder: dropping non-UUID customerId');
    return null;
  }

  const customer = await db
    .selectFrom('customers')
    .select('id')
    .where('id', '=', rawId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!customer) {
    logger.warn({ customerId: rawId, tenantId }, 'createOrder: customer not found in DB, setting customer_id to null');
    return null;
  }

  return customer.id;
}

export async function createOrder(input: CreateOrderInput, tenantId: string) {
  const existing = await db
    .selectFrom('orders')
    .selectAll()
    .where('client_id', '=', input.clientId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (existing) {
    const items = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', existing.id)
      .execute();
    return { ...existing, items, isDuplicate: true };
  }

  const customerId = await resolveCustomerId(input.customerId, tenantId);

  return db.transaction().execute(async (trx) => {
    const order = await trx
      .insertInto('orders')
      .values({
        id: input.clientId,
        client_id: input.clientId,
        tenant_id: tenantId,
        customer_id: customerId,
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

    for (const item of input.items) {
      if (item.productId) {
        await trx
          .updateTable('products')
          .set((eb) => ({ stock: eb('stock', '-', item.quantity) }))
          .where('id', '=', item.productId)
          .where('tenant_id', '=', tenantId)
          .where('stock', '>=', item.quantity)
          .execute();
      }
    }

    await trx
      .insertInto('sync_log')
      .values({ client_id: input.clientId, entity_type: 'order' })
      .onConflict((oc) => oc.column('client_id').doNothing())
      .execute();

    return { ...order, items, isDuplicate: false };
  });
}

export async function getOrder(id: string, tenantId: string) {
  const order = await db
    .selectFrom('orders')
    .leftJoin('customers', 'customers.id', 'orders.customer_id')
    .select([
      'orders.id',
      'orders.client_id',
      'orders.tenant_id',
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
    .where('orders.tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!order) return null;

  const items = await db
    .selectFrom('order_items')
    .selectAll()
    .where('order_id', '=', id)
    .execute();

  return { ...order, items };
}

export async function updateOrderStatus(id: string, status: string, tenantId: string) {
  const validStatuses = ['pending', 'paid', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return null;

  return db
    .updateTable('orders')
    .set({ status })
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .returningAll()
    .executeTakeFirst();
}

export async function listOrders(tenantId: string, limit = 50, offset = 0) {
  return db
    .selectFrom('orders')
    .leftJoin('customers', 'customers.id', 'orders.customer_id')
    .select([
      'orders.id',
      'orders.client_id',
      'orders.tenant_id',
      'orders.customer_id',
      'orders.status',
      'orders.total',
      'orders.notes',
      'orders.created_at',
      'orders.synced_at',
      'customers.name as customer_name',
      'customers.phone as customer_phone',
    ])
    .where('orders.tenant_id', '=', tenantId)
    .orderBy('orders.created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
}
