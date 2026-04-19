import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../api/client';
import { SyncIndicator } from '../../components/SyncIndicator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { log } from '../../lib/logger';

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  todayProfit: number;
  outstandingDebt: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number; threshold: number }>;
  topProducts: Array<{ name: string; totalQty: number; totalRevenue: number }>;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full"
      style={{ background: up ? '#D1FAE5' : '#FEE2E2', color: up ? '#059669' : '#DC2626' }}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<DashboardStats>('/dashboard');
      setStats(data);
      log.info('Dashboard stats loaded', { todayRevenue: data.todayRevenue });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(msg);
      log.error('Dashboard fetch failed', { error: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const revenueDiff = stats && stats.yesterdayRevenue > 0
    ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
    : null;

  const profitMargin = stats && stats.todayRevenue > 0
    ? Math.round((stats.todayProfit / stats.todayRevenue) * 100)
    : null;

  return (
    <div className="page-container pb-28">

      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('dashboard.title')}</h1>
          <p className="text-xs mt-0.5 font-medium" style={{ color: '#9C94B8' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}
          >
            <svg viewBox="0 0 24 24" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" style={{ color: '#7C3AED' }}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <SyncIndicator />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Loading */}
      {loading && !stats && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
          <p className="text-xs font-medium" style={{ color: '#9C94B8' }}>{t('common.loading')}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="m-4 p-5 rounded-2xl text-center"
          style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#DC2626' }}>{error}</p>
          <button className="btn-primary py-2.5 text-sm" style={{ background: 'linear-gradient(135deg,#EF4444,#EC4899)' }}
            onClick={fetchStats}>{t('dashboard.refresh')}</button>
        </div>
      )}

      {stats && (
        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* Revenue spotlight */}
          <div className="rounded-3xl p-5"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/70">{t('dashboard.revenue')}</p>
            <div className="flex items-end gap-3 flex-wrap">
              <p className="text-4xl font-black text-white leading-none">
                {fmt(stats.todayRevenue)}
                <span className="text-base font-semibold text-white/60 ms-1">{t('common.egp')}</span>
              </p>
              <TrendBadge pct={revenueDiff} />
            </div>
            {stats.yesterdayRevenue > 0 && (
              <p className="text-xs text-white/50 mt-2">
                {t('dashboard.vsYesterday')}: {fmt(stats.yesterdayRevenue)} {t('common.egp')}
              </p>
            )}
          </div>

          {/* 3 stat tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Orders */}
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5"
              style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.05)' }}>
              <p className="text-xs font-semibold" style={{ color: '#9C94B8' }}>{t('dashboard.orders')}</p>
              <p className="text-2xl font-black" style={{ color: '#130F2A' }}>{stats.todayOrders}</p>
              {stats.pendingOrders > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full self-start"
                  style={{ background: '#FEF3C7', color: '#D97706' }}>
                  {stats.pendingOrders} ⏳
                </span>
              )}
            </div>

            {/* Profit */}
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5"
              style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', boxShadow: '0 1px 6px rgba(16,185,129,0.08)' }}>
              <p className="text-xs font-semibold" style={{ color: '#9C94B8' }}>{t('dashboard.profit')}</p>
              <p className="text-2xl font-black" style={{ color: '#059669' }}>{fmt(stats.todayProfit)}</p>
              {profitMargin !== null && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full self-start"
                  style={{ background: '#D1FAE5', color: '#059669' }}>
                  {profitMargin}%
                </span>
              )}
            </div>

            {/* Debt */}
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${stats.outstandingDebt > 0 ? '#FECACA' : '#E8E6F5'}`,
                boxShadow: stats.outstandingDebt > 0 ? '0 1px 6px rgba(239,68,68,0.08)' : '0 1px 6px rgba(19,15,42,0.05)',
              }}>
              <p className="text-xs font-semibold" style={{ color: '#9C94B8' }}>{t('dashboard.debt')}</p>
              <p className="text-2xl font-black" style={{ color: stats.outstandingDebt > 0 ? '#DC2626' : '#059669' }}>
                {stats.outstandingDebt > 0 ? fmt(stats.outstandingDebt) : '—'}
              </p>
              {stats.outstandingDebt > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full self-start"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}>{t('common.egp')}</span>
              )}
            </div>
          </div>

          {/* Low stock */}
          <div>
            <p className="section-label">{t('dashboard.lowStock')}</p>
            {stats.lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm" style={{ color: '#059669' }}>✓</span>
                <p className="text-sm font-medium" style={{ color: '#9C94B8' }}>{t('dashboard.noLowStock')}</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                {stats.lowStockProducts.map((p, i) => (
                  <button key={p.id} onClick={() => navigate('/inventory')}
                    className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70 text-start"
                    style={{ borderBottom: i < stats.lowStockProducts.length - 1 ? '1px solid #FDE68A' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D97706' }} />
                      <p className="text-sm font-semibold" style={{ color: '#130F2A' }}>{p.name}</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: '#D97706' }}>{p.stock} left</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Top products */}
          <div>
            <p className="section-label">{t('dashboard.topProducts')}</p>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm font-medium px-1" style={{ color: '#9C94B8' }}>{t('dashboard.noSales')}</p>
            ) : (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.05)' }}>
                {stats.topProducts.map((p, i) => {
                  const rankColors = ['#F59E0B', '#6B7280', '#92400E'];
                  const rc = rankColors[i] ?? '#9CA3AF';
                  const barPct = stats.topProducts[0]?.totalQty
                    ? Math.round((p.totalQty / stats.topProducts[0].totalQty) * 100)
                    : 100;
                  return (
                    <div key={p.name} className="px-4 py-3.5"
                      style={{ borderBottom: i < stats.topProducts.length - 1 ? '1px solid #F3F0FF' : 'none' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                            style={{ background: rc }}>
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold" style={{ color: '#130F2A' }}>{p.name}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-black" style={{ color: '#7C3AED' }}>{fmt(p.totalRevenue)}</p>
                          <p className="text-xs" style={{ color: '#9C94B8' }}>{p.totalQty} {t('dashboard.qty')}</p>
                        </div>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: '#F3F0FF' }}>
                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: rc, opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <p className="section-label">{t('dashboard.quickActions')}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: t('dashboard.newOrder'), icon: '+', bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE', path: '/orders/new' },
                { label: t('dashboard.adjustStock'), icon: '◫', bg: '#CFFAFE', color: '#0891B2', border: '#A5F3FC', path: '/inventory' },
                { label: t('dashboard.viewCustomers'), icon: '⊕', bg: '#D1FAE5', color: '#059669', border: '#A7F3D0', path: '/customers' },
              ].map((a) => (
                <button key={a.path} onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
                  style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                  <span className="text-2xl font-black" style={{ color: a.color }}>{a.icon}</span>
                  <span className="text-xs font-bold text-center leading-tight" style={{ color: a.color }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
