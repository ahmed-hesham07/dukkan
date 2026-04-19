import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { localDb } from '../../offline/db';
import { enqueue } from '../../offline/queue';
import { runSync } from '../../offline/syncEngine';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomerSearchInput } from '../customers/CustomerSearchInput';
import type { Customer, CreateOrderItemInput, PaymentMethod } from '@dukkan/shared';

interface DraftItem { id: string; name: string; price: string; quantity: string; productId?: string; }

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'vodafone_cash', 'instapay', 'credit'];

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
      style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" style={{ color: '#7C3AED' }}>
        <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.04)' }}>
      <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: '#9C94B8' }}>{label}</p>
      {children}
    </div>
  );
}

export default function NewOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, products } = useAppStore();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId ?? '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DraftItem[]>([{ id: uuidv4(), name: '', price: '', quantity: '1' }]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setItems((p) => [...p, { id: uuidv4(), name: '', price: '', quantity: '1' }]);
  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof DraftItem, value: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((p) => p.map((i) => i.id === itemId ? { ...i, name: product.name, price: String(product.price), productId: product.id } : i));
  };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 0), 0);
  const discount = parseFloat(discountAmount) || 0;
  const total = Math.max(0, subtotal - discount);
  const isValid = items.every((i) => i.name.trim() && parseFloat(i.price) > 0 && parseInt(i.quantity) > 0);

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting || !tenantId) return;
    setSubmitting(true);
    const clientId = uuidv4();
    const createdAt = new Date().toISOString();
    const parsedItems: CreateOrderItemInput[] = items.map((i) => ({
      productId: i.productId, name: i.name.trim(), price: parseFloat(i.price), quantity: parseInt(i.quantity),
    }));
    try {
      await localDb.orders.add({
        clientId, id: clientId, tenantId,
        customerId: customer?.id || null, customerName: customer?.name, customerPhone: customer?.phone,
        status: 'pending', paymentMethod, total, discountAmount: discount,
        discountReason: discountReason || null, notes: notes || null,
        items: parsedItems.map((item) => ({
          localId: undefined, orderId: clientId, id: uuidv4(),
          productId: item.productId || null, name: item.name, price: item.price, quantity: item.quantity,
        })),
        createdAt, syncedAt: createdAt, synced: false,
      });
      await enqueue(clientId, 'order', 'create', {
        clientId, customerId: customer?.id, status: 'pending', paymentMethod,
        total, discountAmount: discount, discountReason: discountReason || undefined,
        notes: notes || undefined, items: parsedItems, createdAt,
      }, tenantId);
      runSync();
      showToast(t('msg.orderSaved'));
      navigate('/orders');
    } catch {
      showToast(t('msg.orderFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [items, customer, notes, paymentMethod, discount, discountReason, total, isValid, submitting, tenantId, navigate, showToast, t]);

  return (
    <div className="page-container pb-28">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <BackBtn onClick={() => navigate(-1)} />
          <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('orders.new')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">

        {/* Customer */}
        <SectionCard label={t('customers.select')}>
          <CustomerSearchInput onSelect={setCustomer} selected={customer} />
        </SectionCard>

        {/* Product chips */}
        {products.length > 0 && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              {products.map((p) => (
                <button key={p.id}
                  onClick={() => {
                    const empty = items.find((i) => !i.name);
                    if (empty) { selectProduct(empty.id, p.id); }
                    else {
                      const newId = uuidv4();
                      setItems((prev) => [...prev, { id: newId, name: p.name, price: String(p.price), quantity: '1', productId: p.id }]);
                    }
                  }}
                  className="flex-shrink-0 text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95 whitespace-nowrap"
                  style={{ background: '#EDE9FE', border: '1px solid #DDD6FE', color: '#7C3AED' }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <SectionCard label={t('orders.items')}>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="rounded-xl p-3.5 space-y-2.5"
                style={{ background: '#F5F4FF', border: '1px solid #E2DFF0' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9C94B8' }}>
                    {t('inventory.productN')} {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)}
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: '#DC2626', background: '#FEE2E2' }}>
                      ✕
                    </button>
                  )}
                </div>
                <input className="input-field" placeholder={t('orders.itemName')} value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-field" placeholder={t('orders.price')} type="number" inputMode="decimal" min="0"
                    value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} />
                  <input className="input-field" placeholder={t('orders.quantity')} type="number" inputMode="numeric" min="1"
                    value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                </div>
                {item.name && item.price && item.quantity && (
                  <p className="text-sm font-black" style={{ color: '#7C3AED' }}>
                    = {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} {t('common.egp')}
                  </p>
                )}
              </div>
            ))}
            <button className="btn-secondary py-3 text-sm" onClick={addItem}>
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                {t('orders.addItem')}
              </span>
            </button>
          </div>
        </SectionCard>

        {/* Payment method */}
        <SectionCard label={t('payment.method')}>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} onClick={() => setPaymentMethod(m)}
                className="text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
                style={paymentMethod === m
                  ? { background: '#7C3AED', color: '#FFF', border: '1px solid #7C3AED' }
                  : { background: '#F5F4FF', border: '1px solid #E2DFF0', color: '#6B5B9A' }
                }>
                {t(`payment.${m}`)}
              </button>
            ))}
          </div>
          {paymentMethod === 'credit' && !customer && (
            <p className="text-xs font-semibold mt-2" style={{ color: '#D97706' }}>⚠ {t('customers.select')}</p>
          )}
        </SectionCard>

        {/* Discount */}
        <SectionCard label={t('discount.label')}>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder={t('discount.amount')} type="number" inputMode="decimal" min="0"
              value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
            <input className="input-field" placeholder={t('discount.reason')}
              value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
          </div>
        </SectionCard>

        {/* Notes */}
        <textarea className="input-field resize-none" rows={2} placeholder={t('orders.notes')}
          value={notes} onChange={(e) => setNotes(e.target.value)} />

        {/* Total + submit */}
        <div className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
          {discount > 0 && (
            <div className="flex justify-between text-sm mb-2" style={{ color: '#9C94B8' }}>
              <span>{t('discount.label')}: -{discount.toFixed(2)}</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold" style={{ color: '#6B5B9A' }}>{t('orders.total')}</span>
            <span className="text-3xl font-black" style={{ color: '#7C3AED' }}>
              {total.toFixed(2)}
              <span className="text-base ms-1" style={{ color: '#A78BFA' }}>{t('common.egp')}</span>
            </span>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {t('common.loading')}
                </span>
              : `✓ ${t('orders.submit')}`
            }
          </button>
        </div>

      </div>
    </div>
  );
}
