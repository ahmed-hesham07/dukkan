# دكان — Local Business Operations System

A production-ready, offline-first POS and business management system for small shops in Egypt and emerging markets.

---

## Ports (Unique — No Conflicts)

| Service | Port |
|---|---|
| Frontend (React) | **3847** |
| Backend (Node.js) | **4847** |
| PostgreSQL | **5847** |

---

## Quick Start

### Option 1 — Docker (Recommended, one command)

```bash
cp .env.example .env
docker compose up --build
```

Then open: **http://localhost:3847**

### Option 2 — Local Development

**Prerequisites:** Node.js 20+, PostgreSQL running on port 5847

```bash
# 1. Copy env file
cp .env.example .env
# Edit DATABASE_URL_LOCAL to point to your local Postgres

# 2. Install all dependencies
npm install

# 3. Run database migrations
cd packages/backend
npm run migrate

# 4. Start backend (port 4847)
npm run dev:backend

# 5. Start frontend (port 3847) — in a new terminal
npm run dev:frontend
```

---

## Features

- **Orders** — Create in under 10 seconds, offline-first
- **Inventory** — Stock tracking with low-stock alerts
- **Customers** — Phone-number search, purchase history
- **Invoices** — Printable A4 PDF from any order
- **Offline Sync** — Full functionality without internet, auto-sync with exponential backoff
- **Arabic RTL UI** — Cairo font, mobile-first, large touch targets

---

## Architecture

```
packages/
├── shared/      # TypeScript types shared between frontend + backend
├── backend/     # Express.js REST API + Kysely + PostgreSQL
└── frontend/    # Vite + React + Tailwind + Dexie (IndexedDB) + PWA
```

---

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|---|---|
| `POSTGRES_PORT` | Host port for PostgreSQL (default: 5847) |
| `PORT` | Backend port (default: 4847) |
| `VITE_API_URL` | Frontend → backend URL |
| `CORS_ORIGIN` | Backend allowed origin |
