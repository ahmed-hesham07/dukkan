import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { logger } from '../lib/logger.js';
import type { Database } from './types.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('connect', () => {
  logger.debug('DB pool: new client connected');
});

pool.on('error', (err) => {
  logger.error({ err }, 'DB pool: idle client error');
});

pool.on('remove', () => {
  logger.debug('DB pool: client removed');
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
  log(event) {
    if (event.level === 'error') {
      logger.error({ err: event.error, query: event.query.sql }, 'DB query error');
    } else if (process.env.LOG_LEVEL === 'debug') {
      logger.debug(
        { sql: event.query.sql, params: event.query.parameters, durationMs: event.queryDurationMillis },
        'DB query'
      );
    }
  },
});

export async function checkDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('DB connection verified');
  } finally {
    client.release();
  }
}
