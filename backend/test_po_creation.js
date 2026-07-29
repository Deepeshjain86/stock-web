import http from 'http';

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : '';
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, d: JSON.parse(d) }); } catch(e) { resolve({ s: res.statusCode, d }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testPOCreation() {
  console.log('=== TESTING PURCHASE ORDER & PURCHASE INVOICE CREATION ===\n');

  // 1. Login
  const login = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const t = login.d.token;
  console.log('1. Login Status:', login.s);

  // 2. Fetch Vendors, Warehouses, Products
  const vendors = await request('GET', '/api/vendors', null, t);
  const vId = vendors.d.vendors?.[0]?.id || 1;

  const prods = await request('GET', '/api/products', null, t);
  const pId = prods.d.products?.[0]?.id || 3;

  console.log('2. Target Vendor ID:', vId, '| Target Product ID:', pId);

  // 3. Test Create Purchase Order (POST /api/purchases/orders)
  console.log('\n3. Testing POST /api/purchases/orders (Create Purchase Order)...');
  const poData = {
    vendor_id: vId,
    warehouse_id: 1,
    date: new Date().toISOString().substring(0, 10),
    expected_delivery_date: new Date().toISOString().substring(0, 10),
    subtotal: 100,
    discount: 0,
    gst_amount: 5,
    total: 105,
    notes: 'Test PO',
    items: [
      { product_id: pId, quantity: 2, purchase_price: 50, gst: 5, total: 105 }
    ]
  };

  const poRes = await request('POST', '/api/purchases/orders', poData, t);
  console.log('   PO Response Status:', poRes.s);
  console.log('   PO Response Data:', poRes.d);

  // 4. Test Create Purchase Invoice (POST /api/purchases)
  console.log('\n4. Testing POST /api/purchases (Create Purchase Entry / GRN)...');
  const purData = {
    vendor_id: vId,
    warehouse_id: 1,
    date: new Date().toISOString().substring(0, 10),
    subtotal: 100,
    discount: 0,
    gst_amount: 5,
    total: 105,
    payment_status: 'Pending',
    delivery_status: 'Received',
    payment_method: 'Cash',
    items: [
      { product_id: pId, quantity: 2, purchase_price: 50, gst: 5, total: 105 }
    ]
  };

  const purRes = await request('POST', '/api/purchases', purData, t);
  console.log('   Purchase Entry Response Status:', purRes.s);
  console.log('   Purchase Entry Response Data:', purRes.d);

  console.log('\n=== AUDIT COMPLETE ===');
}

testPOCreation().catch(e => console.error(e));
