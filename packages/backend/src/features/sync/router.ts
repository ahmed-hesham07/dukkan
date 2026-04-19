import { Router } from 'express';
import { createOrder } from '../orders/service.js';
import { upsertCustomer } from '../customers/service.js';
import { adjustStock, createProduct } from '../inventory/service.js';
import type { SyncBatchItem, SyncBatchResult, CreateOrderInput } from '@dukkan/shared';

export const syncRouter = Router();

syncRouter.post('/batch', async (req, res, next) => {
  try {
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
          const result = await createOrder(item.payload as unknown as CreateOrderInput);
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'customer' && item.action === 'create') {
          const p = item.payload as { phone: string; name: string };
          const result = await upsertCustomer(p.phone, p.name);
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'product' && item.action === 'create') {
          const p = item.payload as {
            name: string;
            price: number;
            stock?: number;
            lowStockThreshold?: number;
          };
          const result = await createProduct(p);
          data = result as unknown as Record<string, unknown>;
        } else if (item.entity === 'stock' && item.action === 'update') {
          const p = item.payload as { productId: string; delta: number };
          const result = await adjustStock(p.productId, p.delta);
          data = result as unknown as Record<string, unknown>;
        } else {
          results.push({ clientId: item.clientId, success: false, error: 'عملية غير معروفة' });
          continue;
        }

        results.push({ clientId: item.clientId, success: true, data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'خطأ غير معروف';
        results.push({ clientId: item.clientId, success: false, error: message });
      }
    }

    res.json({ data: { results }, error: null });
  } catch (err) {
    next(err);
  }
});
