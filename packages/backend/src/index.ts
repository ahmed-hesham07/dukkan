import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { logger } from './lib/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './features/auth/router.js';
import { customersRouter } from './features/customers/router.js';
import { productsRouter } from './features/inventory/router.js';
import { ordersRouter } from './features/orders/router.js';
import { invoicesRouter } from './features/invoices/router.js';
import { syncRouter } from './features/sync/router.js';
import { dashboardRouter } from './features/dashboard/router.js';
import { returnsRouter } from './features/returns/router.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 4847;

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public routes (no JWT required) ───────────────────────────────────────────
app.use('/api/v1/auth', authRouter);

// ── Protected routes ──────────────────────────────────────────────────────────
app.use(authMiddleware);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1', returnsRouter);

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Dukkan backend started');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received — closing server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection — shutting down');
  process.exit(1);
});
