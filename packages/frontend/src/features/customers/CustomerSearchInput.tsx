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
      // fallback to local results
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
    await enqueue(id, 'customer', 'create', { phone: customer.phone, name: customer.name }, tenantId);
    onSelect(customer);
    setShowNew(false);
    setQuery('');
    setResults([]);
  };

  /* ── Selected state ── */
  if (selected) {
    return (
      <div
        className="flex items-center justify-between rounded-2xl p-3.5"
        style={{ background: '#F0FDF4', border: '1px solid #A7F3D0' }}
      >
        <div>
          <p className="font-bold" style={{ color: '#130F2A' }}>{selected.name}</p>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#059669' }}>{selected.phone}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-xs font-bold px-2.5 py-1.5 rounded-full transition-all active:scale-95"
          style={{ color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA' }}
        >
          {t('customers.change')}
        </button>
      </div>
    );
  }

  /* ── Search state ── */
  return (
    <div className="space-y-2">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          fill="none"
          style={{ color: '#9C94B8' }}
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="input-field"
          placeholder={t('customers.search')}
          type="tel"
          inputMode="numeric"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingInlineStart: '2.75rem' }}
        />
      </div>

      {loading && (
        <p className="text-xs font-medium text-center py-2" style={{ color: '#9C94B8' }}>
          {t('common.loading')}
        </p>
      )}

      {/* Results dropdown */}
      {results.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 4px 16px rgba(19,15,42,0.1)' }}
        >
          {results.map((c, i) => (
            <button
              key={c.phone}
              onClick={() => { onSelect(c); setQuery(''); setResults([]); }}
              className="w-full text-start px-4 py-3.5 transition-all active:bg-violet-50"
              style={{
                borderBottom: i < results.length - 1 ? '1px solid #F3F0FF' : 'none',
              }}
            >
              <p className="font-semibold" style={{ color: '#130F2A' }}>{c.name}</p>
              <p className="text-sm mt-0.5 font-medium" style={{ color: '#9C94B8' }}>{c.phone}</p>
            </button>
          ))}
        </div>
      )}

      {/* Not found panel */}
      {query.length >= 3 && results.length === 0 && !loading && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: '#F5F4FF', border: '1px solid #E2DFF0' }}
        >
          <p className="text-sm text-center font-medium" style={{ color: '#9C94B8' }}>
            {t('customers.notFound')}
          </p>
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              className="w-full text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE' }}
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
