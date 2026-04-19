export type SyncEntity = 'order' | 'customer' | 'product' | 'stock';
export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'done';

export interface SyncQueueItem {
  id?: number;
  clientId: string;
  entity: SyncEntity;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  retries: number;
  status: SyncStatus;
  error?: string;
  createdAt: string;
}

export interface SyncBatchItem {
  clientId: string;
  entity: SyncEntity;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
}

export interface SyncBatchResult {
  clientId: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SyncBatchResponse {
  results: SyncBatchResult[];
}
