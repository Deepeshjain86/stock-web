import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

function apiRequest(method, path, data, token) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : '';
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const start = Date.now();
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const ms = Date.now() - start;
        try {
          const parsed = JSON.parse(d);
          resolve({ status: res.statusCode, data: parsed, ms });
        } catch(e) {
          resolve({ status: res.statusCode, data: d, ms });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, data: { error: err.message }, ms: Date.now() - start }));
    if (body) req.write(body);
    req.end();
  });
}

async function auditAllSystemAPIs() {
  console.log('\n======================================================');
  console.log('🔍 FULL ENTERPRISE API HEALTH AUDIT & DIAGNOSTICS');
  console.log('======================================================\n');

  let passedCount = 0;
  let failedCount = 0;
  const auditResults = [];

  // 1. SUPER ADMIN AUTH
  const saLogin = await apiRequest('POST', '/api/auth/login', {
    email: 'superadmin@kiranamart.com',
    password: 'superadminpassword'
  });
  const saToken = saLogin.data?.token;

  // 2. TENANT STORE ADMIN AUTH (Dinesh Kirana Mart)
  const tenantLogin = await apiRequest('POST', '/api/auth/login', {
    email: 'dinesh@kiranaerp.com',
    password: 'password123'
  });
  const tenantToken = tenantLogin.data?.token;

  const endpointsToTest = [
    // Super Admin Platform APIs
    { role: 'Super Admin', name: 'Super Admin KPIs', method: 'GET', path: '/api/superadmin/kpis', token: saToken },
    { role: 'Super Admin', name: 'Store Tenants List', method: 'GET', path: '/api/superadmin/stores', token: saToken },
    { role: 'Super Admin', name: 'System Backups List', method: 'GET', path: '/api/superadmin/backups', token: saToken },

    // Tenant / Merchant Store APIs
    { role: 'Tenant Admin', name: 'Auth User Profile', method: 'GET', path: '/api/auth/profile', token: tenantToken },
    { role: 'Tenant Admin', name: 'Products Catalog', method: 'GET', path: '/api/products', token: tenantToken },
    { role: 'Tenant Admin', name: 'Categories List', method: 'GET', path: '/api/categories', token: tenantToken },
    { role: 'Tenant Admin', name: 'Sub-Categories List', method: 'GET', path: '/api/sub-categories', token: tenantToken },
    { role: 'Tenant Admin', name: 'Brands List', method: 'GET', path: '/api/brands', token: tenantToken },
    { role: 'Tenant Admin', name: 'Vendors List', method: 'GET', path: '/api/vendors', token: tenantToken },
    { role: 'Tenant Admin', name: 'Customers Registry', method: 'GET', path: '/api/customers', token: tenantToken },
    { role: 'Tenant Admin', name: 'POS Sales List', method: 'GET', path: '/api/sales', token: tenantToken },
    { role: 'Tenant Admin', name: 'Sales Returns List', method: 'GET', path: '/api/sales-returns', token: tenantToken },
    { role: 'Tenant Admin', name: 'Purchase Orders GRN', method: 'GET', path: '/api/purchases', token: tenantToken },
    { role: 'Tenant Admin', name: 'Stock Inventory Catalog', method: 'GET', path: '/api/stock', token: tenantToken },
    { role: 'Tenant Admin', name: 'Stock Alerts (Low Stock)', method: 'GET', path: '/api/stock/alerts', token: tenantToken },
    { role: 'Tenant Admin', name: 'Borrow Debtors Summary', method: 'GET', path: '/api/borrow', token: tenantToken },
    { role: 'Tenant Admin', name: 'Borrow Debtors KPIs', method: 'GET', path: '/api/borrow/kpis', token: tenantToken },
    { role: 'Tenant Admin', name: 'Borrow History Logs', method: 'GET', path: '/api/borrow/history', token: tenantToken },
    { role: 'Tenant Admin', name: 'Borrow Transactions', method: 'GET', path: '/api/borrow/transactions', token: tenantToken },
    { role: 'Tenant Admin', name: 'Activity Notifications', method: 'GET', path: '/api/notifications', token: tenantToken },
    { role: 'Tenant Admin', name: 'Store Billing Status', method: 'GET', path: '/api/billing/status', token: tenantToken },
    { role: 'Tenant Admin', name: 'Dashboard Analytics KPIs', method: 'GET', path: '/api/reports/dashboard-kpis', token: tenantToken },
    { role: 'Tenant Admin', name: 'Sales Performance Report', method: 'GET', path: '/api/reports/sales', token: tenantToken },
    { role: 'Tenant Admin', name: 'Inventory Report', method: 'GET', path: '/api/reports/inventory', token: tenantToken },
    { role: 'Tenant Admin', name: 'Purchases Analytics Report', method: 'GET', path: '/api/reports/purchases', token: tenantToken },
    { role: 'Tenant Admin', name: 'Advanced Analytics Report', method: 'GET', path: '/api/reports/advanced-analytics', token: tenantToken },
    { role: 'Tenant Admin', name: 'Store Settings Info', method: 'GET', path: '/api/settings', token: tenantToken },
    { role: 'Tenant Admin', name: 'Staff Users List', method: 'GET', path: '/api/users', token: tenantToken },
    { role: 'Tenant Admin', name: 'Activity Audit Logs', method: 'GET', path: '/api/activity-logs', token: tenantToken },
  ];

  for (const ep of endpointsToTest) {
    const res = await apiRequest(ep.method, ep.path, null, ep.token);
    const isSuccess = res.status >= 200 && res.status < 300 && (res.data?.success !== false);
    if (isSuccess) passedCount++; else failedCount++;

    auditResults.push({
      Role: ep.role,
      Module: ep.name,
      Path: ep.path,
      Status: res.status,
      Latency: `${res.ms}ms`,
      Result: isSuccess ? '✅ PASSED' : '❌ FAILED'
    });
  }

  console.table(auditResults);

  console.log('\n======================================================');
  console.log(`AUDIT SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED (${endpointsToTest.length} TOTAL)`);
  if (failedCount === 0) {
    console.log('🎉 ALL SYSTEM APIS ARE OPERATING 100% PERFECTLY!');
  } else {
    console.log('⚠️ ATTENTION NEEDED ON FAILED API ENDPOINTS ABOVE.');
  }
  console.log('======================================================\n');
}

auditAllSystemAPIs();
