import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export function SyncIndicator() {
  const { isOnline, syncPending } = useAppStore();
  const { t } = useTranslation();

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#f59e0b',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}
        />
        {t('sync.offline')}
      </div>
    );
  }

  if (syncPending > 0) {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          color: '#a855f7',
        }}
      >
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {t('sync.syncing')} {syncPending > 0 && `(${syncPending})`}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.25)',
        color: '#10b981',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
      />
      {t('sync.synced')}
    </div>
  );
}
