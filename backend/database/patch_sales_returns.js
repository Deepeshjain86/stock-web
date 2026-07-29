import { masterPool, getTenantPool } from '../config/tenantDb.js';

async function patchSalesReturnsTable() {
  console.log('--- Starting Patch for sales_returns Table ---');
  try {
    const [tenants] = await masterPool.query('SELECT id, database_name FROM tenants');
    const dbNames = ['kirana_erp_master', ...tenants.map(t => t.database_name)];

    for (const dbName of dbNames) {
      try {
        const db = getTenantPool(dbName);

        // Ensure table exists
        await db.query(`
          CREATE TABLE IF NOT EXISTS sales_returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            invoice_no VARCHAR(50) NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            refund_amount DECIMAL(10,2) NOT NULL,
            reason VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check columns
        const [cols] = await db.query(`SHOW COLUMNS FROM sales_returns`);
        const colNames = cols.map(c => c.Field);

        const addCol = async (colDef) => {
          const name = colDef.split(' ')[0];
          if (!colNames.includes(name)) {
            await db.query(`ALTER TABLE sales_returns ADD COLUMN ${colDef}`);
            console.log(`  [${dbName}] Added column: ${name}`);
          }
        };

        await addCol('return_no VARCHAR(50) NULL AFTER id');
        await addCol('customer_name VARCHAR(255) NULL AFTER invoice_no');
        await addCol('customer_phone VARCHAR(50) NULL AFTER customer_name');
        await addCol('return_type VARCHAR(50) DEFAULT "Refund" AFTER reason');
        await addCol('refund_method VARCHAR(50) DEFAULT "Cash" AFTER return_type');
        await addCol('remarks TEXT NULL AFTER refund_method');
        await addCol('replacement_product_id INT NULL AFTER remarks');
        await addCol('replacement_quantity INT NULL AFTER replacement_product_id');
        await addCol('price_difference DECIMAL(10,2) DEFAULT 0.00 AFTER replacement_quantity');
        await addCol('user_id INT NULL AFTER price_difference');

        console.log(`[OK] Patched ${dbName}.sales_returns successfully.`);
      } catch (err) {
        console.error(`[ERR] Failed patching ${dbName}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

patchSalesReturnsTable();
