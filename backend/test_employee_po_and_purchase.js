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

async function testEmployeePurchaseOperations() {
  console.log('=== EMPLOYEE PURCHASE ORDER & PURCHASE INVOICE AUDIT ===\n');

  // 1. Admin Login & Get/Create Employee
  const adminLogin = await request('POST', '/api/auth/login', { email: 'aman@kiranaerp.com', password: '123456' });
  const adminToken = adminLogin.d.token;

  const rolesRes = await request('GET', '/api/users/roles', null, adminToken);
  const empRoleId = rolesRes.d.roles.find(r => r.name === 'Employee').id;

  const empEmail = `po.employee.${Date.now()}@kiranamart.com`;
  console.log('1. Registering Employee account...');
  await request('POST', '/api/users', {
    name: 'Purchase Operator Employee',
    email: empEmail,
    password: 'password123',
    role_id: empRoleId,
    department: 'General'
  }, adminToken);

  // 2. Employee Login
  console.log('\n2. Logging in as Employee...');
  const empLogin = await request('POST', '/api/auth/login', { email: empEmail, password: 'password123' });
  const empToken = empLogin.d.token;
  console.log('   Employee Login Status:', empLogin.s === 200 ? '200 OK' : 'FAIL');

  // Fetch Vendor & Product
  const vRes = await request('GET', '/api/vendors', null, empToken);
  const vId = vRes.d.vendors?.[0]?.id || 1;
  const pRes = await request('GET', '/api/products', null, empToken);
  const pId = pRes.d.products?.[0]?.id || 3;

  // 3. Employee Creates Purchase Order (POST /api/purchases/orders)
  console.log('\n3. Employee Creating Purchase Order (POST /api/purchases/orders)...');
  const poRes = await request('POST', '/api/purchases/orders', {
    vendor_id: vId,
    warehouse_id: 1,
    date: new Date().toISOString().substring(0, 10),
    expected_delivery_date: new Date().toISOString().substring(0, 10),
    subtotal: 100,
    discount: 0,
    gst_amount: 18,
    total: 118,
    notes: 'Employee PO Test',
    items: [
      { product_id: pId, quantity: 2, purchase_price: 50, gst: 18, total: 118 }
    ]
  }, empToken);

  console.log('   PO Create Status:', poRes.s);
  console.log('   PO Create Response:', poRes.d);
  console.log('   PO Creation Result:', poRes.s === 201 ? '✅ PASS (PURCHASE ORDER CREATED)' : '❌ FAIL');

  // 4. Employee Creates Purchase Invoice (POST /api/purchases)
  console.log('\n4. Employee Creating Standalone Purchase Invoice (POST /api/purchases)...');
  const purRes = await request('POST', '/api/purchases', {
    vendor_id: vId,
    warehouse_id: 1,
    date: new Date().toISOString().substring(0, 10),
    subtotal: 200,
    discount: 0,
    gst_amount: 36,
    total: 236,
    payment_status: 'Pending',
    delivery_status: 'Received',
    payment_method: 'Credit',
    items: [
      { product_id: pId, quantity: 4, purchase_price: 50, gst: 18, total: 236 }
    ]
  }, empToken);

  console.log('   Purchase Invoice Status:', purRes.s);
  console.log('   Purchase Invoice Response:', purRes.d);
  console.log('   Purchase Invoice Result:', purRes.s === 201 ? '✅ PASS (PURCHASE INVOICE CREATED)' : '❌ FAIL');

  console.log('\n=== AUDIT COMPLETE ===');
}

testEmployeePurchaseOperations().catch(e => console.error(e));
