import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { localDb, type LocalCustomer } from '../../offline/db';
import { apiGet } from '../../api/client';
import type { Customer } from '@dukkan/shared';

interface Props {
  onSelect: (customer: Customer | null) => void;
  selected: Customer | null;
}

export function CustomerSearchInput({ onSelect, selected }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalCustomer[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (phone: string) => {
    if (phone.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Search local first
      const local = await localDb.customers
        .where('phone')
        .startsWith(phone)
        .limit(5)
        .toArray();

      setResults(local);

      // If online, also search server
      if (navigator.onLine) {
        const remote = await apiGet<Customer[]>(`/customers?phone=${phone}`);
        // Merge without duplicates (remote items as LocalCustomer)
        const merged: LocalCustomer[] = [...local];
        for (const r of remote) {
          if (!merged.find((c) => c.phone === r.phone)) {
            merged.push({ ...r, synced: true });
          }
        }
        setResults(merged);
      }
    } catch {
      // Silently fallback to local results
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 350);
    return () => clearTimeout(timer);
  }, [query, search]);

  const saveNewCustomer = async () => {
    if (!newName.trim() || !query.trim()) return;
    const customer: Customer = {
      id: `local-${Date.now()}`,
      phone: query.trim(),
      name: newName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await localDb.customers.add({ ...customer, localId: undefined, synced: false });
    onSelect(customer);
    setShowNew(false);
    setQuery('');
    setResults([]);
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
        <div>
          <p className="font-semibold text-green-800">{selected.name}</p>
          <p className="text-sm text-green-600">{selected.phone}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-red-500 font-semibold text-sm"
        >
          تغيير
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        className="input-field"
        placeholder={t('customers.search')}
        type="tel"
        inputMode="numeric"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <p className="text-sm text-gray-400 text-center">{t('common.loading')}</p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          {results.map((c) => (
            <button
              key={c.phone}
              onClick={() => {
                onSelect(c);
                setQuery('');
                setResults([]);
              }}
              className="w-full text-right px-4 py-3 hover:bg-gray-50 active:bg-gray-100
                border-b border-gray-50 last:border-0 transition-colors"
            >
              <p className="font-medium text-gray-800">{c.name}</p>
              <p className="text-sm text-gray-400">{c.phone}</p>
            </button>
          ))}
        </div>
      )}

      {query.length >= 3 && results.length === 0 && !loading && (
        <div className="card text-center space-y-2">
          <p className="text-gray-500 text-sm">لا يوجد عميل بهذا الرقم</p>
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              className="text-primary font-semibold text-sm"
            >
              + إضافة عميل جديد
            </button>
          ) : (
            <div className="space-y-2">
              <input
                className="input-field"
                placeholder={t('customers.name')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveNewCustomer} className="btn-primary text-sm py-2">
                  {t('common.save')}
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="btn-secondary text-sm py-2"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
