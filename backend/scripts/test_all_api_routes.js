import dotenv from 'dotenv';

dotenv.config();

const baseUrl = 'http://localhost:5000';

const testAllApiRoutes = async () => {
  console.log('\n======================================================');
  console.log('TESTING ALL BACKEND API ROUTES ON HTTP://LOCALHOST:5000');
  console.log('======================================================\n');

  try {
    // 1. Test Super Admin Login
    console.log('[Route Test] Testing Super Admin Login...');
    const saLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@kiranamart.com', password: 'Pass123!' })
    });

    const saBody = await saLoginRes.json();
    console.log(`              Status: ${saLoginRes.status} | Token Received: ${!!saBody.token}`);
    const saToken = saBody.token;

    // 2. Test Tenant Admin Login (Aman Gupta)
    console.log('[Route Test] Testing Tenant Admin Login...');
    const tenantLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aman@kiranaerp.com', password: 'Aman@123' })
    });

    const tenantBody = await tenantLoginRes.json();
    console.log(`              Status: ${tenantLoginRes.status} | Token Received: ${!!tenantBody.token}`);
    const tenantToken = tenantBody.token;

    const routesToTest = [
      // Super Admin Routes
      { method: 'GET', path: '/api/superadmin/kpis', token: saToken, name: 'SuperAdmin KPIs' },
      { method: 'GET', path: '/api/superadmin/stores', token: saToken, name: 'SuperAdmin Stores List' },

      // Tenant Admin Core Routes
      { method: 'GET', path: '/api/auth/profile', token: tenantToken, name: 'User Profile' },
      { method: 'GET', path: '/api/products', token: tenantToken, name: 'Get Products' },
      { method: 'GET', path: '/api/categories', token: tenantToken, name: 'Get Categories' },
      { method: 'GET', path: '/api/sub-categories', token: tenantToken, name: 'Get SubCategories' },
      { method: 'GET', path: '/api/brands', token: tenantToken, name: 'Get Brands' },
      { method: 'GET', path: '/api/vendors', token: tenantToken, name: 'Get Vendors' },
      { method: 'GET', path: '/api/purchases', token: tenantToken, name: 'Get Purchases' },
      { method: 'GET', path: '/api/sales', token: tenantToken, name: 'Get Sales' },
      { method: 'GET', path: '/api/customers', token: tenantToken, name: 'Get Customers' },
      { method: 'GET', path: '/api/borrow', token: tenantToken, name: 'Get Borrow Summary' },
      { method: 'GET', path: '/api/borrow/kpis', token: tenantToken, name: 'Get Borrow KPIs' },
      { method: 'GET', path: '/api/borrow/transactions', token: tenantToken, name: 'Get Borrow Transactions' },
      { method: 'GET', path: '/api/sales-returns', token: tenantToken, name: 'Get Sales Returns' },
      { method: 'GET', path: '/api/vendor-returns', token: tenantToken, name: 'Get Vendor Returns' },
      { method: 'GET', path: '/api/stock-destroy', token: tenantToken, name: 'Get Stock Destroy' },

      // Reports & Dashboard
      { method: 'GET', path: '/api/reports/dashboard-kpis', token: tenantToken, name: 'Reports Dashboard KPIs' },
      { method: 'GET', path: '/api/reports/dashboard-charts', token: tenantToken, name: 'Reports Dashboard Charts' },
      { method: 'GET', path: '/api/reports/inventory-summary', token: tenantToken, name: 'Reports Inventory Summary' },
      { method: 'GET', path: '/api/reports/inventory', token: tenantToken, name: 'Reports Inventory' },
      { method: 'GET', path: '/api/reports/sales', token: tenantToken, name: 'Reports Sales' },
      { method: 'GET', path: '/api/reports/purchases', token: tenantToken, name: 'Reports Purchases' },
      { method: 'GET', path: '/api/reports/sales-dashboard', token: tenantToken, name: 'Reports Sales Dashboard' },
      { method: 'GET', path: '/api/reports/vendor-purchases', token: tenantToken, name: 'Reports Vendor Purchases' },
      { method: 'GET', path: '/api/reports/vendor-inventory', token: tenantToken, name: 'Reports Vendor Inventory' },
      { method: 'GET', path: '/api/reports/vendor-returns', token: tenantToken, name: 'Reports Vendor Returns' },
      { method: 'GET', path: '/api/reports/advanced-analytics', token: tenantToken, name: 'Reports Advanced Analytics' },

      // Users, Roles & Activity Logs
      { method: 'GET', path: '/api/users', token: tenantToken, name: 'Get Staff Users' },
      { method: 'GET', path: '/api/users/roles', token: tenantToken, name: 'Get Roles & Permissions' },
      { method: 'GET', path: '/api/users/activity-logs', token: tenantToken, name: 'Get Activity Logs' },

      // Notifications & Settings
      { method: 'GET', path: '/api/notifications', token: tenantToken, name: 'Get Notifications' },
      { method: 'GET', path: '/api/notifications/unread-count', token: tenantToken, name: 'Get Unread Count' },
      { method: 'GET', path: '/api/settings', token: tenantToken, name: 'Get Store Settings' }
    ];

    let passedCount = 0;
    let failedCount = 0;

    console.log('\n--- Hitting Endpoints ---');
    for (const r of routesToTest) {
      const res = await fetch(`${baseUrl}${r.path}`, {
        method: r.method,
        headers: {
          'Authorization': `Bearer ${r.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.status >= 200 && res.status < 400) {
        console.log(`✅ [${res.status}] ${r.name.padEnd(28)} (${r.method} ${r.path})`);
        passedCount++;
      } else {
        console.error(`❌ [${res.status}] ${r.name.padEnd(28)} (${r.method} ${r.path}) - Body:`, data);
        failedCount++;
      }
    }

    console.log('\n======================================================');
    console.log(`RESULTS: Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Route Test Error:', err);
  }
};

testAllApiRoutes();
