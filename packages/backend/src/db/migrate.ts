import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sqlPath = join(__dirname, 'migrations', '001_initial.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('Running migrations...');
  await client.query(sql);
  console.log('Migrations complete.');

  await client.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
