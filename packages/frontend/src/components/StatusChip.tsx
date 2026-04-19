import type { OrderStatus } from '@dukkan/shared';
import { useTranslation } from 'react-i18next';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  delivered: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusStyles[status]}`}>
      {t(`orders.status.${status}`)}
    </span>
  );
}
