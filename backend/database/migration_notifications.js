import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`[Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Upgrade Master Database
    console.log(`[Migration] Selecting Master Database "${masterDb}"...`);
    await conn.query(`USE \`${masterDb}\`;`);

    console.log('[Migration] Creating notifications table in Master DB if not exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NULL,
        type VARCHAR(30) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message VARCHAR(255) NOT NULL,
        priority VARCHAR(20) DEFAULT 'Medium',
        related_user VARCHAR(150) NULL,
        related_module VARCHAR(50) NULL,
        target_roles VARCHAR(255) DEFAULT 'Super Admin',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);
    console.log('  -> Master DB notifications table created/checked.');

    // Ensure columns are properly modified/added just in case it already existed
    try {
      await conn.query(`ALTER TABLE notifications MODIFY tenant_id INT NULL;`);
    } catch (err) {}

    const columnsToAddMaster = [
      { name: 'priority', definition: `VARCHAR(20) DEFAULT 'Medium'` },
      { name: 'related_user', definition: `VARCHAR(150) NULL` },
      { name: 'related_module', definition: `VARCHAR(50) NULL` },
      { name: 'target_roles', definition: `VARCHAR(255) DEFAULT 'Super Admin'` }
    ];

    for (const col of columnsToAddMaster) {
      try {
        await conn.query(`ALTER TABLE notifications ADD COLUMN ${col.name} ${col.definition};`);
        console.log(`  -> Added ${col.name} column to notifications in Master DB.`);
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          // already exists
        } else {
          console.error(`  -> Failed to add ${col.name} column in Master DB:`, err.message);
        }
      }
    }

    // 2. Fetch all tenants
    console.log('[Migration] Fetching registered stores/tenants...');
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Migration] Found ${tenants.length} tenant store(s).`);

    const columnsToAddTenant = [
      { name: 'priority', definition: `VARCHAR(20) DEFAULT 'Medium'` },
      { name: 'related_user', definition: `VARCHAR(150) NULL` },
      { name: 'related_module', definition: `VARCHAR(50) NULL` },
      { name: 'target_roles', definition: `VARCHAR(255) DEFAULT 'Admin,Manager,Staff'` }
    ];

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`\n--------------------------------------------`);
      console.log(`[Migration] Upgrading Tenant Database: "${dbName}" (${tenant.store_name})`);
      console.log(`--------------------------------------------`);

      // Select tenant DB
      await conn.query(`USE \`${dbName}\`;`);

      for (const col of columnsToAddTenant) {
        try {
          await conn.query(`ALTER TABLE notifications ADD COLUMN ${col.name} ${col.definition};`);
          console.log(`  -> Added ${col.name} column to notifications in tenant DB "${dbName}".`);
        } catch (err) {
          if (err.code === 'ER_DUP_COLUMN_NAME') {
            // already exists
          } else {
            console.error(`  -> Failed to add ${col.name} column in tenant DB "${dbName}":`, err.message);
          }
        }
      }
    }

    console.log('\n[Migration] Database migration completed successfully.');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runMigration();
