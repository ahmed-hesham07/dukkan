export type RefundMethod = 'cash' | 'card' | 'vodafone_cash' | 'instapay' | 'credit_note';

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string | null;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  tenantId: string;
  total: number;
  refundMethod: RefundMethod;
  notes: string | null;
  createdAt: string;
  items: ReturnItem[];
}

export interface CreateReturnItemInput {
  orderItemId: string;
  quantity: number;
}

export interface CreateReturnInput {
  items: CreateReturnItemInput[];
  refundMethod: RefundMethod;
  notes?: string;
}
