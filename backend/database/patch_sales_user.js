import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log(`[Patch] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT database_name FROM tenants');

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`[Patch] Updating Tenant DB: "${dbName}"...`);
      await conn.query(`USE \`${dbName}\`;`);

      try {
        await conn.query('ALTER TABLE sales ADD COLUMN user_id INT NULL;');
        await conn.query('ALTER TABLE sales ADD CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;');
        console.log('  -> Successfully added user_id column and FK constraint to sales table.');
        
        // Let's populate user_id with the first admin user's id so it's not null for existing rows
        const [admins] = await conn.query('SELECT id FROM users LIMIT 1');
        if (admins.length > 0) {
          await conn.query('UPDATE sales SET user_id = ? WHERE user_id IS NULL', [admins[0].id]);
          console.log(`  -> Set existing sales user_id to default User: ${admins[0].id}`);
        }
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('  -> user_id column already exists in sales table.');
        } else {
          console.error('  -> Failed to patch sales table:', err.message);
        }
      }
    }
    console.log('[Patch] PATCH APPLIED SUCCESSFULLY!');
  } catch (error) {
    console.error('[Patch] Patch failed:', error);
  } finally {
    await conn.end();
  }
};

runPatch();
