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

async function resetAbhiMartData() {
  console.log('====================================================');
  console.log('   RESETTING ABHI MART (shop_abhishek001) TO 0      ');
  console.log('====================================================\n');

  const targetDatabases = ['shop_abhishek001', 'shop_abhishek002'];

  for (const dbName of targetDatabases) {
    let connection;
    try {
      connection = await mysql.createConnection({ ...dbConfig, database: dbName });
      console.log(`[INFO] Connected to tenant database: ${dbName}`);

      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      // 1. Fetch existing tables and truncate
      const [existingTablesRows] = await connection.query('SHOW TABLES');
      const tableKey = Object.keys(existingTablesRows[0] || {})[0];
      const existingTables = existingTablesRows.map(r => r[tableKey]);

      const targetTables = [
        'purchases',
        'purchase_items',
        'purchase_orders',
        'purchase_order_items',
        'grns',
        'grn_items',
        'purchase_batches',
        'purchase_returns',
        'purchase_return_items',
        'sales',
        'sale_items',
        'sales_returns',
        'sales_return_items',
        'supplier_payments',
        'vendor_ledger',
        'customer_payments',
        'customer_borrow_ledger',
        'borrow_records',
        'borrow_transactions',
        'stock_adjustments',
        'stock_logs',
        'stock_transfers',
        'stock_transfer_items',
        'stock_destructions',
        'stock_destruction_items',
        'activity_logs',
        'notifications'
      ];

      for (const tbl of targetTables) {
        if (existingTables.includes(tbl)) {
          await connection.query(`TRUNCATE TABLE ${tbl}`);
          console.log(`  ✓ Truncated table: ${tbl}`);
        }
      }

      // 2. Reset physical stock in stock table to 0 & product prices to 0
      await connection.query('UPDATE stock SET quantity = 0');
      await connection.query('UPDATE products SET purchase_price = 0.00, selling_price = 0.00, mrp = 0.00');
      console.log('  ✓ Reset all product stock quantities & master prices to 0 in `stock` & `products` table');

      // 3. Reset Vendor balances to 0
      await connection.query(
        'UPDATE vendors SET total_purchases = 0.00, total_paid = 0.00, outstanding_balance = 0.00'
      );
      console.log('  ✓ Reset all Vendor financial totals to 0 in `vendors` table');

      // 4. Reset Customer balances to 0
      await connection.query(
        'UPDATE customers SET outstanding_balance = 0.00, advance_balance = 0.00'
      );
      console.log('  ✓ Reset all Customer financial balances to 0 in `customers` table');

      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log(`[SUCCESS] Database ${dbName} reset to initial 0 state successfully!\n`);

    } catch (err) {
      console.error(`[ERROR] Failed resetting ${dbName}:`, err);
    } finally {
      if (connection) await connection.end();
    }
  }

  console.log('====================================================');
  console.log('   ABHI MART RESET COMPLETED (ALL DATA AT ZERO)     ');
  console.log('====================================================');
}

resetAbhiMartData();
