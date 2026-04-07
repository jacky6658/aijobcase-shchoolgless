/**
 * init-db.js - 初始化資料庫 schema + 預設管理員帳號
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function initDB() {
  console.log('🔄 初始化資料庫...');

  try {
    // 執行 schema SQL
    const schemaPath = path.join(__dirname, 'db', 'init-postgres.sql');
    let schema = fs.readFileSync(schemaPath, 'utf-8');

    // 生成真正的 bcrypt hash 取代 placeholder
    const adminHash = await bcrypt.hash('admin123', 10);
    schema = schema.replace('$2a$10$placeholder', adminHash);

    await pool.query(schema);
    console.log('✅ Schema 建立完成');

    // 驗證
    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`✅ users 表有 ${rows[0].count} 筆資料`);

    const extCheck = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    if (extCheck.rows.length > 0) {
      console.log('✅ pgvector 擴充已啟用');
    } else {
      console.warn('⚠️ pgvector 擴充未啟用，請手動執行 CREATE EXTENSION vector');
    }
  } catch (err) {
    console.error('❌ 初始化失敗:', err.message);
    if (err.message.includes('vector')) {
      console.error('提示：請確認 PostgreSQL 已安裝 pgvector 擴充');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initDB();
