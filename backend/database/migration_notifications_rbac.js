import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

const runRbacMigration = async () => {
  console.log(`[RBAC Notification Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDbName}\`;`);
    const [tRows] = await conn.query("SELECT DISTINCT database_name FROM tenants WHERE database_name IS NOT NULL AND database_name != ''");
    const tenantDbs = tRows.map(r => r.database_name);

    const [dbRows] = await conn.query("SHOW DATABASES LIKE 'kirana_erp%'");
    const systemDbs = dbRows.map(r => Object.values(r)[0]);

    const allDbs = Array.from(new Set(['kirana_erp', 'kirana_erp_master', ...tenantDbs, ...systemDbs]));
    console.log(`[RBAC Notification Migration] Target databases:`, allDbs);

    const rbacColumns = [
      { name: 'actor_id', def: `INT NULL` },
      { name: 'actor_name', def: `VARCHAR(150) NULL` },
      { name: 'actor_role', def: `VARCHAR(50) NULL` },
      { name: 'action', def: `VARCHAR(100) NULL` }
    ];

    const rbacIndexes = [
      { name: 'idx_notif_actor', def: '(actor_id)' },
      { name: 'idx_notif_actor_role', def: '(actor_role)' },
      { name: 'idx_notif_module_actor', def: '(module, actor_role)' }
    ];

    for (const dbName of allDbs) {
      console.log(`\n--------------------------------------------`);
      console.log(`[RBAC Notification Migration] Upgrading database: "${dbName}"`);
      console.log(`--------------------------------------------`);
      try {
        await conn.query(`USE \`${dbName}\`;`);
      } catch (err) {
        console.warn(`  -> Skipping "${dbName}":`, err.message);
        continue;
      }

      for (const col of rbacColumns) {
        try {
          await conn.query(`ALTER TABLE notifications ADD COLUMN ${col.name} ${col.def};`);
          console.log(`  -> Added ${col.name} column in "${dbName}".`);
        } catch (err) {
          if (err.code !== 'ER_DUP_COLUMN_NAME') {
            console.warn(`  -> Note on ${col.name} in "${dbName}":`, err.message);
          }
        }
      }

      for (const idx of rbacIndexes) {
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

    console.log('\n[RBAC Notification Migration] Completed successfully on all databases.');
  } catch (error) {
    console.error('[RBAC Notification Migration] Failed:', error);
  } finally {
    await conn.end();
  }
};

runRbacMigration();
