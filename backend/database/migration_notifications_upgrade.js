import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`[Notification Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Get all tenant databases from master DB + all matching kirana_erp% / aman01
    await conn.query(`USE \`${masterDbName}\`;`);
    const [tRows] = await conn.query("SELECT DISTINCT database_name FROM tenants WHERE database_name IS NOT NULL AND database_name != ''");
    const tenantDbs = tRows.map(r => r.database_name);

    const [dbRows] = await conn.query("SHOW DATABASES LIKE 'kirana_erp%'");
    const systemDbs = dbRows.map(r => Object.values(r)[0]);

    const allDbs = Array.from(new Set(['kirana_erp', 'kirana_erp_master', ...tenantDbs, ...systemDbs]));
    console.log(`[Notification Migration] Target databases for notification upgrade:`, allDbs);

    const columns = [
      { name: 'tenant_id', def: `INT NULL` },
      { name: 'user_id', def: `INT NULL` },
      { name: 'module', def: `VARCHAR(50) DEFAULT 'General'` },
      { name: 'related_module', def: `VARCHAR(50) DEFAULT 'General'` },
      { name: 'type', def: `VARCHAR(50) NOT NULL DEFAULT 'System'` },
      { name: 'priority', def: `VARCHAR(20) DEFAULT 'Medium'` },
      { name: 'reference_id', def: `INT NULL` },
      { name: 'reference_type', def: `VARCHAR(50) NULL` },
      { name: 'related_user', def: `VARCHAR(150) NULL` },
      { name: 'target_roles', def: `VARCHAR(255) DEFAULT 'Admin,Manager,Staff'` },
      { name: 'updated_at', def: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` }
    ];

    const indexes = [
      { name: 'idx_notif_tenant_read', def: '(tenant_id, is_read)' },
      { name: 'idx_notif_module', def: '(module)' },
      { name: 'idx_notif_priority', def: '(priority)' },
      { name: 'idx_notif_created', def: '(created_at)' }
    ];

    for (const dbName of allDbs) {
      console.log(`\n--------------------------------------------`);
      console.log(`[Notification Migration] Upgrading database: "${dbName}"`);
      console.log(`--------------------------------------------`);
      try {
        await conn.query(`USE \`${dbName}\`;`);
      } catch (err) {
        console.warn(`  -> Skipping "${dbName}":`, err.message);
        continue;
      }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NULL,
          user_id INT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'System',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          priority VARCHAR(20) DEFAULT 'Medium',
          module VARCHAR(50) DEFAULT 'General',
          related_module VARCHAR(50) DEFAULT 'General',
          reference_id INT NULL,
          reference_type VARCHAR(50) NULL,
          related_user VARCHAR(150) NULL,
          target_roles VARCHAR(255) DEFAULT 'Admin,Manager,Staff',
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      for (const col of columns) {
        try {
          await conn.query(`ALTER TABLE notifications ADD COLUMN ${col.name} ${col.def};`);
          console.log(`  -> Added ${col.name} column to notifications in "${dbName}".`);
        } catch (err) {
          if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.warn(`  -> Note on ${col.name} in "${dbName}":`, err.message);
          }
        }
      }

      for (const idx of indexes) {
        try {
          await conn.query(`CREATE INDEX ${idx.name} ON notifications ${idx.def};`);
          console.log(`  -> Created index ${idx.name} in "${dbName}".`);
        } catch (err) {
          if (err.code !== 'ER_DUP_KEYNAME') {
            console.warn(`  -> Note on index ${idx.name} in "${dbName}":`, err.message);
          }
        }
      }
    }

    console.log('\n[Notification Migration] Migration completed successfully on all tenant databases.');
  } catch (error) {
    console.error('[Notification Migration] Migration failed:', error);
  } finally {
    await conn.end();
  }
};

runMigration();
