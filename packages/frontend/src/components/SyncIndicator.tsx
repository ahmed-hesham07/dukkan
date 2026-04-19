import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export function SyncIndicator() {
  const { isOnline, syncPending } = useAppStore();
  const { t } = useTranslation();

  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-300 font-medium">
        <span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" />
        {t('sync.offline')}
      </span>
    );
  }

  if (syncPending > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-200 font-medium">
        <span className="w-2 h-2 rounded-full bg-blue-300 inline-block animate-pulse" />
        {t('sync.syncing')}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-green-300 font-medium">
      <span className="w-2 h-2 rounded-full bg-green-300 inline-block" />
      {t('sync.synced')}
    </span>
  );
}
