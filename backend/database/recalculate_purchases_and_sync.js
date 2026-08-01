import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function recalculatePurchasesAndSync() {
  console.log('🚀 Starting Purchases Recalculation & Duplicate Invoice Cleanup across tenant databases...');
  
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
      console.log(`Auditing Purchases in database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        // 1. Remove duplicate purchase invoices (same vendor, date, items, subtotal, total)
        const [purchases] = await tenantConn.query(`SELECT * FROM purchases ORDER BY id ASC`);
        const seen = new Set();
        const duplicateIds = [];

        for (const p of purchases) {
          const key = `${p.vendor_id}_${p.date}_${p.subtotal}_${p.total}`;
          if (seen.has(key)) {
            duplicateIds.push(p.id);
          } else {
            seen.add(key);
          }
        }

        if (duplicateIds.length > 0) {
          console.log(`  ⚠️ Found ${duplicateIds.length} duplicate purchase invoice(s) in "${dbName}": IDs [${duplicateIds.join(', ')}]`);
          for (const dupId of duplicateIds) {
            await tenantConn.query(`DELETE FROM purchase_items WHERE purchase_id = ?`, [dupId]);
            await tenantConn.query(`DELETE FROM purchase_batches WHERE purchase_id = ?`, [dupId]);
            await tenantConn.query(`DELETE FROM purchases WHERE id = ?`, [dupId]);
          }
          console.log(`  ✅ Successfully purged duplicate purchase invoice(s).`);
        } else {
          console.log(`  ✅ Zero duplicate purchase invoices in "${dbName}".`);
        }

        // 2. Recalculate subtotal & total for all remaining purchases from purchase_items
        const [validPurchases] = await tenantConn.query(`SELECT id FROM purchases`);
        for (const vp of validPurchases) {
          const [itemSum] = await tenantConn.query(`SELECT COALESCE(SUM(total), 0) as item_total FROM purchase_items WHERE purchase_id = ?`, [vp.id]);
          const itemTotal = Number(itemSum[0]?.item_total || 0);

          if (itemTotal > 0) {
            await tenantConn.query(`UPDATE purchases SET subtotal = ?, total = ? WHERE id = ?`, [itemTotal, itemTotal, vp.id]);
          }
        }

        // 3. Recalculate tenant totals
        const [purchSum] = await tenantConn.query(`SELECT COALESCE(SUM(subtotal), 0) as subtotal, COALESCE(SUM(total), 0) as total FROM purchases`);
        const [retSum] = await tenantConn.query(`SELECT COALESCE(SUM(total_amount), 0) as ret FROM purchase_returns WHERE status != 'Cancelled'`);
        const [stockVal] = await tenantConn.query(`SELECT COALESCE(SUM(remaining_quantity * purchase_price), 0) as val FROM purchase_batches WHERE remaining_quantity > 0`);

        const netPurch = Math.max(0, Number(purchSum[0]?.subtotal || 0) - Number(retSum[0]?.ret || 0));

        console.log(`  📊 Recalculated Summary for "${dbName}":`);
        console.log(`     - Gross Purchases: ₹${Number(purchSum[0]?.subtotal || 0).toFixed(2)}`);
        console.log(`     - Vendor Returns: ₹${Number(retSum[0]?.ret || 0).toFixed(2)}`);
        console.log(`     - Net Purchases: ₹${netPurch.toFixed(2)}`);
        console.log(`     - Active Inventory Valuation: ₹${Number(stockVal[0]?.val || 0).toFixed(2)}`);

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

recalculatePurchasesAndSync();
