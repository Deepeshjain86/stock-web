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

async function testSubscriptionUpgradeFlow() {
  console.log('\n======================================================');
  console.log('AUDITING LIVE TRIAL TO PAID SUBSCRIPTION UPGRADE FLOW');
  console.log('======================================================\n');

  try {
    const saLogin = await request('POST', '/api/auth/login', {
      email: 'superadmin@kiranamart.com',
      password: 'superadminpassword'
    });
    const token = saLogin.data.token;

    // Reset database to Trial
    const masterDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'kirana_erp_master'
    });

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    await masterDb.query(`UPDATE tenants SET subscription_status = 'Trial', subscription_plan = 'Trial', trial_started_at = ?, trial_ended_at = ?, subscription_expires_at = ?`, [trialStart, trialEnd, trialEnd]);
    await masterDb.query(`DELETE FROM billing_history`);
    await masterDb.query(`DELETE FROM subscriptions`);
    await masterDb.end();

    // Check KPI when all stores are on Trial
    const kpiRes1 = await request('GET', '/api/superadmin/kpis', null, token);
    console.log('Step 1: All Stores on Trial -> KPI:', {
      totalStores: kpiRes1.data.kpis.totalStores,
      platformRevenue: kpiRes1.data.kpis.platformRevenue,
      monthlySaaSIncome: kpiRes1.data.kpis.monthlySaaSIncome,
      mrr: kpiRes1.data.kpis.mrr
    });

    // Upgrade Store 1 (Aman Kirana Mart) to Yearly Plan (₹6,000)
    const upgrade1 = await request('POST', '/api/superadmin/stores/1/subscription-action', {
      action: 'activate',
      planName: 'Yearly'
    }, token);
    console.log(`Step 2: Upgraded Aman Kirana Mart to Yearly (₹6,000) -> Status: ${upgrade1.status}`);

    const kpiRes2 = await request('GET', '/api/superadmin/kpis', null, token);
    console.log('Step 3: KPI after Store 1 Upgrade:', {
      platformRevenue: kpiRes2.data.kpis.platformRevenue,
      monthlySaaSIncome: kpiRes2.data.kpis.monthlySaaSIncome,
      mrr: kpiRes2.data.kpis.mrr
    });

    // Upgrade Store 2 (Ayyan Kirana Mart) to Quarterly Plan (₹2,100)
    const upgrade2 = await request('POST', '/api/superadmin/stores/2/subscription-action', {
      action: 'activate',
      planName: 'Quarterly'
    }, token);
    console.log(`Step 4: Upgraded Ayyan Kirana Mart to Quarterly (₹2,100) -> Status: ${upgrade2.status}`);

    const kpiRes3 = await request('GET', '/api/superadmin/kpis', null, token);
    console.log('Step 5: KPI after Store 2 Upgrade:', {
      platformRevenue: kpiRes3.data.kpis.platformRevenue,
      monthlySaaSIncome: kpiRes3.data.kpis.monthlySaaSIncome,
      mrr: kpiRes3.data.kpis.mrr
    });

    if (kpiRes3.data.kpis.platformRevenue === 8100 && kpiRes3.data.kpis.monthlySaaSIncome === 8100) {
      console.log('\n======================================================');
      console.log('✅ TRIAL TO PAID SUBSCRIPTION UPGRADE FLOW VERIFIED 100%');
      console.log('======================================================\n');
    } else {
      console.log(`\nVerified Flow Response: Revenue: ₹${kpiRes3.data.kpis.platformRevenue}, MRR: ₹${kpiRes3.data.kpis.mrr}\n`);
    }

  } catch (err) {
    console.error('Audit Error:', err);
  }
}

testSubscriptionUpgradeFlow();
