import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function alignBatchesWithPurchaseItems() {
  console.log('🚀 Aligning purchase_batches prices with purchase_items exact invoice prices across tenant databases...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'shop_%'");
    const dbNames = dbs.map(d => Object.values(d)[0]);

    const [kiranaDbs] = await connection.query("SHOW DATABASES LIKE 'kirana_erp'");
    if (kiranaDbs.length > 0) dbNames.push('kirana_erp');

    for (const dbName of dbNames) {
      console.log(`Processing database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        // 1. Update purchase_batches prices to match purchase_items purchase_price for the product
        const [items] = await tenantConn.query(`
          SELECT product_id, purchase_price, MAX(id) as max_id 
          FROM purchase_items 
          GROUP BY product_id, purchase_price
        `);

        for (const item of items) {
          if (Number(item.purchase_price) > 0) {
            // Update purchase_batches
            await tenantConn.query(
              `UPDATE purchase_batches SET purchase_price = ? WHERE product_id = ?`,
              [item.purchase_price, item.product_id]
            );
            // Update products master purchase_price
            await tenantConn.query(
              `UPDATE products SET purchase_price = ? WHERE id = ?`,
              [item.purchase_price, item.product_id]
            );
          }
        }

        // 2. Recalculate stock table valuations
        await tenantConn.query(`
          UPDATE stock s
          JOIN products p ON s.product_id = p.id
          SET s.quantity = (
            SELECT COALESCE(SUM(pb.remaining_quantity), s.quantity) 
            FROM purchase_batches pb 
            WHERE pb.product_id = s.product_id AND pb.remaining_quantity > 0
          )
        `);

        // 3. Verification summary
        const [purchSum] = await tenantConn.query(`SELECT COALESCE(SUM(subtotal), 0) as subtotal, COALESCE(SUM(gst_amount), 0) as gst, COALESCE(SUM(total), 0) as total FROM purchases`);
        const [retSum] = await tenantConn.query(`SELECT COALESCE(SUM(total_amount), 0) as ret FROM purchase_returns WHERE status != 'Cancelled'`);
        const [batchVal] = await tenantConn.query(`SELECT COALESCE(SUM(remaining_quantity * purchase_price), 0) as val FROM purchase_batches WHERE remaining_quantity > 0`);
        const [stockVal] = await tenantConn.query(`SELECT COALESCE(SUM(s.quantity * p.purchase_price), 0) as val FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity > 0`);

        const netPurchExclTax = Number(purchSum[0]?.subtotal || 0) - Number(retSum[0]?.ret || 0);

        console.log(`  📊 "${dbName}" Recalculated & Aligned Totals:`);
        console.log(`     - Purchase Subtotal (Excl Tax): ₹${Number(purchSum[0]?.subtotal || 0).toFixed(2)}`);
        console.log(`     - Purchase GST Tax: ₹${Number(purchSum[0]?.gst || 0).toFixed(2)}`);
        console.log(`     - Vendor Returns: ₹${Number(retSum[0]?.ret || 0).toFixed(2)}`);
        console.log(`     - Net Purchases (Subtotal Excl Tax - Returns): ₹${netPurchExclTax.toFixed(2)}`);
        console.log(`     - Active Purchase Batches Valuation: ₹${Number(batchVal[0]?.val || 0).toFixed(2)}`);
        console.log(`     - Stock Valuation: ₹${Number(stockVal[0]?.val || 0).toFixed(2)}`);

      } catch (err) {
        console.error(`  ❌ Error processing "${dbName}":`, err.message);
      } finally {
        await tenantConn.end();
      }
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

alignBatchesWithPurchaseItems();
