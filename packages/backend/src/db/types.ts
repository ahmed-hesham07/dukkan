import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  customers: CustomersTable;
  products: ProductsTable;
  orders: OrdersTable;
  order_items: OrderItemsTable;
  sync_log: SyncLogTable;
}

export interface CustomersTable {
  id: Generated<string>;
  phone: string;
  name: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, never>;
}

export interface ProductsTable {
  id: Generated<string>;
  name: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, never>;
}

export interface OrdersTable {
  id: string;
  client_id: string;
  customer_id: string | null;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
  synced_at: ColumnType<Date, never, never>;
}

export interface OrderItemsTable {
  id: Generated<string>;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface SyncLogTable {
  client_id: string;
  entity_type: string;
  resolved_at: ColumnType<Date, never, never>;
}

export type Customer = Selectable<CustomersTable>;
export type NewCustomer = Insertable<CustomersTable>;
export type CustomerUpdate = Updateable<CustomersTable>;

export type Product = Selectable<ProductsTable>;
export type NewProduct = Insertable<ProductsTable>;
export type ProductUpdate = Updateable<ProductsTable>;

export type Order = Selectable<OrdersTable>;
export type NewOrder = Insertable<OrdersTable>;

export type OrderItem = Selectable<OrderItemsTable>;
export type NewOrderItem = Insertable<OrderItemsTable>;
