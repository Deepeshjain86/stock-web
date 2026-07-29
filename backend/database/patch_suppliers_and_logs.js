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

    // 2. Patch each database schema
    for (const dbName of dbNames) {
      console.log(`\n==========================================`);
      console.log(`[Patch] Patching Database: "${dbName}"`);
      console.log(`==========================================`);

      await conn.query(`USE \`${dbName}\`;`);

      // A. Add columns to activity_logs
      const logCols = [
        ['user_name', 'VARCHAR(150) NULL'],
        ['role', 'VARCHAR(50) NULL'],
        ['department', 'VARCHAR(50) NULL'],
        ['record_id', 'VARCHAR(100) NULL'],
        ['previous_value', 'TEXT NULL'],
        ['new_value', 'TEXT NULL'],
        ['device_info', 'VARCHAR(255) NULL'],
        ['session_id', 'VARCHAR(100) NULL'],
        ['status', "VARCHAR(20) DEFAULT 'Success'"]
      ];

      for (const col of logCols) {
        try {
          await conn.query(`ALTER TABLE activity_logs ADD COLUMN ${col[0]} ${col[1]};`);
          console.log(`  -> Added ${col[0]} column to activity_logs.`);
        } catch (err) {
          if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.error(`  -> Failed to add activity_logs.${col[0]}:`, err.message);
          }
        }
      }

      // B. If tenant database, add columns to vendors
      if (dbName !== masterDb) {
        const vendorCols = [
          ['company_name', 'VARCHAR(150) NULL'],
          ['contact_person', 'VARCHAR(100) NULL'],
          ['pan', 'VARCHAR(10) NULL'],
          ['city', 'VARCHAR(100) NULL'],
          ['state', 'VARCHAR(100) NULL'],
          ['pincode', 'VARCHAR(20) NULL'],
          ['categories_supplied', 'TEXT NULL'],
          ['payment_terms', 'VARCHAR(100) NULL'],
          ['opening_balance', 'DECIMAL(12,2) DEFAULT 0.00'],
          ['status', "VARCHAR(20) DEFAULT 'Active'"],
          ['notes', 'TEXT NULL'],
          ['supplier_code', 'VARCHAR(50) NULL']
        ];

        for (const col of vendorCols) {
          try {
            await conn.query(`ALTER TABLE vendors ADD COLUMN ${col[0]} ${col[1]};`);
            console.log(`  -> Added ${col[0]} column to vendors.`);
          } catch (err) {
            if (err.code !== 'ER_DUP_COLUMN_NAME') {
              console.error(`  -> Failed to add vendors.${col[0]}:`, err.message);
            }
          }
        }

        // Generate unique supplier code for existing vendors
        const [existingVendors] = await conn.query('SELECT id, supplier_code FROM vendors');
        for (const v of existingVendors) {
          if (!v.supplier_code) {
            const code = `SUP-${String(v.id).padStart(4, '0')}`;
            await conn.query('UPDATE vendors SET supplier_code = ? WHERE id = ?', [code, v.id]);
            console.log(`  -> Updated vendor ID ${v.id} with supplier_code "${code}"`);
          }
        }
      }
    }

    console.log('\n[Patch] DATABASE SCHEMAS PATCHED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Schema patching failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
