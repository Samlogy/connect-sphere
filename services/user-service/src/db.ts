import fs from 'fs';
import path from 'path';
import { Pool } from "pg";
import config from './config';

export const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: Number(config.db.PG_PORT),
});


async function initDB(): Promise<void> {
  const filePath = path.join(__dirname, '../scripts/init.sql');

  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ init.sql not found at: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  console.log('🚀 Running database initialization script...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Database initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default { sql: initDB, nosql: {} };