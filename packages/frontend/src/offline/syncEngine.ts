import { apiPost } from '../api/client.js';
import {
  getPendingItems,
  markSyncing,
  markDone,
  markFailed,
  countPending,
} from './queue.js';
import { useAppStore } from '../store/useAppStore.js';
import type { SyncBatchItem, SyncBatchResponse } from '@dukkan/shared';
import { SYNC_MAX_RETRIES, SYNC_BASE_DELAY_MS, SYNC_MAX_DELAY_MS } from '@dukkan/shared';

let isSyncing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

function getBackoffDelay(attempt: number): number {
  const delay = SYNC_BASE_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, SYNC_MAX_DELAY_MS);
}

export async function runSync(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;

  const pending = await getPendingItems();
  if (pending.length === 0) {
    useAppStore.getState().setSyncPending(0);
    return;
  }

  isSyncing = true;

  // Filter out items that have exceeded max retries
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

  // Mark all as syncing
  await Promise.all(eligible.map((item) => markSyncing(item.id!)));

  try {
    const response = await apiPost<SyncBatchResponse['results']>(
      '/sync/batch',
      batchPayload
    );

    for (const result of response) {
      const item = eligible.find((i) => i.clientId === result.clientId);
      if (!item) continue;

      if (result.success) {
        await markDone(item.id!);
      } else {
        await markFailed(item.id!, result.error || 'خطأ', item.retries + 1);
      }
    }

    retryCount = 0;
  } catch (err) {
    // Network/server error — backoff and retry all
    for (const item of eligible) {
      await markFailed(
        item.id!,
        err instanceof Error ? err.message : 'خطأ في الشبكة',
        item.retries + 1
      );
    }

    retryCount++;
    const delay = getBackoffDelay(retryCount);
    scheduleRetry(delay);
  } finally {
    isSyncing = false;
    const stillPending = await countPending();
    useAppStore.getState().setSyncPending(stillPending);
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
    store.setOnline(true);
    retryCount = 0;
    runSync();
  };

  const handleOffline = () => {
    store.setOnline(false);
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Sync on startup if online
  if (navigator.onLine) {
    runSync();
  }

  // Periodic sync every 30 seconds
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
