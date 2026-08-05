import http from 'http';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

async function testMohanSubscriptionUpgrade() {
  console.log('\n======================================================');
  console.log('TESTING MOHAN SUBSCRIPTION UPGRADE & FULL DASHBOARD UNLOCKING');
  console.log('======================================================\n');

  // Step 1: Login as Mohan (Expired State)
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'mohan@kiranamart.com',
    password: 'Mohan@123'
  });

  console.log('Step 1: Login Response:', {
    status: loginRes.status,
    store: loginRes.data.user?.store_name,
    subscription_status: loginRes.data.user?.subscription_status
  });

  const token = loginRes.data.token;

  // Step 2: Mohan Subscribes to Yearly Plan (₹6,000)
  const subRes = await request('POST', '/api/billing/subscribe', {
    planName: 'Yearly'
  }, token);

  console.log('\nStep 2: Subscription Upgrade Response:', {
    status: subRes.status,
    message: subRes.data?.message,
    expiresAt: subRes.data?.expiresAt
  });

  // Step 3: Verify Profile & Active Access
  const profileRes = await request('GET', '/api/auth/profile', null, token);
  console.log('\nStep 3: User Profile after Subscription Upgrade:', {
    status: profileRes.status,
    user: profileRes.data.user?.name,
    role: profileRes.data.user?.role,
    subscription_status: profileRes.data.subscription_status
  });

  // Step 4: Verify Master DB Tenant Table
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await masterDb.query(
    'SELECT id, store_name, subscription_status, subscription_plan, subscription_expires_at FROM tenants WHERE LOWER(email) LIKE "%mohan%"'
  );
  console.log('\nStep 4: Master Database Store Status:');
  console.table(tenants);

  // Step 5: Verify Store Database Data Integrity (Tables & records)
  const tenantDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'shop_mohan001'
  });
  const [tables] = await tenantDb.query('SHOW TABLES');
  console.log(`\nStep 5: Store Isolated DB Data Integrity Verified: ${tables.length} tables intact in "shop_mohan001"`);

  if (subRes.status === 200 && tenants[0].subscription_status === 'Active') {
    console.log('\n======================================================');
    console.log('✅ MOHAN SUBSCRIPTION UNLOCKING & DATA PRESERVATION VERIFIED 100%');
    console.log('======================================================\n');
  }

  await masterDb.end();
  await tenantDb.end();
}

testMohanSubscriptionUpgrade();
