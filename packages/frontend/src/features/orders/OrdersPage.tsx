import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import { SyncIndicator } from '../../components/SyncIndicator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { LocalOrder } from '../../offline/db';

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lang } = useLanguageStore();
  const tenantId = user?.tenantId ?? '';
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    localDb.orders
      .where('tenantId').equals(tenantId)
      .reverse()
      .sortBy('createdAt')
      .then(setOrders);
  }, [tenantId]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));

  const totalRevenue = orders
    .filter((o) => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{t('orders.title')}</h1>
            <p className="text-xs text-white/40 mt-0.5 font-medium">
              {orders.length} {t('orders.itemCount')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Revenue summary card */}
        {orders.length > 0 && (
          <div
            className="rounded-3xl p-5 animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">
              {t('orders.revenue')}
            </p>
            <p
              className="text-3xl font-black"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {totalRevenue.toFixed(2)}
              <span className="text-base font-bold ms-1" style={{ WebkitTextFillColor: 'rgba(255,255,255,0.5)' }}>
                {t('common.egp')}
              </span>
            </p>
          </div>
        )}

        {/* New order button */}
        <button className="btn-primary" onClick={() => navigate('/orders/new')}>
          <span className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {t('orders.new')}
          </span>
        </button>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 animate-fade-in">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-5"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              📋
            </div>
            <p className="text-white/40 text-base font-medium">{t('orders.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <button
                key={order.clientId}
                className="w-full text-start transition-all duration-150 active:scale-95"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => navigate(`/orders/${order.clientId}`)}
              >
                <div
                  className="rounded-3xl p-4"
                  style={{
                    background: 'rgba(20,20,42,0.85)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate text-base">
                        {order.customerName || t('orders.unknownCustomer')}
                      </p>
                      <p className="text-xs text-white/40 mt-1">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {order.items.length} {t('orders.itemCount')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusChip status={order.status} />
                      <span
                        className="font-black text-lg"
                        style={{
                          background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {order.total.toFixed(2)}
                        <span className="text-sm font-semibold ms-0.5" style={{ WebkitTextFillColor: 'rgba(255,255,255,0.4)' }}>
                          {t('common.egp')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {!order.synced && (
                    <div
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: '#f59e0b' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {t('sync.pending')}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
