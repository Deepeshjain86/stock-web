import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function deleteAdminKiranamart() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log(`Connecting to MySQL at ${host}:${port}...`);
  const conn = await mysql.createConnection({ host, port, user, password, database: masterDb });

  try {
    // 1. Find Tenant ID and DB Name for admin@kiranamart.com
    const [tenants] = await conn.query('SELECT * FROM tenants WHERE email = "admin@kiranamart.com" OR tenant_uuid = "TENT-KIRANAMART-001"');
    
    let tenantId = null;
    let databaseName = 'kirana_erp_tenant_1';

    if (tenants.length > 0) {
      tenantId = tenants[0].id;
      databaseName = tenants[0].database_name;
      console.log(`Found tenant record: ID=${tenantId}, Database=${databaseName}`);
    } else {
      console.log('No tenant record found for admin@kiranamart.com, searching by database name...');
    }

    // 2. Drop Tenant Database permanently
    console.log(`Dropping MySQL database "${databaseName}" permanently...`);
    await conn.query(`DROP DATABASE IF EXISTS \`${databaseName}\`;`);
    console.log(`Database "${databaseName}" dropped successfully.`);

    // Also drop kirana_erp_tenant_1 just in case
    await conn.query(`DROP DATABASE IF EXISTS \`kirana_erp_tenant_1\`;`);

    // 3. Remove records from Master Database tables
    if (tenantId) {
      console.log(`Deleting activity logs for tenant ID ${tenantId}...`);
      await conn.query('DELETE FROM activity_logs WHERE tenant_id = ?', [tenantId]);

      console.log(`Deleting notifications for tenant ID ${tenantId}...`);
      await conn.query('DELETE FROM notifications WHERE tenant_id = ?', [tenantId]);

      console.log(`Deleting billing history for tenant ID ${tenantId}...`);
      await conn.query('DELETE FROM billing_history WHERE tenant_id = ?', [tenantId]);

      console.log(`Deleting subscription logs for tenant ID ${tenantId}...`);
      await conn.query('DELETE FROM subscription_logs WHERE tenant_id = ?', [tenantId]);

      console.log(`Deleting users associated with tenant ID ${tenantId}...`);
      await conn.query('DELETE FROM users WHERE tenant_id = ?', [tenantId]);

      console.log(`Deleting tenant record ID ${tenantId}...`);
      await conn.query('DELETE FROM tenants WHERE id = ?', [tenantId]);
    }

    // Cleanup any orphaned users with admin@kiranamart.com or staff@kiranamart.com
    console.log('Cleaning up any orphaned user entries for admin@kiranamart.com and staff@kiranamart.com...');
    await conn.query('DELETE FROM users WHERE email IN ("admin@kiranamart.com", "staff@kiranamart.com")');
    await conn.query('DELETE FROM tenants WHERE email = "admin@kiranamart.com" OR tenant_uuid = "TENT-KIRANAMART-001"');

    console.log('\n======================================================');
    console.log('SUCCESS: admin@kiranamart.com AND ITS DATABASE WERE PERMANENTLY REMOVED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await conn.end();
  }
}

deleteAdminKiranamart();
