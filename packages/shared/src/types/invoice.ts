import type { Order } from './order.js';
import type { Customer } from './customer.js';

export interface Invoice {
  order: Order;
  customer: Customer | null;
  invoiceNumber: string;
  generatedAt: string;
}
