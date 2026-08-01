import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function deduplicateStockTable() {
  console.log('🚀 Deduplicating stock table and setting UNIQUE (product_id, warehouse_id) constraint across tenant databases...');
  
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
        // 1. Get all products
        const [products] = await tenantConn.query('SELECT id FROM products');

        for (const p of products) {
          // Get correct batch quantity
          const [batchRow] = await tenantConn.query(
            'SELECT COALESCE(SUM(remaining_quantity), 0) as batch_qty FROM purchase_batches WHERE product_id = ? AND remaining_quantity > 0',
            [p.id]
          );
          const correctQty = Number(batchRow[0]?.batch_qty || 0);

          // Get all stock rows for this product
          const [stockRows] = await tenantConn.query('SELECT id FROM stock WHERE product_id = ? ORDER BY id ASC', [p.id]);

          if (stockRows.length > 1) {
            // Keep first stock row, delete all duplicate rows
            const firstId = stockRows[0].id;
            const duplicateIds = stockRows.slice(1).map(r => r.id);
            await tenantConn.query('DELETE FROM stock WHERE id IN (?)', [duplicateIds]);
            await tenantConn.query('UPDATE stock SET quantity = ? WHERE id = ?', [correctQty, firstId]);
          } else if (stockRows.length === 1) {
            await tenantConn.query('UPDATE stock SET quantity = ? WHERE id = ?', [correctQty, stockRows[0].id]);
          } else {
            // Insert missing stock row if needed
            await tenantConn.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, ?)', [p.id, correctQty]);
          }
        }

        // 2. Add Unique constraint if not exists
        try {
          await tenantConn.query('ALTER TABLE stock ADD UNIQUE KEY unique_product_warehouse (product_id, warehouse_id)');
          console.log(`  ✅ Added UNIQUE KEY (product_id, warehouse_id) to stock table in "${dbName}"`);
        } catch (e) {
          // Key already exists or ignored
        }

        // Verification
        const [totalStock] = await tenantConn.query('SELECT SUM(quantity) as qty_sum, COUNT(*) as row_count FROM stock');
        const [totalBatch] = await tenantConn.query('SELECT SUM(remaining_quantity) as qty_sum FROM purchase_batches WHERE remaining_quantity > 0');

        console.log(`  📊 "${dbName}" Stock Table Deduplication Complete:`);
        console.log(`     - Total Stock Rows: ${totalStock[0]?.row_count}`);
        console.log(`     - Total Stock Quantity: ${totalStock[0]?.qty_sum}`);
        console.log(`     - Total Batch Quantity: ${totalBatch[0]?.qty_sum}`);

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

deduplicateStockTable();
