import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function restoreAgarbattiStock() {
  console.log('🚀 Restoring Agarbatti stock and canceling test purchase returns...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const dbName = 'shop_ayyan001';
    console.log(`Processing database: "${dbName}"...`);
    const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

    try {
      // 1. Delete/Cancel test purchase returns for Agarbatti (product_id = 27)
      await tenantConn.query(`DELETE FROM purchase_returns WHERE product_id = 27`);
      await tenantConn.query(`DELETE FROM stock_logs WHERE product_id = 27 AND type = 'Stock Out' AND reference_no LIKE 'PRN-%'`);

      // 2. Set remaining batch quantity to 15 (20 purchased - 5 sold)
      await tenantConn.query(`UPDATE purchase_batches SET remaining_quantity = 15 WHERE product_id = 27`);

      // 3. Set stock quantity to 15
      await tenantConn.query(`UPDATE stock SET quantity = 15 WHERE product_id = 27`);

      // 4. Verify stock and batch quantity
      const [st] = await tenantConn.query(`SELECT quantity FROM stock WHERE product_id = 27`);
      const [pb] = await tenantConn.query(`SELECT remaining_quantity FROM purchase_batches WHERE product_id = 27`);

      console.log(`  ✅ Restored Agarbatti (product_id 27) Stock Quantity: ${st[0]?.quantity}`);
      console.log(`  ✅ Restored Agarbatti (product_id 27) Batch Quantity: ${pb[0]?.remaining_quantity}`);

    } catch (err) {
      console.error(`  ❌ Error processing "${dbName}":`, err.message);
    } finally {
      await tenantConn.end();
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

restoreAgarbattiStock();
