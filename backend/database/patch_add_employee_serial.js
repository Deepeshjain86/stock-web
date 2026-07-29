import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runPatch = async () => {
  console.log('[Patch] Connecting to MySQL to add employee_serial_id column...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Read tenants from master
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    const tenantDbNames = tenants.map(t => t.database_name);

    for (const dbName of tenantDbNames) {
      console.log(`\n------------------------------------------`);
      console.log(`[Patch] Altering users table in: "${dbName}"`);
      console.log(`------------------------------------------`);

      await conn.query(`USE \`${dbName}\`;`);

      // Add employee_serial_id column
      try {
        await conn.query('ALTER TABLE users ADD COLUMN employee_serial_id INT UNIQUE NULL;');
        console.log('  -> Added users.employee_serial_id column.');
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('  -> users.employee_serial_id column already exists.');
        } else {
          console.error('  -> Failed to add users.employee_serial_id:', err.message);
        }
      }

      // Backfill serial IDs for existing users in this tenant db
      const [existingUsers] = await conn.query('SELECT id, name FROM users ORDER BY id ASC');
      console.log(`  -> Found ${existingUsers.length} existing user(s) to backfill.`);
      
      let serialVal = 1;
      for (const u of existingUsers) {
        await conn.query('UPDATE users SET employee_serial_id = ? WHERE id = ?', [serialVal, u.id]);
        console.log(`     Backfilled "${u.name}" (ID ${u.id}) with Serial ${serialVal}`);
        serialVal++;
      }
    }

    console.log('\n[Patch] EMPLOYEE SERIAL ID PATCH COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Migration failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runPatch();
