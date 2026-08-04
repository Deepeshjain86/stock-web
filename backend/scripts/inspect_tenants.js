import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectTenants() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await masterDb.query('SELECT * FROM tenants');
  console.log('All tenants in kirana_erp_master:', tenants);

  await masterDb.end();
}

inspectTenants();
