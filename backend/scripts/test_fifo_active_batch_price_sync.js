import mysql from 'mysql2/promise';
import { syncProductFifoState } from '../utils/fifoQueueHelper.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_aman001'
};

async function testFifoActiveBatchPriceSync() {
  console.log('================================================================');
  console.log('   FIFO ACTIVE BATCH QUEUE PURCHASE PRICE SYNC TEST             ');
  console.log('================================================================\n');

  const db = await mysql.createConnection(dbConfig);
  let passed = 0;
  let failed = 0;

  function assert(cond, name, info = '') {
    if (cond) {
      console.log(`✅ [PASS] ${name} ${info ? '-> ' + info : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${info ? '-> ' + info : ''}`);
      failed++;
    }
  }

  try {
    // Create dedicated clean test product
    const [createProd] = await db.query(
      `INSERT INTO products (name, barcode, sku, category_id, unit, purchase_price, selling_price, mrp)
       VALUES ('TEST FIFO QUEUE PROD', 'BAR-FIFO-TEST-001', 'SKU-FIFO-001', 1, 'Pcs', 8.00, 12.00, 15.00)`
    );
    const productId = createProd.insertId;

    // Set stock to 20 units
    await db.query('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, 1, 20)', [productId]);

    // 1. Create Batch A (10 Pcs @ ₹8.00)
    console.log('--- Step 1: Receiving Batch A (10 units @ ₹8.00) ---');
    await db.query(
      `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, warehouse_id)
       VALUES (?, 'TEST-FIFO-BATCH-A', 10, 10, DATE_SUB(NOW(), INTERVAL 2 DAY), 8.00, 15.00, 12.00, 1)`,
      [productId]
    );

    // Sync FIFO queue state
    await syncProductFifoState(db, productId);
    const [[prodAfterA]] = await db.query('SELECT purchase_price FROM products WHERE id = ?', [productId]);
    assert(Number(prodAfterA.purchase_price) === 8.00, 'Step 1: Product Master Purchase Price is ₹8.00 while Batch A is active', `Product Price = ₹${prodAfterA.purchase_price}`);

    // 2. Create Batch B (10 Pcs @ ₹12.00)
    console.log('\n--- Step 2: Receiving Batch B (10 units @ ₹12.00) ---');
    await db.query(
      `INSERT INTO purchase_batches (product_id, batch_number, purchase_quantity, remaining_quantity, purchase_date, purchase_price, mrp, selling_price, warehouse_id)
       VALUES (?, 'TEST-FIFO-BATCH-B', 10, 10, DATE_SUB(NOW(), INTERVAL 1 DAY), 12.00, 18.00, 15.00, 1)`,
      [productId]
    );

    // Sync FIFO queue state (Batch A is still front of queue with 10 units remaining)
    await syncProductFifoState(db, productId);
    const [[prodAfterB]] = await db.query('SELECT purchase_price FROM products WHERE id = ?', [productId]);
    assert(Number(prodAfterB.purchase_price) === 8.00, 'Step 2: Product Master Purchase Price stays ₹8.00 while Batch A has stock', `Product Price = ₹${prodAfterB.purchase_price}`);

    // 3. Sell out Batch A completely (10 units sold: stock decreases 20 -> 10, Batch A remaining_quantity = 0)
    console.log('\n--- Step 3: Selling out Batch A completely (10 units sold, Batch A remaining = 0, Stock = 10) ---');
    await db.query('UPDATE stock SET quantity = 10 WHERE product_id = ?', [productId]);
    await db.query('UPDATE purchase_batches SET remaining_quantity = 0 WHERE batch_number = "TEST-FIFO-BATCH-A"');

    // Sync FIFO queue state (Batch B is now front node!)
    await syncProductFifoState(db, productId);
    const [[prodAfterASold]] = await db.query('SELECT purchase_price FROM products WHERE id = ?', [productId]);
    assert(Number(prodAfterASold.purchase_price) === 12.00, 'Step 3: Product Master Purchase Price automatically updates to ₹12.00 for Batch B!', `Product Price = ₹${prodAfterASold.purchase_price}`);

    // Cleanup test records
    await db.query('DELETE FROM purchase_batches WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM stock WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM products WHERE id = ?', [productId]);

    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED                 `);
    console.log('================================================================\n');

  } catch (err) {
    console.error('FIFO Queue Test Error:', err);
  } finally {
    await db.end();
  }
}

testFifoActiveBatchPriceSync();
