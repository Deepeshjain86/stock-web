import dotenv from 'dotenv';
import { masterPool, getTenantPool } from '../config/tenantDb.js';

dotenv.config();

export async function patchStockTransfersSchema() {
  console.log('====================================================');
  console.log('   PATCHING MULTI-WAREHOUSE STOCK TRANSFERS SCHEMA ');
  console.log('====================================================\n');

  try {
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    const dbNames = ['kirana_erp', ...tenants.map(t => t.database_name)];
    const uniqueDbs = [...new Set(dbNames.filter(Boolean))];

    for (const dbName of uniqueDbs) {
      try {
        console.log(`Processing database "${dbName}"...`);
        const pool = getTenantPool(dbName);

        // 1. Ensure warehouses table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS warehouses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) DEFAULT 'Main Building',
            status ENUM('Active', 'Inactive') DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Seed Main Storage only if warehouses table is empty
        const [whCount] = await pool.query('SELECT COUNT(*) as cnt FROM warehouses');
        if (whCount[0].cnt === 0) {
          console.log(`   - Seeding Main Storage warehouse in "${dbName}"...`);
          await pool.query(`
            INSERT IGNORE INTO warehouses (id, name, location, status) VALUES
            (1, 'Main Storage', 'Ground Floor Stockroom', 'Active')
          `);
        }

        // 2. Ensure stock_transfers table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS stock_transfers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transfer_no VARCHAR(50) UNIQUE NOT NULL,
            from_warehouse_id INT NOT NULL,
            to_warehouse_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Dynamically add any missing columns to existing stock_transfers table
        const [existingCols] = await pool.query('DESCRIBE stock_transfers');
        const existingColNames = existingCols.map(c => c.Field);

        const requiredCols = [
          { name: 'product_id', spec: 'INT NOT NULL AFTER transfer_no' },
          { name: 'product_name', spec: 'VARCHAR(255) NOT NULL AFTER product_id' },
          { name: 'barcode', spec: 'VARCHAR(100) DEFAULT "N/A" AFTER product_name' },
          { name: 'sku', spec: 'VARCHAR(100) DEFAULT "N/A" AFTER barcode' },
          { name: 'from_warehouse_name', spec: 'VARCHAR(255) DEFAULT "Main Storage" AFTER from_warehouse_id' },
          { name: 'to_warehouse_name', spec: 'VARCHAR(255) DEFAULT "Secondary Warehouse" AFTER to_warehouse_id' },
          { name: 'batch_id', spec: 'INT NULL AFTER to_warehouse_name' },
          { name: 'batch_no', spec: 'VARCHAR(100) DEFAULT "DEFAULT" AFTER batch_id' },
          { name: 'expiry_date', spec: 'DATE NULL AFTER batch_no' },
          { name: 'quantity', spec: 'DECIMAL(12,3) NOT NULL DEFAULT 0.000 AFTER expiry_date' },
          { name: 'in_transit_quantity', spec: 'DECIMAL(12,3) DEFAULT 0.000 AFTER quantity' },
          { name: 'unit', spec: 'VARCHAR(50) DEFAULT "Pcs" AFTER in_transit_quantity' },
          { name: 'unit_cost', spec: 'DECIMAL(12,2) DEFAULT 0.00 AFTER unit' },
          { name: 'total_value', spec: 'DECIMAL(12,2) DEFAULT 0.00 AFTER unit_cost' },
          { name: 'remarks', spec: 'TEXT NULL' },
          { name: 'cancel_reason', spec: 'TEXT NULL' },
          { name: 'created_by_name', spec: 'VARCHAR(255) DEFAULT "Admin"' },
          { name: 'received_by', spec: 'INT NULL' },
          { name: 'received_by_name', spec: 'VARCHAR(255) NULL' },
          { name: 'shipped_at', spec: 'DATETIME NULL' },
          { name: 'received_at', spec: 'DATETIME NULL' }
        ];

        for (const col of requiredCols) {
          if (!existingColNames.includes(col.name)) {
            console.log(`   - Adding column "${col.name}" to stock_transfers in "${dbName}"...`);
            await pool.query(`ALTER TABLE stock_transfers ADD COLUMN ${col.name} ${col.spec}`);
          }
        }

        // Make old legacy columns nullable if they exist
        if (existingColNames.includes('transfer_date')) {
          await pool.query('ALTER TABLE stock_transfers MODIFY COLUMN transfer_date DATE NULL DEFAULT NULL');
        }

        // Expand status ENUM
        await pool.query(`ALTER TABLE stock_transfers MODIFY COLUMN status ENUM('Draft', 'In Transit', 'Pending', 'In-Transit', 'Completed', 'Cancelled') DEFAULT 'In Transit'`);

        // Expand inventory_valuation_layers transaction_type ENUM
        await pool.query(`
          ALTER TABLE inventory_valuation_layers
          MODIFY COLUMN transaction_type ENUM(
            'Purchase Receipt', 'Sales Delivery', 'Sales Return', 'Purchase Return',
            'Stock Adjustment', 'Scrap/Wastage', 'Stock Transfer', 'Transfer Out',
            'Transfer In', 'Transfer Reversal', 'Revaluation'
          ) NOT NULL
        `);

        console.log(`✓ Database "${dbName}" stock_transfers schema patched successfully.`);
      } catch (err) {
        console.warn(`Notice for database "${dbName}":`, err.message);
      }
    }

    console.log('\n====================================================');
    console.log('   ✅ MULTI-WAREHOUSE TRANSFERS SCHEMA PATCHED!    ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('Schema patching failed:', error);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  patchStockTransfersSchema().then(() => process.exit(0));
}
