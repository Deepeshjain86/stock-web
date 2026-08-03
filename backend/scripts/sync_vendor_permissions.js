import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function syncVendorPermissions() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log('Connecting to Master DB for vendor permissions sync...');
  let masterConn;
  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    const [tenants] = await masterConn.query('SELECT id, store_name, database_name FROM tenants');

    for (const tenant of tenants) {
      console.log(`Processing tenant "${tenant.store_name}" (${tenant.database_name})...`);
      let tenantConn;
      try {
        tenantConn = await mysql.createConnection({ host, port, user, password, database: tenant.database_name });

        // Ensure view_vendors permission exists
        await tenantConn.query(
          `INSERT IGNORE INTO permissions (name, module, description) 
           VALUES ('view_vendors', 'Vendors', 'View supplier master directory')`
        );

        const [permRows] = await tenantConn.query(`SELECT id FROM permissions WHERE name = 'view_vendors'`);
        if (permRows.length === 0) continue;
        const viewVendorsPermId = permRows[0].id;

        // Fetch all role IDs in tenant DB
        const [roles] = await tenantConn.query(`SELECT id, name FROM roles`);
        for (const role of roles) {
          await tenantConn.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [role.id, viewVendorsPermId]
          );
          console.log(`  ✓ Assigned view_vendors to role "${role.name}" (id: ${role.id})`);
        }
      } catch (err) {
        console.error(`Error processing tenant ${tenant.database_name}:`, err.message);
      } finally {
        if (tenantConn) await tenantConn.end();
      }
    }
    console.log('Successfully synced view_vendors permissions across all tenant databases.');
  } catch (err) {
    console.error('Error syncing vendor permissions:', err.message);
  } finally {
    if (masterConn) await masterConn.end();
  }
}

syncVendorPermissions();
