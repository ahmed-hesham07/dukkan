import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export function SyncIndicator() {
  const { isOnline, syncPending } = useAppStore();
  const { t } = useTranslation();

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
        style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
        {t('sync.offline')}
      </span>
    );
  }

  if (syncPending > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
        style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
        <svg className="w-3 h-3 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {syncPending}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      {t('sync.synced')}
    </span>
  );
}
