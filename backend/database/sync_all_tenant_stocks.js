import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function syncAllTenantStocks() {
  console.log('🚀 Starting comprehensive stock & batch sync across all tenant databases...');
  
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

    console.log(`Found ${dbNames.length} tenant database(s):`, dbNames);

    for (const dbName of dbNames) {
      console.log(`Synchronizing database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        const [tables] = await tenantConn.query("SHOW TABLES LIKE 'stock'");
        if (tables.length === 0) {
          console.log(`  ℹ️ Table 'stock' missing in "${dbName}". Skipping.`);
          await tenantConn.end();
          continue;
        }

        const [products] = await tenantConn.query('SELECT id, expiry_date, purchase_price, selling_price, mrp FROM products');
        let syncedProductsCount = 0;

        for (const prod of products) {
          const pId = prod.id;

          // 1. Calculate sum of purchase_batches remaining quantity
          const [batchRes] = await tenantConn.query(
            'SELECT COALESCE(SUM(remaining_quantity), 0) as total FROM purchase_batches WHERE product_id = ?',
            [pId]
          );
          const batchTotal = Number(batchRes[0]?.total || 0);

          // 2. Calculate sum of stock table quantity
          const [stockRes] = await tenantConn.query(
            'SELECT COALESCE(SUM(quantity), 0) as total FROM stock WHERE product_id = ?',
            [pId]
          );
          const stockTotal = Number(stockRes[0]?.total || 0);

          if (batchTotal > 0 && stockTotal !== batchTotal) {
            // Update stock table to match batch total
            const [stockRows] = await tenantConn.query(
              'SELECT id FROM stock WHERE product_id = ? AND warehouse_id = 1 LIMIT 1',
              [pId]
            );

            if (stockRows.length > 0) {
              await tenantConn.query('UPDATE stock SET quantity = ? WHERE id = ?', [batchTotal, stockRows[0].id]);
            } else {
              await tenantConn.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?)', [pId, batchTotal]);
            }
            syncedProductsCount++;
          } else if (stockTotal > 0 && batchTotal === 0) {
            // Create batch in purchase_batches to match stock table
            await tenantConn.query(
              `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, warehouse_id)
               VALUES (?, 'INIT-SYNC-BATCH', ?, ?, CURRENT_DATE(), ?, ?, ?, ?, 1)`,
              [pId, stockTotal, stockTotal, prod.expiry_date || null, prod.purchase_price || 0, prod.mrp || 0, prod.selling_price || 0]
            );
            syncedProductsCount++;
          }
        }

        console.log(`  ✅ Successfully synced ${syncedProductsCount} product stock level(s) in "${dbName}".`);
      } catch (err) {
        console.error(`  ❌ Error syncing "${dbName}":`, err.message);
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

syncAllTenantStocks();
