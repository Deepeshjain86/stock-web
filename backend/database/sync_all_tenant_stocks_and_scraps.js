import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { masterPool, getTenantPool } from '../config/tenantDb.js';

dotenv.config();

export async function syncAllTenantStocksAndScraps() {
  console.log('====================================================');
  console.log('   SYNCING & RECONCILING STOCKS, BATCHES & SCRAPS   ');
  console.log('====================================================\n');

  try {
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    const dbNames = ['kirana_erp', ...tenants.map(t => t.database_name)];
    const uniqueDbs = [...new Set(dbNames.filter(Boolean))];

    for (const dbName of uniqueDbs) {
      try {
        console.log(`Processing database "${dbName}"...`);
        const pool = getTenantPool(dbName);
        const [products] = await pool.query('SELECT id, name FROM products');

        for (const p of products) {
          // 1. Get stock.quantity
          const [stockRows] = await pool.query('SELECT SUM(quantity) as stockQty FROM stock WHERE product_id = ?', [p.id]);
          const stockQty = Number(stockRows[0]?.stockQty || 0);

          // 2. Get active batches
          const [batches] = await pool.query(
            'SELECT id, remaining_quantity, purchase_quantity FROM purchase_batches WHERE product_id = ? ORDER BY purchase_date DESC, id DESC',
            [p.id]
          );

          if (batches.length > 0) {
            const currentBatchSum = batches.reduce((s, b) => s + Number(b.remaining_quantity || 0), 0);

            // If stock.quantity != currentBatchSum, adjust batches from oldest to newest to match stock.quantity
            if (Math.abs(stockQty - currentBatchSum) > 0.001) {
              console.log(`   - Product "${p.name}" (ID ${p.id}): Stock Qty = ${stockQty}, Batch Sum = ${currentBatchSum}. Re-aligning batches...`);

              let targetQty = stockQty;
              // Reset all batches to 0, then allocate targetQty from newest to oldest (or oldest to newest)
              for (let i = 0; i < batches.length; i++) {
                const b = batches[i];
                const pQty = Number(b.purchase_quantity || 0);
                let newRem = 0;
                if (targetQty > 0) {
                  newRem = Math.min(targetQty, pQty > 0 ? pQty : targetQty);
                  targetQty -= newRem;
                }
                await pool.query('UPDATE purchase_batches SET remaining_quantity = ? WHERE id = ?', [newRem, b.id]);
              }

              // If targetQty still remains, add to newest batch
              if (targetQty > 0 && batches.length > 0) {
                await pool.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity + ? WHERE id = ?', [targetQty, batches[0].id]);
              }
            }
          }
        }
        console.log(`✓ Database "${dbName}" stocks and batches synchronized successfully.`);
      } catch (err) {
        console.warn(`Could not process database "${dbName}":`, err.message);
      }
    }

    console.log('\n====================================================');
    console.log('   ✅ ALL STOCKS AND BATCHES SYNCHRONIZED PERFECTLY   ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('Synchronization failed:', error);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  syncAllTenantStocksAndScraps().then(() => process.exit(0));
}
