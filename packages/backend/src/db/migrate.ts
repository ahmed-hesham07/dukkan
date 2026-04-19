import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import pino from 'pino';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const log = pino({
  level: 'info',
  formatters: { level: (label) => ({ level: label.toUpperCase() }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const MIGRATIONS = [
  '001_initial.sql',
  '002_multi_tenant.sql',
  '003_business_features.sql',
];

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    log.fatal('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  log.info('Connecting to database...');
  await client.connect();
  log.info('Connected — running migrations');

  for (const file of MIGRATIONS) {
    const sqlPath = join(__dirname, 'migrations', file);
    const sql = readFileSync(sqlPath, 'utf-8');
    const start = Date.now();
    log.info({ file }, `Running migration: ${file}`);
    try {
      await client.query(sql);
      log.info({ file, durationMs: Date.now() - start }, `Migration complete: ${file}`);
    } catch (err) {
      log.error({ err, file }, `Migration failed: ${file}`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  log.info('All migrations complete — database is ready');
}

migrate().catch((err) => {
  console.error('Unexpected migration error:', err);
  process.exit(1);
});
