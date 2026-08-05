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

async function testTrialToPaidFlow() {
  console.log('\n======================================================');
  console.log('AUDITING COMPLETE 7-DAY TRIAL TO PAID SUBSCRIPTION FLOW');
  console.log('======================================================\n');

  const testEmail = `merchant_trial_${Date.now()}@kiranaerp.com`;

  // Step 1: Merchant Registers Store (7-Day Trial)
  const regRes = await request('POST', '/api/auth/register-store', {
    store_name: 'Gupta Grocery Mart',
    owner_name: 'Gupta Ji',
    email: testEmail,
    password: 'password123',
    phone: '9988776655',
    address: 'Indirapuram, Ghaziabad'
  });

  console.log(`Step 1: Register Merchant Store -> Status: ${regRes.status}`, {
    store: regRes.data.user?.store_name,
    plan: regRes.data.user?.subscription_plan,
    status: regRes.data.user?.subscription_status,
    trial_ended_at: regRes.data.user?.trial_ended_at
  });

  const tenantToken = regRes.data.token;
  const tenantId = regRes.data.user?.tenantId;

  // Step 2: Merchant Store Upgrades to Yearly Plan (₹6,000)
  const subRes = await request('POST', '/api/billing/subscribe', {
    planName: 'Yearly'
  }, tenantToken);

  console.log(`Step 2: Merchant Upgrades to Yearly Plan -> Status: ${subRes.status}`, {
    message: subRes.data?.message,
    expiresAt: subRes.data?.expiresAt
  });

  // Step 3: Verify Billing Status
  const statusRes = await request('GET', '/api/billing/status', null, tenantToken);
  console.log('Step 3: Billing Status Response:', {
    store_name: statusRes.data.subscription?.store_name,
    subscription_plan: statusRes.data.subscription?.subscription_plan,
    subscription_status: statusRes.data.subscription?.subscription_status,
    invoices_count: statusRes.data.invoices?.length
  });

  // Step 4: Verify Super Admin SaaS Income Update
  const saLogin = await request('POST', '/api/auth/login', {
    email: 'superadmin@kiranamart.com',
    password: 'superadminpassword'
  });
  const saToken = saLogin.data.token;

  const kpiRes = await request('GET', '/api/superadmin/kpis', null, saToken);
  console.log('Step 4: Live Super Admin SaaS Revenue KPI:', {
    monthlySaaSIncome: kpiRes.data.kpis?.monthlySaaSIncome,
    platformRevenue: kpiRes.data.kpis?.platformRevenue,
    mrr: kpiRes.data.kpis?.mrr
  });

  if (kpiRes.data.kpis?.monthlySaaSIncome === 6000 && statusRes.data.subscription?.subscription_plan === 'Yearly') {
    console.log('\n======================================================');
    console.log('✅ COMPLETE 7-DAY TRIAL TO PAID SUBSCRIPTION FLOW VERIFIED 100%');
    console.log('======================================================\n');
  }

  // Cleanup test data
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });
  const tenantDbName = regRes.data.user?.tenantDbName;
  if (tenantDbName) await masterDb.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
  await masterDb.query('DELETE FROM users WHERE email = ?', [testEmail]);
  await masterDb.query('DELETE FROM tenants WHERE email = ?', [testEmail]);
  await masterDb.query('DELETE FROM billing_history WHERE tenant_id = ?', [tenantId]);
  await masterDb.query('DELETE FROM subscriptions WHERE tenant_id = ?', [tenantId]);
  await masterDb.end();
  console.log('🧹 Cleaned up temporary trial audit data.');
}

testTrialToPaidFlow();
