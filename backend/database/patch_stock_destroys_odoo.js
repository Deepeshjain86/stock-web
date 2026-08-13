import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { masterPool, getTenantPool } from '../config/tenantDb.js';

dotenv.config();

export async function patchStockDestroysOdoo() {
  console.log('Starting Odoo-style Stock Destroys database migration...');

  try {
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    const dbNames = ['kirana_erp', ...tenants.map(t => t.database_name)];
    const uniqueDbs = [...new Set(dbNames.filter(Boolean))];

    for (const dbName of uniqueDbs) {
      try {
        console.log(`Patching stock_destroys table in database "${dbName}"...`);
        const pool = getTenantPool(dbName);

        // 1. Ensure stock_destroys table exists with full schema
        await pool.query(`
          CREATE TABLE IF NOT EXISTS stock_destroys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            destroy_no VARCHAR(50) NOT NULL UNIQUE,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            barcode VARCHAR(100) NULL,
            sku VARCHAR(100) NULL,
            batch_no VARCHAR(100) NULL,
            batch_id INT NULL,
            warehouse_name VARCHAR(100) DEFAULT 'Main Storage',
            source_location VARCHAR(150) DEFAULT 'Main Storage',
            scrap_location VARCHAR(150) DEFAULT 'Scrap / Inventory Loss Location',
            available_stock DECIMAL(12,3) DEFAULT 0.000,
            destroy_quantity DECIMAL(12,3) NOT NULL,
            unit VARCHAR(50) DEFAULT 'Pcs',
            unit_cost DECIMAL(12,2) DEFAULT 0.00,
            purchase_price DECIMAL(12,2) DEFAULT 0.00,
            selling_price DECIMAL(12,2) DEFAULT 0.00,
            destroy_value DECIMAL(12,2) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            remarks TEXT NULL,
            evidence_image LONGTEXT NULL,
            destroyed_by_id INT NULL,
            destroyed_by_name VARCHAR(255) NULL,
            status ENUM('Draft', 'Confirmed', 'Cancelled') DEFAULT 'Confirmed',
            cancel_reason TEXT NULL,
            cancelled_by_name VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_destroy_no (destroy_no),
            INDEX idx_product_id (product_id),
            INDEX idx_batch_id (batch_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Add columns if missing for existing databases
        const [columns] = await pool.query(`SHOW COLUMNS FROM stock_destroys`);
        const existingColNames = columns.map(c => c.Field);

        if (!existingColNames.includes('batch_id')) {
          await pool.query(`ALTER TABLE stock_destroys ADD COLUMN batch_id INT NULL AFTER batch_no`);
          console.log(`   - Added batch_id column.`);
        }
        if (!existingColNames.includes('source_location')) {
          await pool.query(`ALTER TABLE stock_destroys ADD COLUMN source_location VARCHAR(150) DEFAULT 'Main Storage' AFTER warehouse_name`);
          console.log(`   - Added source_location column.`);
        }
        if (!existingColNames.includes('scrap_location')) {
          await pool.query(`ALTER TABLE stock_destroys ADD COLUMN scrap_location VARCHAR(150) DEFAULT 'Scrap / Inventory Loss Location' AFTER source_location`);
          console.log(`   - Added scrap_location column.`);
        }
        if (!existingColNames.includes('unit_cost')) {
          await pool.query(`ALTER TABLE stock_destroys ADD COLUMN unit_cost DECIMAL(12,2) DEFAULT 0.00 AFTER unit`);
          console.log(`   - Added unit_cost column.`);
        }

        // Check status ENUM values
        const statusCol = columns.find(c => c.Field === 'status');
        if (statusCol && !statusCol.Type.includes("'Draft'")) {
          await pool.query(`ALTER TABLE stock_destroys MODIFY COLUMN status ENUM('Draft', 'Confirmed', 'Cancelled') DEFAULT 'Confirmed'`);
          console.log(`   - Updated status ENUM to include 'Draft'.`);
        }

        console.log(`✓ stock_destroys table patched in "${dbName}".`);
      } catch (err) {
        console.warn(`Failed to patch database "${dbName}":`, err.message);
      }
    }

    console.log('Stock Destroys Odoo migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  patchStockDestroysOdoo().then(() => process.exit(0));
}
