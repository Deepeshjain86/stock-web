import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verify3Stores() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await masterDb.query('SELECT id, store_name, owner_name, email, database_name, subscription_plan FROM tenants ORDER BY id ASC');
  console.log('\n======================================================');
  console.log('VERIFYING OFFICIAL STORES IN MASTER DB (EXACT COUNT):', tenants.length);
  console.table(tenants);
  console.log('======================================================\n');

  await masterDb.end();
}

verify3Stores();
