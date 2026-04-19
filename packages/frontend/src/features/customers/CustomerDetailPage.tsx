import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { LocalCustomer, LocalOrder } from '../../offline/db';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { lang } = useLanguageStore();
  const tenantId = user?.tenantId ?? '';

  const [customer, setCustomer] = useState<LocalCustomer | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    if (!id || !tenantId) return;
    localDb.customers.where('id').equals(id)
      .and((c) => c.tenantId === tenantId)
      .first().then((c) => setCustomer(c ?? null));
    localDb.orders.where('tenantId').equals(tenantId)
      .and((o) => o.customerId === id)
      .reverse().sortBy('createdAt').then(setOrders);
  }, [id, tenantId]);

  if (!customer) {
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

  const totalSpent = orders
    .filter((o) => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const formatShort = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short', day: 'numeric',
    }).format(new Date(iso));

  const initials = customer.name.charAt(0).toUpperCase();

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
          <h1 className="text-xl font-black text-white">{customer.name}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile card */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}
            >
              {initials}
            </div>
            <div>
              <p className="font-black text-white text-xl">{customer.name}</p>
              <p className="text-white/40 font-medium mt-0.5">{customer.phone}</p>
            </div>
          </div>

          {orders.length > 0 && (
            <div
              className="grid grid-cols-2 gap-3 pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <p
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {orders.length}
                </p>
                <p className="text-xs text-white/40 font-medium mt-0.5">{t('customers.ordersCount')}</p>
              </div>
              <div
                className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <p className="text-2xl font-black" style={{ color: '#10b981' }}>
                  {totalSpent.toFixed(0)}
                </p>
                <p className="text-xs text-white/40 font-medium mt-0.5">{t('customers.egpSpent')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order history */}
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 px-1">
            {t('customers.history')}
          </p>
          {orders.length === 0 ? (
            <div
              className="rounded-3xl p-8 flex flex-col items-center"
              style={{ background: 'rgba(20,20,42,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-white/30 font-medium">{t('customers.noHistory')}</p>
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
                    style={{
                      background: 'rgba(20,20,42,0.85)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {order.items.length} {t('orders.itemCount')}
                      </p>
                      <p className="text-sm text-white/40 mt-0.5">{formatShort(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusChip status={order.status} />
                      <span
                        className="font-black text-sm"
                        style={{
                          background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {order.total.toFixed(2)} {t('common.egp')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
