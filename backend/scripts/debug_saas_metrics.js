import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugSaaSMetrics() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await masterDb.query(`
    SELECT t.id, t.store_name, t.subscription_plan, t.subscription_status, t.subscription_expires_at,
           s.amount, s.payment_status, s.plan as sub_plan, s.status as sub_status
    FROM tenants t
    LEFT JOIN subscriptions s ON s.tenant_id = t.id AND s.status = 'Active' AND s.payment_status = 'Paid'
  `);

  console.log('\n======================================================');
  console.log('CURRENT TENANTS & ACTIVE SUBSCRIPTIONS IN MASTER DB:');
  console.table(tenants);
  console.log('======================================================\n');

  await masterDb.end();
}

debugSaaSMetrics();
