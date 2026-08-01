import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function syncVendorReturnsWithBatches() {
  console.log('🚀 Synchronizing vendor returns with purchase_batches and stock levels across tenant databases...');
  
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
        const [returns] = await tenantConn.query(
          `SELECT product_id, SUM(quantity) as ret_qty FROM purchase_returns WHERE status != 'Cancelled' GROUP BY product_id`
        );

        for (const r of returns) {
          const retQty = Number(r.ret_qty || 0);
          if (retQty > 0) {
            await tenantConn.query(
              `UPDATE purchase_batches SET remaining_quantity = GREATEST(0, purchase_quantity - ?) WHERE product_id = ?`,
              [retQty, r.product_id]
            );
            await tenantConn.query(
              `UPDATE stock SET quantity = GREATEST(0, (SELECT SUM(remaining_quantity) FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0)) WHERE product_id = ?`,
              [r.product_id, r.product_id]
            );
          }
        }

        // Verification
        const [purchSum] = await tenantConn.query(`SELECT COALESCE(SUM(subtotal), 0) as subtotal, COALESCE(SUM(total), 0) as total FROM purchases`);
        const [retSum] = await tenantConn.query(`SELECT COALESCE(SUM(total_amount), 0) as ret FROM purchase_returns WHERE status != 'Cancelled'`);
        const [batchVal] = await tenantConn.query(`SELECT COALESCE(SUM(remaining_quantity * purchase_price), 0) as val FROM purchase_batches WHERE remaining_quantity > 0`);
        const [stockVal] = await tenantConn.query(`SELECT COALESCE(SUM(s.quantity * p.purchase_price), 0) as val FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity > 0`);

        // Get items net subtotal
        const [itemSub] = await tenantConn.query(`SELECT COALESCE(SUM(pi.quantity * pi.purchase_price), 0) as net_subtotal FROM purchase_items pi JOIN purchases p ON pi.purchase_id = p.id`);

        const netPurch = Number(itemSub[0]?.net_subtotal || purchSum[0]?.subtotal || 0) - Number(retSum[0]?.ret || 0);
        const invVal = Number(batchVal[0]?.val || 0);

        console.log(`  📊 "${dbName}" Recalculated & Synchronized Summary:`);
        console.log(`     - Purchases Net (Excl. Tax): ₹${netPurch.toFixed(2)}`);
        console.log(`     - Inventory Valuation (Excl. Tax): ₹${invVal.toFixed(2)}`);
        console.log(`     - Difference: ₹${(netPurch - invVal).toFixed(2)}`);

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

syncVendorReturnsWithBatches();
