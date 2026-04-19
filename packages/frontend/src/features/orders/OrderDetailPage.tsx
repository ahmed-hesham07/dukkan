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

const STATUSES: OrderStatus[] = ['pending', 'paid', 'delivered', 'cancelled'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useAppStore();
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    if (!id) return;
    localDb.orders.where('clientId').equals(id).first().then((o) => {
      if (o) setOrder(o);
    });
  }, [id]);

  const changeStatus = async (status: OrderStatus) => {
    if (!order) return;
    try {
      await localDb.orders
        .where('clientId')
        .equals(order.clientId)
        .modify({ status });
      setOrder({ ...order, status });

      if (navigator.onLine) {
        await apiPatch(`/orders/${order.id}/status`, { status });
      }
      showToast('تم تحديث الحالة');
    } catch {
      showToast('فشل تحديث الحالة', 'error');
    }
  };

  if (!order) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-xl font-bold">تفاصيل الطلب</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm">{formatDate(order.createdAt)}</span>
            <StatusChip status={order.status} />
          </div>
          <p className="text-gray-600 font-medium">
            {order.customerName || 'عميل غير محدد'}
            {order.customerPhone && (
              <span className="text-gray-400 text-sm me-2"> | {order.customerPhone}</span>
            )}
          </p>
          {order.notes && (
            <p className="text-sm text-gray-400 mt-2">{order.notes}</p>
          )}
        </div>

        {/* Items */}
        <div className="card">
          <p className="font-semibold text-gray-700 mb-3">{t('orders.items')}</p>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-400">
                    {item.price} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-gray-800">
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
            <span className="font-bold text-lg">{t('orders.total')}</span>
            <span className="font-bold text-xl text-primary">
              {order.total.toFixed(2)} {t('common.egp')}
            </span>
          </div>
        </div>

        {/* Change Status */}
        <div className="card">
          <p className="font-semibold text-gray-700 mb-3">تغيير الحالة</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={order.status === s}
                className={`py-3 rounded-xl text-sm font-semibold transition-colors
                  ${order.status === s
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 active:scale-95'
                  }`}
              >
                {t(`orders.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Print */}
        <button className="btn-secondary no-print" onClick={handlePrint}>
          🖨️ {t('invoice.print')}
        </button>

        {/* Hidden invoice for printing */}
        <div className="hidden">
          <InvoicePrint ref={printRef} order={order} />
        </div>
      </div>
    </div>
  );
}
