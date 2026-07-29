import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

const getPrefix = (adminId, roleName, department) => {
  const cleanAdmin = adminId || 'AMAN01';
  const roleStr = String(roleName || '').trim();
  const deptStr = String(department || '').trim();

  if (roleStr === 'Purchase Manager') {
    return `${cleanAdmin}-PM`;
  }
  if (roleStr === 'Sales Manager') {
    return `${cleanAdmin}-SM`;
  }
  if (roleStr === 'Purchase Employee' || deptStr === 'Purchase') {
    return `${cleanAdmin}-PE`;
  }
  if (roleStr === 'Sales Employee' || deptStr === 'Sales') {
    return `${cleanAdmin}-SE`;
  }
  return `${cleanAdmin}-EM`;
};

async function patchLoginIds() {
  console.log('[Patch] Starting Login ID format migration...');
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDbName });

  try {
    const [tenants] = await masterConn.query('SELECT database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      if (!dbName) continue;

      console.log(`[Patch] Updating login IDs for tenant DB: "${dbName}"`);
      const conn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        // Get Admin Login ID
        const [adminRows] = await conn.query(
          "SELECT u.login_id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' LIMIT 1"
        );
        const adminId = adminRows[0]?.login_id || 'AMAN01';
        console.log(`  -> Admin ID for "${dbName}": ${adminId}`);

        // Get all staff users ordered by id ASC
        const [staffUsers] = await conn.query(`
          SELECT u.id, u.email, u.login_id, u.department, r.name as role_name
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE r.name != 'Admin'
          ORDER BY u.id ASC
        `);

        // Counters per prefix
        const counters = {
          PM: 0,
          SM: 0,
          PE: 0,
          SE: 0,
          EM: 0
        };

        for (const staff of staffUsers) {
          const prefix = getPrefix(adminId, staff.role_name, staff.department);
          const key = prefix.split('-')[1] || 'EM';
          counters[key] = (counters[key] || 0) + 1;
          const numStr = String(counters[key]).padStart(4, '0');
          const newLoginId = `${prefix}${numStr}`;

          console.log(`  -> Updating user ${staff.id} (${staff.role_name}): ${staff.login_id} -> ${newLoginId}`);

          // Update in tenant DB
          await conn.query('UPDATE users SET login_id = ? WHERE id = ?', [newLoginId, staff.id]);

          // Also update in master DB if login_id column exists
          try {
            await masterConn.query('UPDATE users SET login_id = ? WHERE email = ?', [newLoginId, staff.email]);
          } catch (e) {
            // Master DB column might be login_id or email primary
          }
        }

        console.log(`  -> Completed login ID migration for "${dbName}"`);
      } catch (err) {
        console.error(`  -> Error updating "${dbName}":`, err.message);
      } finally {
        await conn.end();
      }
    }
  } catch (err) {
    console.error('[Patch] Migration error:', err.message);
  } finally {
    await masterConn.end();
    console.log('[Patch] Finished.');
  }
}

patchLoginIds();
