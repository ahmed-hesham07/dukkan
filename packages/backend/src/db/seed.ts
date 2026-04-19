/**
 * Seed script – populates the database with realistic test data.
 * Run from the project root:
 *   DATABASE_URL=postgresql://dukkan:dukkan_secret@localhost:5847/dukkan \
 *     npx tsx packages/backend/src/db/seed.ts
 *
 * Or use the npm script (reads DATABASE_URL_LOCAL from .env):
 *   npm run seed -w packages/backend
 */

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

// ── Connection ────────────────────────────────────────────────────────────────

const DATABASE_URL =
  process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌  Set DATABASE_URL_LOCAL or DATABASE_URL before running seed.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function query(sql: string, params: unknown[] = []) {
  return pool.query(sql, params);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const TENANTS = [
  { name: 'متجر أحمد للبقالة', username: 'ahmed', password: 'ahmed123' },
  { name: 'سوبر ماركت محمد',   username: 'mohamed', password: 'mohamed123' },
];

const PRODUCTS_TEMPLATE = [
  { name: 'أرز بسمتي ١ كيلو',    price: 45,   costPrice: 32,  stock: 120 },
  { name: 'زيت ذرة ١.٥ لتر',     price: 89,   costPrice: 68,  stock: 80  },
  { name: 'سكر أبيض ١ كيلو',     price: 28,   costPrice: 20,  stock: 200 },
  { name: 'مكرونة ٥٠٠ جرام',     price: 18,   costPrice: 13,  stock: 3   }, // low stock
  { name: 'شاي أحمر ١٠٠ كيس',   price: 55,   costPrice: 38,  stock: 60  },
  { name: 'صابون دتول ١٢٥ جرام', price: 22,   costPrice: 15,  stock: 2   }, // low stock
  { name: 'مياه معدنية ١.٥ لتر', price: 12,   costPrice: 7,   stock: 500 },
  { name: 'عصير دلتا مانجو',     price: 35,   costPrice: 24,  stock: 90  },
  { name: 'لبن كامل الدسم ١ لتر',price: 30,   costPrice: 22,  stock: 45  },
  { name: 'جبن أبيض ٢٥٠ جرام',  price: 42,   costPrice: 29,  stock: 4   }, // low stock
];

const CUSTOMERS_TEMPLATE = [
  { name: 'علي حسن محمود',    phone: '01001234567' },
  { name: 'فاطمة أحمد إبراهيم', phone: '01112345678' },
  { name: 'محمود عبد الله',   phone: '01223456789' },
  { name: 'نورا السيد',       phone: '01534567890' },
  { name: 'كريم طارق',        phone: '01645678901' },
  { name: 'سارة وليد',        phone: '01756789012' },
];

const PAYMENT_METHODS = ['cash', 'card', 'vodafone_cash', 'instapay', 'credit'] as const;

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('\n🌱  Dukkan seed starting…\n');

    // ── Wipe existing seed data (safe: cascades handle children) ──────────────
    console.log('🗑   Clearing old data…');
    await client.query(`DELETE FROM return_items`);
    await client.query(`DELETE FROM returns`);
    await client.query(`DELETE FROM customer_credit_events`);
    await client.query(`DELETE FROM order_items`);
    await client.query(`DELETE FROM orders`);
    await client.query(`DELETE FROM customers`);
    await client.query(`DELETE FROM products`);
    await client.query(`DELETE FROM users`);
    await client.query(`DELETE FROM tenants`);
    console.log('   ✓ Cleared\n');

    for (const tenantDef of TENANTS) {
      // ── Tenant ──────────────────────────────────────────────────────────────
      const tenantId = uuid();
      await client.query(
        `INSERT INTO tenants (id, name) VALUES ($1, $2)`,
        [tenantId, tenantDef.name]
      );
      console.log(`🏪  Tenant: ${tenantDef.name} (${tenantId})`);

      // ── Owner user ──────────────────────────────────────────────────────────
      const passwordHash = await bcrypt.hash(tenantDef.password, 10);
      await client.query(
        `INSERT INTO users (id, tenant_id, username, password_hash, role)
         VALUES ($1,$2,$3,$4,'owner')`,
        [uuid(), tenantId, tenantDef.username, passwordHash]
      );
      console.log(`👤  User: ${tenantDef.username} / ${tenantDef.password}`);

      // Cashier
      const cashierHash = await bcrypt.hash('cashier123', 10);
      await client.query(
        `INSERT INTO users (id, tenant_id, username, password_hash, role)
         VALUES ($1,$2,$3,$4,'cashier')`,
        [uuid(), tenantId, `${tenantDef.username}_cashier`, cashierHash]
      );
      console.log(`👤  User: ${tenantDef.username}_cashier / cashier123`);

      // ── Products ─────────────────────────────────────────────────────────────
      const productIds: string[] = [];
      for (const p of PRODUCTS_TEMPLATE) {
        const pid = uuid();
        productIds.push(pid);
        await client.query(
          `INSERT INTO products (id, tenant_id, name, price, cost_price, stock, low_stock_threshold)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [pid, tenantId, p.name, p.price, p.costPrice, p.stock, 5]
        );
      }
      console.log(`📦  ${productIds.length} products created`);

      // ── Customers ────────────────────────────────────────────────────────────
      const customerIds: string[] = [];
      for (const c of CUSTOMERS_TEMPLATE) {
        // Give each tenant slightly different phone numbers
        const tenantSuffix = TENANTS.indexOf(tenantDef);
        const phone = c.phone.slice(0, -1) + String(tenantSuffix);
        const cid = uuid();
        customerIds.push(cid);
        await client.query(
          `INSERT INTO customers (id, tenant_id, name, phone)
           VALUES ($1,$2,$3,$4)`,
          [cid, tenantId, c.name, phone]
        );
      }
      console.log(`👥  ${customerIds.length} customers created`);

      // ── Orders (spread across last 14 days) ──────────────────────────────────
      let totalOrders = 0;
      let creditOrderCount = 0;

      for (let day = 13; day >= 0; day--) {
        const ordersThisDay = rand(2, 6);
        for (let o = 0; o < ordersThisDay; o++) {
          const orderId = uuid();
          const clientId = uuid();
          const customerId = Math.random() > 0.3 ? pick(customerIds) : null;
          const paymentMethod = pick([...PAYMENT_METHODS]);
          const status = pick(['paid', 'paid', 'paid', 'delivered', 'pending', 'cancelled']);
          const createdAt = daysAgo(day);

          // Pick 1-4 random products for this order
          const itemCount = rand(1, 4);
          const chosenProducts = PRODUCTS_TEMPLATE.slice()
            .sort(() => Math.random() - 0.5)
            .slice(0, itemCount);

          let subtotal = 0;
          const items: Array<{ pid: string; name: string; price: number; qty: number }> = [];
          for (let i = 0; i < chosenProducts.length; i++) {
            const prod = chosenProducts[i];
            const pid = productIds[PRODUCTS_TEMPLATE.indexOf(prod)];
            const qty = rand(1, 5);
            const price = prod.price;
            subtotal += price * qty;
            items.push({ pid, name: prod.name, price, qty });
          }

          const discountAmount = Math.random() > 0.8 ? rand(5, 20) : 0;
          const total = Math.max(0, subtotal - discountAmount);

          await client.query(
            `INSERT INTO orders
               (id, client_id, tenant_id, customer_id, status, total,
                payment_method, discount_amount, discount_reason, created_at, synced_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
            [
              orderId, clientId, tenantId, customerId, status, total,
              paymentMethod,
              discountAmount,
              discountAmount > 0 ? 'خصم عميل متميز' : null,
              createdAt,
            ]
          );

          // Order items
          for (const item of items) {
            await client.query(
              `INSERT INTO order_items (id, order_id, product_id, name, price, quantity)
               VALUES ($1,$2,$3,$4,$5,$6)`,
              [uuid(), orderId, item.pid, item.name, item.price, item.qty]
            );
          }

          // Credit event when payment is on credit
          if (paymentMethod === 'credit' && customerId && status !== 'cancelled') {
            await client.query(
              `INSERT INTO customer_credit_events
                 (id, tenant_id, customer_id, amount, type, order_id, notes, created_at)
               VALUES ($1,$2,$3,$4,'debit',$5,'بضاعة بالأجل',$6)`,
              [uuid(), tenantId, customerId, total, orderId, createdAt]
            );
            creditOrderCount++;

            // ~50% chance the customer already paid some/all of it
            if (Math.random() > 0.5) {
              const paidAmount = randFloat(total * 0.4, total);
              const paymentDate = new Date(createdAt);
              paymentDate.setDate(paymentDate.getDate() + rand(1, 5));
              await client.query(
                `INSERT INTO customer_credit_events
                   (id, tenant_id, customer_id, amount, type, order_id, notes, created_at)
                 VALUES ($1,$2,$3,$4,'payment',$5,'دفعة من العميل',$6)`,
                [uuid(), tenantId, customerId, paidAmount, orderId, paymentDate.toISOString()]
              );
            }
          }

          totalOrders++;
        }
      }

      console.log(`🧾  ${totalOrders} orders (${creditOrderCount} on credit)`);
      console.log(`✅  Tenant "${tenantDef.name}" seeded\n`);
    }

    await client.query('COMMIT');

    console.log('─'.repeat(50));
    console.log('🎉  Seed complete!\n');
    console.log('Login credentials:');
    for (const t of TENANTS) {
      console.log(`  • ${t.username} / ${t.password}  (owner)`);
      console.log(`  • ${t.username}_cashier / cashier123  (cashier)`);
    }
    console.log('─'.repeat(50));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
