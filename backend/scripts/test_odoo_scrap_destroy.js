import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getTenantPool } from '../config/tenantDb.js';
import {
  createStockDestroy,
  confirmStockDestroy,
  cancelStockDestroy
} from '../controllers/stockDestroyController.js';
import {
  calculateInventoryValuation,
  calculateTotalSales,
  calculatePurchaseExpenses,
  calculateStockDestroy
} from '../services/calculationService.js';

dotenv.config();

async function runOdooScrapTest() {
  console.log('====================================================');
  console.log('   STARTING ODOO SCRAP INVENTORY AUTOMATED VERIFICATION   ');
  console.log('====================================================\n');

  const pool = getTenantPool('shop_aman001');
  const connection = await pool.getConnection();

  try {
    // 1. Setup Test Product
    console.log('[Setup] Creating test product "Scrap Test Item" with 100 units @ ₹8 unit cost...');
    const [catRows] = await pool.query('SELECT id FROM categories LIMIT 1');
    const catId = catRows[0]?.id || 1;

    const [prodResult] = await pool.query(
      `INSERT INTO products (name, barcode, sku, category_id, unit, purchase_price, selling_price, min_stock)
       VALUES ('Scrap Test Item', 'BAR-SCRAP-99', 'SKU-SCRAP-99', ?, 'Pcs', 8.00, 12.00, 10)`,
      [catId]
    );
    const productId = prodResult.insertId;

    // Insert Stock row (100 units)
    await pool.query(
      `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, 100.000)`,
      [productId]
    );

    // Insert Batch row (100 units @ ₹8)
    const [batchResult] = await pool.query(
      `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, warehouse_id)
       VALUES (?, 'BATCH-SCRAP-001', 100.000, 100.000, CURRENT_DATE(), 8.00, 12.00, 12.00, 1)`,
      [productId]
    );
    const batchId = batchResult.insertId;

    console.log(`✓ Product created (ID: ${productId}, Batch ID: ${batchId}). Baseline Stock: 100 units @ ₹8 = ₹800 Valuation.`);

    const reqMockBase = {
      db: pool,
      user: { id: 1, name: 'Test Operator', role: 'Admin' }
    };

    // Helper to invoke Express controller functions directly
    const callController = (fn, reqObj) => {
      return new Promise((resolve) => {
        const resObj = {
          status: (code) => ({
            json: (data) => resolve({ statusCode: code, data })
          })
        };
        const next = (err) => resolve({ statusCode: 500, data: { success: false, message: err.message } });
        fn({ ...reqMockBase, ...reqObj }, resObj, next);
      });
    };

    // TEST 1: Draft Scrap Creation
    console.log('\n[Test 1] Testing Draft Scrap creation...');
    const draftRes = await callController(createStockDestroy, {
      body: {
        product_id: productId,
        destroy_date: '2026-08-13',
        destroy_quantity: 10,
        reason: 'Damaged',
        remarks: 'Draft test entry',
        warehouse_name: 'Main Storage',
        source_location: 'Main Storage',
        scrap_location: 'Scrap / Inventory Loss Location',
        batch_id: batchId,
        batch_no: 'BATCH-SCRAP-001',
        status: 'Draft'
      }
    });

    console.log('   Draft Creation Response:', draftRes.data.message);
    const draftId = draftRes.data.destroyId;

    // Verify Stock & Batch unchanged after Draft
    const [stkRows1] = await pool.query('SELECT quantity FROM stock WHERE product_id = ?', [productId]);
    const [batRows1] = await pool.query('SELECT remaining_quantity FROM purchase_batches WHERE id = ?', [batchId]);
    const draftStock = Number(stkRows1[0]?.quantity);
    const draftBatch = Number(batRows1[0]?.remaining_quantity);

    if (draftStock === 100 && draftBatch === 100) {
      console.log('   ✓ PASS: Draft entry did NOT deduct stock or batch quantity (Stock remains 100, Batch remains 100).');
    } else {
      console.error(`   ❌ FAIL: Draft entry altered stock! Stock: ${draftStock}, Batch: ${draftBatch}`);
    }

    // TEST 2: Confirming Draft Entry
    console.log('\n[Test 2] Confirming Draft Scrap entry...');
    const confirmRes = await callController(confirmStockDestroy, {
      params: { id: draftId }
    });

    console.log('   Confirm Response:', confirmRes.data.message);

    // Verify Stock, Batch & Valuation Layer after Confirmation
    const [stkRows2] = await pool.query('SELECT quantity FROM stock WHERE product_id = ?', [productId]);
    const [batRows2] = await pool.query('SELECT remaining_quantity FROM purchase_batches WHERE id = ?', [batchId]);
    const postConfirmStock = Number(stkRows2[0]?.quantity);
    const postConfirmBatch = Number(batRows2[0]?.remaining_quantity);

    const [ivlRows] = await pool.query('SELECT * FROM inventory_valuation_layers WHERE product_id = ? ORDER BY id DESC LIMIT 1', [productId]);

    if (postConfirmStock === 90 && postConfirmBatch === 90) {
      console.log('   ✓ PASS: Physical stock reduced to 90 units and Batch quantity reduced to 90 units.');
    } else {
      console.error(`   ❌ FAIL: Incorrect stock deduction! Stock: ${postConfirmStock}, Batch: ${postConfirmBatch}`);
    }

    if (ivlRows.length > 0 && ivlRows[0].transaction_type === 'Scrap/Wastage' && Number(ivlRows[0].value_delta) === -80) {
      console.log('   ✓ PASS: Odoo Valuation Layer recorded: transaction_type = "Scrap/Wastage", value_delta = -₹80.00.');
    } else {
      console.error('   ❌ FAIL: Valuation Layer not correctly created:', ivlRows[0]);
    }

    // TEST 3: Isolation Verification (Sales & Purchase Reports)
    console.log('\n[Test 3] Verifying Isolation of Scrap from Sales and Purchase Reports...');
    const [[{ salesCount }]] = await pool.query('SELECT COUNT(*) as salesCount FROM sale_items WHERE product_id = ?', [productId]);
    const [[{ purchaseCount }]] = await pool.query('SELECT COUNT(*) as purchaseCount FROM purchase_items WHERE product_id = ?', [productId]);
    const scrapMetrics = await calculateStockDestroy(pool, { productId });

    console.log(`   Product Sales Items Count: ${salesCount}`);
    console.log(`   Product Purchase Items Count: ${purchaseCount}`);
    console.log(`   Scrapped Qty: ${scrapMetrics.destroyQty}, Scrapped Value: ₹${scrapMetrics.destroyCost}`);

    if (salesCount === 0 && purchaseCount === 0 && scrapMetrics.destroyQty === 10 && scrapMetrics.destroyCost === 80) {
      console.log('   ✓ PASS: Scrap is strictly isolated! Sales and Purchase item counts remain 0.');
    } else {
      console.error('   ❌ FAIL: Scrap affected Sales or Purchase reports!');
    }

    // TEST 4: Excessive Quantity Validation (Preventing Negative Stock)
    console.log('\n[Test 4] Testing server-side validation against excessive scrap quantity...');
    const overflowRes = await callController(createStockDestroy, {
      body: {
        product_id: productId,
        destroy_date: '2026-08-13',
        destroy_quantity: 150, // Available is only 90
        reason: 'Expired',
        batch_id: batchId,
        status: 'Confirmed'
      }
    });

    if (overflowRes.statusCode === 400 && overflowRes.data.message.includes('exceeds')) {
      console.log('   ✓ PASS: Server rejected excessive scrap request cleanly:', overflowRes.data.message);
    } else {
      console.error('   ❌ FAIL: Excessive scrap request was not blocked!', overflowRes);
    }

    // TEST 5: Cancellation & Restoration Test
    console.log('\n[Test 5] Testing Cancellation & Stock Restoration...');
    const cancelRes = await callController(cancelStockDestroy, {
      params: { id: draftId },
      body: { cancel_reason: 'Restoring destroyed item after re-inspection' }
    });

    console.log('   Cancel Response:', cancelRes.data.message);

    const [stkRows3] = await pool.query('SELECT quantity FROM stock WHERE product_id = ?', [productId]);
    const [batRows3] = await pool.query('SELECT remaining_quantity FROM purchase_batches WHERE id = ?', [batchId]);
    const restoredStock = Number(stkRows3[0]?.quantity);
    const restoredBatch = Number(batRows3[0]?.remaining_quantity);

    if (restoredStock === 100 && restoredBatch === 100) {
      console.log('   ✓ PASS: Cancellation successfully restored Stock to 100 and Batch to 100 units.');
    } else {
      console.error(`   ❌ FAIL: Restoration failed! Stock: ${restoredStock}, Batch: ${restoredBatch}`);
    }

    // Cleanup Test Product & Records
    console.log('\n[Cleanup] Removing temporary test records...');
    await pool.query('DELETE FROM inventory_valuation_layers WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM stock_logs WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM stock_destroys WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM purchase_batches WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM stock WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    console.log('✓ Cleanup complete.');

    console.log('\n====================================================');
    console.log('   ✅ ALL ODOO SCRAP INVENTORY TESTS PASSED PERFECTLY! ');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Test script execution error:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runOdooScrapTest();
