import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306
};

async function applyStockAdjustmentsTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server...');

    const [databases] = await connection.query("SHOW DATABASES LIKE 'shop_%'");
    const dbList = databases.map(d => Object.values(d)[0]);
    dbList.push('kirana_erp_master');

    const tableSql = `
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adjustment_no VARCHAR(50) NOT NULL UNIQUE,
        product_id INT NOT NULL,
        warehouse_id INT NOT NULL DEFAULT 1,
        batch_id INT NULL,
        batch_number VARCHAR(100) NULL,
        adjustment_type ENUM('Increase', 'Decrease') NOT NULL,
        quantity DECIMAL(12,3) NOT NULL,
        unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        adjustment_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        reason VARCHAR(100) NOT NULL,
        financial_impact ENUM('Gain', 'Loss', 'None') NOT NULL DEFAULT 'None',
        remarks TEXT NULL,
        user_id INT NULL,
        status ENUM('Completed', 'Reversed') NOT NULL DEFAULT 'Completed',
        reversal_ref_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reversal_ref_id) REFERENCES stock_adjustments(id) ON DELETE SET NULL,
        INDEX idx_adj_no (adjustment_no),
        INDEX idx_adj_product (product_id),
        INDEX idx_adj_status (status)
      );
    `;

    for (const dbName of dbList) {
      try {
        await connection.query(`USE \`${dbName}\``);
        await connection.query(tableSql);
        console.log(`[SUCCESS] Patched stock_adjustments table in database: ${dbName}`);
      } catch (err) {
        console.error(`[ERROR] Failed patching database ${dbName}:`, err.message);
      }
    }

    console.log('\nAll databases successfully patched!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

applyStockAdjustmentsTable();
