import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306
};

async function purgeTenants() {
  console.log('====================================================');
  console.log('   PERMANENTLY PURGING TENANTS 32, 33, 34 DATA     ');
  console.log('====================================================\n');

  const targetTenantIds = [32, 33, 34];
  let connection;

  try {
    connection = await mysql.createConnection({ ...dbConfig, database: 'kirana_erp_master' });
    console.log('[INFO] Connected to master database: kirana_erp_master');

    // 1. Get user IDs and database names associated with these tenants
    const [userRows] = await connection.query(
      'SELECT id, email, login_id FROM users WHERE tenant_id IN (?)',
      [targetTenantIds]
    );
    const userIds = userRows.map(u => u.id);
    console.log(`[INFO] Found ${userRows.length} users to purge:`, userRows.map(u => `${u.login_id} (${u.email})`));

    const [tenantRows] = await connection.query(
      'SELECT id, store_name, database_name FROM tenants WHERE id IN (?)',
      [targetTenantIds]
    );
    const tenantDbNames = tenantRows.map(t => t.database_name).filter(Boolean);
    console.log(`[INFO] Found ${tenantRows.length} tenants to purge:`, tenantRows.map(t => `${t.store_name} [ID: ${t.id}, DB: ${t.database_name}]`));

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Delete from master database tables
    const tablesToClean = [
      { name: 'billing_history', col: 'tenant_id', vals: targetTenantIds },
      { name: 'subscriptions', col: 'tenant_id', vals: targetTenantIds },
      { name: 'subscription_logs', col: 'tenant_id', vals: targetTenantIds },
      { name: 'notifications', col: 'tenant_id', vals: targetTenantIds },
      { name: 'activity_logs', col: 'tenant_id', vals: targetTenantIds }
    ];

    for (const t of tablesToClean) {
      const [res] = await connection.query(`DELETE FROM ${t.name} WHERE ${t.col} IN (?)`, [t.vals]);
      console.log(`  ✓ Deleted ${res.affectedRows} records from master table \`${t.name}\``);
    }

    if (userIds.length > 0) {
      const [resUserLogs] = await connection.query('DELETE FROM activity_logs WHERE user_id IN (?)', [userIds]);
      const [resUserNotifs] = await connection.query('DELETE FROM notifications WHERE user_id IN (?)', [userIds]);
      console.log(`  ✓ Deleted user activity logs (${resUserLogs.affectedRows}) & notifications (${resUserNotifs.affectedRows})`);

      const [resUsers] = await connection.query('DELETE FROM users WHERE id IN (?) OR tenant_id IN (?)', [userIds, targetTenantIds]);
      console.log(`  ✓ Deleted ${resUsers.affectedRows} user accounts from master \`users\` table`);
    }

    const [resTenants] = await connection.query('DELETE FROM tenants WHERE id IN (?)', [targetTenantIds]);
    console.log(`  ✓ Deleted ${resTenants.affectedRows} tenant entries from master \`tenants\` table`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 3. Drop physical tenant MySQL databases
    for (const dbName of tenantDbNames) {
      try {
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        console.log(`  ✓ Dropped MySQL Database: \`${dbName}\``);
      } catch (dbErr) {
        console.error(`  ✕ Error dropping database ${dbName}:`, dbErr.message);
      }
    }

    // 4. Delete tenant upload directories
    for (const dbName of tenantDbNames) {
      const uploadDirPath = path.join(__dirname, '../uploads/tenants', dbName);
      if (fs.existsSync(uploadDirPath)) {
        try {
          fs.rmSync(uploadDirPath, { recursive: true, force: true });
          console.log(`  ✓ Deleted uploads folder: ${uploadDirPath}`);
        } catch (fsErr) {
          console.error(`  ✕ Error deleting uploads folder ${uploadDirPath}:`, fsErr.message);
        }
      }
    }

    console.log('\n====================================================');
    console.log('   PERMANENT PURGE COMPLETE FOR TENANTS 32, 33, 34 ');
    console.log('====================================================');

  } catch (err) {
    console.error('[ERROR] Purge script failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

purgeTenants();
