import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { SyncIndicator } from '../../components/SyncIndicator';
import type { LocalCustomer } from '../../offline/db';

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const filtered = query.length >= 2
      ? localDb.customers.where('phone').startsWith(query).limit(30).toArray()
      : localDb.customers.orderBy('name').limit(50).toArray();

    filtered.then(setCustomers);
  }, [query]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">{t('customers.title')}</h1>
          <SyncIndicator />
        </div>
        <input
          className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3
            text-white placeholder-white/60 text-base focus:outline-none"
          placeholder={t('customers.search')}
          type="tel"
          inputMode="numeric"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="p-4">
        {customers.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => (
              <button
                key={c.phone}
                className="card w-full text-right active:scale-98 transition-transform"
                onClick={() => navigate(`/customers/${c.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{c.phone}</p>
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
