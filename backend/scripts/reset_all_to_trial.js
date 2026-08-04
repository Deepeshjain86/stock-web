import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function resetAllToTrial() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  console.log('\n======================================================');
  console.log('RESETTING ALL OFFICIAL STORES TO TRIAL STATUS');
  console.log('======================================================\n');

  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  // Update all tenants to Trial Active
  await masterDb.query(`
    UPDATE tenants 
    SET subscription_status = 'Trial', 
        subscription_plan = 'Trial', 
        trial_started_at = ?, 
        trial_ended_at = ?, 
        subscription_expires_at = ?,
        trial_used = 1
  `, [trialStart, trialEnd, trialEnd]);

  // Clean pending/old active subscriptions if needed or reset primary active subscription row
  await masterDb.query(`UPDATE subscriptions SET status = 'Trial', plan = 'Trial', payment_status = 'Paid', amount = 0.00 WHERE tenant_id IN (1, 2, 3)`);

  const [tenants] = await masterDb.query('SELECT id, store_name, subscription_plan, subscription_status, subscription_expires_at FROM tenants');
  console.log('Updated Tenants Status:');
  console.table(tenants);

  console.log('\n======================================================');
  console.log('✅ ALL STORES SUCCESSFULLY RESET TO TRIAL ACTIVE');
  console.log('======================================================\n');

  await masterDb.end();
}

resetAllToTrial();
