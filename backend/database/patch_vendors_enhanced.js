import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL for Vendors Enhancements...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    const dbNames = [masterDb, ...tenants.map(t => t.database_name)];

    for (const dbName of dbNames) {
      if (dbName === masterDb) continue;
      console.log(`\n==========================================`);
      console.log(`[Patch] Patching Database: "${dbName}"`);
      console.log(`==========================================`);

      await conn.query(`USE \`${dbName}\`;`);

      const vendorCols = [
        ['alternate_phone', 'VARCHAR(20) NULL'],
        ['pan', 'VARCHAR(15) NULL'],
        ['opening_balance_type', "VARCHAR(20) DEFAULT 'Payable'"],
        ['credit_limit', 'DECIMAL(12,2) DEFAULT 0.00'],
        ['bank_name', 'VARCHAR(100) NULL'],
        ['account_number', 'VARCHAR(50) NULL'],
        ['ifsc_code', 'VARCHAR(20) NULL']
      ];

      for (const col of vendorCols) {
        try {
          await conn.query(`ALTER TABLE vendors ADD COLUMN ${col[0]} ${col[1]};`);
          console.log(`  -> Added ${col[0]} column to vendors.`);
        } catch (err) {
          if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.error(`  -> Error adding vendors.${col[0]}:`, err.message);
          }
        }
      }
    }

    console.log('\n==========================================');
    console.log('[Patch] VENDORS ENHANCED COLUMNS MIGRATION SUCCESSFUL!');
    console.log('==========================================\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runPatch();
