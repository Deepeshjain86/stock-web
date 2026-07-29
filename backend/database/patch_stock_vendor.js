import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL for stock.vendor_id migration...');
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

    const tenantDbs = tenants.map(t => t.database_name);

    for (const dbName of tenantDbs) {
      console.log(`\n------------------------------------------`);
      console.log(`[Patch] Migrating Stock table in Database: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      try {
        // Make vendor_id NULL in stock table
        await conn.query('ALTER TABLE stock MODIFY COLUMN vendor_id INT NULL DEFAULT NULL;');
        console.log('  -> Altered stock.vendor_id to be NULLABLE (Optional).');
      } catch (err) {
        console.error('  -> Failed to alter stock.vendor_id:', err.message);
      }
    }

    console.log('\n[Patch] STOCK SCHEMA MIGRATION COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
