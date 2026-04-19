import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { apiGet, apiPost } from '../../api/client';
import type { LocalCustomer, LocalOrder } from '../../offline/db';
import type { CustomerCreditEvent, CustomerBalance } from '@dukkan/shared';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showToast } = useAppStore();
  const { lang } = useLanguageStore();
  const tenantId = user?.tenantId ?? '';

  const [customer, setCustomer] = useState<LocalCustomer | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [creditEvents, setCreditEvents] = useState<CustomerCreditEvent[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'credit'>('orders');

  const loadData = useCallback(async () => {
    if (!id || !tenantId) return;
    const c = await localDb.customers.where('id').equals(id).and((c) => c.tenantId === tenantId).first();
    setCustomer(c ?? null);
    const o = await localDb.orders.where('tenantId').equals(tenantId).and((o) => o.customerId === id).reverse().sortBy('createdAt');
    setOrders(o);

    if (navigator.onLine) {
      try {
        const b = await apiGet<{ data: CustomerBalance }>(`/customers/${id}/balance`);
        setBalance(b.data);
        const ev = await apiGet<{ data: CustomerCreditEvent[] }>(`/customers/${id}/credit-events`);
        setCreditEvents(ev.data);
      } catch { /* offline OK */ }
    }
  }, [id, tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || !id) return;
    setPaymentLoading(true);
    try {
      await apiPost(`/customers/${id}/payments`, { amount, notes: paymentNotes || undefined });
      showToast(t('credit.paymentSuccess'), 'success');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ── Loading state ── */
  if (!customer) {
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

  const totalSpent = orders
    .filter((o) => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const formatShort = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));

  const initials = customer.name.charAt(0).toUpperCase();
  const hasDebt = balance && balance.balance > 0;

  return (
    <div className="page-container pb-24">

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
          <h1 className="text-xl font-black truncate" style={{ color: '#130F2A' }}>{customer.name}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">

        {/* ── Profile card ── */}
        <div
          className="rounded-3xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 2px 12px rgba(19,15,42,0.06)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}
            >
              {initials}
            </div>
            <div>
              <p className="font-black text-xl" style={{ color: '#130F2A' }}>{customer.name}</p>
              <p className="font-medium mt-0.5" style={{ color: '#9C94B8' }}>{customer.phone}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid #F3F0FF' }}>
            <div className="rounded-2xl p-3 text-center" style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
              <p className="text-2xl font-black" style={{ color: '#7C3AED' }}>{orders.length}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#9C94B8' }}>{t('customers.ordersCount')}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
              <p className="text-2xl font-black" style={{ color: '#059669' }}>{totalSpent.toFixed(0)}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#9C94B8' }}>{t('customers.egpSpent')}</p>
            </div>
          </div>
        </div>

        {/* ── Balance / Debt card ── */}
        {balance !== null && (
          <div
            className="rounded-3xl p-4"
            style={{
              background: hasDebt ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${hasDebt ? '#FECACA' : '#A7F3D0'}`,
            }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9C94B8' }}>
                  {t('credit.balance')}
                </p>
                <p className="text-2xl font-black" style={{ color: hasDebt ? '#DC2626' : '#059669' }}>
                  {hasDebt ? `${balance.balance.toFixed(2)} ${t('common.egp')}` : t('credit.clear')}
                </p>
                {hasDebt && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#DC2626' }}>
                    {t('credit.owed')} {t('common.egp')}{balance.balance.toFixed(2)}
                  </p>
                )}
              </div>
              {hasDebt && navigator.onLine && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2.5 rounded-2xl text-sm font-bold text-white flex-shrink-0"
                  style={{ background: '#059669' }}
                >
                  {t('credit.recordPayment')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div
          className="flex gap-1.5 p-1 rounded-2xl"
          style={{ background: '#F3F0FF', border: '1px solid #E8E6F5' }}
        >
          {(['orders', 'credit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={
                activeTab === tab
                  ? { background: '#FFFFFF', color: '#7C3AED', boxShadow: '0 1px 6px rgba(19,15,42,0.08)' }
                  : { color: '#9C94B8' }
              }
            >
              {tab === 'orders' ? t('customers.history') : t('credit.events')}
            </button>
          ))}
        </div>

        {/* ── Orders tab ── */}
        {activeTab === 'orders' && (
          orders.length === 0 ? (
            <div
              className="rounded-3xl p-8 flex flex-col items-center"
              style={{ background: '#FFFFFF', border: '1px solid #E8E6F5' }}
            >
              <p className="font-medium" style={{ color: '#9C94B8' }}>{t('customers.noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order) => (
                <button
                  key={order.clientId}
                  className="w-full text-start transition-all active:scale-95"
                  onClick={() => navigate(`/orders/${order.clientId}`)}
                >
                  <div
                    className="rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 4px rgba(19,15,42,0.04)' }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: '#130F2A' }}>
                        {order.items.length} {t('orders.itemCount')}
                      </p>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: '#9C94B8' }}>
                        {formatShort(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusChip status={order.status} />
                      <span className="font-black text-sm" style={{ color: '#7C3AED' }}>
                        {order.total.toFixed(2)} {t('common.egp')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* ── Credit events tab ── */}
        {activeTab === 'credit' && (
          creditEvents.length === 0 ? (
            <div
              className="rounded-3xl p-8 flex flex-col items-center"
              style={{ background: '#FFFFFF', border: '1px solid #E8E6F5' }}
            >
              <p className="font-medium" style={{ color: '#9C94B8' }}>{t('credit.noEvents')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creditEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl p-3.5 flex items-center justify-between"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${ev.type === 'debit' ? '#FECACA' : '#A7F3D0'}`,
                  }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: ev.type === 'debit' ? '#DC2626' : '#059669' }}>
                      {ev.type === 'debit' ? t('credit.debit') : t('credit.payment')}
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#9C94B8' }}>
                      {formatDate(ev.createdAt)}
                    </p>
                    {ev.notes && (
                      <p className="text-xs mt-0.5 italic" style={{ color: '#9C94B8' }}>{ev.notes}</p>
                    )}
                  </div>
                  <p className="font-black text-base" style={{ color: ev.type === 'debit' ? '#DC2626' : '#059669' }}>
                    {ev.type === 'debit' ? '+' : '-'}{ev.amount.toFixed(2)} {t('common.egp')}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      {/* ── Payment modal — light bottom sheet ── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(19,15,42,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}
        >
          <div
            className="w-full rounded-t-3xl p-6 space-y-4 animate-slide-up"
            style={{ background: '#FFFFFF', boxShadow: '0 -4px 32px rgba(19,15,42,0.12)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ color: '#130F2A' }}>{t('credit.recordPayment')}</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: '#F3F0FF', color: '#9C94B8' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <input
              className="input-field"
              type="number"
              inputMode="decimal"
              placeholder={t('credit.amount')}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <input
              className="input-field"
              placeholder={t('credit.notes')}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn-primary"
                onClick={handleRecordPayment}
                disabled={!paymentAmount || paymentLoading}
              >
                {paymentLoading ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
