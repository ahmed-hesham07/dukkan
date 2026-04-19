import { db } from '../../db/client.js';

export async function listProducts(tenantId: string) {
  return db
    .selectFrom('products')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .orderBy('name', 'asc')
    .execute();
}

export async function createProduct(
  data: {
    name: string;
    price: number;
    stock?: number;
    lowStockThreshold?: number;
  },
  tenantId: string
) {
  return db
    .insertInto('products')
    .values({
      tenant_id: tenantId,
      name: data.name,
      price: data.price,
      stock: data.stock ?? 0,
      low_stock_threshold: data.lowStockThreshold ?? 5,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function adjustStock(id: string, delta: number, tenantId: string) {
  const product = await db
    .selectFrom('products')
    .select(['id', 'stock'])
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (!product) return null;

  const newStock = Math.max(0, product.stock + delta);
  return db
    .updateTable('products')
    .set({ stock: newStock })
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateProduct(
  id: string,
  data: { name?: string; price?: number; lowStockThreshold?: number },
  tenantId: string
) {
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.price !== undefined) updates.price = data.price;
  if (data.lowStockThreshold !== undefined)
    updates.low_stock_threshold = data.lowStockThreshold;

  return db
    .updateTable('products')
    .set(updates)
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .returningAll()
    .executeTakeFirst();
}

export async function deleteProduct(id: string, tenantId: string) {
  await db
    .deleteFrom('products')
    .where('id', '=', id)
    .where('tenant_id', '=', tenantId)
    .execute();
}
