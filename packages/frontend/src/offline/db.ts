import Dexie, { type Table } from 'dexie';
import type {
  Order,
  Customer,
  Product,
  SyncQueueItem,
  OrderItem,
} from '@dukkan/shared';

export interface LocalOrder extends Omit<Order, 'items'> {
  localId?: number;
  tenantId: string;
  items: LocalOrderItem[];
  synced: boolean;
}

export interface LocalOrderItem extends Omit<OrderItem, 'id' | 'orderId'> {
  localId?: number;
  orderId: string;
}

export interface LocalCustomer extends Customer {
  localId?: number;
  tenantId: string;
  synced: boolean;
}

export interface LocalProduct extends Product {
  localId?: number;
  tenantId: string;
  synced: boolean;
}

export interface LocalSyncQueueItem extends SyncQueueItem {
  id?: number;
  tenantId: string;
}

class DukkanDatabase extends Dexie {
  orders!: Table<LocalOrder>;
  orderItems!: Table<LocalOrderItem>;
  customers!: Table<LocalCustomer>;
  products!: Table<LocalProduct>;
  syncQueue!: Table<LocalSyncQueueItem>;

  constructor() {
    super('dukkan_v1');

    // v1 — original schema (no tenantId)
    this.version(1).stores({
      orders: '++localId, clientId, status, createdAt, synced',
      orderItems: '++localId, orderId',
      customers: '++localId, phone, id, synced',
      products: '++localId, id, synced',
      syncQueue: '++id, entity, action, status, createdAt',
    });

    // v2 — add tenantId index to all tables
    this.version(2)
      .stores({
        orders: '++localId, clientId, tenantId, status, createdAt, synced',
        orderItems: '++localId, orderId',
        customers: '++localId, phone, id, tenantId, synced',
        products: '++localId, id, tenantId, synced',
        syncQueue: '++id, entity, action, status, tenantId, createdAt',
      })
      .upgrade((tx) => {
        // Existing rows get tenantId = '' — they will be cleared on first tenant login
        return Promise.all([
          tx.table('orders').toCollection().modify({ tenantId: '' }),
          tx.table('customers').toCollection().modify({ tenantId: '' }),
          tx.table('products').toCollection().modify({ tenantId: '' }),
          tx.table('syncQueue').toCollection().modify({ tenantId: '' }),
        ]);
      });
  }
}

export const localDb = new DukkanDatabase();

/** Clear all local data belonging to a specific tenant (used on logout) */
export async function clearTenantData(tenantId: string): Promise<void> {
  await Promise.all([
    localDb.orders.where('tenantId').equals(tenantId).delete(),
    localDb.customers.where('tenantId').equals(tenantId).delete(),
    localDb.products.where('tenantId').equals(tenantId).delete(),
    localDb.syncQueue.where('tenantId').equals(tenantId).delete(),
  ]);
}
