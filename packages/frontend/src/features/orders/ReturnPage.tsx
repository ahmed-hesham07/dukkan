import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { apiGet, apiPost } from '../../api/client';
import type { RefundMethod, Order } from '@dukkan/shared';

const REFUND_METHODS: RefundMethod[] = ['cash', 'card', 'vodafone_cash', 'instapay', 'credit_note'];

export default function ReturnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useAppStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [online] = useState(() => navigator.onLine);

  useEffect(() => {
    if (!id || !online) { setLoading(false); return; }
    apiGet<Order>(`/orders/${id}`)
      .then((o) => {
        setOrder(o);
        const initial: Record<string, number> = {};
        o.items.forEach((item) => { initial[item.id] = 0; });
        setReturnQtys(initial);
      })
      .catch(() => showToast(t('common.error'), 'error'))
      .finally(() => setLoading(false));
  }, [id, online, showToast, t]);

  const hasAnyQty = Object.values(returnQtys).some((q) => q > 0);

  const handleSubmit = useCallback(async () => {
    if (!order || !hasAnyQty || submitting || !online) return;
    setSubmitting(true);
    try {
      const items = order.items
        .filter((item) => (returnQtys[item.id] ?? 0) > 0)
        .map((item) => ({ orderItemId: item.id, quantity: returnQtys[item.id] }));
      await apiPost(`/orders/${order.id}/returns`, { items, refundMethod, notes: notes || undefined });
      showToast(t('returns.success'), 'success');
      navigate(`/orders/${id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [order, returnQtys, refundMethod, notes, hasAnyQty, submitting, online, id, navigate, showToast, t]);

  /* ── Offline state ── */
  if (!online) {
    return (
      <div className="page-container flex items-center justify-center p-8">
        <div className="card p-8 text-center" style={{ borderColor: '#FDE68A' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" style={{ color: '#D97706' }}>
              <path d="M1 6l7.5 7.5M1 6h8V1M23 18l-7.5-7.5M23 18h-8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: '#D97706' }}>{t('returns.noNetwork')}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading) {
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

  /* ── Error / not found ── */
  if (!order) {
    return (
      <div className="page-container flex items-center justify-center p-8">
        <div className="card p-8 text-center">
          <p className="font-medium" style={{ color: '#9C94B8' }}>{t('common.error')}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('returns.title')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">

        {/* ── Items selection ── */}
        <div className="card">
          <p className="section-label mb-3">{t('orders.items')}</p>
          <div className="space-y-0">
            {order.items.map((item, idx) => {
              const qty = returnQtys[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: idx < order.items.length - 1 ? '1px solid #F3F0FF' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#130F2A' }}>{item.name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#9C94B8' }}>
                      {item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setReturnQtys((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1) }))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90"
                      style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-black text-base" style={{ color: '#130F2A' }}>{qty}</span>
                    <button
                      onClick={() => setReturnQtys((prev) => ({ ...prev, [item.id]: Math.min(item.quantity, (prev[item.id] ?? 0) + 1) }))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90"
                      style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Refund method ── */}
        <div className="card">
          <p className="section-label mb-3">{t('returns.refundMethod')}</p>
          <div className="flex flex-wrap gap-2">
            {REFUND_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setRefundMethod(m)}
                className="text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
                style={
                  refundMethod === m
                    ? { background: '#7C3AED', color: '#FFF', border: '1px solid #7C3AED' }
                    : { background: '#F5F4FF', color: '#6B5B9A', border: '1px solid #E2DFF0' }
                }
              >
                {t(`returns.${m}`)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notes ── */}
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder={t('orders.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* ── Submit ── */}
        <button
          className="btn-danger"
          onClick={handleSubmit}
          disabled={!hasAnyQty || submitting}
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('common.loading')}
              </span>
            : t('returns.submit')
          }
        </button>

      </div>
    </div>
  );
}
