import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL to drop PAN card number column from vendors...');
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

    const tenantDbNames = tenants.map(t => t.database_name);

    for (const dbName of tenantDbNames) {
      console.log(`\n------------------------------------------`);
      console.log(`[Patch] Altering vendors table in: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      // Drop pan column
      try {
        await conn.query('ALTER TABLE vendors DROP COLUMN pan;');
        console.log('  -> Dropped vendors.pan column.');
      } catch (err) {
        if (err.code === 'ER_CANT_DROP_COLUMN' || err.code === 'ER_BAD_FIELD_ERROR') {
          console.log('  -> vendors.pan column already dropped.');
        } else {
          console.error('  -> Failed to drop vendors.pan:', err.message);
        }
      }
    }

    console.log('\n[Patch] VENDORS PAN COLUMN REMOVED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Drop vendors PAN migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
