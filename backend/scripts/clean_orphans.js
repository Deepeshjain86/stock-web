import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanOrphans() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const officialDbs = ['shop_aman001', 'shop_ayyan001', 'shop_dinesh001'];
  const officialTenantIds = [1, 2, 3];

  await masterDb.query('DELETE FROM tenants WHERE database_name NOT IN (?, ?, ?)', officialDbs);
  await masterDb.query('DELETE FROM users WHERE tenant_id NOT IN (?, ?, ?) AND role != "Super Admin"', officialTenantIds);
  await masterDb.query('DELETE FROM subscriptions WHERE tenant_id NOT IN (?, ?, ?)', officialTenantIds);
  await masterDb.query('DELETE FROM billing_history WHERE tenant_id NOT IN (?, ?, ?)', officialTenantIds);

  console.log('✅ Cleaned all non-official orphan tenant records.');
  await masterDb.end();
}

cleanOrphans();
