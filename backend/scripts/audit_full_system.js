import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const reqApi = (method, path, token, data = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
};

async function auditFullSystem() {
  console.log('\n======================================================');
  console.log('STARTING FULL ENTERPRISE SYSTEM AUDIT & INTEGRITY CHECK');
  console.log('======================================================\n');

  const results = [];
  const addResult = (module, testName, passed, details) => {
    results.push({ module, testName, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${module} - ${testName}: ${details}`);
  };

  const secret = process.env.JWT_SECRET || 'secret';

  // 1. Health Check
  try {
    const res = await reqApi('GET', '/health');
    if (res.status === 200 && res.data.status === 'UP') {
      addResult('System', 'Health Check Endpoint', true, 'HTTP 200 OK (Status UP)');
    } else {
      addResult('System', 'Health Check Endpoint', false, `Status ${res.status}`);
    }
  } catch (err) {
    addResult('System', 'Health Check Endpoint', false, err.message);
  }

  // 2. Super Admin Login
  let superToken = null;
  try {
    const res = await reqApi('POST', '/api/auth/login', null, {
      email: 'superadmin@kiranamart.com',
      password: 'superadminpassword'
    });
    if (res.status === 200 && res.data.token) {
      superToken = res.data.token;
      addResult('Auth', 'Super Admin Authentication', true, 'Login successful with JWT token');
    } else {
      addResult('Auth', 'Super Admin Authentication', false, res.data.message || 'Login failed');
    }
  } catch (err) {
    addResult('Auth', 'Super Admin Authentication', false, err.message);
  }

  // 3. Super Admin KPIs & Stores List
  if (superToken) {
    try {
      const res = await reqApi('GET', '/api/superadmin/kpis', superToken);
      if (res.status === 200 && res.data.kpis) {
        addResult('SuperAdmin', 'KPI Analytics API', true, `Total Stores: ${res.data.kpis.totalStores}, Total Sales: ₹${res.data.kpis.totalSales}`);
      } else {
        addResult('SuperAdmin', 'KPI Analytics API', false, res.data.message || 'Failed');
      }
    } catch (err) {
      addResult('SuperAdmin', 'KPI Analytics API', false, err.message);
    }

    try {
      const res = await reqApi('GET', '/api/superadmin/stores', superToken);
      if (res.status === 200 && Array.isArray(res.data.stores)) {
        addResult('SuperAdmin', 'Store Management List API', true, `Fetched ${res.data.stores.length} store(s)`);
      } else {
        addResult('SuperAdmin', 'Store Management List API', false, res.data.message || 'Failed');
      }
    } catch (err) {
      addResult('SuperAdmin', 'Store Management List API', false, err.message);
    }
  }

  // 4. Store Admin Token (Aman Kirana Mart)
  const storeAdminToken = jwt.sign({
    id: 17,
    email: 'aman@kiranaerp.com',
    role: 'Admin',
    tenantId: 1,
    tenantDbName: 'shop_aman001'
  }, secret, { expiresIn: '1h' });

  // 5. Products API Check
  try {
    const res = await reqApi('GET', '/api/products', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.products)) {
      addResult('Products', 'Get All Products API', true, `Retrieved ${res.data.products.length} product(s)`);
    } else {
      addResult('Products', 'Get All Products API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Products', 'Get All Products API', false, err.message);
  }

  // 6. Categories, Sub-Categories & Brands API Check
  try {
    const res = await reqApi('GET', '/api/categories', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.categories)) {
      addResult('Categories', 'Get Categories API', true, `Retrieved ${res.data.categories.length} category(ies)`);
    } else {
      addResult('Categories', 'Get Categories API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Categories', 'Get Categories API', false, err.message);
  }

  try {
    const res = await reqApi('GET', '/api/sub-categories', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.subCategories)) {
      addResult('SubCategories', 'Get Sub-Categories API', true, `Retrieved ${res.data.subCategories.length} sub-category(ies)`);
    } else {
      addResult('SubCategories', 'Get Sub-Categories API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('SubCategories', 'Get Sub-Categories API', false, err.message);
  }

  try {
    const res = await reqApi('GET', '/api/brands', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.brands)) {
      addResult('Brands', 'Get Brands API', true, `Retrieved ${res.data.brands.length} brand(s)`);
    } else {
      addResult('Brands', 'Get Brands API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Brands', 'Get Brands API', false, err.message);
  }

  // 7. Stock & Warehouse Levels API Check
  try {
    const res = await reqApi('GET', '/api/stock', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.stock)) {
      addResult('Stock', 'Get Stock Balances API', true, `Retrieved ${res.data.stock.length} stock item(s)`);
    } else {
      addResult('Stock', 'Get Stock Balances API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Stock', 'Get Stock Balances API', false, err.message);
  }

  // 8. Sales History API Check
  try {
    const res = await reqApi('GET', '/api/sales', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.sales)) {
      addResult('Sales', 'Get Sales Invoices API', true, `Retrieved ${res.data.sales.length} sales invoice(s)`);
    } else {
      addResult('Sales', 'Get Sales Invoices API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Sales', 'Get Sales Invoices API', false, err.message);
  }

  // 9. Purchases & Vendors API Check
  try {
    const res = await reqApi('GET', '/api/purchases', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.purchases)) {
      addResult('Purchases', 'Get Purchases API', true, `Retrieved ${res.data.purchases.length} purchase invoice(s)`);
    } else {
      addResult('Purchases', 'Get Purchases API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Purchases', 'Get Purchases API', false, err.message);
  }

  try {
    const res = await reqApi('GET', '/api/vendors', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.vendors)) {
      addResult('Vendors', 'Get Vendors API', true, `Retrieved ${res.data.vendors.length} vendor(s)`);
    } else {
      addResult('Vendors', 'Get Vendors API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Vendors', 'Get Vendors API', false, err.message);
  }

  // 10. Customers & Borrow Ledger API Check
  try {
    const res = await reqApi('GET', '/api/customers', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.customers)) {
      addResult('Customers', 'Get Customers API', true, `Retrieved ${res.data.customers.length} customer(s)`);
    } else {
      addResult('Customers', 'Get Customers API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Customers', 'Get Customers API', false, err.message);
  }

  try {
    const res = await reqApi('GET', '/api/borrow', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.summary)) {
      addResult('Borrow', 'Get Udhaar Borrow Ledger API', true, `Retrieved ${res.data.summary.length} customer borrow summary(ies)`);
    } else {
      addResult('Borrow', 'Get Udhaar Borrow Ledger API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Borrow', 'Get Udhaar Borrow Ledger API', false, err.message);
  }

  // 11. Staff / Users API Check
  try {
    const res = await reqApi('GET', '/api/users', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.users)) {
      addResult('Staff', 'Get Staff Users API', true, `Retrieved ${res.data.users.length} staff member(s)`);
    } else {
      addResult('Staff', 'Get Staff Users API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Staff', 'Get Staff Users API', false, err.message);
  }

  // 12. Notifications & Activity Logs API Check
  try {
    const res = await reqApi('GET', '/api/notifications', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.notifications)) {
      addResult('Notifications', 'Get Notifications API', true, `Retrieved ${res.data.notifications.length} notification(s)`);
    } else {
      addResult('Notifications', 'Get Notifications API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('Notifications', 'Get Notifications API', false, err.message);
  }

  try {
    const res = await reqApi('GET', '/api/activity-logs', storeAdminToken);
    if (res.status === 200 && Array.isArray(res.data.logs)) {
      addResult('ActivityLogs', 'Get Activity Logs API', true, `Retrieved ${res.data.logs.length} audit log(s)`);
    } else {
      addResult('ActivityLogs', 'Get Activity Logs API', false, res.data.message || 'Failed');
    }
  } catch (err) {
    addResult('ActivityLogs', 'Get Activity Logs API', false, err.message);
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log('\n======================================================');
  console.log(`AUDIT SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED (${Math.round(passedCount/results.length*100)}% SUCCESS RATE)`);
  console.log('======================================================\n');
}

auditFullSystem();
