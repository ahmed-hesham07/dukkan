export const ORDER_STATUSES = ['pending', 'paid', 'delivered', 'cancelled'] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'معلق',
  paid: 'مدفوع',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export const LOW_STOCK_THRESHOLD = 5;

export const SYNC_MAX_RETRIES = 5;
export const SYNC_BASE_DELAY_MS = 1000;
export const SYNC_MAX_DELAY_MS = 30000;

export const EGYPT_PHONE_REGEX = /^(\+20|0)?1[0125]\d{8}$/;
