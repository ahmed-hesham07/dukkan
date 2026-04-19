export type CreditEventType = 'debit' | 'payment';

export interface CustomerCreditEvent {
  id: string;
  tenantId: string;
  customerId: string;
  amount: number;
  type: CreditEventType;
  orderId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerBalance {
  customerId: string;
  balance: number;
}

export interface RecordPaymentInput {
  amount: number;
  notes?: string;
}
