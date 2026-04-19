import { localDb } from './db.js';
import type { SyncEntity, SyncQueueItem } from '@dukkan/shared';

export async function enqueue(
  clientId: string,
  entity: SyncEntity,
  action: SyncQueueItem['action'],
  payload: Record<string, unknown>
): Promise<void> {
  await localDb.syncQueue.add({
    clientId,
    entity,
    action,
    payload,
    retries: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingItems() {
  return localDb.syncQueue
    .where('status')
    .anyOf(['pending', 'failed'])
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

export async function countPending(): Promise<number> {
  return localDb.syncQueue
    .where('status')
    .anyOf(['pending', 'failed', 'syncing'])
    .count();
}
