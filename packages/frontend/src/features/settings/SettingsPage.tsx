import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { SyncIndicator } from '../../components/SyncIndicator';
import { runSync } from '../../offline/syncEngine';
import { clearTenantData } from '../../offline/db';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 px-1">{title}</p>
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(20,20,42,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, right, danger, onClick }: {
  icon: string;
  label: string;
  right?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-3.5 px-4 py-4 transition-all active:scale-95 disabled:cursor-default"
      style={{ color: danger ? '#f72585' : 'inherit' }}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="flex-1 text-start font-semibold text-sm" style={{ color: danger ? '#f72585' : 'rgba(255,255,255,0.85)' }}>
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
  const roleGradient = user?.role === 'owner'
    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
    : 'linear-gradient(135deg, #7c3aed, #06b6d4)';

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">{t('nav.settings')}</h1>
          <SyncIndicator />
        </div>
      </header>

      <div className="p-4 space-y-6">

        {/* User Profile Card */}
        {user && (
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              boxShadow: '0 4px 24px rgba(124,58,237,0.12)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.4)',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-xl truncate">{user.username}</p>
                <span
                  className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1.5 text-white"
                  style={{ background: roleGradient }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Language */}
        <Section title={t('settings.language')}>
          <div className="p-3 grid grid-cols-2 gap-2">
            {(['ar', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="py-3 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95"
                style={lang === l
                  ? {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }
                }
              >
                {l === 'ar' ? '🇪🇬 عربي' : '🇬🇧 English'}
              </button>
            ))}
          </div>
        </Section>

        {/* Sync */}
        <Section title={t('settings.syncSection')}>
          <Row icon="📡" label={t('settings.syncStatus')} right={<SyncIndicator />} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />
          <Row icon="⏳" label={t('settings.syncPending')} right={
            <span
              className="text-sm font-black px-2.5 py-1 rounded-full"
              style={syncPending > 0
                ? { background: 'rgba(124,58,237,0.2)', color: '#a855f7' }
                : { color: 'rgba(255,255,255,0.3)' }
              }
            >
              {syncPending}
            </span>
          } />
          <div className="px-4 pb-4 pt-2">
            <button
              className="btn-primary"
              onClick={handleManualSync}
              disabled={!isOnline}
            >
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M4 4v5h5M20 20v-5h-5M4 9a8.001 8.001 0 0115.93-1M20 15a8.001 8.001 0 01-15.93 1"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('settings.syncNow')}
              </span>
            </button>
          </div>
        </Section>

        {/* Maintenance */}
        <Section title={t('settings.maintenance')}>
          <Row icon="🗑️" label={t('settings.clearCache')} onClick={handleClearCache}
            right={<svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          />
        </Section>

        {/* System Info */}
        <Section title={t('settings.systemInfo')}>
          {[
            { icon: '🌐', label: t('settings.frontend'), val: ':3847' },
            { icon: '⚙️', label: t('settings.backend'), val: ':4847' },
            { icon: '🗄️', label: t('settings.database'), val: ':5847' },
            { icon: '🏷️', label: t('settings.version'), val: '1.1.0' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-medium text-white/50">{item.label}</span>
                <span className="font-mono text-xs font-bold text-white/40">{item.val}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 16px' }} />
              )}
            </div>
          ))}
        </Section>

        {/* Logout */}
        {user && (
          <Section title="">
            <Row icon="🚪" label={t('settings.logout')} danger onClick={handleLogout} />
          </Section>
        )}
      </div>
    </div>
  );
}
