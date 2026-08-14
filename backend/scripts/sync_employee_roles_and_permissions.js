import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function syncEmployeeRoles() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log(`Connecting to Master DB...`);
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });

  try {
    const [tenants] = await masterConn.query('SELECT id, store_name, database_name FROM tenants');

    for (const tenant of tenants) {
      if (!tenant.database_name) continue;
      console.log(`Syncing roles for tenant database: "${tenant.database_name}" (${tenant.store_name})...`);

      try {
        const tenantConn = await mysql.createConnection({
          host,
          port,
          user,
          password,
          database: tenant.database_name
        });

        // 1. Fetch permissions map
        const [perms] = await tenantConn.query('SELECT id, name FROM permissions');
        const permMap = {};
        perms.forEach(p => {
          permMap[p.name] = p.id;
        });

        // 2. Check & Insert "Purchase Employee"
        let [peRole] = await tenantConn.query('SELECT id FROM roles WHERE name = "Purchase Employee"');
        let peRoleId;
        if (peRole.length === 0) {
          console.log(`  -> Creating "Purchase Employee" role...`);
          const [ins] = await tenantConn.query(
            'INSERT INTO roles (name, description) VALUES ("Purchase Employee", "Purchase and inventory staff member for GRN and stock entry")'
          );
          peRoleId = ins.insertId;
        } else {
          peRoleId = peRole[0].id;
        }

        const pePerms = ['view_dashboard', 'view_purchases', 'create_purchases', 'view_products', 'create_products', 'edit_products', 'import_products', 'export_products', 'view_categories', 'create_categories', 'edit_categories', 'view_stock', 'view_stock_history', 'adjust_stock', 'destroy_stock', 'view_reports', 'export_reports'];
        for (const permName of pePerms) {
          if (permMap[permName]) {
            await tenantConn.query(
              'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [peRoleId, permMap[permName]]
            );
          }
        }

        // 3. Check & Insert "Sales Manager"
        let [smRole] = await tenantConn.query('SELECT id FROM roles WHERE name = "Sales Manager"');
        let smRoleId;
        if (smRole.length === 0) {
          console.log(`  -> Creating "Sales Manager" role...`);
          const [ins] = await tenantConn.query(
            'INSERT INTO roles (name, description) VALUES ("Sales Manager", "Sales department head with sales metrics and staff control")'
          );
          smRoleId = ins.insertId;
        } else {
          smRoleId = smRole[0].id;
        }

        const smPerms = ['view_dashboard', 'view_sales', 'create_sales', 'delete_sales', 'manage_customers', 'view_reports', 'view_borrow', 'create_borrow', 'manage_users', 'view_vendors', 'view_products', 'view_categories', 'view_stock'];
        for (const permName of smPerms) {
          if (permMap[permName]) {
            await tenantConn.query(
              'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [smRoleId, permMap[permName]]
            );
          }
        }

        // 4. Check & Insert "Sales Employee"
        let [seRole] = await tenantConn.query('SELECT id FROM roles WHERE name = "Sales Employee"');
        let seRoleId;
        if (seRole.length === 0) {
          console.log(`  -> Creating "Sales Employee" role...`);
          const [ins] = await tenantConn.query(
            'INSERT INTO roles (name, description) VALUES ("Sales Employee", "Sales and POS cashier staff member for checkout and customer logs")'
          );
          seRoleId = ins.insertId;
        } else {
          seRoleId = seRole[0].id;
        }

        const sePerms = ['view_dashboard', 'view_sales', 'create_sales', 'manage_customers', 'view_borrow', 'create_borrow', 'view_products', 'view_categories', 'view_stock', 'view_vendors'];
        for (const permName of sePerms) {
          if (permMap[permName]) {
            await tenantConn.query(
              'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [seRoleId, permMap[permName]]
            );
          }
        }

        console.log(`  ✓ Roles synced for "${tenant.database_name}".`);
        await tenantConn.end();
      } catch (err) {
        console.error(`  ✕ Error syncing tenant DB "${tenant.database_name}":`, err.message);
      }
    }
    console.log('\n======================================================');
    console.log('SUCCESS: All tenant databases synced with Purchase Employee and Sales Employee roles!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error connecting to master DB:', err);
  } finally {
    await masterConn.end();
  }
}

syncEmployeeRoles();
