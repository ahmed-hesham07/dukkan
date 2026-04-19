import { apiPost } from '../api/client.js';
import { log } from '../lib/logger.js';
import {
  getPendingItems,
  markSyncing,
  markDone,
  markFailed,
  markDead,
  countPending,
} from './queue.js';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import type { SyncBatchItem, SyncBatchResponse } from '@dukkan/shared';
import { SYNC_MAX_RETRIES, SYNC_BASE_DELAY_MS, SYNC_MAX_DELAY_MS } from '@dukkan/shared';

let isSyncing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

function getBackoffDelay(attempt: number): number {
  const delay = SYNC_BASE_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, SYNC_MAX_DELAY_MS);
}

function getCurrentTenantId(): string | null {
  return useAuthStore.getState().user?.tenantId ?? null;
}

export async function runSync(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;

  const tenantId = getCurrentTenantId();
  if (!tenantId) return;

  const pending = await getPendingItems(tenantId);
  if (pending.length === 0) {
    useAppStore.getState().setSyncPending(0);
    return;
  }

  log.info(`Sync: starting batch of ${pending.length} item(s)`);
  isSyncing = true;

  const eligible = pending.filter((item) => item.retries < SYNC_MAX_RETRIES);
  if (eligible.length === 0) {
    isSyncing = false;
    return;
  }

  const batchPayload: SyncBatchItem[] = eligible.map((item) => ({
    clientId: item.clientId,
    entity: item.entity,
    action: item.action,
    payload: item.payload,
  }));

  await Promise.all(eligible.map((item) => markSyncing(item.id!)));

  try {
    const response = await apiPost<SyncBatchResponse['results']>(
      '/sync/batch',
      batchPayload
    );

    let successCount = 0;
    let failCount = 0;

    for (const result of response) {
      const item = eligible.find((i) => i.clientId === result.clientId);
      if (!item) continue;
      if (result.success) {
        await markDone(item.id!);
        successCount++;
      } else if (result.permanent) {
        // Server confirmed this is a bad-data error — retrying will never help.
        await markDead(item.id!, result.error || 'permanent error');
        failCount++;
        log.error('Sync: item permanently dead — will not retry', undefined, {
          clientId: result.clientId,
          error: result.error,
          entity: item.entity,
        });
      } else {
        await markFailed(item.id!, result.error || 'خطأ', item.retries + 1);
        failCount++;
        log.warn('Sync: item failed', { clientId: result.clientId, error: result.error });
      }
    }

    log.info('Sync: batch complete', { successCount, failCount });
    retryCount = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ في الشبكة';
    log.error('Sync: batch request failed', err);
    for (const item of eligible) {
      await markFailed(item.id!, message, item.retries + 1);
    }

    retryCount++;
    const delay = getBackoffDelay(retryCount);
    log.warn('Sync: scheduling retry with backoff', { retryCount, delayMs: delay });
    scheduleRetry(delay);
  } finally {
    isSyncing = false;
    const tenantIdNow = getCurrentTenantId();
    if (tenantIdNow) {
      const stillPending = await countPending(tenantIdNow);
      useAppStore.getState().setSyncPending(stillPending);
    }
  }
}

function scheduleRetry(delayMs: number) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    runSync();
  }, delayMs);
}

export function initSyncEngine() {
  const store = useAppStore.getState();

  const handleOnline = () => {
    log.info('Network: back online — triggering sync');
    store.setOnline(true);
    retryCount = 0;
    runSync();
  };

  const handleOffline = () => {
    log.warn('Network: went offline');
    store.setOnline(false);
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (navigator.onLine) {
    runSync();
  }

  const periodicSync = setInterval(() => {
    if (navigator.onLine) runSync();
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(periodicSync);
    if (retryTimer) clearTimeout(retryTimer);
  };
}
