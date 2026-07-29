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

async function runTest() {
  console.log('=== PURCHASE INVOICE DEDUPLICATION & PAYMENT STATUS AUDIT ===\n');

  // 1. Login
  const login = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const t = login.d.token;
  console.log('1. Login:', login.s === 200 ? 'PASS' : 'FAIL');

  // 2. Fetch Vendors & Products
  const vendors = await request('GET', '/api/vendors', null, t);
  const vId = vendors.d.vendors?.[0]?.id || 1;
  const prods = await request('GET', '/api/products', null, t);
  const pId = prods.d.products?.[0]?.id || 3;

  // 3. Create New Unpaid Purchase (defaulting payment_status: 'Pending')
  console.log('\n2. Creating Purchase Entry with default payment_status: "Pending"...');
  const payload = {
    vendor_id: vId,
    warehouse_id: 1,
    date: new Date().toISOString().substring(0, 10),
    subtotal: 500,
    discount: 0,
    gst_amount: 90,
    total: 590,
    payment_status: 'Pending',
    delivery_status: 'Received',
    payment_method: 'Credit',
    items: [
      { product_id: pId, quantity: 10, purchase_price: 50, gst: 18, total: 590 }
    ]
  };

  const createRes1 = await request('POST', '/api/purchases', payload, t);
  console.log('   Create Result 1 Status:', createRes1.s);
  console.log('   Create Result 1 Data:', createRes1.d);

  // Fetch created purchase detail
  const purDetail = await request('GET', `/api/purchases/${createRes1.d.purchaseId}`, null, t);
  console.log('   Saved Purchase Invoice Payment Status:', purDetail.d.purchase?.payment_status);
  console.log('   Payment Status Check:', purDetail.d.purchase?.payment_status === 'Pending' ? '✅ PASS (PENDING)' : '❌ FAIL');

  // 4. Test Immediate Duplicate Submission (Guard Test)
  console.log('\n3. Firing rapid Duplicate Submission (Guard Test)...');
  const createRes2 = await request('POST', '/api/purchases', payload, t);
  console.log('   Create Result 2 (Duplicate Attempt) Message:', createRes2.d.message);
  console.log('   Duplicate Guard Result:', createRes2.d.message.includes('suppressed') ? '✅ PASS (DUPLICATE SUPPRESSED)' : '❌ FAIL');

  console.log('\n=== AUDIT COMPLETE ===');
}

runTest().catch(e => console.error(e));
