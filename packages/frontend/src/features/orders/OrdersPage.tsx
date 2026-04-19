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
    localDb.orders.where('tenantId').equals(tenantId).reverse().sortBy('createdAt').then(setOrders);
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
            <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('orders.title')}</h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9C94B8' }}>
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
        {/* Revenue summary */}
        {orders.length > 0 && (
          <div className="rounded-2xl p-4 animate-fade-in flex items-center justify-between"
            style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
            <p className="text-sm font-semibold" style={{ color: '#7C3AED' }}>{t('orders.revenue')}</p>
            <p className="text-2xl font-black" style={{ color: '#7C3AED' }}>
              {totalRevenue.toFixed(2)}
              <span className="text-sm font-semibold ms-1" style={{ color: '#A78BFA' }}>{t('common.egp')}</span>
            </p>
          </div>
        )}

        {/* New order */}
        <button className="btn-primary" onClick={() => navigate('/orders/new')}>
          <span className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            {t('orders.new')}
          </span>
        </button>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 animate-fade-in gap-3">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
              📋
            </div>
            <p className="text-sm font-semibold" style={{ color: '#9C94B8' }}>{t('orders.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order) => (
              <button key={order.clientId} className="w-full text-start transition-all active:scale-95"
                onClick={() => navigate(`/orders/${order.clientId}`)}>
                <div className="rounded-2xl p-4"
                  style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.05)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: '#130F2A' }}>
                        {order.customerName || t('orders.unknownCustomer')}
                      </p>
                      <p className="text-xs mt-1 font-medium" style={{ color: '#9C94B8' }}>{formatDate(order.createdAt)}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#C4B8F0' }}>
                        {order.items.length} {t('orders.itemCount')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusChip status={order.status} />
                      <span className="font-black text-lg" style={{ color: '#7C3AED' }}>
                        {order.total.toFixed(2)}
                        <span className="text-sm font-semibold ms-0.5" style={{ color: '#A78BFA' }}>{t('common.egp')}</span>
                      </span>
                    </div>
                  </div>
                  {!order.synced && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: '#D97706' }}>
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
