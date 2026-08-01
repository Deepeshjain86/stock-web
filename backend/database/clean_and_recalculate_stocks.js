import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function cleanAndRecalculateStocks() {
  console.log('🚀 Starting Database Stock Cleanup & Recalculation across all tenant databases...');
  
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
        // 1. Remove unlinked initial batches that were created from dummy seed data or initial stock defaults
        const [delRes] = await tenantConn.query(`
          DELETE FROM purchase_batches 
          WHERE (purchase_id IS NULL AND grn_id IS NULL)
             OR batch_number LIKE 'INIT%'
             OR batch_number LIKE 'INIT-STOCK%'
             OR batch_number LIKE 'IMPORT-BATCH%'
        `);
        console.log(`  ✅ Removed ${delRes.affectedRows} unlinked/dummy initial batch(es) from "${dbName}".`);

        // 2. Remove unlinked opening stock logs
        try {
          await tenantConn.query(`
            DELETE FROM stock_logs 
            WHERE type = 'Opening Stock' 
               OR reference_no IN ('OPENING_STOCK', 'EXCEL_IMPORT', 'INITIAL_STOCK')
          `);
        } catch (e) {}

        // 3. Reset stock table quantities to 0
        await tenantConn.query(`UPDATE stock SET quantity = 0`);

        // 4. Recalculate stock table quantities based strictly on remaining_quantity of valid purchase_batches
        const [products] = await tenantConn.query(`SELECT id FROM products`);
        for (const p of products) {
          const pId = p.id;
          const [batchSum] = await tenantConn.query(
            `SELECT COALESCE(SUM(remaining_quantity), 0) as total FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0`,
            [pId]
          );
          const validStockQty = Number(batchSum[0]?.total || 0);

          await tenantConn.query(
            `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE quantity = ?`,
            [pId, validStockQty, validStockQty]
          );
        }

        // 5. Verification summary
        const [pCount] = await tenantConn.query(`SELECT COUNT(id) as c FROM purchases`);
        const [pbVal] = await tenantConn.query(`SELECT COALESCE(SUM(remaining_quantity * purchase_price), 0) as val FROM purchase_batches WHERE remaining_quantity > 0`);
        const [stVal] = await tenantConn.query(`SELECT COALESCE(SUM(s.quantity * p.purchase_price), 0) as val FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity > 0`);

        console.log(`  📊 "${dbName}" Recalculated Totals:`);
        console.log(`     - Total Recorded Purchases: ${pCount[0]?.c || 0}`);
        console.log(`     - Valid Purchase Batches Valuation: ₹${Number(pbVal[0]?.val || 0).toFixed(2)}`);
        console.log(`     - Physical Stock Valuation: ₹${Number(stVal[0]?.val || 0).toFixed(2)}`);

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

cleanAndRecalculateStocks();
