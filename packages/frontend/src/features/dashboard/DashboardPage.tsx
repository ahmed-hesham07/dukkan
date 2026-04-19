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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: up ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        color: up ? '#34d399' : '#f87171',
      }}
    >
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  valueColor: string;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
}

function KPICard({ label, value, valueColor, sub, icon, accent }: KPICardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-50">{label}</p>
        <span className="opacity-40">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight" style={{ color: valueColor }}>
          {value}
        </p>
        {sub && <div className="mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest opacity-40 px-1 mb-2">
      {children}
    </p>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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

  const revenueDiff =
    stats && stats.yesterdayRevenue > 0
      ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
      : null;

  const profitMargin =
    stats && stats.todayRevenue > 0
      ? Math.round((stats.todayProfit / stats.todayRevenue) * 100)
      : null;

  return (
    <div className="page-container pb-28">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-black text-white">{t('dashboard.title')}</h1>
          <p className="text-xs opacity-40 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg
              viewBox="0 0 24 24" className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`}
              fill="none"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <SyncIndicator />
          <LanguageSwitcher />
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && !stats && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs opacity-40">{t('common.loading')}</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="mx-4 mt-4 p-5 rounded-2xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
          <button className="btn-primary py-2 text-sm" onClick={fetchStats}>{t('dashboard.refresh')}</button>
        </div>
      )}

      {/* ── Content ── */}
      {stats && (
        <div className="px-4 pt-2 flex flex-col gap-5">

          {/* ── Revenue spotlight ── */}
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(6,182,212,0.06) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">{t('dashboard.revenue')}</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-white leading-none">
                {fmt(stats.todayRevenue)}
                <span className="text-base font-semibold opacity-40 ms-1">{t('common.egp')}</span>
              </p>
              <TrendBadge pct={revenueDiff} />
            </div>
            {stats.yesterdayRevenue > 0 && (
              <p className="text-xs opacity-40 mt-2">
                {t('dashboard.vsYesterday')}: {fmt(stats.yesterdayRevenue)} {t('common.egp')}
              </p>
            )}
          </div>

          {/* ── 3-stat row ── */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs opacity-40 font-medium">{t('dashboard.orders')}</p>
              <p className="text-2xl font-black text-white">{stats.todayOrders}</p>
              {stats.pendingOrders > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full self-start" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                  {stats.pendingOrders} ⏳
                </span>
              )}
            </div>
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-xs opacity-40 font-medium">{t('dashboard.profit')}</p>
              <p className="text-2xl font-black" style={{ color: '#34d399' }}>{fmt(stats.todayProfit)}</p>
              {profitMargin !== null && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full self-start" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                  {profitMargin}%
                </span>
              )}
            </div>
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${stats.outstandingDebt > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <p className="text-xs opacity-40 font-medium">{t('dashboard.debt')}</p>
              <p className="text-2xl font-black" style={{ color: stats.outstandingDebt > 0 ? '#f87171' : '#34d399' }}>
                {stats.outstandingDebt > 0 ? fmt(stats.outstandingDebt) : '—'}
              </p>
              {stats.outstandingDebt > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full self-start" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                  {t('common.egp')}
                </span>
              )}
            </div>
          </div>

          <Divider />

          {/* ── Low stock ── */}
          <div>
            <SectionLabel>{t('dashboard.lowStock')}</SectionLabel>
            {stats.lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 px-1">
                <span className="text-emerald-400 text-sm">✓</span>
                <p className="text-sm opacity-50">{t('dashboard.noLowStock')}</p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}
              >
                {stats.lowStockProducts.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate('/inventory')}
                    className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70 text-start"
                    style={{
                      borderBottom: i < stats.lowStockProducts.length - 1
                        ? '1px solid rgba(245,158,11,0.12)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-400">{p.stock} left</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* ── Top products ── */}
          <div>
            <SectionLabel>{t('dashboard.topProducts')}</SectionLabel>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm opacity-40 px-1">{t('dashboard.noSales')}</p>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {stats.topProducts.map((p, i) => {
                  const rankColors = ['#f59e0b', '#9ca3af', '#92400e'];
                  const rankColor = rankColors[i] ?? '#4b5563';
                  const barPct = stats.topProducts[0]?.totalQty
                    ? Math.round((p.totalQty / stats.topProducts[0].totalQty) * 100)
                    : 100;
                  return (
                    <div
                      key={p.name}
                      className="px-4 py-3.5"
                      style={{
                        borderBottom: i < stats.topProducts.length - 1
                          ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: rankColor, color: '#fff', fontSize: '0.6rem' }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-bold text-white">{fmt(p.totalRevenue)}</p>
                          <p className="text-xs opacity-40">{p.totalQty} {t('dashboard.qty')}</p>
                        </div>
                      </div>
                      {/* mini progress bar */}
                      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, background: rankColor, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Divider />

          {/* ── Quick actions ── */}
          <div>
            <SectionLabel>{t('dashboard.quickActions')}</SectionLabel>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: t('dashboard.newOrder'), icon: '＋', color: '#a78bfa', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)', path: '/orders/new' },
                { label: t('dashboard.adjustStock'), icon: '◫', color: '#60a5fa', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', path: '/inventory' },
                { label: t('dashboard.viewCustomers'), icon: '⊕', color: '#34d399', bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.2)', path: '/customers' },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
                  style={{ background: action.bg, border: `1px solid ${action.border}` }}
                >
                  <span className="text-xl font-black" style={{ color: action.color }}>{action.icon}</span>
                  <span className="text-xs font-semibold text-center leading-tight" style={{ color: action.color }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
