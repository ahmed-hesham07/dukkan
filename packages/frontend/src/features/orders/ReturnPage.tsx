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
        .map((item) => ({
          orderItemId: item.id,
          quantity: returnQtys[item.id],
        }));

      await apiPost(`/orders/${order.id}/returns`, {
        items,
        refundMethod,
        notes: notes || undefined,
      });

      showToast(t('returns.success'), 'success');
      navigate(`/orders/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [order, returnQtys, refundMethod, notes, hasAnyQty, submitting, online, id, navigate, showToast, t]);

  if (!online) {
    return (
      <div className="page-container flex items-center justify-center p-8">
        <div className="card p-8 text-center" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <p className="text-4xl mb-4">📶</p>
          <p className="text-amber-400 font-bold text-lg mb-2">{t('returns.noNetwork')}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container flex items-center justify-center p-8">
        <div className="card p-8 text-center">
          <p className="text-white/40 font-medium">{t('common.error')}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-28">
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
          <h1 className="text-xl font-black text-white">{t('returns.title')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Items selection */}
        <div className="rounded-3xl p-4" style={{ background: 'rgba(20,20,42,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">{t('orders.items')}</p>
          <div className="space-y-3">
            {order.items.map((item) => {
              const qty = returnQtys[item.id] ?? 0;
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-white/40">{item.price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReturnQtys((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1) }))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90"
                      style={{ background: 'rgba(247,37,133,0.15)', color: '#f72585', border: '1px solid rgba(247,37,133,0.2)' }}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-black text-white">{qty}</span>
                    <button
                      onClick={() => setReturnQtys((prev) => ({ ...prev, [item.id]: Math.min(item.quantity, (prev[item.id] ?? 0) + 1) }))}
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refund method */}
        <div className="rounded-3xl p-4" style={{ background: 'rgba(20,20,42,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">{t('returns.refundMethod')}</p>
          <div className="flex flex-wrap gap-2">
            {REFUND_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setRefundMethod(m)}
                className="text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
                style={
                  refundMethod === m
                    ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: '1px solid transparent' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {t(`returns.${m}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder={t('orders.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Submit */}
        <button
          className="btn-danger"
          onClick={handleSubmit}
          disabled={!hasAnyQty || submitting}
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {t('common.loading')}
              </span>
            : `↩ ${t('returns.submit')}`
          }
        </button>
      </div>
    </div>
  );
}
