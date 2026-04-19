import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import { InvoicePrint } from '../invoices/InvoicePrint';
import type { LocalOrder } from '../../offline/db';
import type { OrderStatus } from '@dukkan/shared';
import { apiPatch } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'delivered', 'cancelled'];

const statusColors: Record<OrderStatus, { bg: string; border: string; color: string }> = {
  pending:   { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
  paid:      { bg: '#F0FDF4', border: '#A7F3D0', color: '#059669' },
  delivered: { bg: '#EDE9FE', border: '#DDD6FE', color: '#7C3AED' },
  cancelled: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useAppStore();
  const { user } = useAuthStore();
  const { lang } = useLanguageStore();
  const tenantId = user?.tenantId ?? '';
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    if (!id || !tenantId) return;
    localDb.orders
      .where('clientId').equals(id)
      .and((o) => o.tenantId === tenantId)
      .first()
      .then((o) => { if (o) setOrder(o); });
  }, [id, tenantId]);

  const changeStatus = async (status: OrderStatus) => {
    if (!order) return;
    try {
      await localDb.orders.where('clientId').equals(order.clientId).modify({ status });
      setOrder({ ...order, status });

      if (!order.synced) {
        await localDb.syncQueue
          .filter((item) => item.clientId === order.clientId && item.entity === 'order')
          .modify((item) => {
            (item.payload as Record<string, unknown>).status = status;
          });
        showToast(t('msg.statusUpdated'));
        return;
      }

      if (navigator.onLine) await apiPatch(`/orders/${order.id}/status`, { status });
      showToast(t('msg.statusUpdated'));
    } catch {
      showToast(t('msg.statusFailed'), 'error');
    }
  };

  /* ── Loading state ── */
  if (!order) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: '#DDD6FE', borderTopColor: '#7C3AED' }} />
          <p className="text-sm font-medium" style={{ color: '#9C94B8' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));

  const sc = statusColors[order.status];

  return (
    <div className="page-container pb-28">

      {/* ── Header ── */}
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" style={{ color: '#7C3AED' }}>
              <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: '#130F2A' }}>{t('orders.orderDetail')}</h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9C94B8' }}>{formatDate(order.createdAt)}</p>
          </div>
          <StatusChip status={order.status} />
        </div>
      </header>

      <div className="p-4 space-y-4">

        {/* ── Status highlight banner ── */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
        >
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
          <span className="text-sm font-bold capitalize" style={{ color: sc.color }}>
            {t(`status.${order.status}`)}
          </span>
          {!order.synced && (
            <span className="ms-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
              {t('common.pending')}
            </span>
          )}
        </div>

        {/* ── Customer info ── */}
        <div className="card">
          <p className="section-label mb-3">{t('customers.title')}</p>
          <p className="font-bold text-lg" style={{ color: '#130F2A' }}>
            {order.customerName || t('orders.unknownCustomer')}
          </p>
          {order.customerPhone && (
            <p className="text-sm mt-0.5 font-medium" style={{ color: '#9C94B8' }}>{order.customerPhone}</p>
          )}
          {order.notes && (
            <p className="text-sm mt-3 pt-3 italic font-medium" style={{ color: '#9C94B8', borderTop: '1px solid #F3F0FF' }}>
              {order.notes}
            </p>
          )}
        </div>

        {/* ── Order items ── */}
        <div className="card">
          <p className="section-label mb-3">{t('orders.items')}</p>
          <div className="space-y-0">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: idx < order.items.length - 1 ? '1px solid #F3F0FF' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#130F2A' }}>{item.name}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#9C94B8' }}>
                    {item.price} × {item.quantity}
                  </p>
                </div>
                <span className="font-black text-base ms-4 flex-shrink-0" style={{ color: '#7C3AED' }}>
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className="flex justify-between items-center mt-4 pt-4"
            style={{ borderTop: '1.5px solid #E8E6F5' }}
          >
            <span className="font-bold" style={{ color: '#6B5B9A' }}>{t('orders.total')}</span>
            <span className="text-2xl font-black" style={{ color: '#7C3AED' }}>
              {order.total.toFixed(2)}
              <span className="text-sm font-semibold ms-1" style={{ color: '#9C94B8' }}>
                {t('common.egp')}
              </span>
            </span>
          </div>
        </div>

        {/* ── Payment method + discount ── */}
        {(order.paymentMethod || order.discountAmount > 0) && (
          <div className="card">
            <p className="section-label mb-3">{t('payment.method')}</p>
            <div className="flex flex-wrap gap-2">
              {order.paymentMethod && (
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-bold"
                  style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                >
                  {t(`payment.${order.paymentMethod}`)}
                </span>
              )}
              {order.discountAmount > 0 && (
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-bold"
                  style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
                >
                  {t('discount.label')}: -{order.discountAmount.toFixed(2)} {t('common.egp')}
                  {order.discountReason && ` (${order.discountReason})`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Change status ── */}
        <div className="card">
          <p className="section-label mb-3">{t('orders.changeStatus')}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUSES.map((s) => {
              const isActive = order.status === s;
              const c = statusColors[s];
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={isActive}
                  className="py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-default"
                  style={
                    isActive
                      ? { background: c.bg, border: `1.5px solid ${c.border}`, color: c.color }
                      : { background: '#F5F4FF', border: '1px solid #E2DFF0', color: '#9C94B8' }
                  }
                >
                  <StatusChip status={s} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        {order.synced && order.status !== 'cancelled' && (
          <button
            className="btn-danger no-print"
            onClick={() => navigate(`/orders/${order.id}/return`)}
          >
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0M9 12l3-3m0 0l3 3m-3-3v6"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('returns.new')}
            </span>
          </button>
        )}

        <button className="btn-secondary no-print" onClick={handlePrint}>
          <span className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('invoice.print')}
          </span>
        </button>

        <div className="hidden">
          <InvoicePrint ref={printRef} order={order} />
        </div>

      </div>
    </div>
  );
}
