import { localDb } from './db.js';
import type { SyncEntity, SyncQueueItem } from '@dukkan/shared';

export async function enqueue(
  clientId: string,
  entity: SyncEntity,
  action: SyncQueueItem['action'],
  payload: Record<string, unknown>,
  tenantId: string
): Promise<void> {
  await localDb.syncQueue.add({
    clientId,
    entity,
    action,
    payload,
    retries: 0,
    status: 'pending',
    tenantId,
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingItems(tenantId: string) {
  return localDb.syncQueue
    .where('tenantId')
    .equals(tenantId)
    .and((item) => item.status === 'pending' || item.status === 'failed')
    .sortBy('createdAt');
}

export async function markSyncing(id: number) {
  await localDb.syncQueue.update(id, { status: 'syncing' });
}

export async function markDone(id: number) {
  await localDb.syncQueue.update(id, { status: 'done' });
}

export async function markFailed(id: number, error: string, retries: number) {
  await localDb.syncQueue.update(id, { status: 'failed', error, retries });
}

/**
 * Mark an item as permanently dead — it will never be retried.
 * Used when the server signals a permanent data error (e.g. bad UUID, FK violation).
 */
export async function markDead(id: number, error: string) {
  await localDb.syncQueue.update(id, { status: 'dead', error });
}

export async function countPending(tenantId: string): Promise<number> {
  return localDb.syncQueue
    .where('tenantId')
    .equals(tenantId)
    .and((item) =>
      item.status === 'pending' ||
      item.status === 'failed' ||
      item.status === 'syncing'
    )
    .count();
}
