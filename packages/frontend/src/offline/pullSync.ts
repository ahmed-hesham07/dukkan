/**
 * Pull sync — fetches server data into IndexedDB on login / app startup.
 * This makes the app work correctly even when there is pre-existing server-side
 * data (e.g. data seeded directly into the database or created on another device).
 */

import { apiGet } from '../api/client';
import { localDb } from './db';
import { log } from '../lib/logger';
import type { LocalProduct, LocalCustomer, LocalOrder } from './db';
import type { Product, Customer, Order } from '@dukkan/shared';

let pulling = false;

export async function pullFromServer(tenantId: string): Promise<void> {
  if (pulling) return;
  pulling = true;

  try {
    log.info('Pull sync starting', { tenantId });

    await Promise.all([
      pullProducts(tenantId),
      pullCustomers(tenantId),
      pullOrders(tenantId),
    ]);

    log.info('Pull sync complete', { tenantId });
  } catch (err) {
    // Non-fatal — offline or server error; local data still usable
    log.warn('Pull sync failed (non-fatal)', { error: (err as Error).message });
  } finally {
    pulling = false;
  }
}

async function pullProducts(tenantId: string) {
  const products = await apiGet<Product[]>('/inventory');
  if (!products?.length) return;

  const toUpsert: LocalProduct[] = products.map((p) => ({
    id: p.id,
    tenantId,
    name: p.name,
    price: p.price,
    costPrice: (p as LocalProduct).costPrice,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    synced: true,
  }));

  await localDb.transaction('rw', localDb.products, async () => {
    // Remove stale entries for this tenant, then bulk-add fresh data
    await localDb.products.where('tenantId').equals(tenantId).delete();
    await localDb.products.bulkAdd(toUpsert);
  });

  log.info('Products pulled', { count: toUpsert.length, tenantId });
}

async function pullCustomers(tenantId: string) {
  const customers = await apiGet<Customer[]>('/customers');
  if (!customers?.length) return;

  const toUpsert: LocalCustomer[] = customers.map((c) => ({
    id: c.id,
    tenantId,
    name: c.name,
    phone: c.phone,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    synced: true,
  }));

  await localDb.transaction('rw', localDb.customers, async () => {
    await localDb.customers.where('tenantId').equals(tenantId).delete();
    await localDb.customers.bulkAdd(toUpsert);
  });

  log.info('Customers pulled', { count: toUpsert.length, tenantId });
}

async function pullOrders(tenantId: string) {
  // Fetch recent 100 orders
  const orders = await apiGet<Order[]>('/orders?limit=100');
  if (!orders?.length) return;

  const toUpsert: LocalOrder[] = orders.map((o) => ({
    id: o.id,
    clientId: o.clientId ?? o.id,
    tenantId,
    customerId: o.customerId ?? null,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    status: o.status,
    total: Number(o.total),
    paymentMethod: o.paymentMethod ?? 'cash',
    discountAmount: Number(o.discountAmount ?? 0),
    discountReason: o.discountReason ?? null,
    notes: o.notes ?? null,
    items: (o.items ?? []).map((item) => ({
      localId: undefined,
      orderId: o.id,
      productId: item.productId ?? null,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    createdAt: o.createdAt,
    syncedAt: o.syncedAt ?? o.createdAt,
    synced: true,
  }));

  await localDb.transaction('rw', localDb.orders, async () => {
    // Only add orders that aren't already in IDB (avoid overwriting unsynced local orders)
    const existingClientIds = new Set(
      await localDb.orders.where('tenantId').equals(tenantId).toArray().then((r) => r.map((o) => o.clientId))
    );
    const newOrders = toUpsert.filter((o) => !existingClientIds.has(o.clientId));
    if (newOrders.length) await localDb.orders.bulkAdd(newOrders);
  });

  log.info('Orders pulled', { count: toUpsert.length, tenantId });
}
