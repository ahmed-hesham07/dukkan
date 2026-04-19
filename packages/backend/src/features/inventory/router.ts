import { Router } from 'express';
import {
  listProducts,
  createProduct,
  adjustStock,
  updateProduct,
  deleteProduct,
} from './service.js';
import { getAuthUser } from '../../middleware/auth.js';

export const productsRouter = Router();

productsRouter.get('/', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const products = await listProducts(tenantId);
    res.json({ data: products, error: null });
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const { name, price, stock, lowStockThreshold } = req.body as {
      name: string;
      price: number;
      stock?: number;
      lowStockThreshold?: number;
    };
    if (!name || price === undefined) {
      res.status(400).json({ data: null, error: 'الاسم والسعر مطلوبان' });
      return;
    }
    const product = await createProduct({ name, price, stock, lowStockThreshold }, tenantId);
    res.status(201).json({ data: product, error: null });
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const updated = await updateProduct(
      req.params.id,
      req.body as { name?: string; price?: number; lowStockThreshold?: number },
      tenantId
    );
    if (!updated) {
      res.status(404).json({ data: null, error: 'المنتج غير موجود' });
      return;
    }
    res.json({ data: updated, error: null });
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id/stock', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    const delta = Number(req.body.delta);
    if (isNaN(delta)) {
      res.status(400).json({ data: null, error: 'قيمة التعديل غير صحيحة' });
      return;
    }
    const product = await adjustStock(req.params.id, delta, tenantId);
    if (!product) {
      res.status(404).json({ data: null, error: 'المنتج غير موجود' });
      return;
    }
    res.json({ data: product, error: null });
  } catch (err) {
    next(err);
  }
});

productsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { tenantId } = getAuthUser(req);
    await deleteProduct(req.params.id, tenantId);
    res.json({ data: { deleted: true }, error: null });
  } catch (err) {
    next(err);
  }
});
