import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { enqueue } from '../../offline/queue';
import { runSync } from '../../offline/syncEngine';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SyncIndicator } from '../../components/SyncIndicator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import type { LocalProduct } from '../../offline/db';
import type { Product } from '@dukkan/shared';
import { v4 as uuidv4 } from 'uuid';

export default function InventoryPage() {
  const { t } = useTranslation();
  const { showToast, setProducts } = useAppStore();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId ?? '';

  const [products, setLocalProducts] = useState<LocalProduct[]>([]);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', costPrice: '', stock: '0', lowStockThreshold: '5',
  });

  const loadProducts = async () => {
    if (!tenantId) return;
    const list = await localDb.products.where('tenantId').equals(tenantId).sortBy('name');
    setLocalProducts(list);
    setProducts(list as unknown as Product[]);
  };

  useEffect(() => { loadProducts(); }, [tenantId]);

  const handleAddProduct = async () => {
    const { name, price, costPrice, stock, lowStockThreshold } = newProduct;
    if (!name.trim() || !price || !tenantId) return;
    const id = uuidv4();
    const product: LocalProduct = {
      id, tenantId, name: name.trim(),
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), synced: false,
    };
    await localDb.products.add(product);
    await enqueue(id, 'product', 'create', {
      name: product.name, price: product.price,
      costPrice: product.costPrice,
      stock: product.stock, lowStockThreshold: product.lowStockThreshold,
    }, tenantId);
    runSync();
    setNewProduct({ name: '', price: '', costPrice: '', stock: '0', lowStockThreshold: '5' });
    setShowAddForm(false);
    showToast(t('msg.productAdded'));
    loadProducts();
  };

  const handleAdjust = async (product: LocalProduct, dir: 1 | -1) => {
    const amount = parseInt(delta) || 0;
    if (amount <= 0 || !tenantId) return;
    const finalDelta = dir * amount;
    await localDb.products.where('id').equals(product.id)
      .modify({ stock: Math.max(0, product.stock + finalDelta) });
    await enqueue(uuidv4(), 'stock', 'update', { productId: product.id, delta: finalDelta }, tenantId);
    runSync();
    setAdjustingId(null);
    setDelta('');
    showToast(t('msg.stockUpdated'));
    loadProducts();
  };

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{t('inventory.title')}</h1>
            {lowStockCount > 0 && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#f72585' }}>
                ⚠️ {lowStockCount} {t('inventory.lowStock')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Add button */}
        <button className={showAddForm ? 'btn-secondary' : 'btn-primary'} onClick={() => setShowAddForm(!showAddForm)}>
          <span className="flex items-center justify-center gap-2">
            {showAddForm ? (
              <><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>{t('common.cancel')}</>
            ) : (
              <><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>{t('inventory.add')}</>
            )}
          </span>
        </button>

        {/* Add form */}
        {showAddForm && (
          <div className="rounded-3xl p-5 space-y-4 animate-slide-down" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="font-bold text-white">{t('inventory.add')}</p>
            <input className="input-field" placeholder={t('inventory.name')}
              value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder={`${t('inventory.price')} (${t('common.egp')})`}
                type="number" inputMode="decimal" value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              <input className="input-field" placeholder={`${t('inventory.costPrice')} (${t('common.egp')})`}
                type="number" inputMode="decimal" value={newProduct.costPrice}
                onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder={t('inventory.stock')}
                type="number" inputMode="numeric" value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
              <input className="input-field" placeholder={t('inventory.alertLevel')}
                type="number" inputMode="numeric" value={newProduct.lowStockThreshold}
                onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.price}>
              {t('common.save')}
            </button>
          </div>
        )}

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-5" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              📦
            </div>
            <p className="text-white/40 text-base font-medium">{t('inventory.noProducts')}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {products.map((p) => {
              const isLow = p.stock <= p.lowStockThreshold;
              const isAdjusting = adjustingId === p.id;
              const margin = p.costPrice && p.price > 0
                ? Math.round(((p.price - p.costPrice) / p.price) * 100)
                : null;
              return (
                <div
                  key={p.id}
                  className="rounded-3xl overflow-hidden transition-all duration-200"
                  style={{ background: 'rgba(20,20,42,0.85)', border: isLow ? '1px solid rgba(247,37,133,0.25)' : '1px solid rgba(255,255,255,0.07)', boxShadow: isLow ? '0 4px 20px rgba(247,37,133,0.1)' : '0 4px 20px rgba(0,0,0,0.3)' }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-white text-base">{p.name}</p>
                        <p className="font-black text-lg mt-1" style={{ background: 'linear-gradient(135deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          {p.price.toFixed(2)}
                          <span className="text-sm font-semibold ms-1" style={{ WebkitTextFillColor: 'rgba(255,255,255,0.4)' }}>{t('common.egp')}</span>
                        </p>
                        {p.costPrice !== undefined && p.costPrice !== null && (
                          <p className="text-xs mt-0.5 opacity-50">
                            {t('inventory.costPrice')}: {p.costPrice.toFixed(2)} {t('common.egp')}
                            {margin !== null && (
                              <span className="ms-2 font-bold" style={{ color: margin >= 0 ? '#10b981' : '#f87171' }}>
                                {t('inventory.margin')}: {margin}%
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-end flex-shrink-0">
                        <span className="text-3xl font-black block" style={{ color: isLow ? '#f72585' : '#10b981' }}>
                          {p.stock}
                        </span>
                        {isLow && <span className="text-xs font-bold" style={{ color: '#f72585' }}>{t('inventory.lowStock')}</span>}
                      </div>
                    </div>

                    {isAdjusting ? (
                      <div className="mt-4 space-y-3 animate-slide-down">
                        <input
                          className="input-field text-center text-xl font-bold"
                          placeholder={t('inventory.amount')}
                          type="number" inputMode="numeric" min="1"
                          value={delta} onChange={(e) => setDelta(e.target.value)} autoFocus
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <button className="font-bold rounded-2xl py-3.5 text-base text-white active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }} onClick={() => handleAdjust(p, 1)}>
                            + {t('inventory.increase')}
                          </button>
                          <button className="font-bold rounded-2xl py-3.5 text-base text-white active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #f72585 0%, #b5179e 100%)', boxShadow: '0 4px 16px rgba(247,37,133,0.35)' }} onClick={() => handleAdjust(p, -1)}>
                            − {t('inventory.decrease')}
                          </button>
                        </div>
                        <button className="btn-secondary py-3 text-sm" onClick={() => { setAdjustingId(null); setDelta(''); }}>
                          {t('inventory.cancelAdjust')}
                        </button>
                      </div>
                    ) : (
                      <button className="mt-3 w-full rounded-2xl py-2.5 text-sm font-semibold text-white/60 transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setAdjustingId(p.id)}>
                        {t('inventory.adjust')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
