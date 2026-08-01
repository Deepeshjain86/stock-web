import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

async function syncStockAndBatches() {
  console.log('[Sync] Starting Stock and Purchase Batches 100% Sync...');
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDbName });

  try {
    const [tenants] = await masterConn.query('SELECT database_name FROM tenants');

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      if (!dbName) continue;

      console.log(`[Sync] Synchronizing tenant DB: "${dbName}"`);
      const conn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        const [products] = await conn.query('SELECT id, expiry_date, purchase_price, selling_price, mrp FROM products');

        for (const prod of products) {
          const pId = prod.id;

          // Get batch total
          const [batchRes] = await conn.query(
            'SELECT COALESCE(SUM(remaining_quantity), 0) as total FROM purchase_batches WHERE product_id = ?',
            [pId]
          );
          const batchTotal = Number(batchRes[0]?.total || 0);

          // Get stock table total
          const [stockRes] = await conn.query(
            'SELECT COALESCE(SUM(quantity), 0) as total FROM stock WHERE product_id = ?',
            [pId]
          );
          const stockTotal = Number(stockRes[0]?.total || 0);

          if (batchTotal > 0) {
            // Update stock table to match batchTotal
            const [existingStockRow] = await conn.query(
              'SELECT id FROM stock WHERE product_id = ? AND warehouse_id = 1 LIMIT 1',
              [pId]
            );

            if (existingStockRow.length > 0) {
              await conn.query('UPDATE stock SET quantity = ? WHERE id = ?', [batchTotal, existingStockRow[0].id]);
            } else {
              await conn.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?)', [pId, batchTotal]);
            }
          } else if (stockTotal > 0) {
            // Create batch in purchase_batches to match stockTotal
            await conn.query(
              `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, mrp, selling_price, warehouse_id)
               VALUES (?, 'INIT-SYNC-BATCH', ?, ?, CURRENT_DATE(), ?, ?, ?, ?, 1)`,
              [pId, stockTotal, stockTotal, prod.expiry_date || null, prod.purchase_price || 0, prod.mrp || 0, prod.selling_price || 0]
            );
          }
        }
        console.log(`  -> Completed sync for "${dbName}"`);

      } catch (err) {
        console.error(`  -> Failed sync for "${dbName}":`, err.message);
      } finally {
        await conn.end();
      }
    }
  } catch (err) {
    console.error('[Sync] Error:', err.message);
  } finally {
    await masterConn.end();
    console.log('[Sync] Finished.');
  }
}

syncStockAndBatches();
