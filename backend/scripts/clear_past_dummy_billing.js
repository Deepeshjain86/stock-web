import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function clearPastDummyBilling() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  console.log('\n======================================================');
  console.log('CLEARING ALL DUMMY BILLING INVOICES & SUBSCRIPTIONS');
  console.log('======================================================\n');

  // Truncate/delete billing_history and subscriptions tables
  await masterDb.query('DELETE FROM billing_history');
  await masterDb.query('DELETE FROM subscriptions');

  // Insert default Trial subscription for the 3 official stores
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  await masterDb.query(`
    UPDATE tenants 
    SET subscription_status = 'Trial', 
        subscription_plan = 'Trial', 
        trial_started_at = ?, 
        trial_ended_at = ?, 
        subscription_expires_at = ?,
        trial_used = 1
  `, [trialStart, trialEnd, trialEnd]);

  for (const tenantId of [1, 2, 3]) {
    await masterDb.query(
      `INSERT INTO subscriptions (tenant_id, plan, status, trial_start_date, trial_end_date, payment_status, payment_gateway, amount)
       VALUES (?, 'Trial', 'Trial', ?, ?, 'Paid', 'System', 0.00)`,
      [tenantId, trialStart, trialEnd]
    );
  }

  console.log('✅ Cleared all dummy billing history and reset all 3 stores to Trial status with ₹0 income!');

  await masterDb.end();
}

clearPastDummyBilling();
