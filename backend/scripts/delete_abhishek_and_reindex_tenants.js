import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function deleteAbhishekAndReindex() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log(`Connecting to MySQL at ${host}:${port}...`);
  const conn = await mysql.createConnection({ host, port, user, password, database: masterDb });

  try {
    // 1. Delete abhishek@kiranaerp.com tenant and database
    console.log('Searching for abhishek@kiranaerp.com tenant record...');
    const [abhishekTenants] = await conn.query('SELECT * FROM tenants WHERE email = "abhishek@kiranaerp.com"');

    for (const t of abhishekTenants) {
      console.log(`Found tenant to delete: ID=${t.id}, Store=${t.store_name}, Database=${t.database_name}`);
      if (t.database_name) {
        console.log(`Dropping MySQL database "${t.database_name}"...`);
        await conn.query(`DROP DATABASE IF EXISTS \`${t.database_name}\`;`);
      }
      await conn.query('DELETE FROM activity_logs WHERE tenant_id = ?', [t.id]);
      await conn.query('DELETE FROM notifications WHERE tenant_id = ?', [t.id]);
      await conn.query('DELETE FROM billing_history WHERE tenant_id = ?', [t.id]);
      await conn.query('DELETE FROM subscription_logs WHERE tenant_id = ?', [t.id]);
      await conn.query('DELETE FROM users WHERE tenant_id = ?', [t.id]);
      await conn.query('DELETE FROM tenants WHERE id = ?', [t.id]);
    }

    // Cleanup any orphaned user entries for abhishek
    await conn.query('DELETE FROM users WHERE email = "abhishek@kiranaerp.com"');
    console.log('Abhishek tenant and user deleted successfully.');

    // 2. Re-sequence / re-index remaining Tenants starting from ID 1
    console.log('\nFetching all remaining tenants to re-sequence IDs starting from 1...');
    const [remainingTenants] = await conn.query('SELECT * FROM tenants ORDER BY id ASC');

    console.log(`Found ${remainingTenants.length} remaining tenant(s). Re-indexing...`);

    // Disable foreign keys temporarily for clean ID updates
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    let nextId = 1;
    for (const tenant of remainingTenants) {
      const oldId = tenant.id;
      const newId = nextId;

      if (oldId !== newId) {
        console.log(`Updating Tenant ID: ${oldId} -> ${newId} (${tenant.store_name})`);
        
        await conn.query('UPDATE tenants SET id = ? WHERE id = ?', [newId, oldId]);
        await conn.query('UPDATE users SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        await conn.query('UPDATE activity_logs SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        await conn.query('UPDATE notifications SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        await conn.query('UPDATE billing_history SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        await conn.query('UPDATE subscription_logs SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        
        // Also check if subscriptions table exists in master DB
        try {
          await conn.query('UPDATE subscriptions SET tenant_id = ? WHERE tenant_id = ?', [newId, oldId]);
        } catch (e) {
          // Table might not exist or might be empty
        }
      } else {
        console.log(`Tenant ID ${oldId} is already ${newId} (${tenant.store_name}).`);
      }
      nextId++;
    }

    // 3. Reset AUTO_INCREMENT on tenants table so next store created gets next sequential ID
    console.log(`Resetting tenants AUTO_INCREMENT to ${nextId}...`);
    await conn.query(`ALTER TABLE tenants AUTO_INCREMENT = ${nextId};`);

    // Enable foreign keys back
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n======================================================');
    console.log(`SUCCESS: abhishek@kiranaerp.com deleted and remaining tenant IDs re-indexed starting from 1! Next AUTO_INCREMENT is ${nextId}.`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await conn.end();
  }
}

deleteAbhishekAndReindex();
