import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const checkAndFixAdmins = async () => {
  console.log('\n======================================================');
  console.log('CHECKING & FIXING ALL EXISTING ADMIN IDS');
  console.log('======================================================\n');

  let masterConn = null;
  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });

    const [tenants] = await masterConn.query('SELECT * FROM tenants ORDER BY id ASC');
    console.log(`[Admin Check] Found ${tenants.length} tenant store(s).`);

    const nameCounts = {};

    for (const t of tenants) {
      const ownerName = t.owner_name || t.store_name || 'Admin';
      const firstWord = ownerName.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'ADMIN';
      
      nameCounts[firstWord] = (nameCounts[firstWord] || 0) + 1;
      const expectedAdminId = `${firstWord}${String(nameCounts[firstWord]).padStart(3, '0')}`;
      const expectedDbName = `shop_${expectedAdminId.toLowerCase()}`;

      console.log(`[Tenant ID ${t.id}] Owner: "${ownerName}" -> Formatted Admin ID: "${expectedAdminId}", DB: "${expectedDbName}"`);

      // Update master user login_id for this tenant's Admin
      await masterConn.query(
        'UPDATE users SET login_id = ? WHERE tenant_id = ? AND role = "Admin"',
        [expectedAdminId, t.id]
      );

      // Update tenant table database_name
      await masterConn.query(
        'UPDATE tenants SET database_name = ? WHERE id = ?',
        [expectedDbName, t.id]
      );

      // Check if tenant database needs to be renamed or schema verified
      if (t.database_name && t.database_name !== expectedDbName) {
        const baseConn = await mysql.createConnection({ host, port, user, password });
        const [oldDbExists] = await baseConn.query(`SHOW DATABASES LIKE '${t.database_name}'`);
        if (oldDbExists.length > 0) {
          await baseConn.query(`CREATE DATABASE IF NOT EXISTS \`${expectedDbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          const [tables] = await baseConn.query(`SHOW TABLES FROM \`${t.database_name}\``);
          for (const tbl of tables) {
            const tableName = Object.values(tbl)[0];
            await baseConn.query(`CREATE TABLE IF NOT EXISTS \`${expectedDbName}\`.\`${tableName}\` LIKE \`${t.database_name}\`.\`${tableName}\`;`);
            await baseConn.query(`INSERT IGNORE INTO \`${expectedDbName}\`.\`${tableName}\` SELECT * FROM \`${t.database_name}\`.\`${tableName}\`;`);
          }
          await baseConn.query(`DROP DATABASE IF EXISTS \`${t.database_name}\`;`);
          console.log(`[Migration] Migrated database "${t.database_name}" -> "${expectedDbName}".`);
        }
        await baseConn.end();
      }
    }

    const [updatedUsers] = await masterConn.query('SELECT id, email, login_id, role FROM users WHERE role = "Admin"');
    console.log('\nUpdated Active Admin Users in Master DB:', updatedUsers);

    console.log('\n======================================================');
    console.log('✅ EXISTING ADMIN IDS FORMATTED SUCCESSFULLY 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Check & Fix Failed:', err);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

checkAndFixAdmins();
