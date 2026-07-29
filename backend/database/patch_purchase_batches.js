import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

async function patchPurchaseBatches() {
  console.log('[Patch] Initializing purchase_batches table migration...');
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDbName });

  try {
    const [tenants] = await masterConn.query('SELECT database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      if (!dbName) continue;

      console.log(`[Patch] Processing tenant DB: "${dbName}"`);
      const conn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        // Create purchase_batches table
        await conn.query(`
          CREATE TABLE IF NOT EXISTS purchase_batches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            batch_number VARCHAR(100) NULL,
            purchase_quantity INT NOT NULL DEFAULT 0,
            remaining_quantity INT NOT NULL DEFAULT 0,
            purchase_date DATE NOT NULL,
            expiry_date DATE NULL,
            purchase_price DECIMAL(10, 2) DEFAULT 0.00,
            supplier_id INT NULL,
            warehouse_id INT NULL DEFAULT 1,
            grn_id INT NULL,
            purchase_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_prod_rem (product_id, remaining_quantity, purchase_date, id)
          );
        `);
        console.log(`  -> Confirmed purchase_batches table in "${dbName}"`);

        // Seed purchase_batches from existing grn_items if purchase_batches is empty
        const [existingBatches] = await conn.query('SELECT COUNT(*) as count FROM purchase_batches');
        if (existingBatches[0].count === 0) {
          console.log(`  -> Seeding purchase_batches from existing grn_items / stock...`);
          
          try {
            const [grnRows] = await conn.query(`
              SELECT gi.product_id, gi.quantity_received, gi.batch_number, gi.expiry_date, g.date as purchase_date, g.vendor_id, g.warehouse_id, g.id as grn_id
              FROM grn_items gi
              JOIN grns g ON gi.grn_id = g.id
              ORDER BY g.date ASC, gi.id ASC
            `);

            for (const grnItem of grnRows) {
              if (grnItem.quantity_received > 0) {
                await conn.query(`
                  INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, supplier_id, warehouse_id, grn_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  grnItem.product_id,
                  grnItem.batch_number || 'BATCH-001',
                  grnItem.quantity_received,
                  grnItem.quantity_received,
                  grnItem.purchase_date || new Date().toISOString().substring(0, 10),
                  grnItem.expiry_date || null,
                  grnItem.vendor_id || null,
                  grnItem.warehouse_id || 1,
                  grnItem.grn_id
                ]);
              }
            }
          } catch (e) {
            console.log(`  -> Skipping grn_items seeding (table missing or empty)`);
          }

          // Also seed for any products with current stock that have no grn_items entry
          const [productsWithoutBatches] = await conn.query(`
            SELECT p.id, p.expiry_date, p.purchase_price, COALESCE(SUM(s.quantity), 0) as current_stock
            FROM products p
            LEFT JOIN stock s ON p.id = s.product_id
            WHERE p.id NOT IN (SELECT DISTINCT product_id FROM purchase_batches)
            GROUP BY p.id
            HAVING current_stock > 0
          `);

          for (const prod of productsWithoutBatches) {
            await conn.query(`
              INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, expiry_date, purchase_price, warehouse_id)
              VALUES (?, 'INIT-BATCH', ?, ?, CURRENT_DATE(), ?, ?, 1)
            `, [
              prod.id,
              prod.current_stock,
              prod.current_stock,
              prod.expiry_date || null,
              prod.purchase_price || 0
            ]);
          }

          console.log(`  -> Completed initial batch seeding for "${dbName}"`);
        }

      } catch (err) {
        console.error(`  -> Failed to patch "${dbName}":`, err.message);
      } finally {
        await conn.end();
      }
    }
  } catch (err) {
    console.error('[Patch] Migration error:', err.message);
  } finally {
    await masterConn.end();
    console.log('[Patch] Migration finished.');
  }
}

patchPurchaseBatches();
