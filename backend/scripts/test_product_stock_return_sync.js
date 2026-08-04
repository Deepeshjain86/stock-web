import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : '';
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { 
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } 
        catch(e) { resolve({ status: res.statusCode, data: d }); } 
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testProductStockReturnSync() {
  console.log('\n======================================================');
  console.log('AUDITING INSTANT PRODUCT CATALOG STOCK SYNC ON SALES RETURN');
  console.log('======================================================\n');

  try {
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Stock Sync Store ${timestamp}`,
      owner_name: 'Sync Admin',
      email: `syncadmin_${timestamp}@kiranaerp.com`,
      phone: '9993334445',
      address: 'Kolkata',
      password: 'AdminPassword123!',
      admin_id: `SSDM${timestamp.toString().slice(-4)}`
    };

    await request('POST', '/api/superadmin/stores', newStorePayload, saToken);

    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });
    const token = adminLoginRes.data.token;

    // 1. Create Category, Vendor, Product (Stock initially 0)
    const catRes = await request('POST', '/api/categories', { name: 'Groceries' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Rice Trader', phone: '9876500000' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Basmati Rice 5kg',
      sku: 'SKU-RICE-5KG',
      barcode: 'BAR-RICE-05',
      category_id: categoryId,
      purchase_price: 300.00,
      selling_price: 400.00,
      mrp: 420.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    // 2. Add Stock via Purchase (Purchase 10 units) -> Stock = 10
    await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [{ product_id: productId, quantity: 10, purchase_price: 300.00, selling_price: 400.00, mrp: 420.00 }]
    }, token);

    let prodList1 = await request('GET', '/api/products', null, token);
    let prod1 = prodList1.data.products.find(p => p.id === productId);
    console.log(`Step 1: Stock after Purchase (10 units) -> Catalog Stock: ${prod1.total_stock}`);

    // 3. POS Sale of 3 units -> Stock = 7
    const saleRes = await request('POST', '/api/sales', {
      customerId: 1,
      items: [{ productId: productId, quantity: 3, sellingPrice: 400.00 }],
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    }, token);

    let prodList2 = await request('GET', '/api/products', null, token);
    let prod2 = prodList2.data.products.find(p => p.id === productId);
    console.log(`Step 2: Stock after POS Sale (3 units deducted) -> Catalog Stock: ${prod2.total_stock}`);

    // 4. Customer returns 2 units -> Stock should IMMEDIATELY increase to 9!
    const returnRes = await request('POST', '/api/sales-returns', {
      sale_id: saleRes.data.saleId,
      items: [{ product_id: productId, quantity: 2 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Refund',
      refund_method: 'Cash'
    }, token);
    console.log(`Step 3: Process Return of 2 units -> VRN: ${returnRes.data.returnNo}`);

    // 5. Verify Products Catalog Stock IMMEDIATELY after return!
    let prodList3 = await request('GET', '/api/products', null, token);
    let prod3 = prodList3.data.products.find(p => p.id === productId);
    console.log(`Step 4: Stock after Return (2 units returned) -> Catalog Stock: ${prod3.total_stock}`);

    if (Number(prod3.total_stock) === 9) {
      console.log('\n======================================================');
      console.log('✅ INSTANT PRODUCT CATALOG STOCK SYNC VERIFIED 100% (7 -> 9)');
      console.log('======================================================\n');
    } else {
      console.error(`❌ STOCK MISMATCH! Expected 9, got ${prod3.total_stock}`);
    }
  } catch (e) {
    console.error('Audit Error:', e);
  }
}

testProductStockReturnSync();
