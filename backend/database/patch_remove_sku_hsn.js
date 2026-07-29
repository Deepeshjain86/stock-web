import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL to drop SKU and HSN columns...');
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
      console.log(`[Patch] Altering products table in: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      // Drop sku column
      try {
        await conn.query('ALTER TABLE products DROP COLUMN sku;');
        console.log('  -> Dropped products.sku column.');
      } catch (err) {
        if (err.code === 'ER_CANT_DROP_COLUMN' || err.code === 'ER_BAD_FIELD_ERROR') {
          console.log('  -> products.sku column already dropped.');
        } else {
          console.error('  -> Failed to drop products.sku:', err.message);
        }
      }

      // Drop hsn_code column
      try {
        await conn.query('ALTER TABLE products DROP COLUMN hsn_code;');
        console.log('  -> Dropped products.hsn_code column.');
      } catch (err) {
        if (err.code === 'ER_CANT_DROP_COLUMN' || err.code === 'ER_BAD_FIELD_ERROR') {
          console.log('  -> products.hsn_code column already dropped.');
        } else {
          console.error('  -> Failed to drop products.hsn_code:', err.message);
        }
      }
    }

    console.log('\n[Patch] SKU & HSN COLUMNS REMOVED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Drop columns migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
