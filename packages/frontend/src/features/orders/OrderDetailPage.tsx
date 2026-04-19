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

const statusGradients: Record<OrderStatus, string> = {
  pending:   'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))',
  paid:      'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
  delivered: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.08))',
  cancelled: 'linear-gradient(135deg, rgba(247,37,133,0.2), rgba(247,37,133,0.08))',
};
const statusBorders: Record<OrderStatus, string> = {
  pending:   'rgba(245,158,11,0.3)',
  paid:      'rgba(16,185,129,0.3)',
  delivered: 'rgba(124,58,237,0.3)',
  cancelled: 'rgba(247,37,133,0.3)',
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
      // Always update the local record first — this is the source of truth for offline.
      await localDb.orders.where('clientId').equals(order.clientId).modify({ status });
      setOrder({ ...order, status });

      if (!order.synced) {
        // Order hasn't reached the backend yet. Update the pending sync-queue payload so
        // the order will be created on the server with the correct status when it syncs.
        // Calling apiPatch here would 404 because the row doesn't exist yet.
        await localDb.syncQueue
          .filter((item) => item.clientId === order.clientId && item.entity === 'order')
          .modify((item) => {
            (item.payload as Record<string, unknown>).status = status;
          });
        showToast(t('msg.statusUpdated'));
        return;
      }

      // Order is confirmed on the backend — update it directly.
      if (navigator.onLine) await apiPatch(`/orders/${order.id}/status`, { status });
      showToast(t('msg.statusUpdated'));
    } catch {
      showToast(t('msg.statusFailed'), 'error');
    }
  };

  if (!order) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 text-white/20 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-white/30 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{t('orders.orderDetail')}</h1>
            <p className="text-xs text-white/40 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <StatusChip status={order.status} />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Customer info */}
        <div
          className="rounded-3xl p-4"
          style={{
            background: 'rgba(20,20,42,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">
            {t('customers.title')}
          </p>
          <p className="font-bold text-white text-lg">
            {order.customerName || t('orders.unknownCustomer')}
          </p>
          {order.customerPhone && (
            <p className="text-sm text-white/40 mt-0.5 font-medium">{order.customerPhone}</p>
          )}
          {order.notes && (
            <p
              className="text-sm mt-3 pt-3 text-white/50 italic"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {order.notes}
            </p>
          )}
        </div>

        {/* Items */}
        <div
          className="rounded-3xl p-4"
          style={{
            background: 'rgba(20,20,42,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">
            {t('orders.items')}
          </p>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {item.price} × {item.quantity}
                  </p>
                </div>
                <span
                  className="font-black text-base ms-4 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div
            className="flex justify-between items-center mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="font-bold text-white/70">{t('orders.total')}</span>
            <span
              className="text-2xl font-black"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {order.total.toFixed(2)}
              <span className="text-sm ms-1" style={{ WebkitTextFillColor: 'rgba(255,255,255,0.4)' }}>
                {t('common.egp')}
              </span>
            </span>
          </div>
        </div>

        {/* Change status */}
        <div
          className="rounded-3xl p-4"
          style={{
            background: 'rgba(20,20,42,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">
            {t('orders.changeStatus')}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUSES.map((s) => {
              const isActive = order.status === s;
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={isActive}
                  className="py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 disabled:cursor-default"
                  style={isActive
                    ? { background: statusGradients[s], border: `1px solid ${statusBorders[s]}` }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  <StatusChip status={s} />
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn-secondary no-print"
          onClick={handlePrint}
        >
          <span className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
