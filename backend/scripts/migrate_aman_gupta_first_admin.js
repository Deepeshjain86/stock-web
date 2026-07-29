import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const migrateFirstAdminAman = async () => {
  console.log('\n======================================================');
  console.log('MIGRATING FIRST ADMIN (AMAN GUPTA) & CLEANING TEST DATA');
  console.log('======================================================\n');

  let baseConn = null;
  try {
    baseConn = await mysql.createConnection({ host, port, user, password });
    console.log('[Migration] Connected to MySQL database server.');

    // 1. Locate Aman Gupta in Master Database
    const [amanTenants] = await baseConn.query(`
      SELECT * FROM \`${masterDb}\`.tenants 
      WHERE email = 'aman@kiranaerp.com' OR owner_name LIKE '%Aman%' 
      LIMIT 1
    `);

    if (amanTenants.length === 0) {
      throw new Error('Aman Gupta tenant account not found in Master Database!');
    }

    const amanTenant = amanTenants[0];
    const amanTenantId = amanTenant.id;
    const oldDbName = amanTenant.database_name || 'aman01';
    const newDbName = 'shop_aman001';
    const newAdminId = 'AMAN001';

    console.log(`[Migration] Found Aman Gupta (Tenant ID: ${amanTenantId}, Current DB: "${oldDbName}")`);

    // 2. Provision / Migrate database to "shop_aman001"
    await baseConn.query(`CREATE DATABASE IF NOT EXISTS \`${newDbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

    // Check if old DB exists and copy tables
    const [oldDbCheck] = await baseConn.query(`SHOW DATABASES LIKE '${oldDbName}'`);
    if (oldDbCheck.length > 0) {
      console.log(`[Migration] Copying tables and data from "${oldDbName}" to "${newDbName}"...`);
      const [tables] = await baseConn.query(`SHOW TABLES FROM \`${oldDbName}\``);
      for (const t of tables) {
        const tableName = Object.values(t)[0];
        await baseConn.query(`CREATE TABLE IF NOT EXISTS \`${newDbName}\`.\`${tableName}\` LIKE \`${oldDbName}\`.\`${tableName}\`;`);
        await baseConn.query(`INSERT IGNORE INTO \`${newDbName}\`.\`${tableName}\` SELECT * FROM \`${oldDbName}\`.\`${tableName}\`;`);
      }
      console.log(`[Migration] Successfully copied all tables to "${newDbName}".`);
    }

    // 3. Update Aman Gupta's Master DB record & users
    await baseConn.query(
      `UPDATE \`${masterDb}\`.tenants SET database_name = ? WHERE id = ?`,
      [newDbName, amanTenantId]
    );

    await baseConn.query(
      `UPDATE \`${masterDb}\`.users SET login_id = ? WHERE tenant_id = ? AND role = 'Admin'`,
      [newAdminId, amanTenantId]
    );

    // Update employee login_ids in Master users for Aman
    const [amanEmployees] = await baseConn.query(
      `SELECT id, login_id FROM \`${masterDb}\`.users WHERE tenant_id = ? AND role != 'Admin'`,
      [amanTenantId]
    );

    for (const emp of amanEmployees) {
      if (emp.login_id && !emp.login_id.startsWith(newAdminId)) {
        const updatedEmpId = emp.login_id.replace(/^AMAN01/, newAdminId);
        await baseConn.query(`UPDATE \`${masterDb}\`.users SET login_id = ? WHERE id = ?`, [updatedEmpId, emp.id]);
      }
    }

    // Update local Admin user login_id in shop_aman001
    await baseConn.query(
      `UPDATE \`${newDbName}\`.users SET login_id = ? WHERE role_id = (SELECT id FROM \`${newDbName}\`.roles WHERE name = 'Admin')`,
      [newAdminId]
    );

    // 4. Create Tenant Isolated Storage Directory for Aman Gupta
    const amanStorageDir = path.join(__dirname, '../uploads/tenants', newDbName);
    const subDirs = ['products', 'logos', 'documents', 'invoices', 'exports', 'imports'];
    for (const sub of subDirs) {
      const dirPath = path.join(amanStorageDir, sub);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Move existing products files if any in uploads/products/ to uploads/tenants/shop_aman001/products/
    const oldProductsDir = path.join(__dirname, '../uploads/products');
    if (fs.existsSync(oldProductsDir)) {
      const files = fs.readdirSync(oldProductsDir);
      for (const file of files) {
        const srcFile = path.join(oldProductsDir, file);
        const destFile = path.join(amanStorageDir, 'products', file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
      console.log(`[Migration] Migrated ${files.length} product image files to "uploads/tenants/${newDbName}/products/"`);
    }

    // Move existing logos if any in uploads/logos/ to uploads/tenants/shop_aman001/logos/
    const oldLogosDir = path.join(__dirname, '../uploads/logos');
    if (fs.existsSync(oldLogosDir)) {
      const files = fs.readdirSync(oldLogosDir);
      for (const file of files) {
        const srcFile = path.join(oldLogosDir, file);
        const destFile = path.join(amanStorageDir, 'logos', file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
      console.log(`[Migration] Migrated ${files.length} logo files to "uploads/tenants/${newDbName}/logos/"`);
    }

    // Update product image_urls in shop_aman001 to tenant-isolated path
    await baseConn.query(
      `UPDATE \`${newDbName}\`.products 
       SET image_url = REPLACE(image_url, '/uploads/products/', '/uploads/tenants/shop_aman001/products/') 
       WHERE image_url LIKE '/uploads/products/%'`
    );

    // Update store_logo in shop_aman001 settings to tenant-isolated path
    await baseConn.query(
      `UPDATE \`${newDbName}\`.settings 
       SET value = REPLACE(value, '/uploads/logos/', '/uploads/tenants/shop_aman001/logos/') 
       WHERE \`key\` = 'store_logo' AND value LIKE '/uploads/logos/%'`
    );

    console.log(`[Migration] Successfully arranged Aman Gupta data to new multi-tenant SaaS standard.`);

    // 5. PERMANENTLY REMOVE all other test stores and non-Aman admin accounts
    const [allTenants] = await baseConn.query(`SELECT id, store_name, database_name FROM \`${masterDb}\`.tenants WHERE id != ?`, [amanTenantId]);

    for (const t of allTenants) {
      console.log(`[Cleanup] Permanently removing test tenant "${t.store_name}" (DB: ${t.database_name}, ID: ${t.id})...`);
      
      if (t.database_name && t.database_name !== oldDbName && t.database_name !== newDbName) {
        await baseConn.query(`DROP DATABASE IF EXISTS \`${t.database_name}\`;`);
      }

      await baseConn.query(`DELETE FROM \`${masterDb}\`.subscriptions WHERE tenant_id = ?`, [t.id]);
      await baseConn.query(`DELETE FROM \`${masterDb}\`.billing_history WHERE tenant_id = ?`, [t.id]);
      await baseConn.query(`DELETE FROM \`${masterDb}\`.subscription_logs WHERE tenant_id = ?`, [t.id]);
      await baseConn.query(`DELETE FROM \`${masterDb}\`.users WHERE tenant_id = ?`, [t.id]);
      await baseConn.query(`DELETE FROM \`${masterDb}\`.tenants WHERE id = ?`, [t.id]);
    }

    // Drop legacy databases if present
    const legacyDbs = ['ajay01', 'kirana_erp_tenant_1', 'shop_sachin001', 'kirana_erp'];
    for (const lDb of legacyDbs) {
      if (lDb !== newDbName) {
        await baseConn.query(`DROP DATABASE IF EXISTS \`${lDb}\`;`);
      }
    }
    if (oldDbName !== newDbName) {
      await baseConn.query(`DROP DATABASE IF EXISTS \`${oldDbName}\`;`);
    }

    console.log('\n======================================================');
    console.log('✅ AMAN GUPTA (FIRST ADMIN) MIGRATED & CLEANUP COMPLETED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ MIGRATION FAILED:', err);
    process.exit(1);
  } finally {
    if (baseConn) await baseConn.end();
  }
};

migrateFirstAdminAman();
