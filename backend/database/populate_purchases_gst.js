import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function populatePurchasesGst() {
  console.log('🚀 Populating Purchases GST Amount across tenant databases...');
  
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
        const [purchases] = await tenantConn.query(`SELECT id FROM purchases`);
        for (const p of purchases) {
          const [gstRow] = await tenantConn.query(`
            SELECT COALESCE(SUM((pi.quantity * pi.purchase_price) * (COALESCE(NULLIF(pi.gst, 0), pr.gst, 0) / 100)), 0) as calculated_gst
            FROM purchase_items pi
            JOIN products pr ON pi.product_id = pr.id
            WHERE pi.purchase_id = ?
          `, [p.id]);

          const calcGst = Number(gstRow[0]?.calculated_gst || 0);
          await tenantConn.query(`UPDATE purchases SET gst_amount = ? WHERE id = ?`, [calcGst, p.id]);
        }

        const [gstSum] = await tenantConn.query(`SELECT COALESCE(SUM(gst_amount), 0) as total_gst FROM purchases`);
        console.log(`  ✅ Updated Purchases GST Amount in "${dbName}": Total GST = ₹${Number(gstSum[0]?.total_gst || 0).toFixed(2)}`);
      } catch (err) {
        console.error(`  ❌ Error in "${dbName}":`, err.message);
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

populatePurchasesGst();
