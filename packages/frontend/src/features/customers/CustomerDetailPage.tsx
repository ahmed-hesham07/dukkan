import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { StatusChip } from '../../components/StatusChip';
import type { LocalCustomer, LocalOrder } from '../../offline/db';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<LocalCustomer | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    if (!id) return;
    localDb.customers.where('id').equals(id).first().then((c) => setCustomer(c ?? null));
    localDb.orders.where('customerId').equals(id).reverse().sortBy('createdAt').then(setOrders);
  }, [id]);

  if (!customer) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-xl font-bold">{customer.name}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{customer.name}</p>
              <p className="text-gray-500">{customer.phone}</p>
            </div>
          </div>
          {orders.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{orders.length}</p>
                <p className="text-xs text-gray-400">طلب</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{totalSpent.toFixed(0)}</p>
                <p className="text-xs text-gray-400">جنيه</p>
              </div>
            </div>
          )}
        </div>

        {/* Order History */}
        <div>
          <h2 className="font-bold text-gray-700 mb-3">{t('customers.history')}</h2>
          {orders.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">
              {t('customers.noHistory')}
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.clientId}
                  className="card w-full text-right active:scale-98"
                  onClick={() => navigate(`/orders/${order.clientId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {order.items.length} منتج
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {new Intl.DateTimeFormat('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusChip status={order.status} />
                      <span className="font-bold text-primary">
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
