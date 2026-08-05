import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkMohanUser() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [users] = await masterDb.query(
    'SELECT u.id, u.tenant_id, u.email, u.login_id, u.role, u.status, t.store_name, t.subscription_status FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE LOWER(t.store_name) LIKE "%mohan%" OR LOWER(u.email) LIKE "%mohan%" OR LOWER(u.login_id) LIKE "%mohan%"'
  );

  console.log('Master Users matching Mohan:');
  console.table(users);

  await masterDb.end();
}

checkMohanUser();
