import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { SyncIndicator } from '../../components/SyncIndicator';
import { runSync } from '../../offline/syncEngine';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isOnline, syncPending, showToast } = useAppStore();

  const handleManualSync = async () => {
    if (!isOnline) {
      showToast('لا يوجد اتصال بالإنترنت', 'error');
      return;
    }
    await runSync();
    showToast('تمت المزامنة');
  };

  const handleClearCache = async () => {
    if (confirm('هل أنت متأكد؟ سيتم حذف البيانات المحلية غير المتزامنة.')) {
      // Only clear done items from sync queue
      const { localDb } = await import('../../offline/db');
      await localDb.syncQueue.where('status').equals('done').delete();
      showToast('تم تنظيف السجلات القديمة');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('nav.settings')}</h1>
          <SyncIndicator />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* App Info */}
        <div className="card text-center py-6">
          <div className="text-4xl font-bold text-primary mb-1">دكان</div>
          <div className="text-gray-400 text-sm">نظام إدارة المحل</div>
          <div className="text-xs text-gray-300 mt-1">الإصدار 1.0.0</div>
        </div>

        {/* Sync Status */}
        <div className="card space-y-3">
          <p className="font-semibold text-gray-700">حالة المزامنة</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">الحالة</span>
            <SyncIndicator />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">في الانتظار</span>
            <span className="font-bold text-gray-700">{syncPending} عملية</span>
          </div>
          <button className="btn-primary" onClick={handleManualSync} disabled={!isOnline}>
            مزامنة الآن
          </button>
        </div>

        {/* Maintenance */}
        <div className="card space-y-3">
          <p className="font-semibold text-gray-700">الصيانة</p>
          <button className="btn-secondary" onClick={handleClearCache}>
            تنظيف السجلات القديمة
          </button>
        </div>

        {/* Ports info for dev */}
        <div className="card space-y-2">
          <p className="font-semibold text-gray-700 text-sm">معلومات النظام</p>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>الواجهة الأمامية</span>
              <span className="font-mono">:3847</span>
            </div>
            <div className="flex justify-between">
              <span>الخادم</span>
              <span className="font-mono">:4847</span>
            </div>
            <div className="flex justify-between">
              <span>قاعدة البيانات</span>
              <span className="font-mono">:5847</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
