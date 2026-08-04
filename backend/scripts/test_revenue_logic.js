import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testRevenueLogic() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  // 1. Total paid from billing_history
  const [bRes] = await masterDb.query('SELECT COALESCE(SUM(amount), 0) as total FROM billing_history WHERE payment_status = "Paid"');
  console.log('1. billing_history Paid sum:', bRes[0].total);

  // 2. Latest active subscription payment for each active store
  const [latestSubs] = await masterDb.query(`
    SELECT s.tenant_id, s.plan, s.amount, s.created_at
    FROM subscriptions s
    INNER JOIN (
      SELECT tenant_id, MAX(id) as max_id
      FROM subscriptions
      WHERE payment_status = 'Paid' AND amount > 0
      GROUP BY tenant_id
    ) latest ON s.tenant_id = latest.tenant_id AND s.id = latest.max_id
  `);
  console.log('2. Latest Paid Subscriptions per store:', latestSubs);

  const activeStoreRevenueSum = latestSubs.reduce((acc, s) => acc + Number(s.amount), 0);
  console.log('3. Active Stores Latest Subscription Value Sum:', activeStoreRevenueSum);

  // 4. Monthly Amortized MRR
  const PLAN_RATES = {
    Monthly: 800,
    Quarterly: 2100,
    'Half-Yearly': 3600,
    Yearly: 6000
  };

  let mrr = 0;
  latestSubs.forEach(s => {
    const rate = Number(s.amount) > 0 ? Number(s.amount) : (PLAN_RATES[s.plan] || 800);
    if (s.plan === 'Monthly') mrr += rate;
    else if (s.plan === 'Quarterly') mrr += Math.round(rate / 3);
    else if (s.plan === 'Half-Yearly') mrr += Math.round(rate / 6);
    else if (s.plan === 'Yearly') mrr += Math.round(rate / 12);
  });
  console.log('4. Monthly Amortized MRR:', mrr);

  await masterDb.end();
}

testRevenueLogic();
