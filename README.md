# دكان · Dukkan

**Production-ready, offline-first Local Business Operations System**  
Built for small and medium shops in Egypt and emerging markets. Works without internet, syncs automatically when back online.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Offline Sync System](#offline-sync-system)
8. [Multi-Tenancy & Authentication](#multi-tenancy--authentication)
9. [Internationalization](#internationalization)
10. [Logging & Error Handling](#logging--error-handling)
11. [Quick Start — Docker](#quick-start--docker-recommended)
12. [Quick Start — Local Dev](#quick-start--local-development)
13. [Environment Variables](#environment-variables)
14. [Project Structure](#project-structure)
15. [Design System](#design-system)
16. [Known Behaviours & Edge Cases](#known-behaviours--edge-cases)
17. [Security Considerations](#security-considerations)

---

## Overview

Dukkan is a monorepo POS and operations system designed to run on cheap Android tablets and low-end smartphones in areas with unreliable internet. It stores everything locally first using IndexedDB, then syncs to a PostgreSQL backend in the background. A cashier can take an order, adjust stock, and print an invoice even when fully offline.

**Ports are intentionally non-default to avoid conflicts with other projects running locally:**

| Service | Host Port | Internal Port |
|---|---|---|
| Frontend (Nginx + React) | **3847** | 3847 |
| Backend (Node.js / Express) | **4847** | 4847 |
| PostgreSQL | **5847** | 5432 |

---

## Features

### Dashboard
- Financial KPIs at a glance: **today's revenue**, **order count**, **profit**, and **outstanding customer debt**
- Revenue comparison vs. yesterday (percentage change)
- **Low-stock alerts** — chips linking directly to the inventory page
- **Top 5 products** by quantity sold today with medal ranks
- **Quick-action buttons**: New Order, Adjust Stock, View Customers
- Auto-refresh on mount; manual refresh button

### Orders
- Create a full order with customer lookup, line items, and notes in under 10 seconds
- Quick-add chips for products already in inventory
- **Payment method selector**: Cash · Card · Vodafone Cash · InstaPay · Credit (on account)
- **Discount support**: apply a flat discount amount with an optional reason; net total = subtotal − discount
- Per-order status lifecycle: `pending → paid → delivered → cancelled`
- Offline-first: orders are saved to IndexedDB immediately; synced to the server in the background
- Status changes on unsynced orders update the sync queue payload directly — no 404s
- **Return Items button** on each synced order (navigates to the return flow)

### Returns & Refunds
- Select per-item return quantities (capped at originally ordered qty)
- Choose refund method: Cash · Card · Vodafone Cash · InstaPay · Credit Note
- Stock is automatically restored for returned products on the server
- Requires an internet connection — shows a warning when offline
- Accessible from the Order Detail page via "Return Items" button

### Inventory
- Add and manage products with name, price, **cost price**, stock count, and low-stock threshold
- **Profit margin %** displayed on each product row: `((price − costPrice) / price × 100)%`
- Stock adjustment panel (add or subtract) with confirmation
- Visual low-stock warnings (red glow) when stock ≤ threshold
- Stock changes enqueued for sync

### Customers
- Search by phone number (debounced, 350 ms)
- Inline new customer creation during order flow — saved with a real UUID and enqueued for sync before the order
- **Tabs**: Purchase History · Credit & Payment History
- **Balance card**: green (no debt) or red (owes money) with exact amount
- **Record Payment modal**: enter amount and optional notes → `POST /customers/:id/payments`
- Credit event list shows each debit (order on account) and payment with date and amount

### Customer Debt & Credit Ledger
- Every order paid with method `credit` automatically creates a `customer_credit_events` debit entry (amount = order total after discount)
- Cashiers record cash payments against customer balances via the Record Payment flow
- Outstanding balance = Σ(debit) − Σ(payment), shown on Customer Detail and Dashboard

### Invoices
- Printable A4-formatted invoice from any order using `react-to-print`
- Works offline — generated from IndexedDB data, no server needed

### Sync
- Background auto-sync every 30 seconds
- Triggered immediately on network reconnect
- Exponential backoff: 1 s → 2 s → 4 s → … → 30 s max
- Max 5 retries per item
- `dead` status for permanently-failed items (bad UUID, FK violation) — stops infinite retry loops
- Batch API: all pending items sent in a single POST per cycle

### Authentication
- JWT-based, stateless
- Passwords hashed with bcrypt (10 rounds)
- Token stored in `localStorage`, attached via `Authorization: Bearer` header
- Auto-logout and redirect to `/login` on 401 response
- 30-day token expiry by default (configurable)

### Internationalization
- Full Arabic (RTL, Cairo font) and English (LTR, Inter font) support
- Language toggle available on every page including pre-login screens
- `document.dir` and `document.lang` set dynamically — no page reload
- Choice persisted to `localStorage`

---

## Tech Stack

### Frontend (`packages/frontend`)
| Library | Version | Purpose |
|---|---|---|
| React | 18 | UI rendering |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool + dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Zustand | 4 | Global state (auth, app, language) |
| Dexie.js | 3 | IndexedDB ORM (offline storage) — **schema v3** |
| i18next | 23 | Internationalization (AR + EN) |
| React Router | 6 | Client-side routing |
| Axios | 1 | HTTP client with interceptors |
| react-to-print | 2 | Browser print for invoices |
| uuid | 9 | UUID generation for offline entities |
| Vite PWA Plugin | — | Service worker + Web App Manifest |

### Backend (`packages/backend`)
| Library | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| TypeScript | 5 | Type safety |
| Express.js | 4 | HTTP framework |
| Kysely | 0.27 | Type-safe SQL query builder |
| pg | 8 | PostgreSQL driver |
| bcryptjs | 2 | Password hashing |
| jsonwebtoken | 9 | JWT signing and verification |
| pino | 9 | Structured JSON logging |
| pino-http | 10 | HTTP request logging middleware |
| tsx | 4 | TypeScript execution (dev + migration) |
| helmet | 7 | Security HTTP headers |
| cors | 2 | CORS handling |

### Database
| | |
|---|---|
| Engine | PostgreSQL 16 |
| Extensions | `pgcrypto` (UUID generation) |
| Migrations | Sequential SQL files, idempotent (`IF NOT EXISTS`, `IF EXISTS`) |
| Schema | UUIDs for all PKs, `TIMESTAMPTZ` for all timestamps |

### Infrastructure
| | |
|---|---|
| Containerisation | Docker + Docker Compose v2 |
| Frontend serving | Nginx 1.29 (Alpine) |
| Data persistence | Named Docker volume (`dukkan_pgdata`) |

---

## Architecture

```
dukkan/                          ← npm workspace root
├── packages/
│   ├── shared/                  ← TypeScript types + constants shared by all packages
│   │   └── src/
│   │       ├── types/
│   │       │   ├── auth.ts      ← LoginInput, RegisterInput, AuthUser, AuthResponse
│   │       │   ├── customer.ts  ← Customer
│   │       │   ├── order.ts     ← Order, OrderItem, CreateOrderInput, PaymentMethod
│   │       │   ├── product.ts   ← Product (with costPrice)
│   │       │   ├── credit.ts    ← CustomerCreditEvent, CustomerBalance, RecordPaymentInput
│   │       │   ├── return.ts    ← OrderReturn, ReturnItem, CreateReturnInput, RefundMethod
│   │       │   ├── sync.ts      ← SyncQueueItem, SyncBatchItem, SyncBatchResult
│   │       │   └── api.ts       ← ApiResponse wrapper
│   │       └── constants.ts     ← SYNC_MAX_RETRIES, LOW_STOCK_THRESHOLD, etc.
│   │
│   ├── backend/                 ← Express REST API
│   │   └── src/
│   │       ├── db/
│   │       │   ├── client.ts    ← Kysely + pg Pool setup, connection logging
│   │       │   ├── types.ts     ← Kysely Database interface (all tables typed)
│   │       │   ├── migrate.ts   ← Migration runner
│   │       │   └── migrations/
│   │       │       ├── 001_initial.sql             ← Core schema
│   │       │       ├── 002_multi_tenant.sql        ← Tenants, users, tenant_id columns
│   │       │       └── 003_business_features.sql   ← Payment/discount/cost/credit/returns
│   │       ├── features/
│   │       │   ├── auth/        ← POST /auth/register, POST /auth/login
│   │       │   ├── orders/      ← CRUD + status update + payment/discount/credit logic
│   │       │   ├── customers/   ← Phone search + upsert + balance + credit events
│   │       │   ├── inventory/   ← Products + stock adjustment + cost price
│   │       │   ├── invoices/    ← Invoice data endpoint
│   │       │   ├── dashboard/   ← GET /dashboard (KPI aggregation)
│   │       │   ├── returns/     ← POST+GET /orders/:id/returns, GET /returns/:id
│   │       │   └── sync/        ← POST /sync/batch (offline sync processor)
│   │       ├── middleware/
│   │       │   ├── auth.ts      ← JWT verification, req.user injection
│   │       │   ├── errorHandler.ts  ← Typed AppError → JSON response
│   │       │   ├── requestLogger.ts ← pino-http middleware
│   │       │   └── validate.ts
│   │       └── lib/
│   │           ├── logger.ts    ← Pino instance (pretty in dev, JSON in prod)
│   │           └── AppError.ts  ← Typed error class + DB error translator
│   │
│   └── frontend/                ← React SPA
│       └── src/
│           ├── api/
│           │   └── client.ts    ← Axios instance, Bearer interceptor, 401 auto-logout
│           ├── components/      ← BottomNav (5 tabs), Toast, StatusChip, SyncIndicator, etc.
│           ├── features/
│           │   ├── auth/        ← LoginPage, RegisterPage
│           │   ├── dashboard/   ← DashboardPage (home /)
│           │   ├── orders/      ← OrdersPage, NewOrderPage, OrderDetailPage, ReturnPage
│           │   ├── customers/   ← CustomersPage, CustomerDetailPage, CustomerSearchInput
│           │   ├── inventory/   ← InventoryPage (with cost price + margin)
│           │   ├── invoices/    ← InvoicePrint (print-only component)
│           │   └── settings/    ← SettingsPage (language, sync, logout)
│           ├── i18n/
│           │   ├── ar.json      ← Arabic strings (full coverage incl. new features)
│           │   ├── en.json      ← English strings (full coverage incl. new features)
│           │   └── config.ts    ← i18next setup
│           ├── lib/
│           │   └── logger.ts    ← Client-side structured logger (console dev, JSON prod)
│           ├── offline/
│           │   ├── db.ts        ← Dexie schema v3: paymentMethod, discountAmount, costPrice
│           │   ├── queue.ts     ← enqueue, markDone, markFailed, markDead
│           │   └── syncEngine.ts ← Batch sync loop, backoff, dead-letter handling
│           └── store/
│               ├── useAuthStore.ts     ← Zustand: token, user, login, logout
│               ├── useAppStore.ts      ← Zustand: toast, sync state, product cache
│               └── useLanguageStore.ts ← Zustand: lang, setLang, initLanguage
├── docker-compose.yml
├── .env.example
├── package.json                 ← npm workspaces root
└── tsconfig.base.json           ← Shared TS compiler options
```

---

## Database Schema

### `tenants`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `name` | VARCHAR(120) | Business display name |
| `created_at` | TIMESTAMPTZ | |

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `username` | VARCHAR(60) UNIQUE | |
| `password_hash` | TEXT | bcrypt, 10 rounds |
| `role` | VARCHAR(20) | `owner` \| `cashier` |
| `created_at` | TIMESTAMPTZ | |

### `customers`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `phone` | VARCHAR(20) | UNIQUE per tenant |
| `name` | VARCHAR(120) | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated by trigger |

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `name` | VARCHAR(120) | |
| `price` | NUMERIC(10,2) | Selling price ≥ 0 |
| `cost_price` | NUMERIC(10,2) | Optional purchase cost — used for profit calculation |
| `stock` | INT | ≥ 0 |
| `low_stock_threshold` | INT | Default 5 — triggers alert when `stock ≤ threshold` |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Set to `client_id` on insert (idempotent) |
| `client_id` | UUID UNIQUE | Generated on the device before sync |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `customer_id` | UUID FK → customers | SET NULL on customer delete; nullable |
| `status` | VARCHAR(20) | `pending` \| `paid` \| `delivered` \| `cancelled` |
| `payment_method` | VARCHAR(30) | `cash` \| `card` \| `vodafone_cash` \| `instapay` \| `credit` |
| `total` | NUMERIC(10,2) | Final amount after discount |
| `discount_amount` | NUMERIC(10,2) | Default 0 |
| `discount_reason` | VARCHAR(120) | Optional text explaining the discount |
| `notes` | TEXT | Nullable |
| `created_at` | TIMESTAMPTZ | Device-generated timestamp |
| `synced_at` | TIMESTAMPTZ | Server arrival time |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Server-generated |
| `order_id` | UUID FK → orders | CASCADE delete |
| `product_id` | UUID FK → products | SET NULL; nullable |
| `name` | VARCHAR(120) | Snapshot at order time |
| `price` | NUMERIC(10,2) | Snapshot at order time |
| `quantity` | INT | > 0 |

### `customer_credit_events` _(new)_
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `customer_id` | UUID FK → customers | CASCADE delete |
| `amount` | NUMERIC(10,2) | > 0 always |
| `type` | VARCHAR(20) | `debit` (owes money) \| `payment` (paid money) |
| `order_id` | UUID FK → orders | SET NULL; links debit to the originating order |
| `notes` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | |

Balance formula: `SUM(debit) − SUM(payment)` — positive balance means customer still owes money.

### `returns` _(new)_
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `order_id` | UUID FK → orders | |
| `total` | NUMERIC(10,2) | Sum of returned item values |
| `refund_method` | VARCHAR(30) | `cash` \| `card` \| `vodafone_cash` \| `instapay` \| `credit_note` |
| `notes` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | |

### `return_items` _(new)_
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `return_id` | UUID FK → returns | CASCADE delete |
| `order_item_id` | UUID FK → order_items | SET NULL |
| `product_id` | UUID FK → products | SET NULL |
| `name` | VARCHAR(120) | Snapshot from original item |
| `price` | NUMERIC(10,2) | Snapshot from original item |
| `quantity` | INT | > 0; ≤ original ordered quantity |

### `sync_log`
| Column | Type | Notes |
|---|---|---|
| `client_id` | UUID PK | Deduplication key |
| `entity_type` | VARCHAR(30) | |
| `resolved_at` | TIMESTAMPTZ | |

---

## API Reference

All endpoints (except `/auth/*`) require:
```
Authorization: Bearer <JWT>
```

All responses follow the envelope:
```json
{ "data": <payload or null>, "error": <string or null> }
```

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | `{ businessName, username, password }` | Create tenant + owner user. Returns token + user. |
| `POST` | `/api/v1/auth/login` | `{ username, password }` | Authenticate. Returns token + user. |

Validation:
- `businessName`: required, min 2 chars
- `username`: required, min 3 chars
- `password`: required, min 6 chars

### Dashboard _(new)_

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard` | Returns all KPIs for today in a single response |

**Response shape:**
```json
{
  "todayRevenue": 12450.00,
  "yesterdayRevenue": 9800.00,
  "todayOrders": 23,
  "pendingOrders": 4,
  "todayProfit": 3210.00,
  "outstandingDebt": 5600.00,
  "lowStockProducts": [
    { "id": "uuid", "name": "Pepsi 1L", "stock": 2, "threshold": 5 }
  ],
  "topProducts": [
    { "name": "Pepsi 1L", "totalQty": 48, "totalRevenue": 2400.00 }
  ]
}
```

All KPI queries run in parallel via `Promise.all`. Profit is calculated as `(price − cost_price) × quantity` for items in completed orders today.

### Orders

| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/orders` | `?limit=50&offset=0` | List orders for the tenant |
| `POST` | `/api/v1/orders` | `CreateOrderInput` | Create order (idempotent via `clientId`) |
| `GET` | `/api/v1/orders/:id` | — | Get single order with items |
| `PATCH` | `/api/v1/orders/:id/status` | `{ status }` | Update order status |

**`CreateOrderInput` (updated):**
```json
{
  "clientId": "uuid",
  "customerId": "uuid (optional)",
  "status": "pending",
  "paymentMethod": "cash | card | vodafone_cash | instapay | credit",
  "total": 450.00,
  "discountAmount": 50.00,
  "discountReason": "loyalty discount",
  "notes": "optional",
  "items": [{ "productId": "uuid", "name": "Pepsi", "price": 10.00, "quantity": 5 }],
  "createdAt": "2026-04-19T14:00:00Z"
}
```

When `paymentMethod === "credit"` and a valid `customerId` is provided, a `customer_credit_events` debit row is auto-inserted inside the same DB transaction.

### Returns _(new)_

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders/:id/returns` | `CreateReturnInput` | Process a return — validates quantities, restores stock |
| `GET` | `/api/v1/orders/:id/returns` | — | List all returns for an order |
| `GET` | `/api/v1/returns/:id` | — | Get a single return with items |

**`CreateReturnInput`:**
```json
{
  "items": [{ "orderItemId": "uuid", "quantity": 2 }],
  "refundMethod": "cash | card | vodafone_cash | instapay | credit_note",
  "notes": "optional"
}
```

Validations:
- Each `orderItemId` must belong to the specified order
- `quantity` must not exceed the originally ordered quantity
- Stock restoration runs inside the same transaction as the return insert

### Customers

| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/customers` | `?phone=<query>` | Search by phone number |
| `POST` | `/api/v1/customers` | `{ phone, name }` | Upsert (update name if phone exists) |
| `GET` | `/api/v1/customers/:id/orders` | — | Get all orders for a customer |
| `GET` | `/api/v1/customers/:id/balance` | — | Get outstanding balance _(new)_ |
| `GET` | `/api/v1/customers/:id/credit-events` | — | List credit/payment history _(new)_ |
| `POST` | `/api/v1/customers/:id/payments` | `{ amount, notes? }` | Record a cash payment _(new)_ |

**Balance response:**
```json
{ "data": { "customerId": "uuid", "balance": 450.00 } }
```

Balance is always `≥ 0`. A value of `0` means fully settled.

### Inventory

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | — | List all products for tenant |
| `POST` | `/api/v1/products` | `{ name, price, costPrice?, stock?, lowStockThreshold? }` | Create product _(costPrice is new)_ |
| `PATCH` | `/api/v1/products/:id` | `{ name?, price?, costPrice?, lowStockThreshold? }` | Update product _(costPrice is new)_ |
| `PATCH` | `/api/v1/products/:id/stock` | `{ delta }` | Adjust stock by delta (positive or negative) |

### Invoices

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/invoices/:orderId` | Return invoice data for an order |

### Sync (Batch)

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/v1/sync/batch` | `SyncBatchItem[]` | Process a batch of offline operations |

**`SyncBatchItem` shape:**
```json
{
  "clientId": "uuid",
  "entity": "order | customer | product | stock",
  "action": "create | update",
  "payload": { }
}
```

**`SyncBatchResult` shape:**
```json
{
  "clientId": "uuid",
  "success": true,
  "permanent": false,
  "data": { }
}
```

When `success: false` and `permanent: true`, the frontend marks the item as `dead` and stops retrying. Triggered by PostgreSQL error codes `22P02` (invalid UUID), `23503` (FK violation), `23505` (duplicate).

---

## Offline Sync System

### Flow

```
User action (create order / adjust stock / add customer)
        │
        ▼
┌─────────────────┐
│   IndexedDB     │  ← Written immediately, UI responds instantly
│  (Dexie v3)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Sync Queue    │  ← enqueue(clientId, entity, action, payload)
└────────┬────────┘
         │  (background, every 30 s or on reconnect)
         ▼
┌─────────────────┐     HTTP 200     ┌─────────────────┐
│  Sync Engine    │ ─────────────────▶   POST /sync/    │
│  (syncEngine.ts)│                  │   batch          │
└────────┬────────┘ ◀─────────────── └─────────────────┘
         │             results[]
         ▼
  ┌──────┴────────┐
  │  per result:  │
  │  success  → markDone        │
  │  transient → markFailed     │  retries++, backoff
  │  permanent → markDead       │  stop retrying
  └───────────────┘
```

### IndexedDB Schema (v3)

Dexie database name: `dukkan_v1`, current version: **3**

| Version | Changes |
|---|---|
| v1 | Initial schema — orders, customers, products, syncQueue |
| v2 | Added `tenantId` index to all tables for multi-tenant isolation |
| v3 | Added `paymentMethod`, `discountAmount`, `discountReason` to `LocalOrder`; added `costPrice` to `LocalProduct`. Upgrade function backfills `paymentMethod='cash'` and `discountAmount=0` on existing rows. |

Credit events and returns are **not** stored in IndexedDB — they are always fetched from the API because they require server-confirmed IDs.

### Queue Statuses

| Status | Meaning |
|---|---|
| `pending` | Waiting to be sent |
| `syncing` | Currently in a batch request |
| `failed` | Last attempt failed; will retry (max 5 times) |
| `done` | Successfully processed by the server |
| `dead` | Permanently invalid — will never be retried |

### Backoff Schedule

| Attempt | Delay |
|---|---|
| 1 | 1 s |
| 2 | 2 s |
| 3 | 4 s |
| 4 | 8 s |
| 5 | 16 s (capped at 30 s) |

### Idempotency

Orders are idempotent via `client_id`. If the network drops after the server processes the order but before the client receives the response, the next sync attempt will receive `isDuplicate: true` and mark the item as done without creating a duplicate.

---

## Multi-Tenancy & Authentication

### Tenant Isolation

Every data table (`customers`, `products`, `orders`, `customer_credit_events`, `returns`) has a `tenant_id` column with a FK to `tenants`. All queries are scoped:

```sql
WHERE tenant_id = $tenantId
```

The `tenant_id` is extracted from the JWT on every request by the `authMiddleware` and injected into `req.user`. Services never trust client-provided tenant IDs.

### JWT Payload

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "owner | cashier",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Registration Flow

1. Client sends `POST /auth/register` with `{ businessName, username, password }`
2. A new `tenant` row is created
3. The `password` is hashed with bcrypt (10 rounds)
4. A new `user` row is created linked to the tenant with `role = 'owner'`
5. A JWT is returned immediately — the user is logged in

---

## Internationalization

The app fully supports **Arabic (ar)** and **English (en)**.

### Language Files

- `packages/frontend/src/i18n/ar.json` — Arabic strings (RTL)
- `packages/frontend/src/i18n/en.json` — English strings (LTR)

### Covered Namespaces

| Namespace | Keys |
|---|---|
| `app` | name, tagline |
| `nav` | dashboard, orders, inventory, customers, settings |
| `dashboard` | title, revenue, orders, profit, debt, lowStock, topProducts, quickActions, vsYesterday, pending, noLowStock, noSales, refresh, newOrder, adjustStock, viewCustomers, qty |
| `orders` | title, new, status.*, total, notes, items, addItem, itemName, price, quantity, submit, revenue, empty, noItems, unknownCustomer, itemCount, changeStatus, orderDetail, priceX |
| `payment` | method, cash, card, vodafone_cash, instapay, credit |
| `discount` | label, amount, reason, applied |
| `returns` | title, new, quantity, refundMethod, cash, card, vodafone_cash, instapay, credit_note, submit, success, noReturns, noNetwork |
| `credit` | balance, owed, clear, recordPayment, debit, payment, events, amount, notes, noEvents, paymentSuccess |
| `customers` | title, search, name, phone, add, history, noHistory, select, noCustomers, change, notFound, addNew, ordersCount, egpSpent |
| `inventory` | title, add, name, price, **costPrice**, **margin**, stock, lowStock, adjust, increase, decrease, amount, noProducts, alertLevel, productN, cancelAdjust |
| `invoice` | title, number, date, print, download, customer, item, qty, unitPrice, subtotal, total, thankYou |
| `sync` | syncing, synced, offline, pending, failed |
| `settings` | account, logout, language, syncSection, syncStatus, syncPending, operations, syncNow, maintenance, clearCache, systemInfo, frontend, backend, database, version, roleOwner, roleCashier |
| `msg` | noInternet, syncDone, statusUpdated, statusFailed, orderSaved, orderFailed, productAdded, stockUpdated, cacheCleared, confirmLogout, confirmClear |
| `common` | save, cancel, delete, edit, confirm, back, loading, error, success, egp, required |

### Switching Language

Calling `setLang('en' | 'ar')` from `useLanguageStore` atomically:

1. Updates `i18next.language`
2. Sets `document.documentElement.lang`
3. Sets `document.documentElement.dir` (`rtl` or `ltr`)
4. Persists the choice to `localStorage`

`initLanguage()` is called before the React root mounts to restore the saved language and prevent a flash of incorrect direction.

### CSS Direction

There is **no hardcoded** `direction: rtl` in CSS. All direction is driven by the `dir` attribute on `<html>`. Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) are used throughout so layout mirrors correctly in both directions.

---

## Logging & Error Handling

### Backend Logging (pino)

Structured JSON logs in production, pretty-printed in development.

```
LOG_LEVEL=trace | debug | info | warn | error | fatal
```

Sensitive fields automatically redacted in production:
- `req.headers.authorization`
- `body.password`

**Log events include:**
- Every HTTP request and response (method, URL, status, response time, request ID)
- Database connection pool events (connect, error, remove)
- SQL query errors with the full query string
- Auth events (login attempt, login success, login failure)
- Sync batch events (item count, per-item success/failure/permanent)
- Credit event creation (order on credit)
- Payment recording (customer debt payment)
- Return creation (items returned, stock restored)
- Graceful shutdown signals

### Backend Error Types (`AppError`)

| Code | HTTP Status | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing or invalid input |
| `NOT_FOUND` | 404 | Entity not found |
| `UNAUTHORIZED` | 401 | Bad or missing JWT |
| `CONFLICT` | 409 | Duplicate (e.g. username taken) |
| `INTERNAL_ERROR` | 500 | Unexpected error |

PostgreSQL errors are translated into typed `AppError` instances before being passed to the global error handler. Error stack traces are included in `500` responses in development only.

### Frontend Logging

`packages/frontend/src/lib/logger.ts` provides a structured client-side logger:

- **Development**: formatted `console.log/warn/error` with level prefix
- **Production**: `console.warn` and `console.error` only, JSON-formatted

**Logged events:**
- App startup (env, API URL)
- Every Axios request and response
- 401 auto-logout
- Network errors (timeout, connection refused)
- Sync engine batch start, completion, per-item failures
- Dashboard stats fetch success/failure
- React `ErrorBoundary` catches

### React ErrorBoundary

Wraps the entire app. On unhandled render error:
- Logs the error and component stack
- Shows a dark-themed fallback screen
- "Go Home" button resets state and navigates to `/`
- In development, shows the raw error message

---

## Quick Start — Docker (Recommended)

**Prerequisites:** Docker Desktop (any recent version)

```bash
# 1. Clone and enter the project
git clone <repo-url> dukkan
cd dukkan

# 2. Copy environment file
cp .env.example .env

# 3. IMPORTANT: Set a real JWT secret before going to production
#    Generate one with: openssl rand -hex 64
# Edit .env: JWT_SECRET=<your-generated-secret>

# 4. Build and start all services
docker compose up --build

# First run takes ~2 minutes (downloads images, builds, runs migrations)
# Subsequent runs: ~15 seconds
```

Open **http://localhost:3847** and create your first business account.

> **Note:** The first time you start, migrations run `001_initial.sql`, `002_multi_tenant.sql`, and `003_business_features.sql` automatically. On subsequent starts only missing columns/tables are added (all `ALTER TABLE` statements use `ADD COLUMN IF NOT EXISTS`).

### Useful Docker Commands

```bash
# Start in background
docker compose up -d --build

# View live logs for all services
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# Stop all services (data preserved)
docker compose down

# Stop and DELETE all data (fresh start)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build backend
```

---

## Quick Start — Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 16 running locally

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy and edit environment
cp .env.example .env
# Set DATABASE_URL_LOCAL to your local Postgres connection string
# Set VITE_API_URL=http://localhost:4847/api/v1

# 3. Run migrations
cd packages/backend
DATABASE_URL=<your-local-db-url> npx tsx src/db/migrate.ts
cd ../..

# 4. Start backend (terminal 1)
npm run dev:backend

# 5. Start frontend (terminal 2)
npm run dev:frontend
```

| | URL |
|---|---|
| Frontend | http://localhost:3847 |
| Backend API | http://localhost:4847/api/v1 |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

| Variable | Default | Required | Description |
|---|---|---|---|
| `POSTGRES_USER` | `dukkan` | Docker only | PostgreSQL username |
| `POSTGRES_PASSWORD` | `dukkan_secret` | Docker only | PostgreSQL password — change in production |
| `POSTGRES_DB` | `dukkan` | Docker only | Database name |
| `POSTGRES_PORT` | `5847` | Docker only | Host port for PostgreSQL |
| `DATABASE_URL` | — | Backend | Full PostgreSQL connection string (Docker network uses service name `db`) |
| `DATABASE_URL_LOCAL` | — | Local dev | Connection string from host machine |
| `PORT` | `4847` | Backend | Backend HTTP port |
| `NODE_ENV` | `development` | Backend | `development` or `production` |
| `LOG_LEVEL` | `info` | Backend | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |
| `CORS_ORIGIN` | `http://localhost:3847` | Backend | Allowed CORS origin |
| `JWT_SECRET` | ⚠️ change this | Backend | **Must be changed in production.** Min 32 chars. Generate: `openssl rand -hex 64` |
| `JWT_EXPIRY_DAYS` | `30` | Backend | Token lifetime in days |
| `VITE_API_URL` | `http://localhost:4847/api/v1` | Frontend (build-time) | API base URL baked into the frontend bundle |

---

## Project Structure

```
dukkan/
├── .env.example                 ← Template for all environment variables
├── .dockerignore
├── docker-compose.yml           ← 4 services: db, migrate, backend, frontend
├── package.json                 ← npm workspaces root
├── tsconfig.base.json           ← Shared TypeScript compiler options
│
├── packages/
│   ├── shared/                  ← @dukkan/shared
│   │   ├── src/
│   │   │   ├── constants.ts     ← ORDER_STATUSES, SYNC_MAX_RETRIES, EGYPT_PHONE_REGEX, …
│   │   │   ├── index.ts         ← Re-exports everything
│   │   │   └── types/
│   │   │       ├── auth.ts
│   │   │       ├── customer.ts
│   │   │       ├── order.ts     ← PaymentMethod union type
│   │   │       ├── product.ts   ← costPrice field
│   │   │       ├── credit.ts    ← CustomerCreditEvent, CustomerBalance, RecordPaymentInput
│   │   │       ├── return.ts    ← OrderReturn, ReturnItem, CreateReturnInput, RefundMethod
│   │   │       ├── sync.ts      ← SyncStatus includes 'dead' for permanent failures
│   │   │       ├── invoice.ts
│   │   │       └── api.ts
│   │   └── package.json
│   │
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts         ← Express app, middleware wiring, graceful shutdown
│   │       ├── db/
│   │       │   ├── client.ts    ← pg Pool + Kysely instance, pool event logging
│   │       │   ├── types.ts     ← Full Kysely Database interface (all 9 tables)
│   │       │   ├── migrate.ts   ← Sequential migration runner
│   │       │   └── migrations/
│   │       │       ├── 001_initial.sql               ← Core schema + triggers
│   │       │       ├── 002_multi_tenant.sql          ← tenants, users, tenant_id columns
│   │       │       └── 003_business_features.sql     ← payment, discount, cost_price,
│   │       │                                            customer_credit_events, returns
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── router.ts     ← POST /register, POST /login
│   │       │   │   └── service.ts    ← bcrypt hash/compare, JWT sign
│   │       │   ├── dashboard/        ← NEW
│   │       │   │   ├── router.ts     ← GET /dashboard
│   │       │   │   └── service.ts    ← getDashboardStats() — parallel KPI queries
│   │       │   ├── orders/
│   │       │   │   ├── router.ts
│   │       │   │   └── service.ts    ← paymentMethod, discount, credit event auto-insert
│   │       │   ├── returns/          ← NEW
│   │       │   │   ├── router.ts     ← POST+GET /orders/:id/returns, GET /returns/:id
│   │       │   │   └── service.ts    ← createReturn(), stock restoration
│   │       │   ├── customers/
│   │       │   │   ├── router.ts     ← + balance, credit-events, payments endpoints
│   │       │   │   └── service.ts    ← + getCustomerBalance(), listCreditEvents(), recordPayment()
│   │       │   ├── inventory/
│   │       │   │   ├── router.ts
│   │       │   │   └── service.ts    ← + cost_price in createProduct/updateProduct
│   │       │   ├── invoices/
│   │       │   └── sync/
│   │       │       └── router.ts     ← Batch processor, permanent error detection
│   │       ├── lib/
│   │       │   ├── logger.ts         ← Pino (pretty dev / JSON prod)
│   │       │   └── AppError.ts       ← Typed errors + DB error translator
│   │       └── middleware/
│   │           ├── auth.ts           ← JWT verification, req.user, getTenantId()
│   │           ├── errorHandler.ts   ← Global Express error handler
│   │           └── requestLogger.ts  ← pino-http
│   │
│   └── frontend/
│       ├── Dockerfile            ← Multi-stage: Vite build → Nginx serve
│       ├── nginx.conf
│       ├── vite.config.ts        ← PWA, code splitting by route
│       ├── tailwind.config.js    ← Dark design tokens, glow shadows, animations
│       ├── index.html            ← Inter + Cairo fonts, lang/dir set by JS
│       └── src/
│           ├── App.tsx           ← Router (/ = Dashboard, /orders = Orders, /orders/:id/return = ReturnPage)
│           ├── main.tsx          ← initLanguage(), ErrorBoundary, React root
│           ├── index.css         ← Tailwind base + .btn-primary, .btn-danger, .card, .input-field, …
│           ├── api/client.ts     ← Axios, Bearer interceptor, 401 auto-logout
│           ├── components/
│           │   ├── BottomNav.tsx       ← 5-tab glass nav: Dashboard/Orders/Inventory/Customers/Settings
│           │   ├── StatusChip.tsx      ← Glowing status badges
│           │   ├── SyncIndicator.tsx   ← Online/syncing/synced pill
│           │   ├── Toast.tsx           ← Slide-down glass notification
│           │   ├── LanguageSwitcher.tsx
│           │   ├── ProtectedRoute.tsx
│           │   └── ErrorBoundary.tsx
│           ├── features/
│           │   ├── auth/         ← LoginPage, RegisterPage
│           │   ├── dashboard/    ← DashboardPage (home /) — NEW
│           │   ├── orders/       ← OrdersPage, NewOrderPage, OrderDetailPage, ReturnPage (NEW)
│           │   ├── customers/    ← CustomersPage, CustomerDetailPage (+ balance/credit tab), CustomerSearchInput
│           │   ├── inventory/    ← InventoryPage (+ costPrice + margin)
│           │   ├── invoices/     ← InvoicePrint (print-only)
│           │   └── settings/     ← SettingsPage
│           ├── i18n/
│           │   ├── ar.json       ← Arabic (all namespaces including new ones)
│           │   ├── en.json       ← English (all namespaces including new ones)
│           │   └── config.ts
│           ├── lib/logger.ts     ← Client-side structured logger
│           ├── offline/
│           │   ├── db.ts         ← Dexie v3 schema (paymentMethod, discountAmount, costPrice)
│           │   ├── queue.ts      ← enqueue, markDone, markFailed, markDead
│           │   └── syncEngine.ts ← Backoff loop, dead-letter, network events
│           └── store/
│               ├── useAuthStore.ts
│               ├── useAppStore.ts
│               └── useLanguageStore.ts
```

---

## Design System

The UI uses a **Gen Z dark aesthetic**: deep backgrounds, glassmorphism cards, neon gradient accents, and glow effects. All components are mobile-first with large 52px touch targets.

### Color Palette

| Token | Value | Use |
|---|---|---|
| `bg` | `#080810` | Page background |
| `surface` | `#0f0f1e` | Secondary surface |
| `card` | `#14142a` | Card base |
| `primary` | `#7c3aed` | Electric violet — primary actions |
| `primary-light` | `#a855f7` | Lighter violet — gradient end |
| `accent` | `#06b6d4` | Cyan — gradient accent |
| `pink` / `danger` | `#f72585` | Hot pink — destructive / cancelled |
| `success` | `#10b981` | Electric green — paid / positive |
| `warning` | `#f59e0b` | Amber — pending / offline |

### Key CSS Classes

| Class | Description |
|---|---|
| `.btn-primary` | Violet→purple→cyan gradient button, glow on hover |
| `.btn-danger` | Pink→magenta gradient button — used for Return Items |
| `.btn-secondary` | Glass button (white/7% bg, white/10% border) |
| `.card` | Dark glass card with blur and inner-border highlight |
| `.input-field` | Dark input, violet glow ring on focus |
| `.page-header` | Sticky gradient header with backdrop blur |

### Fonts

| | Font | Weight |
|---|---|---|
| English | Inter | 400 – 900 |
| Arabic | Cairo | 400 – 900 |

### Navigation

5-tab bottom navigation bar (glassmorphism with gradient active indicator):

| Tab | Icon | Route |
|---|---|---|
| Dashboard | Grid (2×2 squares) | `/` |
| Orders | Clipboard | `/orders` |
| Inventory | Box | `/inventory` |
| Customers | Users | `/customers` |
| Settings | Gear | `/settings` |

---

## Known Behaviours & Edge Cases

### Offline Customer → Order FK Safety

When a customer is created offline (not yet synced), they are assigned a proper `uuidv4()` ID immediately. The customer creation is enqueued **before** the order in the sync queue. Even if both arrive in the same batch, the server processes items sequentially.

The backend `resolveCustomerId()` function provides an additional guard: if the UUID is syntactically invalid or the customer doesn't yet exist in the DB, `customer_id` is silently set to `null` rather than crashing.

### Status Change on Unsynced Orders

If an order hasn't been confirmed by the backend (`synced: false`), changing its status locally updates the sync queue payload directly — so the order will be created on the server with the correct status. The direct `PATCH /orders/:id/status` call is skipped to avoid a 404.

### Duplicate Order Prevention

Orders use `client_id` (device-generated UUID) as the deduplication key on the server. If the network drops after the server saves the order but before the client receives the response, the next sync sends the same `client_id` and receives `isDuplicate: true` without creating a second row.

### Dead-Letter Queue

Sync items that fail with PostgreSQL error codes `22P02`, `23503`, or `23505` are immediately marked `dead`. The sync engine will never retry them. This prevents infinite retry loops from corrupted or stale data.

### Credit Orders (Payment Method = "Credit")

When an order is submitted with `paymentMethod: "credit"`:
- A `customer_credit_events` debit row is created inside the same DB transaction
- If the transaction fails, neither the order nor the credit event is committed
- The debit amount equals `total − discount_amount`
- If `customerId` is null or unresolved, no credit event is created (order still saves as cash semantics)

### Returns Are Online-Only

The return flow (`ReturnPage`) requires a live internet connection. If the user is offline, a warning banner is shown and the submit button is disabled. This is intentional: returns involve complex stock restoration that must be server-confirmed before showing the result.

### IndexedDB Upgrade (v2 → v3)

Existing installations upgrading from Dexie v2 will have the upgrade function run automatically on first page load after update. Orders get `paymentMethod: 'cash'` and `discountAmount: 0` backfilled. No data is lost.

### PWA / Service Worker

The app is a Progressive Web App. On Chrome/Edge you can install it to your home screen. The service worker caches static assets. API calls are always network-first (no caching of API responses).

---

## Security Considerations

| Area | Practice |
|---|---|
| Passwords | bcrypt with 10 rounds. Never logged, never returned in API responses. Redacted by pino in production logs. |
| JWT | Signed with `HS256`. Secret must be ≥ 32 chars. Default expiry 30 days. Token stored in `localStorage` (acceptable for local-network deployments; upgrade to `httpOnly` cookies for public internet). |
| SQL Injection | Impossible — all queries use Kysely's parameterised query builder. No raw string interpolation. |
| Tenant Isolation | Every query includes `WHERE tenant_id = $tenantId` extracted from the verified JWT. This applies to all new tables: `customer_credit_events`, `returns`. |
| Return Validation | The returns service verifies the order belongs to the tenant and that returned quantities do not exceed original quantities. |
| Credit Balance | The balance endpoint always returns `max(0, debit − payment)` — it cannot go negative or expose other tenants' data. |
| CORS | Restricted to `CORS_ORIGIN` env var. Default: `http://localhost:3847`. |
| Security Headers | `helmet` middleware applies `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc. |
| Input Validation | All route handlers validate required fields and throw typed `AppError.validation()` before touching the database. |
| Error Responses | Stack traces are only included in responses when `NODE_ENV !== 'production'`. |
