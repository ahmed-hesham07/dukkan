import type { OrderStatus } from '@dukkan/shared';
import { useTranslation } from 'react-i18next';

const statusConfig: Record<OrderStatus, {
  gradient: string;
  glow: string;
  dot: string;
  label: string;
}> = {
  pending: {
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.08) 100%)',
    glow: '0 0 12px rgba(245,158,11,0.35)',
    dot: '#f59e0b',
    label: '',
  },
  paid: {
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)',
    glow: '0 0 12px rgba(16,185,129,0.35)',
    dot: '#10b981',
    label: '',
  },
  delivered: {
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.08) 100%)',
    glow: '0 0 12px rgba(124,58,237,0.35)',
    dot: '#a855f7',
    label: '',
  },
  cancelled: {
    gradient: 'linear-gradient(135deg, rgba(247,37,133,0.2) 0%, rgba(247,37,133,0.08) 100%)',
    glow: '0 0 12px rgba(247,37,133,0.35)',
    dot: '#f72585',
    label: '',
  },
};

const statusTextColors: Record<OrderStatus, string> = {
  pending:   '#f59e0b',
  paid:      '#10b981',
  delivered: '#a855f7',
  cancelled: '#f72585',
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
      style={{
        background: cfg.gradient,
        border: `1px solid ${statusTextColors[status]}30`,
        boxShadow: cfg.glow,
        color: statusTextColors[status],
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
      {t(`orders.status.${status}`)}
    </span>
  );
}
