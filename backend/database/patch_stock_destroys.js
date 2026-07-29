import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { masterPool, getTenantPool } from '../config/tenantDb.js';

dotenv.config();

async function patchStockDestroys() {
  console.log('Starting Stock Destroys database migration...');
  
  try {
    // 1. Get all active databases (master + tenants)
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    const dbNames = ['kirana_erp', ...tenants.map(t => t.database_name)];
    
    // Remove duplicates
    const uniqueDbs = [...new Set(dbNames)];
    
    for (const dbName of uniqueDbs) {
      try {
        console.log(`Patching stock_destroys table in database "${dbName}"...`);
        const pool = getTenantPool(dbName);
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS stock_destroys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            destroy_no VARCHAR(50) NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            barcode VARCHAR(100),
            sku VARCHAR(100),
            batch_no VARCHAR(100),
            warehouse_name VARCHAR(100) DEFAULT 'Main Storage',
            available_stock DECIMAL(10,2) DEFAULT 0.00,
            destroy_quantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(50) DEFAULT 'Pcs',
            purchase_price DECIMAL(10,2) DEFAULT 0.00,
            selling_price DECIMAL(10,2) DEFAULT 0.00,
            destroy_value DECIMAL(10,2) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            remarks TEXT,
            evidence_image LONGTEXT,
            destroyed_by_id INT,
            destroyed_by_name VARCHAR(255),
            status ENUM('Confirmed', 'Cancelled') DEFAULT 'Confirmed',
            cancel_reason TEXT,
            cancelled_by_name VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_destroy_no (destroy_no),
            INDEX idx_product_id (product_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log(`✓ stock_destroys table ready in "${dbName}".`);
      } catch (err) {
        console.warn(`Failed to patch database "${dbName}":`, err.message);
      }
    }
    
    console.log('Stock Destroys migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

patchStockDestroys();
