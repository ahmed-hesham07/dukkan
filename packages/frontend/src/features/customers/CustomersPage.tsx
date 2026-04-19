import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { SyncIndicator } from '../../components/SyncIndicator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuthStore } from '../../store/useAuthStore';
import type { LocalCustomer } from '../../offline/db';

const AVATAR_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#CFFAFE', text: '#0891B2' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEF3C7', text: '#D97706' },
];

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId ?? '';
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    const promise = query.length >= 2
      ? localDb.customers.where('tenantId').equals(tenantId).and((c) => c.phone.includes(query)).limit(30).toArray()
      : localDb.customers.where('tenantId').equals(tenantId).limit(50).toArray()
          .then((rows) => rows.sort((a, b) => a.name.localeCompare(b.name)));
    promise.then(setCustomers);
  }, [query, tenantId]);

  const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('customers.title')}</h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#9C94B8' }}>
              {customers.length} {t('customers.title').toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" fill="none"
            style={{ color: '#9C94B8' }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="input-field"
            style={{ paddingInlineStart: '2.75rem' }}
            placeholder={t('customers.search')}
            type="tel" inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="p-4">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 animate-fade-in gap-3">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
              👥
            </div>
            <p className="text-sm font-semibold" style={{ color: '#9C94B8' }}>{t('customers.noCustomers')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => {
              const { bg, text } = avatarColor(c.name);
              return (
                <button key={c.phone} className="w-full text-start transition-all active:scale-95"
                  onClick={() => navigate(`/customers/${c.id}`)}>
                  <div className="rounded-2xl p-4 flex items-center gap-3.5"
                    style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.05)' }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: bg, color: text }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: '#130F2A' }}>{c.name}</p>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: '#9C94B8' }}>{c.phone}</p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" style={{ color: '#C4B8F0' }}>
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
