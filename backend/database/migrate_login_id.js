import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`Connecting to database at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log(`Selecting Master Database "${masterDb}"...`);
    await conn.query(`USE \`${masterDb}\`;`);

    console.log('Altering users table in Master DB...');
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN login_id VARCHAR(50) NULL UNIQUE;`);
      console.log('  -> Added login_id column to users table in Master DB.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME' || err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
        console.log('  -> login_id column already exists in Master DB users table.');
      } else {
        throw err;
      }
    }

    // Set default login_ids for seeded global users
    console.log('Setting login_ids for seeded global users...');
    await conn.query(`UPDATE users SET login_id = 'superadmin' WHERE email = 'superadmin@kiranamart.com' AND login_id IS NULL`);
    await conn.query(`UPDATE users SET login_id = 'DEEPESH01' WHERE email = 'admin@kiranamart.com' AND login_id IS NULL`);
    await conn.query(`UPDATE users SET login_id = 'DEEPESH01-EM0001' WHERE email = 'staff@kiranamart.com' AND login_id IS NULL`);

    // Fetch all tenants to migrate their databases too
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`Found ${tenants.length} tenants to upgrade.`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`Upgrading Tenant Database: "${dbName}" (${tenant.store_name})`);

      try {
        await conn.query(`USE \`${dbName}\`;`);

        // Check/Add login_id to local users
        let hasColumn = false;
        try {
          const [columns] = await conn.query(`SHOW COLUMNS FROM users LIKE 'login_id'`);
          hasColumn = columns.length > 0;
        } catch (err) {
          console.error('Failed to check columns:', err.message);
        }

        if (!hasColumn) {
          await conn.query(`ALTER TABLE users ADD COLUMN login_id VARCHAR(50) NULL;`);
          console.log('  -> Added nullable login_id column.');
        }

        // Set local login_ids
        if (dbName === 'kirana_erp_tenant_1') {
          console.log('  -> Seeding login_ids for tenant 1 users...');
          await conn.query(`UPDATE users SET login_id = 'DEEPESH01' WHERE email = 'admin@kiranamart.com'`);
          await conn.query(`UPDATE users SET login_id = 'DEEPESH01-EM0001' WHERE email = 'staff@kiranamart.com'`);
        } else {
          // General fallback for other tenants
          const storeBase = tenant.store_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || 'TENANT';
          const [localUsers] = await conn.query(`SELECT id, email, role_id FROM users`);
          for (let i = 0; i < localUsers.length; i++) {
            const u = localUsers[i];
            const [roleRows] = await conn.query('SELECT name FROM roles WHERE id = ?', [u.role_id]);
            const roleName = roleRows[0]?.name;
            let loginId = `${storeBase}01`;
            if (roleName !== 'Admin') {
              loginId = `${storeBase}01-EM${String(i).padStart(4, '0')}`;
            }
            await conn.query(`UPDATE users SET login_id = ? WHERE id = ?`, [loginId, u.id]);
          }
        }

        // Now that all login_ids are populated, make it NOT NULL and UNIQUE
        if (!hasColumn) {
          try {
            await conn.query(`ALTER TABLE users MODIFY COLUMN login_id VARCHAR(50) NOT NULL;`);
            await conn.query(`ALTER TABLE users ADD UNIQUE KEY unique_login_id (login_id);`);
            console.log('  -> Made login_id column NOT NULL and UNIQUE.');
          } catch (err) {
            console.error('  -> Failed to enforce UNIQUE constraint:', err.message);
          }
        }
      } catch (err) {
        console.error(`Error migrating tenant db ${dbName}:`, err.message);
      }
    }

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runMigration();
