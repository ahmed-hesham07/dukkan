import type { OrderStatus } from '@dukkan/shared';
import { useTranslation } from 'react-i18next';

const cfg: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  paid:      { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  delivered: { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
      {t(`orders.status.${status}`)}
    </span>
  );
}
