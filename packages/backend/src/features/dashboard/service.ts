import { db } from '../../db/client.js';
import { sql } from 'kysely';
import { logger } from '../../lib/logger.js';

export interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  todayProfit: number;
  outstandingDebt: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number; threshold: number }>;
  topProducts: Array<{ name: string; totalQty: number; totalRevenue: number }>;
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const log = logger.child({ fn: 'getDashboardStats', tenantId });

  const [
    revenueTodayRow,
    revenueYestRow,
    pendingRow,
    profitTodayRow,
    debtRow,
    lowStockRows,
    topProductRows,
  ] = await Promise.all([
    // Today revenue + order count (status paid or delivered)
    db
      .selectFrom('orders')
      .select([
        sql<string>`COALESCE(SUM(total - discount_amount), 0)`.as('revenue'),
        sql<string>`COUNT(*)`.as('order_count'),
      ])
      .where('tenant_id', '=', tenantId)
      .where('status', 'in', ['paid', 'delivered'])
      .where(sql`created_at::date`, '=', sql`CURRENT_DATE`)
      .executeTakeFirst(),

    // Yesterday revenue
    db
      .selectFrom('orders')
      .select([sql<string>`COALESCE(SUM(total - discount_amount), 0)`.as('revenue')])
      .where('tenant_id', '=', tenantId)
      .where('status', 'in', ['paid', 'delivered'])
      .where(sql`created_at::date`, '=', sql`CURRENT_DATE - INTERVAL '1 day'`)
      .executeTakeFirst(),

    // Pending orders count
    db
      .selectFrom('orders')
      .select([sql<string>`COUNT(*)`.as('count')])
      .where('tenant_id', '=', tenantId)
      .where('status', '=', 'pending')
      .executeTakeFirst(),

    // Today profit (requires cost_price on products)
    db
      .selectFrom('order_items as oi')
      .innerJoin('orders as o', 'o.id', 'oi.order_id')
      .leftJoin('products as p', 'p.id', 'oi.product_id')
      .select([
        sql<string>`COALESCE(SUM((oi.price - COALESCE(p.cost_price, 0)) * oi.quantity), 0)`.as(
          'profit'
        ),
      ])
      .where('o.tenant_id', '=', tenantId)
      .where('o.status', 'in', ['paid', 'delivered'])
      .where(sql`o.created_at::date`, '=', sql`CURRENT_DATE`)
      .executeTakeFirst(),

    // Outstanding customer debt
    db
      .selectFrom('customer_credit_events')
      .select([
        sql<string>`COALESCE(
          SUM(CASE WHEN type = 'debit'   THEN amount ELSE 0 END) -
          SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END),
          0
        )`.as('debt'),
      ])
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst(),

    // Low stock products
    db
      .selectFrom('products')
      .select(['id', 'name', 'stock', 'low_stock_threshold as threshold'])
      .where('tenant_id', '=', tenantId)
      .whereRef('stock', '<=', 'low_stock_threshold')
      .orderBy('stock', 'asc')
      .limit(10)
      .execute(),

    // Top 5 products by quantity sold today
    db
      .selectFrom('order_items as oi')
      .innerJoin('orders as o', 'o.id', 'oi.order_id')
      .select([
        'oi.name',
        sql<string>`SUM(oi.quantity)`.as('total_qty'),
        sql<string>`SUM(oi.price * oi.quantity)`.as('total_revenue'),
      ])
      .where('o.tenant_id', '=', tenantId)
      .where('o.status', 'in', ['paid', 'delivered'])
      .where(sql`o.created_at::date`, '=', sql`CURRENT_DATE`)
      .groupBy('oi.name')
      .orderBy('total_qty', 'desc')
      .limit(5)
      .execute(),
  ]);

  log.debug('Dashboard stats fetched successfully');

  return {
    todayRevenue: parseFloat(revenueTodayRow?.revenue ?? '0'),
    yesterdayRevenue: parseFloat(revenueYestRow?.revenue ?? '0'),
    todayOrders: parseInt(revenueTodayRow?.order_count ?? '0', 10),
    pendingOrders: parseInt(pendingRow?.count ?? '0', 10),
    todayProfit: parseFloat(profitTodayRow?.profit ?? '0'),
    outstandingDebt: Math.max(0, parseFloat(debtRow?.debt ?? '0')),
    lowStockProducts: lowStockRows.map((r) => ({
      id: r.id,
      name: r.name,
      stock: r.stock,
      threshold: (r as unknown as { threshold: number }).threshold,
    })),
    topProducts: topProductRows.map((r) => ({
      name: r.name,
      totalQty: parseInt((r as unknown as { total_qty: string }).total_qty ?? '0', 10),
      totalRevenue: parseFloat((r as unknown as { total_revenue: string }).total_revenue ?? '0'),
    })),
  };
}
