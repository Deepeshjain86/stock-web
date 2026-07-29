/**
 * patch_vendor_returns_v2.js
 *
 * Migration patch that ensures:
 *   1. purchase_returns table has all required columns
 *   2. purchase_return_status_history table exists
 *   3. stock_logs table has vendor_id column (nullable)
 *   4. vendors table does NOT have advance_balance (it's computed dynamically)
 *      If it exists as a leftover, this patch will safely leave it alone.
 *
 * Run: node patch_vendor_returns_v2.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host     = process.env.DB_HOST     || '127.0.0.1';
const port     = process.env.DB_PORT     || 3306;
const user     = process.env.DB_USER     || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[PatchV2] Connecting to MySQL...');
  let masterConn;
  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    const [tenants] = await masterConn.query('SELECT database_name, store_name FROM tenants');
    console.log(`[PatchV2] Found ${tenants.length} tenant database(s).`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      if (!dbName) continue;
      console.log(`\n[PatchV2] ─── Patching: "${dbName}" (${tenant.store_name}) ───`);

      const conn = await mysql.createConnection({ host, port, user, password, database: dbName });

      // ── 1. purchase_returns: ensure all required columns exist ──────────────
      console.log('[PatchV2] Checking purchase_returns columns...');
      const [columns] = await conn.query('SHOW COLUMNS FROM purchase_returns');
      const colNames = columns.map(c => c.Field);

      const requiredCols = [
        ['return_no',    'VARCHAR(50) NULL'],
        ['return_type',  "VARCHAR(30) NOT NULL DEFAULT 'Refund'"],
        ['remarks',      'TEXT NULL'],
        ['image_url',    'VARCHAR(255) NULL'],
        ['status',       "VARCHAR(50) NOT NULL DEFAULT 'Pending'"],
        ['batch_number', 'VARCHAR(50) NULL'],
        ['expiry_date',  'DATE NULL'],
      ];

      for (const [col, def] of requiredCols) {
        if (!colNames.includes(col)) {
          await conn.query(`ALTER TABLE purchase_returns ADD COLUMN ${col} ${def}`);
          console.log(`  -> Added column: purchase_returns.${col}`);
        } else {
          console.log(`  -> Column already exists: purchase_returns.${col}`);
        }
      }

      // Back-fill return_no for existing rows that have it NULL
      await conn.query(`
        UPDATE purchase_returns 
        SET return_no = CONCAT('VRN-', YEAR(created_at), '-', LPAD(id, 6, '0')) 
        WHERE return_no IS NULL
      `);

      // Make return_no NOT NULL now that all rows have a value
      await conn.query(`ALTER TABLE purchase_returns MODIFY COLUMN return_no VARCHAR(50) NOT NULL`);
      console.log('  -> Ensured return_no is NOT NULL');

      // ── 2. purchase_return_status_history table ──────────────────────────────
      await conn.query(`
        CREATE TABLE IF NOT EXISTS purchase_return_status_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_return_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          user_name VARCHAR(150) NOT NULL DEFAULT 'System',
          notes VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
        )
      `);
      console.log('  -> Ensured purchase_return_status_history table exists');

      // ── 3. stock_logs: ensure vendor_id column exists ────────────────────────
      const [logCols] = await conn.query('SHOW COLUMNS FROM stock_logs');
      const logColNames = logCols.map(c => c.Field);

      if (!logColNames.includes('vendor_id')) {
        await conn.query('ALTER TABLE stock_logs ADD COLUMN vendor_id INT NULL');
        try {
          await conn.query(
            'ALTER TABLE stock_logs ADD CONSTRAINT fk_stock_logs_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL'
          );
          console.log('  -> Added vendor_id + FK to stock_logs');
        } catch (fkErr) {
          console.log('  -> Added vendor_id to stock_logs (FK constraint already existed or skipped)');
        }
      } else {
        console.log('  -> stock_logs.vendor_id already exists');
      }

      // ── 4. Report on vendors table columns (informational) ───────────────────
      const [vendorCols] = await conn.query('SHOW COLUMNS FROM vendors WHERE Field = "outstanding_balance"');
      if (vendorCols.length === 0) {
        await conn.query('ALTER TABLE vendors ADD COLUMN outstanding_balance DECIMAL(12,2) DEFAULT 0.00');
        console.log('  -> Added vendors.outstanding_balance');
      } else {
        console.log('  -> vendors.outstanding_balance already exists');
      }

      // Sanity note: advance_balance is NOT a stored column - it's computed
      const [advCols] = await conn.query('SHOW COLUMNS FROM vendors WHERE Field = "advance_balance"');
      if (advCols.length > 0) {
        console.log('  -> [NOTICE] vendors.advance_balance found as a stored column.');
        console.log('     The application computes this dynamically - the stored column is unused.');
        console.log('     You may safely drop it with: ALTER TABLE vendors DROP COLUMN advance_balance;');
      }

      await conn.end();
      console.log(`[PatchV2] Completed patch for "${dbName}"`);
    }

    console.log('\n[PatchV2] ALL TENANTS PATCHED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('[PatchV2] PATCH FAILED:', err);
    process.exit(1);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

runPatch();
