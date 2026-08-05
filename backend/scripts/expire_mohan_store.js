import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function expireMohanStore() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  console.log('\n======================================================');
  console.log('SETTING MOHAN STORE STATUS TO EXPIRED & 0 DAYS REMAINING');
  console.log('======================================================\n');

  const pastDate = '2026-08-01 00:00:00';

  await masterDb.query(
    `UPDATE tenants 
     SET subscription_status = 'Expired', 
         subscription_expires_at = ?,
         trial_ended_at = ?
     WHERE LOWER(store_name) LIKE "%mohan%" OR LOWER(owner_name) LIKE "%mohan%" OR LOWER(email) LIKE "%mohan%"`,
    [pastDate, pastDate]
  );

  await masterDb.query(
    `UPDATE subscriptions 
     SET status = 'Expired', 
         subscription_expiry_date = ?,
         trial_end_date = ?
     WHERE tenant_id IN (SELECT id FROM tenants WHERE LOWER(store_name) LIKE "%mohan%" OR LOWER(owner_name) LIKE "%mohan%" OR LOWER(email) LIKE "%mohan%")`,
    [pastDate, pastDate]
  );

  const [updated] = await masterDb.query(
    'SELECT id, store_name, owner_name, email, database_name, subscription_status, subscription_expires_at, trial_ended_at FROM tenants WHERE LOWER(store_name) LIKE "%mohan%"'
  );

  console.log('Updated Tenant Statuses:');
  console.table(updated);

  await masterDb.end();
}

expireMohanStore();
