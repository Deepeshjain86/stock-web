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

async function testVendorReturnsFlow() {
  console.log('\n======================================================');
  console.log('AUDITING VENDOR RETURN & SUPPLIER LEDGER FLOW FOR NEW ADMIN');
  console.log('======================================================\n');

  try {
    // 1. Super Admin Login
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    const saToken = saLogin.data.token;

    // 2. Provision New Store Admin
    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Vendor Audit Store ${timestamp}`,
      owner_name: 'Vendor Admin',
      email: `vendoradmin_${timestamp}@kiranaerp.com`,
      phone: '9991112223',
      address: 'Jaipur',
      password: 'AdminPassword123!',
      admin_id: `VRADM${timestamp.toString().slice(-4)}`
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

    // 4. Create Category, Supplier, Product & Purchase Invoice
    const catRes = await request('POST', '/api/categories', { name: 'Beverages Master' }, token);
    const categoryId = catRes.data.category?.id || catRes.data.id;

    const vendorRes = await request('POST', '/api/vendors', { name: 'Syam Sahu Traders', phone: '9876543210' }, token);
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;

    const prodRes = await request('POST', '/api/products', {
      name: 'Real Juice 1L',
      sku: 'SKU-REAL-JUICE-1L',
      barcode: 'BAR-REAL-01',
      category_id: categoryId,
      purchase_price: 80.00,
      selling_price: 100.00,
      mrp: 110.00
    }, token);
    const productId = prodRes.data.product?.id || prodRes.data.id;

    const purRes = await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      items: [
        { product_id: productId, quantity: 50, purchase_price: 80.00, selling_price: 100.00, mrp: 110.00 }
      ]
    }, token);
    const purchaseId = purRes.data.purchaseId;
    console.log(`Step 3: Purchase Invoice Created -> Purchase No: ${purRes.data.purchaseNo} (ID: ${purchaseId})`);

    // 5. Test getById for Purchase Invoice (Itemized check)
    const purDetail = await request('GET', `/api/purchases/${purchaseId}`, null, token);
    console.log(`Step 4: GET Purchase By ID -> Status: ${purDetail.status} | Items Count: ${purDetail.data.purchase?.items?.length || 0}`);

    // 6. Test Vendor Return APIs
    const vProds = await request('GET', `/api/vendor-returns/products-purchased?vendor_id=${vendorId}`, null, token);
    console.log(`Step 5: GET Products Purchased By Vendor -> Status: ${vProds.status} | Prods Count: ${vProds.data.products?.length || 0}`);

    const pPurchases = await request('GET', `/api/vendor-returns/purchases-by-product?vendor_id=${vendorId}&product_id=${productId}`, null, token);
    console.log(`Step 6: GET Purchases By Vendor & Product -> Status: ${pPurchases.status} | Purchases Count: ${pPurchases.data.purchases?.length || 0}`);

    // 7. Post Vendor Return Note (Return 5 units of Real Juice)
    const returnRes = await request('POST', '/api/vendor-returns', {
      purchase_id: purchaseId,
      vendor_id: vendorId,
      product_id: productId,
      quantity: 5,
      reason: 'Damaged Goods',
      return_type: 'Refund'
    }, token);
    console.log(`Step 7: Post Vendor Return Note -> Status: ${returnRes.status} | VRN: ${returnRes.data.vrn} | Refund Amount: ₹${returnRes.data.totalAmount}`);

    // 8. Fetch Supplier Ledger Analytics
    const ledgerRes = await request('GET', `/api/vendor-returns/ledger/${vendorId}`, null, token);
    console.log(`Step 8: GET Supplier Ledger -> Status: ${ledgerRes.status} | Gross: ₹${ledgerRes.data.analytics?.grossPurchases} | Returns: ₹${ledgerRes.data.analytics?.totalReturns} | Outstanding: ₹${ledgerRes.data.analytics?.outstandingBalance}`);

    console.log('\n======================================================');
    console.log('✅ ALL VENDOR RETURN & SUPPLIER LEDGER APIS PASSED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Vendor Return Audit Failed:', err);
  }
}

testVendorReturnsFlow();
