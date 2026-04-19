import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { SyncIndicator } from '../../components/SyncIndicator';
import { DukkanMark } from '../../components/DukkanLogo';
import { runSync } from '../../offline/syncEngine';
import { clearTenantData } from '../../offline/db';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <p className="section-label mb-2">{title}</p>}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 1px 6px rgba(19,15,42,0.04)' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, right, danger, onClick }: {
  icon: React.ReactNode; label: string; right?: React.ReactNode;
  danger?: boolean; onClick?: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-3.5 px-4 py-4 transition-all active:opacity-70 disabled:cursor-default"
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center" style={{ color: danger ? '#EF4444' : '#9C94B8' }}>
        {icon}
      </span>
      <span className="flex-1 text-start font-semibold text-sm" style={{ color: danger ? '#DC2626' : '#130F2A' }}>
        {label}
      </span>
      {right}
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline, syncPending, showToast } = useAppStore();
  const { user, logout } = useAuthStore();
  const { lang, setLang } = useLanguageStore();

  const handleManualSync = async () => {
    if (!isOnline) { showToast(t('msg.noInternet'), 'error'); return; }
    await runSync();
    showToast(t('msg.syncDone'));
  };

  const handleLogout = async () => {
    if (!confirm(t('msg.confirmLogout'))) return;
    if (user?.tenantId) await clearTenantData(user.tenantId);
    logout();
    navigate('/login', { replace: true });
  };

  const handleClearCache = async () => {
    if (confirm(t('msg.confirmClear'))) {
      const { localDb } = await import('../../offline/db');
      await localDb.syncQueue.where('status').equals('done').delete();
      showToast(t('msg.cacheCleared'));
    }
  };

  const roleLabel = user?.role === 'owner' ? t('settings.roleOwner') : t('settings.roleCashier');

  return (
    <div className="page-container">
      <header className="page-header flex items-center justify-between">
        <h1 className="text-xl font-black" style={{ color: '#130F2A' }}>{t('nav.settings')}</h1>
        <SyncIndicator />
      </header>

      <div className="p-4 space-y-5">

        {/* User card */}
        {user && (
          <div
            className="rounded-3xl p-5 flex items-center gap-4"
            style={{ background: '#7C3AED', boxShadow: '0 6px 24px rgba(124,58,237,0.25)' }}
          >
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 uppercase"
              style={{ background: 'rgba(255,255,255,0.18)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {user.username.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-lg truncate capitalize">{user.username}</p>
              <span
                className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 text-white"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                {roleLabel}
              </span>
            </div>

            {/* Brand mark — subtle presence */}
            <DukkanMark size={32} inverted />
          </div>
        )}

        {/* Language */}
        <Section title={t('settings.language')}>
          <div className="p-3 grid grid-cols-2 gap-2">
            {(['ar', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
                style={
                  lang === l
                    ? { background: '#7C3AED', color: '#FFF', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }
                    : { background: '#F5F4FF', color: '#6B5B9A', border: '1px solid #E2DFF0' }
                }
              >
                {l === 'ar' ? 'عربي' : 'English'}
              </button>
            ))}
          </div>
        </Section>

        {/* Sync */}
        <Section title={t('settings.syncSection')}>
          <Row
            icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
            label={t('settings.syncStatus')}
            right={<SyncIndicator />}
          />
          <div style={{ height: 1, background: '#F3F0FF', margin: '0 16px' }} />
          <Row
            icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            label={t('settings.syncPending')}
            right={
              <span className="text-sm font-black px-2.5 py-1 rounded-full"
                style={syncPending > 0 ? { background: '#EDE9FE', color: '#7C3AED' } : { color: '#9C94B8' }}>
                {syncPending}
              </span>
            }
          />
          <div className="px-4 pb-4 pt-2">
            <button className="btn-primary" onClick={handleManualSync} disabled={!isOnline}>
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M4 4v5h5M20 20v-5h-5M4 9a8.001 8.001 0 0115.93-1M20 15a8.001 8.001 0 01-15.93 1"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('settings.syncNow')}
              </span>
            </button>
          </div>
        </Section>

        {/* Maintenance */}
        <Section title={t('settings.maintenance')}>
          <Row
            icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label={t('settings.clearCache')}
            onClick={handleClearCache}
            right={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" style={{ color: '#C4B8F0' }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
          />
        </Section>

        {/* System info */}
        <Section title={t('settings.systemInfo')}>
          {[
            { label: t('settings.frontend'), val: ':3847' },
            { label: t('settings.backend'),  val: ':4847' },
            { label: t('settings.database'), val: ':5847' },
            { label: t('settings.version'),  val: '1.1.0' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <span className="w-5 h-5 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ color: '#C4B8F0' }}>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="flex-1 text-sm font-medium" style={{ color: '#6B5B9A' }}>{item.label}</span>
                <span className="font-mono text-xs font-bold" style={{ color: '#9C94B8' }}>{item.val}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: '#F3F0FF', margin: '0 16px' }} />}
            </div>
          ))}
        </Section>

        {/* Logout */}
        {user && (
          <Section title="">
            <Row
              icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label={t('settings.logout')}
              danger
              onClick={handleLogout}
              right={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" style={{ color: '#FECACA' }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
            />
          </Section>
        )}

      </div>
    </div>
  );
}
