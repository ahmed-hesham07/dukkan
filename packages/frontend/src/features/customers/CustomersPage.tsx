import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../offline/db';
import { SyncIndicator } from '../../components/SyncIndicator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuthStore } from '../../store/useAuthStore';
import type { LocalCustomer } from '../../offline/db';

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
      ? localDb.customers.where('tenantId').equals(tenantId)
          .and((c) => c.phone.includes(query)).limit(30).toArray()
      : localDb.customers.where('tenantId').equals(tenantId).limit(50).toArray()
          .then((rows) => rows.sort((a, b) => a.name.localeCompare(b.name)));
    promise.then(setCustomers);
  }, [query, tenantId]);

  const avatarColor = (name: string) => {
    const colors = [
      ['rgba(124,58,237,0.3)', '#a855f7'],
      ['rgba(6,182,212,0.3)', '#06b6d4'],
      ['rgba(247,37,133,0.3)', '#f72585'],
      ['rgba(16,185,129,0.3)', '#10b981'],
      ['rgba(245,158,11,0.3)', '#f59e0b'],
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">{t('customers.title')}</h1>
            <p className="text-xs text-white/40 mt-0.5 font-medium">
              {customers.length} {t('customers.title').toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none"
            fill="none"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="w-full rounded-2xl ps-10 pe-4 py-3.5 text-base font-medium text-white
              placeholder-white/30 focus:outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              minHeight: '52px',
            }}
            placeholder={t('customers.search')}
            type="tel"
            inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="p-4">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 animate-fade-in">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-5"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              👥
            </div>
            <p className="text-white/40 text-base font-medium">{t('customers.noCustomers')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {customers.map((c, i) => {
              const [bgColor, textColor] = avatarColor(c.name);
              return (
                <button
                  key={c.phone}
                  className="w-full text-start transition-all duration-150 active:scale-95"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3.5"
                    style={{
                      background: 'rgba(20,20,42,0.85)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                      animationDelay: `${i * 25}ms`,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: bgColor, color: textColor }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{c.name}</p>
                      <p className="text-sm text-white/40 mt-0.5 font-medium">{c.phone}</p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/20 flex-shrink-0" fill="none">
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
