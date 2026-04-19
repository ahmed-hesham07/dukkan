import { Router } from 'express';
import { createOrder } from '../orders/service.js';
import { upsertCustomer } from '../customers/service.js';
import { adjustStock, createProduct } from '../inventory/service.js';
import { logger } from '../../lib/logger.js';
import type { SyncBatchItem, SyncBatchResult, CreateOrderInput } from '@dukkan/shared';
import { getAuthUser } from '../../middleware/auth.js';

export const syncRouter = Router();

/**
 * PostgreSQL error codes that indicate a permanent data problem —
 * retrying will never succeed, so the frontend should mark these as dead.
 * 22P02 = invalid_text_representation (e.g. bad UUID format)
 * 23503 = foreign_key_violation
 * 23505 = unique_violation (duplicate, safe to discard)
 */
const PERMANENT_PG_CODES = new Set(['22P02', '23503', '23505']);

function isPermanentError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return PERMANENT_PG_CODES.has((err as { code: string }).code);
  }
  return false;
}

syncRouter.post('/batch', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const items = req.body as SyncBatchItem[];

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ data: null, error: 'قائمة العمليات فارغة' });
      return;
    }

    const results: SyncBatchResult[] = [];

    for (const item of items) {
      try {
        let data: Record<string, unknown> | undefined;

        if (item.entity === 'order' && item.action === 'create') {
          const result = await createOrder(
            item.payload as unknown as CreateOrderInput,
            tenantId
          );
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'customer' && item.action === 'create') {
          const p = item.payload as { phone: string; name: string };
          const result = await upsertCustomer(p.phone, p.name, tenantId);
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'product' && item.action === 'create') {
          const p = item.payload as {
            name: string;
            price: number;
            stock?: number;
            lowStockThreshold?: number;
          };
          const result = await createProduct(p, tenantId);
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'stock' && item.action === 'update') {
          const p = item.payload as { productId: string; delta: number };
          const result = await adjustStock(p.productId, p.delta, tenantId);
          data = result as unknown as Record<string, unknown>;
        } else {
          results.push({
            clientId: item.clientId,
            success: false,
            permanent: true,
            error: 'عملية غير معروفة',
          });
          continue;
        }

        results.push({ clientId: item.clientId, success: true, data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'خطأ غير معروف';
        const permanent = isPermanentError(err);

        if (permanent) {
          logger.error(
            { err, clientId: item.clientId, entity: item.entity },
            'Sync: permanent error — item will be marked dead'
          );
        }

        results.push({ clientId: item.clientId, success: false, permanent, error: message });
      }
    }

    res.json({ data: { results }, error: null });
  } catch (err) {
    next(err);
  }
});
