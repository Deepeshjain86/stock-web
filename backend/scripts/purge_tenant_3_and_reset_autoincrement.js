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

async function purgeTenant3AndResetAutoIncrement() {
  console.log('====================================================');
  console.log('   PURGING TENANT ID 3 & RESETTING AUTO_INCREMENT   ');
  console.log('====================================================\n');

  const targetTenantId = 3;
  let connection;

  try {
    connection = await mysql.createConnection({ ...dbConfig, database: 'kirana_erp_master' });
    console.log('[INFO] Connected to master database: kirana_erp_master');

    // 1. Get users and database name associated with tenant ID 3
    const [userRows] = await connection.query(
      'SELECT id, email, login_id FROM users WHERE tenant_id = ?',
      [targetTenantId]
    );
    const userIds = userRows.map(u => u.id);
    console.log(`[INFO] Found ${userRows.length} users to purge for tenant 3:`, userRows.map(u => `${u.login_id} (${u.email})`));

    const [tenantRows] = await connection.query(
      'SELECT id, store_name, database_name FROM tenants WHERE id = ?',
      [targetTenantId]
    );
    const tenantDbName = tenantRows[0]?.database_name || 'shop_dinesh001';
    console.log(`[INFO] Found tenant 3:`, tenantRows.map(t => `${t.store_name} [ID: ${t.id}, DB: ${t.database_name}]`));

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Delete from master database tables
    const tablesToClean = [
      { name: 'billing_history', col: 'tenant_id' },
      { name: 'subscriptions', col: 'tenant_id' },
      { name: 'subscription_logs', col: 'tenant_id' },
      { name: 'notifications', col: 'tenant_id' },
      { name: 'activity_logs', col: 'tenant_id' }
    ];

    for (const t of tablesToClean) {
      const [res] = await connection.query(`DELETE FROM ${t.name} WHERE ${t.col} = ?`, [targetTenantId]);
      console.log(`  ✓ Deleted ${res.affectedRows} records from master table \`${t.name}\``);
    }

    if (userIds.length > 0) {
      const [resUserLogs] = await connection.query('DELETE FROM activity_logs WHERE user_id IN (?)', [userIds]);
      const [resUserNotifs] = await connection.query('DELETE FROM notifications WHERE user_id IN (?)', [userIds]);
      console.log(`  ✓ Deleted user activity logs (${resUserLogs.affectedRows}) & notifications (${resUserNotifs.affectedRows})`);

      const [resUsers] = await connection.query('DELETE FROM users WHERE id IN (?) OR tenant_id = ?', [userIds, targetTenantId]);
      console.log(`  ✓ Deleted ${resUsers.affectedRows} user accounts from master \`users\` table`);
    }

    const [resTenants] = await connection.query('DELETE FROM tenants WHERE id = ?', [targetTenantId]);
    console.log(`  ✓ Deleted ${resTenants.affectedRows} tenant entry from master \`tenants\` table`);

    // 3. Drop physical MySQL database
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
      console.log(`  ✓ Dropped MySQL Database: \`${tenantDbName}\``);
    } catch (dbErr) {
      console.error(`  ✕ Error dropping database ${tenantDbName}:`, dbErr.message);
    }

    // 4. Delete tenant upload directory
    const uploadDirPath = path.join(__dirname, '../uploads/tenants', tenantDbName);
    if (fs.existsSync(uploadDirPath)) {
      try {
        fs.rmSync(uploadDirPath, { recursive: true, force: true });
        console.log(`  ✓ Deleted uploads folder: ${uploadDirPath}`);
      } catch (fsErr) {
        console.error(`  ✕ Error deleting uploads folder ${uploadDirPath}:`, fsErr.message);
      }
    }

    // 5. Reset AUTO_INCREMENT on tenants and users table
    const [[maxTenantRow]] = await connection.query('SELECT COALESCE(MAX(id), 0) as max_id FROM tenants');
    const nextTenantId = Number(maxTenantRow.max_id) + 1;
    await connection.query(`ALTER TABLE tenants AUTO_INCREMENT = ${nextTenantId}`);
    console.log(`  ✓ Reset AUTO_INCREMENT on \`tenants\` table to: ${nextTenantId} (Next new store will get ID = ${nextTenantId})`);

    const [[maxUserRow]] = await connection.query('SELECT COALESCE(MAX(id), 0) as max_id FROM users');
    const nextUserId = Number(maxUserRow.max_id) + 1;
    await connection.query(`ALTER TABLE users AUTO_INCREMENT = ${nextUserId}`);
    console.log(`  ✓ Reset AUTO_INCREMENT on \`users\` table to: ${nextUserId}`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 6. Print remaining active tenants
    const [remainingTenants] = await connection.query('SELECT id, store_name, owner_name, email, database_name FROM tenants ORDER BY id ASC');
    console.log('\n--- Remaining Active Tenants ---');
    console.log(remainingTenants);

    console.log('\n====================================================');
    console.log(`   TENANT 3 PURGED & AUTO_INCREMENT RESET TO ${nextTenantId} `);
    console.log('====================================================');

  } catch (err) {
    console.error('[ERROR] Script failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

purgeTenant3AndResetAutoIncrement();
