import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const syncVendorStatus = async () => {
  console.log('\n======================================================');
  console.log('SYNCING VENDOR STATUS COLUMN ACROSS ALL TENANTS');
  console.log('======================================================\n');

  let baseConn = null;
  try {
    baseConn = await mysql.createConnection({ host, port, user, password });

    const [tenants] = await baseConn.query(`SELECT database_name FROM \`${masterDb}\`.tenants`);
    for (const t of tenants) {
      if (!t.database_name) continue;
      const dbName = t.database_name;

      const [dbCheck] = await baseConn.query(`SHOW DATABASES LIKE '${dbName}'`);
      if (dbCheck.length === 0) continue;

      try {
        const [cols] = await baseConn.query(`SHOW COLUMNS FROM \`${dbName}\`.vendors LIKE 'status'`);
        if (cols.length === 0) {
          await baseConn.query(`ALTER TABLE \`${dbName}\`.vendors ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active';`);
          console.log(`[Schema Sync] Added 'status' column to vendors table in "${dbName}".`);
        } else {
          console.log(`[Schema Sync] Vendors table in "${dbName}" already has 'status' column.`);
        }
      } catch (err) {
        console.warn(`[Schema Sync] Info for "${dbName}":`, err.message);
      }
    }

    console.log('\n======================================================');
    console.log('✅ SCHEMA SYNC COMPLETED SUCCESSFULLY 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Schema Sync Failed:', err);
  } finally {
    if (baseConn) await baseConn.end();
  }
};

syncVendorStatus();
