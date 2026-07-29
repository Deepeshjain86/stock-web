import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL to remove Brand category type...');
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
      console.log(`[Patch] Updating categories table in: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      // Delete Brand categories
      try {
        const [delResult] = await conn.query("DELETE FROM categories WHERE category_type = 'Brand';");
        console.log(`  -> Deleted ${delResult.affectedRows} categories of type 'Brand'.`);
      } catch (err) {
        console.error('  -> Failed to delete Brand categories:', err.message);
      }

      // Alter categories table column ENUM
      try {
        await conn.query("ALTER TABLE categories MODIFY COLUMN category_type ENUM('Main','Sub') NOT NULL DEFAULT 'Main';");
        console.log("  -> Altered categories.category_type ENUM to ('Main','Sub').");
      } catch (err) {
        console.error('  -> Failed to alter categories.category_type:', err.message);
      }
    }

    console.log('\n[Patch] Completed successfully.');
  } catch (error) {
    console.error('[Patch] Error running patch:', error);
  } finally {
    await conn.end();
  }
};

runPatch();
