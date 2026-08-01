import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function repairZeroPriceBatches() {
  console.log('🚀 Repairing zero purchase price batches across tenant databases...');
  
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
      console.log(`Processing "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        // Fix zero purchase price batches with product purchase_price
        const [res] = await tenantConn.query(`
          UPDATE purchase_batches pb
          JOIN products p ON pb.product_id = p.id
          SET pb.purchase_price = p.purchase_price
          WHERE (pb.purchase_price IS NULL OR pb.purchase_price = 0)
            AND p.purchase_price > 0
        `);
        console.log(`  ✅ Updated ${res.affectedRows} zero-price batch record(s) in "${dbName}".`);

        // Also create missing batches for items in stock table that have quantity > 0 but no batches
        const [unbatchedProducts] = await tenantConn.query(`
          SELECT p.id, p.name, s.quantity, p.purchase_price, p.selling_price, p.mrp, p.expiry_date
          FROM products p
          JOIN stock s ON p.id = s.product_id
          WHERE s.quantity > 0
            AND NOT EXISTS (SELECT 1 FROM purchase_batches pb WHERE pb.product_id = p.id AND pb.remaining_quantity > 0)
        `);

        for (const prod of unbatchedProducts) {
          await tenantConn.query(
            `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, warehouse_id)
             VALUES (?, 'INIT-STOCK-BATCH', ?, ?, CURRENT_DATE(), ?, ?, ?, ?, 1)`,
            [prod.id, prod.quantity, prod.quantity, prod.expiry_date || null, prod.purchase_price || 0, prod.mrp || 0, prod.selling_price || 0]
          );
        }
        console.log(`  ✅ Created ${unbatchedProducts.length} missing initial batch(es) for stock products in "${dbName}".`);
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

repairZeroPriceBatches();
