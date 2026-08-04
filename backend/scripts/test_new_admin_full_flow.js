import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

function request(method, path, data, token, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    if (token) reqHeaders['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : '';
    if (body) reqHeaders['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers: reqHeaders }, (res) => {
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

async function testNewAdminFlow() {
  console.log('\n======================================================');
  console.log('AUDITING NEW ADMIN & NEW TENANT PROVISIONING & ALL APIs');
  console.log('======================================================\n');

  try {
    // 1. Super Admin Login
    console.log('Step 1: Super Admin Login...');
    const saLogin = await request('POST', '/api/auth/login', { email: 'superadmin@kiranamart.com', password: 'superadminpassword' });
    if (saLogin.status !== 200 || !saLogin.data.token) {
      console.error('❌ Super Admin Login Failed:', saLogin);
      return;
    }
    const saToken = saLogin.data.token;
    console.log('✅ Super Admin Logged In.');

    // 2. Register / Create a Brand New Store Admin (e.g. TestStore New Admin)
    const timestamp = Date.now();
    const newStorePayload = {
      store_name: `Test Store ${timestamp}`,
      owner_name: 'New Admin User',
      email: `newadmin_${timestamp}@kiranaerp.com`,
      phone: '9998887776',
      address: '123 Tech Park, Jaipur',
      gstin: '08ABCDE1234F1Z5',
      subscription_plan: 'Trial',
      password: 'AdminPassword123!',
      admin_id: `NEWADM${timestamp.toString().slice(-4)}`
    };

    console.log(`\nStep 2: Creating New Store Admin ("${newStorePayload.store_name}")...`);
    const createStoreRes = await request('POST', '/api/superadmin/stores', newStorePayload, saToken);
    console.log(`Create Store Status: ${createStoreRes.status}`, createStoreRes.data);

    if (createStoreRes.status !== 201) {
      console.error('❌ Failed to create new store:', createStoreRes.data);
      return;
    }
    console.log('✅ New Store Admin & Dedicated Database Created Successfully!');

    // 3. Login as the newly created Store Admin
    console.log(`\nStep 3: Logging in as New Store Admin (${newStorePayload.email})...`);
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newStorePayload.email,
      password: newStorePayload.password
    });

    console.log(`Admin Login Status: ${adminLoginRes.status}`);
    if (adminLoginRes.status !== 200 || !adminLoginRes.data.token) {
      console.error('❌ New Store Admin Login Failed:', adminLoginRes.data);
      return;
    }
    const newAdminToken = adminLoginRes.data.token;
    console.log('✅ New Store Admin Logged In Successfully!');

    // 4. Hit ALL Endpoints as the New Admin to verify zero-error execution
    const routesToTest = [
      { method: 'GET', path: '/api/auth/profile', name: 'User Profile' },
      { method: 'GET', path: '/api/products', name: 'Get Products' },
      { method: 'GET', path: '/api/categories', name: 'Get Categories' },
      { method: 'GET', path: '/api/sub-categories', name: 'Get SubCategories' },
      { method: 'GET', path: '/api/brands', name: 'Get Brands' },
      { method: 'GET', path: '/api/vendors', name: 'Get Vendors' },
      { method: 'GET', path: '/api/purchases', name: 'Get Purchases' },
      { method: 'GET', path: '/api/sales', name: 'Get Sales' },
      { method: 'GET', path: '/api/customers', name: 'Get Customers' },
      { method: 'GET', path: '/api/borrow', name: 'Get Borrow Summary' },
      { method: 'GET', path: '/api/borrow/kpis', name: 'Get Borrow KPIs' },
      { method: 'GET', path: '/api/borrow/transactions', name: 'Get Borrow Transactions' },
      { method: 'GET', path: '/api/sales-returns', name: 'Get Sales Returns' },
      { method: 'GET', path: '/api/vendor-returns', name: 'Get Vendor Returns' },
      { method: 'GET', path: '/api/stock-destroy', name: 'Get Stock Destroy' },
      { method: 'GET', path: '/api/reports/dashboard-kpis', name: 'Reports Dashboard KPIs' },
      { method: 'GET', path: '/api/reports/dashboard-charts', name: 'Reports Dashboard Charts' },
      { method: 'GET', path: '/api/reports/inventory-summary', name: 'Reports Inventory Summary' },
      { method: 'GET', path: '/api/reports/inventory', name: 'Reports Inventory' },
      { method: 'GET', path: '/api/reports/sales', name: 'Reports Sales' },
      { method: 'GET', path: '/api/reports/purchases', name: 'Reports Purchases' },
      { method: 'GET', path: '/api/reports/sales-dashboard', name: 'Reports Sales Dashboard' },
      { method: 'GET', path: '/api/reports/vendor-purchases', name: 'Reports Vendor Purchases' },
      { method: 'GET', path: '/api/reports/vendor-inventory', name: 'Reports Vendor Inventory' },
      { method: 'GET', path: '/api/reports/vendor-returns', name: 'Reports Vendor Returns' },
      { method: 'GET', path: '/api/reports/advanced-analytics', name: 'Reports Advanced Analytics' },
      { method: 'GET', path: '/api/users', name: 'Get Staff Users' },
      { method: 'GET', path: '/api/users/roles', name: 'Get Roles & Permissions' },
      { method: 'GET', path: '/api/users/activity-logs', name: 'Get Activity Logs' },
      { method: 'GET', path: '/api/notifications', name: 'Get Notifications' },
      { method: 'GET', path: '/api/notifications/unread-count', name: 'Get Unread Count' },
      { method: 'GET', path: '/api/billing/status', name: 'Get SaaS Subscription Status' }
    ];

    console.log('\nStep 4: Testing All APIs for New Store Admin...');
    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const r of routesToTest) {
      const res = await request(r.method, r.path, null, newAdminToken);
      if (res.status >= 200 && res.status < 400) {
        console.log(`✅ [${res.status}] ${r.name.padEnd(28)} (${r.method} ${r.path})`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${r.name.padEnd(28)} (${r.method} ${r.path}) - Res:`, res.data);
        failed++;
        failures.push({ route: r, response: res });
      }
    }

    // 5. Test creating a product, category, vendor, sale, purchase, customer as New Admin
    console.log('\nStep 5: Testing Business CRUD Mutations on New Admin...');
    
    // Category Creation
    const catRes = await request('POST', '/api/categories', { name: 'Dairy & Eggs', description: 'Fresh milk & eggs' }, newAdminToken);
    console.log(`Create Category Status: ${catRes.status}`, catRes.status === 201 ? '✅ PASS' : '❌ FAIL');
    const categoryId = catRes.data.category?.id || catRes.data.id;
    console.log('   Category ID:', categoryId);

    // Vendor Creation
    const vendorRes = await request('POST', '/api/vendors', { name: 'Amul Dairy Supplier', phone: '9876543210', email: 'amul@supplier.com', address: 'Amul Hub' }, newAdminToken);
    console.log(`Create Vendor Status: ${vendorRes.status}`, vendorRes.status === 201 ? '✅ PASS' : '❌ FAIL');
    const vendorId = vendorRes.data.vendor?.id || vendorRes.data.id;
    console.log('   Vendor ID:', vendorId);

    // Product Creation
    const prodRes = await request('POST', '/api/products', {
      name: 'Amul Milk 1L',
      sku: 'AMUL-MILK-1L',
      barcode: '890123456789',
      category_id: categoryId,
      unit: 'Pcs',
      purchase_price: 55.00,
      selling_price: 64.00,
      mrp: 66.00,
      tax_rate: 0
    }, newAdminToken);
    console.log(`Create Product Status: ${prodRes.status}`, prodRes.status === 201 ? '✅ PASS' : '❌ FAIL');
    const productId = prodRes.data.product?.id || prodRes.data.id;
    console.log('   Product ID:', productId);

    // Purchase Creation (Stock In)
    const purchaseRes = await request('POST', '/api/purchases', {
      vendor_id: vendorId,
      invoice_number: 'INV-AMUL-001',
      purchase_date: new Date().toISOString().split('T')[0],
      items: [
        { product_id: productId, quantity: 20, purchase_price: 55.00, selling_price: 64.00, batch_number: 'B-001' }
      ],
      payment_type: 'Paid'
    }, newAdminToken);
    console.log(`Create Purchase Status: ${purchaseRes.status}`, purchaseRes.status === 201 ? '✅ PASS' : '❌ FAIL - Res:', purchaseRes.data);

    // Customer Creation
    const custRes = await request('POST', '/api/customers', { name: 'Rahul Sharma', phone: '9123456789', email: 'rahul@gmail.com' }, newAdminToken);
    console.log(`Create Customer Status: ${custRes.status}`, custRes.status === 201 ? '✅ PASS' : '❌ FAIL');
    const customerId = custRes.data.customer?.id || custRes.data.id;

    // Sale POS Creation
    const saleRes = await request('POST', '/api/sales', {
      customer_id: customerId,
      items: [
        { product_id: productId, quantity: 2, selling_price: 64.00 }
      ],
      payment_type: 'Cash',
      discount: 0
    }, newAdminToken);
    console.log(`Create Sale Status: ${saleRes.status}`, saleRes.status === 201 ? '✅ PASS' : '❌ FAIL - Res:', saleRes.data);

    // Check KPIs & Reports
    const kpiRes = await request('GET', '/api/reports/dashboard-kpis', null, newAdminToken);
    console.log('New Admin Dashboard KPIs:', kpiRes.data);

    console.log('\n======================================================');
    console.log(`FINAL NEW ADMIN AUDIT RESULTS: ${passed} GET Routes Passed, ${failed} Failed`);
    if (failures.length > 0) {
      console.log('FAILURES:', JSON.stringify(failures, null, 2));
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test New Admin Flow Error:', err);
  }
}

testNewAdminFlow();
