import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { localDb } from '../../offline/db';
import { enqueue } from '../../offline/queue';
import { runSync } from '../../offline/syncEngine';
import { useAppStore } from '../../store/useAppStore';
import { CustomerSearchInput } from '../customers/CustomerSearchInput';
import type { Customer, CreateOrderItemInput } from '@dukkan/shared';

interface DraftItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
  productId?: string;
}

export default function NewOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, products } = useAppStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DraftItem[]>([
    { id: uuidv4(), name: '', price: '', quantity: '1' },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addItem = () =>
    setItems((prev) => [...prev, { id: uuidv4(), name: '', price: '', quantity: '1' }]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof DraftItem, value: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, name: product.name, price: String(product.price), productId: product.id }
          : i
      )
    );
  };

  const total = items.reduce((sum, i) => {
    const price = parseFloat(i.price) || 0;
    const qty = parseInt(i.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const isValid = items.every((i) => i.name.trim() && parseFloat(i.price) > 0 && parseInt(i.quantity) > 0);

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    const clientId = uuidv4();
    const createdAt = new Date().toISOString();

    const parsedItems: CreateOrderItemInput[] = items.map((i) => ({
      productId: i.productId,
      name: i.name.trim(),
      price: parseFloat(i.price),
      quantity: parseInt(i.quantity),
    }));

    try {
      // Write to IndexedDB immediately
      await localDb.orders.add({
        clientId,
        id: clientId,
        customerId: customer?.id || null,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        status: 'pending',
        total,
        notes: notes || null,
        items: parsedItems.map((item, idx) => ({
          localId: undefined,
          orderId: clientId,
          id: uuidv4(),
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        createdAt,
        syncedAt: createdAt,
        synced: false,
      });

      // Enqueue for sync
      await enqueue(clientId, 'order', 'create', {
        clientId,
        customerId: customer?.id,
        status: 'pending',
        total,
        notes: notes || undefined,
        items: parsedItems,
        createdAt,
      });

      runSync();
      showToast('تم حفظ الطلب بنجاح ✓');
      navigate('/');
    } catch (err) {
      showToast('فشل حفظ الطلب', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [items, customer, notes, total, isValid, submitting, navigate, showToast]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <h1 className="text-xl font-bold">{t('orders.new')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Customer */}
        <div className="card">
          <label className="block text-sm font-semibold text-gray-500 mb-2">
            {t('customers.select')}
          </label>
          <CustomerSearchInput onSelect={setCustomer} selected={customer} />
        </div>

        {/* Items */}
        <div className="card space-y-3">
          <p className="font-semibold text-gray-700">{t('orders.items')}</p>

          {/* Product quick-select from catalog */}
          {products.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const emptyItem = items.find((i) => !i.name);
                      if (emptyItem) {
                        selectProduct(emptyItem.id, p.id);
                      } else {
                        const newId = uuidv4();
                        setItems((prev) => [
                          ...prev,
                          { id: newId, name: p.name, price: String(p.price), quantity: '1', productId: p.id },
                        ]);
                      }
                    }}
                    className="shrink-0 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {items.map((item, idx) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">منتج {idx + 1}</span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-danger text-sm font-semibold"
                  >
                    ✕ حذف
                  </button>
                )}
              </div>
              <input
                className="input-field"
                placeholder={t('orders.itemName')}
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field"
                  placeholder={t('orders.price')}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder={t('orders.quantity')}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                />
              </div>
              {item.name && item.price && item.quantity && (
                <p className="text-sm text-gray-500 text-left">
                  = {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} {t('common.egp')}
                </p>
              )}
            </div>
          ))}

          <button onClick={addItem} className="btn-secondary">
            + {t('orders.addItem')}
          </button>
        </div>

        {/* Notes */}
        <div className="card">
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder={t('orders.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Total + Submit */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-semibold text-lg">{t('orders.total')}</span>
            <span className="text-2xl font-bold text-primary">
              {total.toFixed(2)} {t('common.egp')}
            </span>
          </div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? t('common.loading') : t('orders.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
