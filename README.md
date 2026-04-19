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

### Orders
- Create a full order with customer lookup, line items, and notes in under 10 seconds
- Quick-add chips for products already in inventory
- Per-order status lifecycle: `pending → paid → delivered → cancelled`
- Offline-first: orders are saved to IndexedDB immediately; synced to the server in the background
- Status changes on unsynced orders update the sync queue payload directly — no 404s

### Inventory
- Add and manage products with name, price, stock count, and low-stock threshold
- Stock adjustment panel (add or subtract) with confirmation
- Visual low-stock warnings (red glow) when stock ≤ threshold
- Stock changes enqueued for sync

### Customers
- Search by phone number (debounced, 350 ms)
- Inline new customer creation during order flow — saved with a real UUID and enqueued for sync before the order
- Purchase history per customer with order total spent

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
| Dexie.js | 3 | IndexedDB ORM (offline storage) |
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
│   │       │   ├── order.ts     ← Order, OrderItem, CreateOrderInput
│   │       │   ├── product.ts   ← Product
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
│   │       │       ├── 001_initial.sql      ← Core schema
│   │       │       └── 002_multi_tenant.sql ← Tenants, users, tenant_id columns
│   │       ├── features/
│   │       │   ├── auth/        ← POST /auth/register, POST /auth/login
│   │       │   ├── orders/      ← CRUD + status update
│   │       │   ├── customers/   ← Phone search + upsert
│   │       │   ├── inventory/   ← Products + stock adjustment
│   │       │   ├── invoices/    ← Invoice data endpoint
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
│           ├── components/      ← BottomNav, Toast, StatusChip, SyncIndicator, etc.
│           ├── features/
│           │   ├── auth/        ← LoginPage, RegisterPage
│           │   ├── orders/      ← OrdersPage, NewOrderPage, OrderDetailPage
│           │   ├── customers/   ← CustomersPage, CustomerDetailPage, CustomerSearchInput
│           │   ├── inventory/   ← InventoryPage
│           │   ├── invoices/    ← InvoicePrint (print-only component)
│           │   └── settings/    ← SettingsPage (language, sync, logout)
│           ├── i18n/
│           │   ├── ar.json      ← Arabic strings
│           │   ├── en.json      ← English strings
│           │   └── config.ts    ← i18next setup
│           ├── lib/
│           │   └── logger.ts    ← Client-side structured logger (console dev, JSON prod)
│           ├── offline/
│           │   ├── db.ts        ← Dexie schema (v2: orders, customers, products, syncQueue)
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
| `price` | NUMERIC(10,2) | ≥ 0 |
| `stock` | INT | ≥ 0 |
| `low_stock_threshold` | INT | Default 5 |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Set to `client_id` on insert (idempotent) |
| `client_id` | UUID UNIQUE | Generated on the device before sync |
| `tenant_id` | UUID FK → tenants | CASCADE delete |
| `customer_id` | UUID FK → customers | SET NULL on customer delete; nullable |
| `status` | VARCHAR(20) | `pending` \| `paid` \| `delivered` \| `cancelled` |
| `total` | NUMERIC(10,2) | |
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

### Orders

| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/orders` | `?limit=50&offset=0` | List orders for the tenant |
| `POST` | `/api/v1/orders` | `CreateOrderInput` | Create order (idempotent via `clientId`) |
| `GET` | `/api/v1/orders/:id` | — | Get single order with items |
| `PATCH` | `/api/v1/orders/:id/status` | `{ status }` | Update order status |

### Customers

| Method | Path | Query | Description |
|---|---|---|---|
| `GET` | `/api/v1/customers` | `?phone=<query>` | Search by phone number |
| `POST` | `/api/v1/customers` | `{ phone, name }` | Upsert (update name if phone exists) |

### Inventory

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | — | List all products for tenant |
| `POST` | `/api/v1/products` | `{ name, price, stock?, lowStockThreshold? }` | Create product |
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
│  (Dexie v2)     │
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

Every data table (`customers`, `products`, `orders`) has a `tenant_id` column with a FK to `tenants`. All queries are scoped:

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
│   │   │       ├── order.ts
│   │   │       ├── product.ts
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
│   │       │   ├── types.ts     ← Full Kysely Database interface
│   │       │   ├── migrate.ts   ← Sequential migration runner
│   │       │   └── migrations/
│   │       │       ├── 001_initial.sql
│   │       │       └── 002_multi_tenant.sql
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── router.ts     ← POST /register, POST /login
│   │       │   │   └── service.ts    ← bcrypt hash/compare, JWT sign
│   │       │   ├── orders/
│   │       │   │   ├── router.ts
│   │       │   │   └── service.ts    ← resolveCustomerId() UUID guard
│   │       │   ├── customers/
│   │       │   ├── inventory/
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
│           ├── App.tsx           ← Router, ProtectedRoute wrapper
│           ├── main.tsx          ← initLanguage(), ErrorBoundary, React root
│           ├── index.css         ← Tailwind base + .btn-primary, .card, .input-field, …
│           ├── api/client.ts     ← Axios, Bearer interceptor, 401 auto-logout
│           ├── components/
│           │   ├── BottomNav.tsx       ← Glass nav, gradient active indicator
│           │   ├── StatusChip.tsx      ← Glowing status badges
│           │   ├── SyncIndicator.tsx   ← Online/syncing/synced pill
│           │   ├── Toast.tsx           ← Slide-down glass notification
│           │   ├── LanguageSwitcher.tsx
│           │   ├── ProtectedRoute.tsx
│           │   └── ErrorBoundary.tsx
│           ├── features/
│           │   ├── auth/         ← LoginPage, RegisterPage
│           │   ├── orders/       ← OrdersPage, NewOrderPage, OrderDetailPage
│           │   ├── customers/    ← CustomersPage, CustomerDetailPage, CustomerSearchInput
│           │   ├── inventory/    ← InventoryPage
│           │   ├── invoices/     ← InvoicePrint (print-only)
│           │   └── settings/     ← SettingsPage
│           ├── i18n/
│           │   ├── ar.json
│           │   ├── en.json
│           │   └── config.ts
│           ├── lib/logger.ts     ← Client-side structured logger
│           ├── offline/
│           │   ├── db.ts         ← Dexie v2 schema (all tables tenant-scoped)
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
| `.btn-danger` | Pink→magenta gradient button |
| `.btn-secondary` | Glass button (white/7% bg, white/10% border) |
| `.card` | Dark glass card with blur and inner-border highlight |
| `.input-field` | Dark input, violet glow ring on focus |
| `.page-header` | Sticky gradient header with backdrop blur |

### Fonts

| | Font | Weight |
|---|---|---|
| English | Inter | 400 – 900 |
| Arabic | Cairo | 400 – 900 |

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

### PWA / Service Worker

The app is a Progressive Web App. On Chrome/Edge you can install it to your home screen. The service worker caches static assets. API calls are always network-first (no caching of API responses).

---

## Security Considerations

| Area | Practice |
|---|---|
| Passwords | bcrypt with 10 rounds. Never logged, never returned in API responses. Redacted by pino in production logs. |
| JWT | Signed with `HS256`. Secret must be ≥ 32 chars. Default expiry 30 days. Token stored in `localStorage` (acceptable for local-network deployments; upgrade to `httpOnly` cookies for public internet). |
| SQL Injection | Impossible — all queries use Kysely's parameterised query builder. No raw string interpolation. |
| Tenant Isolation | Every query includes `WHERE tenant_id = $tenantId` extracted from the verified JWT. |
| CORS | Restricted to `CORS_ORIGIN` env var. Default: `http://localhost:3847`. |
| Security Headers | `helmet` middleware applies `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc. |
| Input Validation | All route handlers validate required fields and throw typed `AppError.validation()` before touching the database. |
| Error Responses | Stack traces are only included in responses when `NODE_ENV !== 'production'`. |
