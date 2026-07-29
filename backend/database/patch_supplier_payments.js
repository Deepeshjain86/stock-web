import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL for Supplier Payments & Vendor Ledger patch...');
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

    for (const dbName of dbNames) {
      console.log(`\n==========================================`);
      console.log(`[Patch] Patching Database: "${dbName}"`);
      console.log(`==========================================`);

      await conn.query(`USE \`${dbName}\`;`);

      if (dbName !== masterDb) {
        // A. Add columns to vendors
        const vendorCols = [
          ['credit_limit', 'DECIMAL(12,2) DEFAULT 0.00'],
          ['total_purchases', 'DECIMAL(12,2) DEFAULT 0.00'],
          ['total_paid', 'DECIMAL(12,2) DEFAULT 0.00']
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

        // B. Add columns to purchases
        const purchaseCols = [
          ['paid_amount', 'DECIMAL(12,2) DEFAULT 0.00']
        ];
        for (const col of purchaseCols) {
          try {
            await conn.query(`ALTER TABLE purchases ADD COLUMN ${col[0]} ${col[1]};`);
            console.log(`  -> Added ${col[0]} column to purchases.`);
          } catch (err) {
            if (err.code !== 'ER_DUP_COLUMN_NAME') {
              console.error(`  -> Error adding purchases.${col[0]}:`, err.message);
            }
          }
        }

        // C. Create supplier_payments table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_no VARCHAR(50) NOT NULL UNIQUE,
            vendor_id INT NOT NULL,
            purchase_id INT NULL,
            payment_date DATETIME NOT NULL,
            amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT/RTGS', 'Other') NOT NULL DEFAULT 'Cash',
            reference_no VARCHAR(100) NULL,
            bank_account VARCHAR(100) NULL,
            remarks TEXT NULL,
            attachment_url VARCHAR(255) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
          );
        `);
        console.log('  -> Ensured supplier_payments table.');

        // D. Create vendor_ledger table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS vendor_ledger (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_id INT NOT NULL,
            purchase_id INT NULL,
            payment_id INT NULL,
            date DATETIME NOT NULL,
            transaction_type ENUM('PURCHASE_INVOICE', 'SUPPLIER_PAYMENT', 'PURCHASE_RETURN', 'OPENING_BALANCE', 'ADJUSTMENT') NOT NULL,
            reference_no VARCHAR(100) NULL,
            description TEXT NULL,
            debit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            running_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
            FOREIGN KEY (payment_id) REFERENCES supplier_payments(id) ON DELETE SET NULL
          );
        `);
        console.log('  -> Ensured vendor_ledger table.');
      }
    }

    console.log('\n==========================================');
    console.log('[Patch] SUPPLIER PAYMENTS & VENDOR LEDGER MIGRATION SUCCESSFUL!');
    console.log('==========================================\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runPatch();
