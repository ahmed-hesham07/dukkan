import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { enqueue } from '../../offline/queue';
import { runSync } from '../../offline/syncEngine';
import { useAppStore } from '../../store/useAppStore';
import { SyncIndicator } from '../../components/SyncIndicator';
import type { LocalProduct } from '../../offline/db';
import { v4 as uuidv4 } from 'uuid';

export default function InventoryPage() {
  const { t } = useTranslation();
  const { showToast, setProducts } = useAppStore();
  const [products, setLocalProducts] = useState<LocalProduct[]>([]);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '0', lowStockThreshold: '5' });

  const loadProducts = async () => {
    const list = await localDb.products.orderBy('name').toArray();
    setLocalProducts(list);
    setProducts(list as unknown as import('@dukkan/shared').Product[]);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleAddProduct = async () => {
    const { name, price, stock, lowStockThreshold } = newProduct;
    if (!name.trim() || !price) return;

    const id = uuidv4();
    const product: LocalProduct = {
      id,
      name: name.trim(),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await localDb.products.add(product);
    await enqueue(id, 'product', 'create', {
      name: product.name,
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
    });
    runSync();
    setNewProduct({ name: '', price: '', stock: '0', lowStockThreshold: '5' });
    setShowAddForm(false);
    showToast('تم إضافة المنتج');
    loadProducts();
  };

  const handleAdjust = async (product: LocalProduct, dir: 1 | -1) => {
    const amount = parseInt(delta) || 0;
    if (amount <= 0) return;

    const finalDelta = dir * amount;
    await localDb.products
      .where('id')
      .equals(product.id)
      .modify({ stock: Math.max(0, product.stock + finalDelta) });

    await enqueue(uuidv4(), 'stock', 'update', {
      productId: product.id,
      delta: finalDelta,
    });
    runSync();
    setAdjustingId(null);
    setDelta('');
    showToast('تم تحديث المخزون');
    loadProducts();
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('inventory.title')}</h1>
          <SyncIndicator />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ إلغاء' : `+ ${t('inventory.add')}`}
        </button>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="card space-y-3">
            <p className="font-semibold text-gray-700">{t('inventory.add')}</p>
            <input
              className="input-field"
              placeholder={t('inventory.name')}
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder={`${t('inventory.price')} (${t('common.egp')})`}
              type="number"
              inputMode="decimal"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input-field"
                placeholder={t('inventory.stock')}
                type="number"
                inputMode="numeric"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="حد التنبيه"
                type="number"
                inputMode="numeric"
                value={newProduct.lowStockThreshold}
                onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleAddProduct}
              disabled={!newProduct.name || !newProduct.price}
            >
              {t('common.save')}
            </button>
          </div>
        )}

        {/* Product List */}
        {products.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-primary font-bold text-lg mt-1">
                      {p.price.toFixed(2)} {t('common.egp')}
                    </p>
                  </div>
                  <div className="text-left">
                    <span
                      className={`text-2xl font-bold block ${
                        p.stock <= p.lowStockThreshold ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {p.stock}
                    </span>
                    {p.stock <= p.lowStockThreshold && (
                      <span className="text-xs text-danger font-medium">
                        ⚠️ {t('inventory.lowStock')}
                      </span>
                    )}
                  </div>
                </div>

                {adjustingId === p.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <input
                      className="input-field text-center"
                      placeholder={t('inventory.amount')}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="bg-success text-white font-bold rounded-xl py-3 text-lg active:scale-95"
                        onClick={() => handleAdjust(p, 1)}
                      >
                        + {t('inventory.increase')}
                      </button>
                      <button
                        className="bg-danger text-white font-bold rounded-xl py-3 text-lg active:scale-95"
                        onClick={() => handleAdjust(p, -1)}
                      >
                        - {t('inventory.decrease')}
                      </button>
                    </div>
                    <button
                      className="btn-secondary py-2 text-sm"
                      onClick={() => { setAdjustingId(null); setDelta(''); }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-3 w-full bg-gray-100 text-gray-700 font-semibold rounded-xl py-2 text-sm active:scale-95"
                    onClick={() => setAdjustingId(p.id)}
                  >
                    {t('inventory.adjust')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
