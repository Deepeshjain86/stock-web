import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL...');
  let masterConn;
  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    console.log('[Patch] Fetching stores/tenants...');
    const [tenants] = await masterConn.query('SELECT database_name, store_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      if (!dbName) continue;
      console.log(`[Patch] Patching tenant DB: "${dbName}" (${tenant.store_name})`);

      const conn = await mysql.createConnection({ host, port, user, password, database: dbName });

      // Check and upgrade customers table
      const [columns] = await conn.query(`SHOW COLUMNS FROM customers`);
      const colNames = columns.map(c => c.Field);

      if (!colNames.includes('payment_mode')) {
        await conn.query(`ALTER TABLE customers ADD COLUMN payment_mode VARCHAR(50) DEFAULT 'Cash'`);
        console.log(`  -> Added payment_mode to customers`);
      }
      if (!colNames.includes('notes')) {
        await conn.query(`ALTER TABLE customers ADD COLUMN notes TEXT NULL`);
        console.log(`  -> Added notes to customers`);
      }

      await conn.end();
    }
    console.log('[Patch] All tenant databases patched successfully!');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

runPatch();
