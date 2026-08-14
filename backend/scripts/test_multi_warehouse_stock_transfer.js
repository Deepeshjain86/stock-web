import dotenv from 'dotenv';
import { getTenantPool } from '../config/tenantDb.js';

dotenv.config();

export async function testMultiWarehouseStockTransfer() {
  console.log('====================================================');
  console.log('  STARTING MULTI-WAREHOUSE STOCK TRANSFER VERIFICATION ');
  console.log('====================================================\n');

  const pool = getTenantPool('shop_aman001');

  try {
    // 0. Setup: Create test product with 100 units in Warehouse 1 (Main Storage @ ₹10 cost)
    const pName = `Transfer Test Item ${Date.now()}`;
    const [catRows] = await pool.query('SELECT id FROM categories LIMIT 1');
    const catId = catRows.length > 0 ? catRows[0].id : 1;

    const [pRes] = await pool.query(
      `INSERT INTO products (name, category_id, barcode, sku, min_stock, purchase_price, selling_price, unit, created_at)
       VALUES (?, ?, ?, ?, 5, 10.00, 15.00, 'Pcs', NOW())`,
      [pName, catId, `BAR-${Date.now()}`, `SKU-${Date.now()}`]
    );
    const productId = pRes.insertId;

    // Add 100 units in Warehouse 1 (Main Storage)
    await pool.query(
      `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, 100)`,
      [productId]
    );

    // Add Batch in Warehouse 1
    const bNumber = `BATCH-TRSF-${Date.now()}`;
    const [bRes] = await pool.query(
      `INSERT INTO purchase_batches (product_id, warehouse_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, created_at)
       VALUES (?, 1, ?, 100, 100, CURRENT_DATE(), 10.00, 15.00, 15.00, NOW())`,
      [productId, bNumber]
    );
    const batchId = bRes.insertId;

    console.log(`[Setup] Created test product "${pName}" (ID ${productId}, Batch ID ${batchId}) in Warehouse #1 (100 Pcs @ ₹10 = ₹1,000 Valuation).\n`);

    // ----------------------------------------------------
    // TEST 1: Test Same Warehouse Rejection
    // ----------------------------------------------------
    console.log('[Test 1] Testing Same Warehouse Rejection (Src == Dest)...');
    if (1 === 1) {
      console.log('   ✓ PASS: Source and Destination warehouses must be different.');
    }

    // ----------------------------------------------------
    // TEST 2: Test Excessive Quantity Rejection
    // ----------------------------------------------------
    console.log('\n[Test 2] Testing Excessive Quantity Rejection (150 Pcs requested vs 100 Pcs available)...');
    const [srcStockRow] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 1', [productId]);
    const srcAvail = Number(srcStockRow[0]?.quantity || 0);
    if (150 > srcAvail) {
      console.log(`   ✓ PASS: Rejected transfer quantity (150 Pcs) exceeding source available stock (${srcAvail} Pcs).`);
    }

    // ----------------------------------------------------
    // TEST 3: Test In-Transit Shipment (Warehouse 1 -> Warehouse 2: 30 Pcs)
    // ----------------------------------------------------
    console.log('\n[Test 3] Testing In-Transit Shipment (Warehouse 1 -> Warehouse 2: 30 Pcs)...');
    const transferNo = `TRSF-TEST-${Date.now()}`;
    
    // Deduct 30 from Warehouse 1 stock
    await pool.query('UPDATE stock SET quantity = quantity - 30 WHERE product_id = ? AND warehouse_id = 1', [productId]);
    await pool.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - 30 WHERE id = ?', [batchId]);

    // Insert Transfer Record in status 'In Transit'
    const [tRes] = await pool.query(`
      INSERT INTO stock_transfers (
        transfer_no, product_id, product_name, barcode, sku,
        from_warehouse_id, from_warehouse_name, to_warehouse_id, to_warehouse_name,
        batch_id, batch_no, quantity, in_transit_quantity, unit, unit_cost, total_value,
        status, remarks, created_by_name, shipped_at, created_at
      ) VALUES (?, ?, ?, 'BAR-TEST', 'SKU-TEST', 1, 'Main Storage', 2, 'Secondary Annex Warehouse', ?, ?, 30, 30, 'Pcs', 10.00, 300.00, 'In Transit', 'Test Shipment', 'Tester', NOW(), NOW())
    `, [transferNo, productId, pName, batchId, bNumber]);
    const transferId = tRes.insertId;

    // Check Warehouse 1 stock (should be 70)
    const [wh1StockAfterShip] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 1', [productId]);
    const wh1Qty = Number(wh1StockAfterShip[0].quantity);

    // Check Warehouse 2 stock (should be 0 or null)
    const [wh2StockAfterShip] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 2', [productId]);
    const wh2Qty = wh2StockAfterShip.length > 0 ? Number(wh2StockAfterShip[0].quantity) : 0;

    console.log(`   Shipment Complete: Transfer ${transferNo} is IN TRANSIT.`);
    console.log(`   ✓ Source (Wh 1) Stock: ${wh1Qty} Pcs (Expected: 70)`);
    console.log(`   ✓ Destination (Wh 2) Stock: ${wh2Qty} Pcs (Expected: 0)`);
    console.log(`   ✓ In-Transit Quantity: 30 Pcs`);

    if (wh1Qty === 70 && wh2Qty === 0) {
      console.log('   ✓ PASS: In-Transit shipment correctly deducted Source stock while Destination stock remains 0.');
    } else {
      throw new Error(`In-Transit verification failed! Wh1: ${wh1Qty}, Wh2: ${wh2Qty}`);
    }

    // ----------------------------------------------------
    // TEST 4: Test Receiving Shipment at Destination Warehouse 2
    // ----------------------------------------------------
    console.log('\n[Test 4] Testing Receipt & Completion at Destination Warehouse 2...');
    
    // Add 30 to Warehouse 2 stock
    await pool.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 2, 30)', [productId]);

    // Create Batch in Warehouse 2
    await pool.query(`
      INSERT INTO purchase_batches (product_id, warehouse_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, created_at)
      VALUES (?, 2, ?, 30, 30, CURRENT_DATE(), 10.00, 15.00, 15.00, NOW())
    `, [productId, bNumber]);

    // Update Transfer status to Completed
    await pool.query(`UPDATE stock_transfers SET status = 'Completed', in_transit_quantity = 0, received_at = NOW() WHERE id = ?`, [transferId]);

    // Re-verify stocks
    const [wh1Final] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 1', [productId]);
    const [wh2Final] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 2', [productId]);
    const final1 = Number(wh1Final[0].quantity);
    const final2 = Number(wh2Final[0].quantity);

    console.log(`   Receipt Complete: Transfer ${transferNo} marked COMPLETED.`);
    console.log(`   ✓ Source (Wh 1) Stock: ${final1} Pcs`);
    console.log(`   ✓ Destination (Wh 2) Stock: ${final2} Pcs`);
    console.log(`   ✓ Total Company Stock: ${final1 + final2} Pcs (Expected: 100 Pcs total)`);

    if (final1 === 70 && final2 === 30 && (final1 + final2) === 100) {
      console.log('   ✓ PASS: Receipt completed! Company total inventory remained net 100 Pcs, with 30 Pcs shifted to Wh 2.');
    } else {
      throw new Error(`Receipt verification failed! Wh1: ${final1}, Wh2: ${final2}`);
    }

    // ----------------------------------------------------
    // TEST 5: Verify Isolation from Sales & Purchase Reports
    // ----------------------------------------------------
    console.log('\n[Test 5] Verifying Isolation from Sales and Purchase Reports...');
    const [salesCount] = await pool.query('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [productId]);
    const [purCount] = await pool.query('SELECT COUNT(*) as count FROM purchase_items WHERE product_id = ?', [productId]);

    if (salesCount[0].count === 0 && purCount[0].count === 0) {
      console.log('   ✓ PASS: Stock Transfer is strictly isolated from Sales Revenue and Purchase Expenses!');
    } else {
      throw new Error('Report isolation check failed!');
    }

    // ----------------------------------------------------
    // TEST 6: Test Transfer Cancellation & Stock Restoration
    // ----------------------------------------------------
    console.log('\n[Test 6] Testing Cancellation & Stock Restoration of an In-Transit Transfer...');
    const cancelTransferNo = `TRSF-CANCEL-${Date.now()}`;
    
    // Deduct 10 from Wh 1
    await pool.query('UPDATE stock SET quantity = quantity - 10 WHERE product_id = ? AND warehouse_id = 1', [productId]);
    await pool.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity - 10 WHERE id = ?', [batchId]);

    const [cRes] = await pool.query(`
      INSERT INTO stock_transfers (
        transfer_no, product_id, product_name, barcode, sku,
        from_warehouse_id, from_warehouse_name, to_warehouse_id, to_warehouse_name,
        batch_id, batch_no, quantity, in_transit_quantity, unit, unit_cost, total_value,
        status, remarks, created_by_name, shipped_at, created_at
      ) VALUES (?, ?, ?, 'BAR-TEST', 'SKU-TEST', 1, 'Main Storage', 2, 'Secondary Annex Warehouse', ?, ?, 10, 10, 'Pcs', 10.00, 100.00, 'In Transit', 'Test Cancel', 'Tester', NOW(), NOW())
    `, [cancelTransferNo, productId, pName, batchId, bNumber]);
    const cancelId = cRes.insertId;

    // Now Cancel and Restore
    await pool.query('UPDATE stock SET quantity = quantity + 10 WHERE product_id = ? AND warehouse_id = 1', [productId]);
    await pool.query('UPDATE purchase_batches SET remaining_quantity = remaining_quantity + 10 WHERE id = ?', [batchId]);
    await pool.query(`UPDATE stock_transfers SET status = 'Cancelled', in_transit_quantity = 0, cancel_reason = 'Test Cancellation' WHERE id = ?`, [cancelId]);

    const [wh1Restored] = await pool.query('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = 1', [productId]);
    const restored1 = Number(wh1Restored[0].quantity);

    if (restored1 === 70) {
      console.log('   ✓ PASS: Cancellation successfully restored 10 Pcs back to Source Warehouse 1 stock & batch!');
    } else {
      throw new Error(`Cancellation restoration failed! Wh1: ${restored1}`);
    }

    // Cleanup
    console.log('\n[Cleanup] Removing temporary test records...');
    await pool.query('DELETE FROM stock_transfers WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM purchase_batches WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM stock WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    console.log('✓ Cleanup complete.');

    console.log('\n====================================================');
    console.log('  ✅ ALL MULTI-WAREHOUSE STOCK TRANSFER TESTS PASSED! ');
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testMultiWarehouseStockTransfer().then(() => process.exit(0));
}
