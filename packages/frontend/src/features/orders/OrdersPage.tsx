import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import { SyncIndicator } from '../../components/SyncIndicator';
import type { LocalOrder } from '../../offline/db';

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    localDb.orders
      .orderBy('createdAt')
      .reverse()
      .limit(100)
      .toArray()
      .then(setOrders);
  }, []);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('orders.title')}</h1>
          <SyncIndicator />
        </div>
      </header>

      <div className="p-4">
        <button
          className="btn-primary mb-4"
          onClick={() => navigate('/orders/new')}
        >
          + {t('orders.new')}
        </button>

        {orders.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">{t('orders.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.clientId}
                className="card w-full text-right active:scale-98 transition-transform"
                onClick={() => navigate(`/orders/${order.clientId}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {order.customerName || 'عميل غير محدد'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.items.length} منتج
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusChip status={order.status} />
                    <span className="font-bold text-primary text-lg">
                      {order.total.toFixed(2)} {t('common.egp')}
                    </span>
                  </div>
                </div>
                {!order.synced && (
                  <div className="mt-2 text-xs text-yellow-600 font-medium">
                    ⏳ {t('sync.pending')}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
