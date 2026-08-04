import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanTestStores() {
  console.log('\n======================================================');
  console.log('PURGING ALL AUTO-GENERATED TEST STORES & DATABASES');
  console.log('======================================================\n');

  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const allowedEmails = ['dinesh@kiranaerp.com', 'ayyan@kiranaerp.com', 'aman@kiranaerp.com'];
  const allowedDbs = ['shop_dinesh001', 'shop_ayyan001', 'shop_aman001'];

  const [allTenants] = await masterDb.query('SELECT id, store_name, owner_name, email, database_name FROM tenants');
  console.log(`Total tenants currently in master DB: ${allTenants.length}`);

  const testTenants = allTenants.filter(t => !allowedEmails.includes(t.email) && !allowedDbs.includes(t.database_name));
  console.log(`Found ${testTenants.length} auto-generated test stores to purge.`);

  for (const tenant of testTenants) {
    console.log(`Deleting test tenant: "${tenant.store_name}" (Email: ${tenant.email}, DB: ${tenant.database_name})...`);
    
    // 1. Delete from tenants table in master DB
    await masterDb.query('DELETE FROM tenants WHERE id = ?', [tenant.id]);

    // 2. Delete related records in master DB (users, subscriptions, billing_history)
    await masterDb.query('DELETE FROM users WHERE tenant_id = ?', [tenant.id]);
    await masterDb.query('DELETE FROM subscriptions WHERE tenant_id = ?', [tenant.id]);

    // 3. Drop the test database from MySQL server if exists
    try {
      await masterDb.query(`DROP DATABASE IF EXISTS \`${tenant.database_name}\`;`);
      console.log(` -> Dropped MySQL database "${tenant.database_name}" successfully.`);
    } catch (err) {
      console.warn(` -> Could not drop database "${tenant.database_name}":`, err.message);
    }
  }

  const [remainingTenants] = await masterDb.query('SELECT id, store_name, owner_name, email, database_name FROM tenants');
  console.log('\n======================================================');
  console.log('OFFICIAL STORES REMAINING IN MASTER DB:');
  console.log(remainingTenants);
  console.log('======================================================\n');

  await masterDb.end();
}

cleanTestStores();
