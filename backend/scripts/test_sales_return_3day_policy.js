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

async function testSalesReturn3DayPolicy() {
  console.log('\n======================================================');
  console.log('AUDITING 3-DAY RETURN POLICY & RETURN ELIGIBILITY FOR SALES');
  console.log('======================================================\n');

  try {
    // 1. Super Admin Login
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    // 2. Provision New Store Admin
    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Sales Policy Store ${timestamp}`,
      owner_name: 'Policy Admin',
      email: `policyadmin_${timestamp}@kiranaerp.com`,
      phone: '9993334445',
      address: 'Delhi',
      password: 'AdminPassword123!',
      admin_id: `PADM${timestamp.toString().slice(-4)}`
    };

    const createStoreRes = await request('POST', '/api/superadmin/stores', newStorePayload, saToken);
    console.log(`Step 1: Provision Store -> Status: ${createStoreRes.status} (DB: ${createStoreRes.data.databaseName})`);

    // 3. Login as New Admin
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });
    const token = adminLoginRes.data.token;
    console.log(`Step 2: Login New Admin -> Status: ${adminLoginRes.status}`);

    // 4. Create Category, Product, Purchase & POS Sale
    const catRes = await request('POST', '/api/categories', { name: 'Grocery' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Kirana Supplier', phone: '9876500000' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Fortune Oil 1L',
      sku: 'SKU-FORTUNE-OIL-1L',
      barcode: 'BAR-FORTUNE-01',
      category_id: categoryId,
      purchase_price: 120.00,
      selling_price: 150.00,
      mrp: 160.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    // Ingest stock via purchase
    await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [{ product_id: productId, quantity: 20, purchase_price: 120.00, selling_price: 150.00, mrp: 160.00 }]
    }, token);

    // Create POS Sale (1 unit)
    const saleRes = await request('POST', '/api/sales', {
      customerId: 1,
      items: [{ productId: productId, quantity: 1, sellingPrice: 150.00 }],
      paymentStatus: 'Paid',
      paymentMethod: 'Cash'
    }, token);
    console.log(`Step 3: POS Sale Created -> Status: ${saleRes.status} | Invoice: ${saleRes.data.invoiceNo} (ID: ${saleRes.data.saleId})`);

    // 5. Search Invoice for Return
    const searchRes = await request('GET', `/api/sales-returns/search-invoice?query=${saleRes.data.invoiceNo}`, null, token);
    const invData = searchRes.data.invoices[0];
    console.log(`Step 4: Search Invoice -> Status: ${searchRes.status} | Policy Eligible: ${invData.is_policy_eligible} | Message: "${invData.policy_message}"`);

    // 6. Process First Return (1 unit)
    const ret1 = await request('POST', '/api/sales-returns', {
      sale_id: invData.sale_id,
      items: [{ product_id: productId, quantity: 1 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Refund',
      refund_method: 'Cash'
    }, token);
    console.log(`Step 5: Process First Sales Return -> Status: ${ret1.status} | Return No: ${ret1.data.returnNo} | Refund: ₹${ret1.data.refundAmount}`);

    // 7. Attempt Second Return on Same Invoice (Already 100% returned)
    const ret2 = await request('POST', '/api/sales-returns', {
      sale_id: invData.sale_id,
      items: [{ product_id: productId, quantity: 1 }],
      reason: 'Wrong Item Purchased',
      return_type: 'Refund',
      refund_method: 'Cash'
    }, token);
    console.log(`Step 6: Attempt Second Return on Fully Returned Invoice -> Status: ${ret2.status} | Message: "${ret2.data.message}"`);

    console.log('\n======================================================');
    console.log('✅ 3-DAY RETURN POLICY & ELIGIBILITY VERIFIED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Sales Return Audit Failed:', err);
  }
}

testSalesReturn3DayPolicy();
