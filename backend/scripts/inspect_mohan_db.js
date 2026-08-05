import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectMohanDb() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await masterDb.query(
    'SELECT id, store_name, owner_name, email, database_name, subscription_status, subscription_plan, subscription_expires_at, trial_started_at, trial_ended_at FROM tenants WHERE LOWER(store_name) LIKE "%mohan%" OR LOWER(owner_name) LIKE "%mohan%" OR LOWER(email) LIKE "%mohan%"'
  );

  console.log('Current DB Tenants matching Mohan:');
  console.table(tenants);

  await masterDb.end();
}

inspectMohanDb();
