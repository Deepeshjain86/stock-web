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

      // 1. Check and upgrade purchase_returns table
      const [columns] = await conn.query(`SHOW COLUMNS FROM purchase_returns`);
      const colNames = columns.map(c => c.Field);

      if (!colNames.includes('return_no')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN return_no VARCHAR(50) NULL`);
        console.log(`  -> Added return_no to purchase_returns`);
      }
      if (!colNames.includes('return_type')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN return_type VARCHAR(30) NOT NULL DEFAULT 'Refund'`);
        console.log(`  -> Added return_type to purchase_returns`);
      }
      if (!colNames.includes('remarks')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN remarks TEXT NULL`);
        console.log(`  -> Added remarks to purchase_returns`);
      }
      if (!colNames.includes('image_url')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN image_url VARCHAR(255) NULL`);
        console.log(`  -> Added image_url to purchase_returns`);
      }
      if (!colNames.includes('status')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'`);
        console.log(`  -> Added status to purchase_returns`);
      }
      if (!colNames.includes('batch_number')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN batch_number VARCHAR(50) NULL`);
        console.log(`  -> Added batch_number to purchase_returns`);
      }
      if (!colNames.includes('expiry_date')) {
        await conn.query(`ALTER TABLE purchase_returns ADD COLUMN expiry_date DATE NULL`);
        console.log(`  -> Added expiry_date to purchase_returns`);
      }

      // Fill existing rows with a mock VRN if return_no is null
      await conn.query(`
        UPDATE purchase_returns 
        SET return_no = CONCAT('VRN-', YEAR(created_at), '-', LPAD(id, 6, '0')) 
        WHERE return_no IS NULL
      `);

      // Modify return_no to be NOT NULL now
      await conn.query(`ALTER TABLE purchase_returns MODIFY COLUMN return_no VARCHAR(50) NOT NULL`);

      // 2. Create purchase_return_status_history table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS purchase_return_status_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_return_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          user_name VARCHAR(150) NOT NULL,
          notes VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
        )
      `);
      console.log(`  -> Ensured purchase_return_status_history table exists.`);

      await conn.end();
    }
    console.log('[Patch] All tenant databases patched successfully!');
  } catch (err) {
    console.error('[Patch] Migration patch failed:', err);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

runPatch();
