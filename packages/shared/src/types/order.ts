export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  customerId: string | null;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
  syncedAt: string;
}

export interface CreateOrderItemInput {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  clientId: string;
  customerId?: string;
  status?: OrderStatus;
  total: number;
  notes?: string;
  items: CreateOrderItemInput[];
  createdAt: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}
