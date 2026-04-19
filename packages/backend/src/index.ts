import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { customersRouter } from './features/customers/router.js';
import { productsRouter } from './features/inventory/router.js';
import { ordersRouter } from './features/orders/router.js';
import { invoicesRouter } from './features/invoices/router.js';
import { syncRouter } from './features/sync/router.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 4847;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/sync', syncRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Dukkan backend running on port ${PORT}`);
});
