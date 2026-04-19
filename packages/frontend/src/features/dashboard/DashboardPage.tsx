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

function KPICard({
  label,
  value,
  sub,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  icon: string;
}) {
  return (
    <div className={`card relative overflow-hidden`} style={{ padding: '1.25rem' }}>
      <div
        className="absolute inset-0 opacity-10 rounded-2xl"
        style={{ background: gradient }}
      />
      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs font-medium opacity-60 mt-1">{label}</p>
        <p
          className="text-xl font-black"
          style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {value}
        </p>
        {sub && <p className="text-xs opacity-50">{sub}</p>}
      </div>
    </div>
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const revenueDiff =
    stats && stats.yesterdayRevenue > 0
      ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
      : null;

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs opacity-50 mt-0.5">{t('app.tagline')}</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <LanguageSwitcher />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="opacity-50">{t('common.loading')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6 text-center" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <p className="text-red-400 font-medium mb-3">{error}</p>
          <button className="btn-primary" onClick={fetchStats}>
            {t('dashboard.refresh')}
          </button>
        </div>
      )}

      {stats && !loading && (
        <div className="flex flex-col gap-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label={t('dashboard.revenue')}
              value={`${stats.todayRevenue.toLocaleString()} ${t('common.egp')}`}
              sub={
                revenueDiff !== null
                  ? `${revenueDiff >= 0 ? '+' : ''}${revenueDiff}% ${t('dashboard.vsYesterday')}`
                  : undefined
              }
              gradient="linear-gradient(135deg,#7c3aed,#6d28d9)"
              icon="💰"
            />
            <KPICard
              label={t('dashboard.orders')}
              value={String(stats.todayOrders)}
              sub={`${stats.pendingOrders} ${t('dashboard.pending')}`}
              gradient="linear-gradient(135deg,#2563eb,#1d4ed8)"
              icon="📦"
            />
            <KPICard
              label={t('dashboard.profit')}
              value={`${stats.todayProfit.toLocaleString()} ${t('common.egp')}`}
              gradient="linear-gradient(135deg,#059669,#047857)"
              icon="📈"
            />
            <KPICard
              label={t('dashboard.debt')}
              value={`${stats.outstandingDebt.toLocaleString()} ${t('common.egp')}`}
              gradient="linear-gradient(135deg,#dc2626,#b91c1c)"
              icon="⚠️"
            />
          </div>

          {/* Low Stock Alert */}
          {stats.lowStockProducts.length > 0 ? (
            <div className="card p-4" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400">⚠</span>
                <h2 className="font-bold text-amber-400 text-sm">
                  {t('dashboard.lowStock')} ({stats.lowStockProducts.length})
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.lowStockProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate('/inventory')}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24',
                    }}
                  >
                    {p.name} ({p.stock})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-4" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span>✓</span> {t('dashboard.noLowStock')}
              </p>
            </div>
          )}

          {/* Top Products */}
          <div className="card p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <span>🏆</span>
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {t('dashboard.topProducts')}
              </span>
            </h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm opacity-50 text-center py-4">{t('dashboard.noSales')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                        style={{
                          background:
                            i === 0
                              ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                              : i === 1
                              ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                              : 'linear-gradient(135deg,#92400e,#78350f)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs opacity-50">
                          {p.totalQty} {t('dashboard.qty')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-violet-400">
                      {p.totalRevenue.toLocaleString()} {t('common.egp')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <span>⚡</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {t('dashboard.quickActions')}
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/orders/new')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.2))',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
              >
                <span className="text-2xl">🛒</span>
                <span className="text-xs font-semibold text-violet-300">{t('dashboard.newOrder')}</span>
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(29,78,216,0.2))',
                  border: '1px solid rgba(37,99,235,0.3)',
                }}
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-semibold text-blue-300">{t('dashboard.adjustStock')}</span>
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg,rgba(5,150,105,0.2),rgba(4,120,87,0.2))',
                  border: '1px solid rgba(5,150,105,0.3)',
                }}
              >
                <span className="text-2xl">👥</span>
                <span className="text-xs font-semibold text-emerald-300">{t('dashboard.viewCustomers')}</span>
              </button>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchStats}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <span>↻</span> {t('dashboard.refresh')}
          </button>
        </div>
      )}
    </div>
  );
}
