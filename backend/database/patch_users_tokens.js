import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL for users reset token columns...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDb}\`;`);

    // Add reset_token column to master users table
    try {
      await conn.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL DEFAULT NULL;');
      console.log('  -> Added reset_token column to master users table.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('  -> reset_token column already exists.');
      } else {
        console.error('  -> Failed to add reset_token column:', err.message);
      }
    }

    // Add reset_token_expires column to master users table
    try {
      await conn.query('ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL DEFAULT NULL;');
      console.log('  -> Added reset_token_expires column to master users table.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('  -> reset_token_expires column already exists.');
      } else {
        console.error('  -> Failed to add reset_token_expires column:', err.message);
      }
    }

    console.log('\n[Patch] MASTER USERS TOKENS PATCH COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
