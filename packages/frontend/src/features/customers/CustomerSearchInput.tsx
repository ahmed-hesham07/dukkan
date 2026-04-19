import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { localDb, type LocalCustomer } from '../../offline/db';
import { enqueue } from '../../offline/queue';
import { apiGet } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import type { Customer } from '@dukkan/shared';

interface Props {
  onSelect: (customer: Customer | null) => void;
  selected: Customer | null;
}

export function CustomerSearchInput({ onSelect, selected }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId ?? '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalCustomer[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (phone: string) => {
    if (phone.length < 3 || !tenantId) { setResults([]); return; }
    setLoading(true);
    try {
      const local = await localDb.customers
        .where('tenantId').equals(tenantId)
        .and((c) => c.phone.includes(phone))
        .limit(5).toArray();
      setResults(local);

      if (navigator.onLine) {
        const remote = await apiGet<Customer[]>(`/customers?phone=${phone}`);
        const merged: LocalCustomer[] = [...local];
        for (const r of remote) {
          if (!merged.find((c) => c.phone === r.phone)) {
            merged.push({ ...r, tenantId, synced: true });
          }
        }
        setResults(merged);
      }
    } catch {
      // fallback to local
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 350);
    return () => clearTimeout(timer);
  }, [query, search]);

  const saveNewCustomer = async () => {
    if (!newName.trim() || !query.trim() || !tenantId) return;
    // Always use a valid UUID so the sync queue can send it to PostgreSQL safely.
    const id = uuidv4();
    const now = new Date().toISOString();
    const customer: LocalCustomer = {
      id,
      phone: query.trim(),
      name: newName.trim(),
      tenantId,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    await localDb.customers.add({ ...customer, localId: undefined });
    // Enqueue the customer BEFORE the order so the backend has the FK target ready.
    await enqueue(id, 'customer', 'create', { phone: customer.phone, name: customer.name }, tenantId);
    onSelect(customer);
    setShowNew(false);
    setQuery('');
    setResults([]);
  };

  if (selected) {
    return (
      <div
        className="flex items-center justify-between rounded-2xl p-3.5"
        style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
        }}
      >
        <div>
          <p className="font-bold text-white">{selected.name}</p>
          <p className="text-sm mt-0.5" style={{ color: '#10b981' }}>{selected.phone}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-xs font-bold px-2.5 py-1.5 rounded-full transition-all active:scale-95"
          style={{ color: '#f72585', background: 'rgba(247,37,133,0.12)' }}
        >
          {t('customers.change')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <svg viewBox="0 0 24 24" className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" fill="none">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className="input-field"
          placeholder={t('customers.search')}
          type="tel" inputMode="numeric"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingInlineStart: '2.75rem' }}
        />
      </div>

      {loading && (
        <p className="text-xs text-white/30 text-center py-2">{t('common.loading')}</p>
      )}

      {results.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          {results.map((c, i) => (
            <button
              key={c.phone}
              onClick={() => { onSelect(c); setQuery(''); setResults([]); }}
              className="w-full text-start px-4 py-3.5 transition-all active:scale-98"
              style={{
                background: 'rgba(20,20,42,0.95)',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <p className="font-semibold text-white">{c.name}</p>
              <p className="text-sm text-white/40 mt-0.5">{c.phone}</p>
            </button>
          ))}
        </div>
      )}

      {query.length >= 3 && results.length === 0 && !loading && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'rgba(20,20,42,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p className="text-white/40 text-sm text-center">{t('customers.notFound')}</p>
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              className="w-full text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              + {t('customers.addNew')}
            </button>
          ) : (
            <div className="space-y-2.5 animate-slide-down">
              <input
                className="input-field"
                placeholder={t('customers.name')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveNewCustomer} className="btn-primary text-sm py-3">{t('common.save')}</button>
                <button onClick={() => setShowNew(false)} className="btn-secondary text-sm py-3">{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
