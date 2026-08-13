import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'kirana_erp_master'
};

export async function runOdoo19ValuationMigration() {
  console.log('====================================================');
  console.log('   RUNNING ODOO 19 INVENTORY VALUATION MIGRATION    ');
  console.log('====================================================\n');

  const masterConn = await mysql.createConnection(dbConfig);
  try {
    const [tenants] = await masterConn.query('SELECT id, store_name, database_name FROM tenants WHERE subscription_status = "Active" OR subscription_status = "Trial"');
    console.log(`[Migration] Found ${tenants.length} active tenant database(s) to process.`);

    for (const tenant of tenants) {
      if (!tenant.database_name) continue;
      console.log(`\n[Migration] Migrating tenant: "${tenant.store_name}" (DB: ${tenant.database_name})...`);
      
      const tenantConn = await mysql.createConnection({
        ...dbConfig,
        database: tenant.database_name
      });

      try {
        // 1. Add costing_method to categories if not exists
        const [catCols] = await tenantConn.query(`SHOW COLUMNS FROM categories LIKE 'costing_method'`);
        if (catCols.length === 0) {
          await tenantConn.query(`ALTER TABLE categories ADD COLUMN costing_method ENUM('FIFO', 'AVCO', 'Standard Cost') NOT NULL DEFAULT 'FIFO' AFTER description`);
          console.log(`   - Added 'costing_method' column to categories table.`);
        }

        // 2. Add standard_cost to products if not exists
        const [prodCols] = await tenantConn.query(`SHOW COLUMNS FROM products LIKE 'standard_cost'`);
        if (prodCols.length === 0) {
          await tenantConn.query(`ALTER TABLE products ADD COLUMN standard_cost DECIMAL(12,2) DEFAULT 0.00 AFTER max_stock`);
          console.log(`   - Added 'standard_cost' column to products table.`);
        }

        // 3. Add audit columns to stock_adjustments if not exists
        const [adjCols] = await tenantConn.query(`SHOW COLUMNS FROM stock_adjustments LIKE 'previous_quantity'`);
        if (adjCols.length === 0) {
          await tenantConn.query(`
            ALTER TABLE stock_adjustments 
            ADD COLUMN previous_quantity DECIMAL(12,3) DEFAULT 0.00 AFTER remarks,
            ADD COLUMN new_quantity DECIMAL(12,3) DEFAULT 0.00 AFTER previous_quantity,
            ADD COLUMN previous_inventory_value DECIMAL(12,2) DEFAULT 0.00 AFTER new_quantity,
            ADD COLUMN new_inventory_value DECIMAL(12,2) DEFAULT 0.00 AFTER previous_inventory_value,
            ADD COLUMN accounting_treatment VARCHAR(100) DEFAULT 'Inventory Variation' AFTER new_inventory_value
          `);
          console.log(`   - Added audit columns (previous_quantity, new_quantity, etc.) to stock_adjustments table.`);
        }

        // 4. Create inventory_valuation_layers table
        await tenantConn.query(`
          CREATE TABLE IF NOT EXISTS inventory_valuation_layers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            warehouse_id INT NOT NULL DEFAULT 1,
            batch_id INT NULL,
            transaction_type ENUM('Purchase Receipt', 'Sales Delivery', 'Sales Return', 'Purchase Return', 'Stock Adjustment', 'Scrap/Wastage', 'Stock Transfer', 'Revaluation') NOT NULL,
            reference_no VARCHAR(100) NOT NULL,
            quantity_delta DECIMAL(12,3) NOT NULL,
            unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            value_delta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            previous_inventory_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            new_inventory_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            previous_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.00,
            new_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.00,
            accounting_treatment VARCHAR(100) NULL DEFAULT 'Inventory Variation',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_ivl_product (product_id),
            INDEX idx_ivl_type (transaction_type),
            INDEX idx_ivl_ref (reference_no)
          );
        `);
        console.log(`   - Verified 'inventory_valuation_layers' table.`);

        // 5. Create inventory_revaluations table
        await tenantConn.query(`
          CREATE TABLE IF NOT EXISTS inventory_revaluations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            revaluation_no VARCHAR(50) NOT NULL UNIQUE,
            product_id INT NOT NULL,
            warehouse_id INT NOT NULL DEFAULT 1,
            batch_id INT NULL,
            old_unit_cost DECIMAL(12,2) NOT NULL,
            new_unit_cost DECIMAL(12,2) NOT NULL,
            quantity DECIMAL(12,3) NOT NULL,
            value_delta DECIMAL(12,2) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            remarks TEXT NULL,
            user_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_rev_no (revaluation_no),
            INDEX idx_rev_product (product_id)
          );
        `);
        console.log(`   - Verified 'inventory_revaluations' table.`);

      } catch (err) {
        console.error(`❌ Migration error on ${tenant.database_name}:`, err.message);
      } finally {
        await tenantConn.end();
      }
    }

    console.log('\n====================================================');
    console.log('   ✅ ODOO 19 VALUATION MIGRATION COMPLETED         ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await masterConn.end();
  }
}

// Run directly if script executed via node
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runOdoo19ValuationMigration();
}
