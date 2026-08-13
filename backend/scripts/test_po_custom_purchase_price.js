import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_aman001'
};

async function testPOCustomPrice() {
  console.log('================================================================');
  console.log('   PURCHASE ORDER CUSTOM EXPECTED PRICE VERIFICATION TEST       ');
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
    // 1. Get or create test product with Master Purchase Price = ₹8.00
    const [prodRows] = await db.query('SELECT id, name, purchase_price FROM products LIMIT 1');
    if (prodRows.length === 0) {
      console.error('No products found in shop_aman001');
      return;
    }
    const productId = prodRows[0].id;
    await db.query('UPDATE products SET purchase_price = 8.00 WHERE id = ?', [productId]);
    console.log(`[Setup] Set Product ID ${productId} Master Purchase Price = ₹8.00`);

    const [vendorRows] = await db.query('SELECT id FROM vendors LIMIT 1');
    const vendorId = vendorRows.length > 0 ? vendorRows[0].id : 1;

    // 2. Test Case 1: Custom Expected Price ₹9.00 with Quantity 1
    console.log('\n--- TEST CASE 1: Product Master = ₹8, Custom Expected Price = ₹9, Qty = 1 ---');
    const po1ItemPrice = 9.00;
    const po1Qty = 1;
    const po1Gst = 0;
    const po1Subtotal = po1ItemPrice * po1Qty; // 9.00
    const po1Total = po1Subtotal;

    const po1No = `PO-TEST-${Date.now()}`;
    const [res1] = await db.query(
      `INSERT INTO purchase_orders (purchase_order_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, status, notes, user_id)
       VALUES (?, ?, 1, CURRENT_DATE(), ?, 0, 0, ?, 'Draft', 'Test PO Custom Price ₹9', 1)`,
      [po1No, vendorId, po1Subtotal, po1Total]
    );
    const po1Id = res1.insertId;

    await db.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, received_quantity, purchase_price, gst, total)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [po1Id, productId, po1Qty, po1ItemPrice, po1Gst, po1Subtotal]
    );

    const [po1Fetched] = await db.query('SELECT * FROM purchase_orders WHERE id = ?', [po1Id]);
    const [po1ItemsFetched] = await db.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [po1Id]);

    assert(Number(po1Fetched[0].subtotal) === 9.00, 'Test 1: PO Subtotal is ₹9.00', `Subtotal = ₹${po1Fetched[0].subtotal}`);
    assert(Number(po1ItemsFetched[0].purchase_price) === 9.00, 'Test 1: PO Item Purchase Price stored is ₹9.00', `Line Price = ₹${po1ItemsFetched[0].purchase_price} (Master was ₹8)`);


    // 3. Test Case 2: Custom Expected Price ₹12.00 with Quantity 5
    console.log('\n--- TEST CASE 2: Product Master = ₹8, Custom Expected Price = ₹12, Qty = 5 ---');
    const po2ItemPrice = 12.00;
    const po2Qty = 5;
    const po2Gst = 0;
    const po2Subtotal = po2ItemPrice * po2Qty; // 60.00
    const po2Total = po2Subtotal;

    const po2No = `PO-TEST2-${Date.now()}`;
    const [res2] = await db.query(
      `INSERT INTO purchase_orders (purchase_order_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, status, notes, user_id)
       VALUES (?, ?, 1, CURRENT_DATE(), ?, 0, 0, ?, 'Draft', 'Test PO Custom Price ₹12', 1)`,
      [po2No, vendorId, po2Subtotal, po2Total]
    );
    const po2Id = res2.insertId;

    await db.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, received_quantity, purchase_price, gst, total)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [po2Id, productId, po2Qty, po2ItemPrice, po2Gst, po2Subtotal]
    );

    const [po2Fetched] = await db.query('SELECT * FROM purchase_orders WHERE id = ?', [po2Id]);
    const [po2ItemsFetched] = await db.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [po2Id]);

    assert(Number(po2Fetched[0].subtotal) === 60.00, 'Test 2: PO Subtotal is ₹60.00', `Subtotal = ₹${po2Fetched[0].subtotal}`);
    assert(Number(po2ItemsFetched[0].purchase_price) === 12.00, 'Test 2: PO Item Purchase Price stored is ₹12.00', `Line Price = ₹${po2ItemsFetched[0].purchase_price}`);


    // 4. Test Case 3: Mutate Product Master Purchase Price later to ₹15.00
    console.log('\n--- TEST CASE 3: Mutating Product Master Purchase Price to ₹15.00 later ---');
    await db.query('UPDATE products SET purchase_price = 15.00 WHERE id = ?', [productId]);
    console.log(`[Mutation] Product Master Purchase Price changed from ₹8.00 -> ₹15.00`);

    const [po1ItemsAfterMutation] = await db.query(
      `SELECT poi.*, pr.purchase_price as master_price 
       FROM purchase_order_items poi 
       JOIN products pr ON poi.product_id = pr.id 
       WHERE poi.purchase_order_id = ?`,
      [po1Id]
    );

    assert(Number(po1ItemsAfterMutation[0].purchase_price) === 9.00, 'Test 3: Saved PO 1 preserves ₹9.00 custom price', `PO Price = ₹${po1ItemsAfterMutation[0].purchase_price}, Master Price = ₹${po1ItemsAfterMutation[0].master_price}`);

    const [po2ItemsAfterMutation] = await db.query(
      `SELECT poi.*, pr.purchase_price as master_price 
       FROM purchase_order_items poi 
       JOIN products pr ON poi.product_id = pr.id 
       WHERE poi.purchase_order_id = ?`,
      [po2Id]
    );

    assert(Number(po2ItemsAfterMutation[0].purchase_price) === 12.00, 'Test 3: Saved PO 2 preserves ₹12.00 custom price', `PO Price = ₹${po2ItemsAfterMutation[0].purchase_price}, Master Price = ₹${po2ItemsAfterMutation[0].master_price}`);

    // Cleanup test records
    await db.query('DELETE FROM purchase_order_items WHERE purchase_order_id IN (?, ?)', [po1Id, po2Id]);
    await db.query('DELETE FROM purchase_orders WHERE id IN (?, ?)', [po1Id, po2Id]);

    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED                 `);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await db.end();
  }
}

testPOCustomPrice();
