import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';
const targetAdminId = 'SACHIN001';
const targetEmail = 'sachin@kiranaerp.com';
const targetDbName = 'shop_sachin001';

const purgeSachinTenant = async () => {
  console.log('\n======================================================');
  console.log(`PERMANENTLY PURGING TENANT SACHIN001 & RELATED DATA`);
  console.log('======================================================\n');

  let baseConn = null;
  try {
    baseConn = await mysql.createConnection({ host, port, user, password });

    // 1. Delete from Master DB tenants table
    const [delTenantRes] = await baseConn.query(
      `DELETE FROM \`${masterDb}\`.tenants WHERE database_name = ? OR UPPER(owner_name) LIKE '%SACHIN%' OR email = ?`,
      [targetDbName, targetEmail]
    );
    console.log(`[Purge] Removed ${delTenantRes.affectedRows} record(s) from Master tenants table.`);

    // 2. Delete from Master DB users table
    const [delUserRes] = await baseConn.query(
      `DELETE FROM \`${masterDb}\`.users WHERE UPPER(login_id) = ? OR LOWER(email) = ?`,
      [targetAdminId, targetEmail]
    );
    console.log(`[Purge] Removed ${delUserRes.affectedRows} record(s) from Master users table.`);

    // 3. Drop MySQL Tenant Database
    await baseConn.query(`DROP DATABASE IF EXISTS \`${targetDbName}\`;`);
    console.log(`[Purge] Dropped database "${targetDbName}" completely.`);

    // 4. Remove dedicated upload folder on disk
    const tenantUploadDir = path.join('uploads', 'tenants', targetDbName);
    if (fs.existsSync(tenantUploadDir)) {
      fs.rmSync(tenantUploadDir, { recursive: true, force: true });
      console.log(`[Purge] Deleted upload directory "${tenantUploadDir}".`);
    } else {
      console.log(`[Purge] Upload directory "${tenantUploadDir}" does not exist.`);
    }

    // 5. Verify Master DB remaining tenants
    const [remainingTenants] = await baseConn.query(`SELECT id, store_name, owner_name, email, database_name FROM \`${masterDb}\`.tenants`);
    console.log('\nRemaining Active Tenant Stores in Master DB:', remainingTenants);

    console.log('\n======================================================');
    console.log(`✅ SACHIN001 PERMANENTLY PURGED 100%`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Purge Failed:', err);
  } finally {
    if (baseConn) await baseConn.end();
  }
};

purgeSachinTenant();
