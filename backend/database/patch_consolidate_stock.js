import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { masterPool, getTenantPool } from '../config/tenantDb.js';

dotenv.config();

async function patchConsolidateStock() {
  console.log('====================================================');
  console.log('Starting Inventory Stock Consolidation Migration...');
  console.log('====================================================');

  try {
    // 1. Fetch all tenant databases
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    const dbNames = ['kirana_erp', ...tenants.map(t => t.database_name)];
    const uniqueDbs = [...new Set(dbNames)];

    for (const dbName of uniqueDbs) {
      console.log(`\nProcessing database: "${dbName}"...`);
      try {
        const pool = getTenantPool(dbName);

        // Fetch all stock records
        const [rows] = await pool.query(
          `SELECT id, product_id, warehouse_id, quantity FROM stock ORDER BY product_id ASC, warehouse_id ASC, id ASC`
        );

        // Group rows by product_id + warehouse_id
        const groups = {};
        for (const row of rows) {
          const key = `${row.product_id}_${row.warehouse_id || 1}`;
          if (!groups[key]) {
            groups[key] = {
              productId: row.product_id,
              warehouseId: row.warehouse_id || 1,
              primaryId: row.id,
              totalQuantity: 0,
              duplicateIds: []
            };
          }
          groups[key].totalQuantity += Number(row.quantity || 0);
          if (row.id !== groups[key].primaryId) {
            groups[key].duplicateIds.push(row.id);
          }
        }

        let mergedCount = 0;
        let deletedRowsCount = 0;

        for (const key of Object.keys(groups)) {
          const g = groups[key];
          
          // Update primary row with consolidated total quantity
          await pool.query(
            `UPDATE stock SET quantity = ? WHERE id = ?`,
            [g.totalQuantity, g.primaryId]
          );

          // Delete duplicate rows if any existed
          if (g.duplicateIds.length > 0) {
            await pool.query(
              `DELETE FROM stock WHERE id IN (?)`,
              [g.duplicateIds]
            );
            mergedCount++;
            deletedRowsCount += g.duplicateIds.length;
          }
        }

        console.log(`✓ Database "${dbName}": Consolidated ${mergedCount} products, removed ${deletedRowsCount} duplicate stock rows.`);

        // Add UNIQUE constraint on (product_id, warehouse_id) if not present
        try {
          // Check if index already exists
          const [indexes] = await pool.query(
            `SHOW INDEX FROM stock WHERE Key_name = 'idx_unique_product_warehouse'`
          );

          if (indexes.length === 0) {
            await pool.query(
              `ALTER TABLE stock ADD UNIQUE INDEX idx_unique_product_warehouse (product_id, warehouse_id)`
            );
            console.log(`✓ Database "${dbName}": Added UNIQUE INDEX idx_unique_product_warehouse (product_id, warehouse_id).`);
          } else {
            console.log(`✓ Database "${dbName}": UNIQUE INDEX idx_unique_product_warehouse already active.`);
          }
        } catch (idxErr) {
          console.warn(`Note on index creation for "${dbName}":`, idxErr.message);
        }

      } catch (dbErr) {
        console.error(`Error processing database "${dbName}":`, dbErr.message);
      }
    }

    console.log('\n====================================================');
    console.log('Stock Consolidation & UNIQUE Constraint Patch Completed!');
    console.log('====================================================');
    process.exit(0);

  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

patchConsolidateStock();
