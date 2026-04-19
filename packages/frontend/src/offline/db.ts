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
  items: LocalOrderItem[];
  synced: boolean;
}

export interface LocalOrderItem extends Omit<OrderItem, 'id' | 'orderId'> {
  localId?: number;
  orderId: string;
}

export interface LocalCustomer extends Customer {
  localId?: number;
  synced: boolean;
}

export interface LocalProduct extends Product {
  localId?: number;
  synced: boolean;
}

export interface LocalSyncQueueItem extends SyncQueueItem {
  id?: number;
}

class DukkanDatabase extends Dexie {
  orders!: Table<LocalOrder>;
  orderItems!: Table<LocalOrderItem>;
  customers!: Table<LocalCustomer>;
  products!: Table<LocalProduct>;
  syncQueue!: Table<LocalSyncQueueItem>;

  constructor() {
    super('dukkan_v1');
    this.version(1).stores({
      orders: '++localId, clientId, status, createdAt, synced',
      orderItems: '++localId, orderId',
      customers: '++localId, phone, id, synced',
      products: '++localId, id, synced',
      syncQueue: '++id, entity, action, status, createdAt',
    });
  }
}

export const localDb = new DukkanDatabase();
