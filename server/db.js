/**
 * db.js - PostgreSQL 連線池 (含 pgvector 支援)
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URI;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變數未設定');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 30,
  min: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool 背景錯誤:', err.message);
});

let _logged = false;
pool.on('connect', () => {
  if (!_logged) {
    _logged = true;
    console.log('✅ PostgreSQL Pool connected');
  }
});

async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

module.exports = { pool, withClient };
