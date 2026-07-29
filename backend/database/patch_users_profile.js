import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL for users profile columns...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Read tenants from master
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    const dbNames = [masterDb, ...tenants.map(t => t.database_name)];

    for (const dbName of dbNames) {
      console.log(`\n------------------------------------------`);
      console.log(`[Patch] Patching Users table in Database: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      // Add phone column
      try {
        await conn.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL;');
        console.log('  -> Added phone column to users table.');
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('  -> phone column already exists.');
        } else {
          console.error('  -> Failed to add phone column:', err.message);
        }
      }

      // Add address column
      try {
        await conn.query('ALTER TABLE users ADD COLUMN address TEXT NULL DEFAULT NULL;');
        console.log('  -> Added address column to users table.');
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('  -> address column already exists.');
        } else {
          console.error('  -> Failed to add address column:', err.message);
        }
      }
    }

    console.log('\n[Patch] USERS SCHEMA PROFILE PATCH COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
