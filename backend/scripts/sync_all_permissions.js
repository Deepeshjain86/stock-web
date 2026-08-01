import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function syncAllPermissions() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log('Connecting to Master DB for complete permissions sync...');
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });

  try {
    const [tenants] = await masterConn.query('SELECT id, store_name, database_name FROM tenants');

    const requiredPermissions = [
      ['view_dashboard', 'Dashboard', 'View dashboard metrics'],
      ['view_reports', 'Reports', 'View sales and stock reports'],
      ['export_reports', 'Reports', 'Export PDF/Excel inventory statements'],
      ['view_products', 'Products', 'View product catalogue details'],
      ['create_products', 'Products', 'Create new product listings'],
      ['edit_products', 'Products', 'Edit product parameters'],
      ['delete_products', 'Products', 'Permanently delete items'],
      ['import_products', 'Products', 'Bulk import products via Excel/CSV'],
      ['export_products', 'Products', 'Bulk export products catalog'],
      ['view_categories', 'Categories', 'View category listings'],
      ['create_categories', 'Categories', 'Create category master records'],
      ['edit_categories', 'Categories', 'Edit category details'],
      ['delete_categories', 'Categories', 'Delete unused category department groupings'],
      ['view_stock', 'Stock', 'View inventory levels'],
      ['adjust_stock', 'Stock', 'Manually adjust stock balances'],
      ['transfer_stock', 'Stock', 'Transfer stocks between warehouses'],
      ['view_stock_history', 'Stock', 'View stock audit history logs'],
      ['destroy_stock', 'Stock', 'Record damaged or destroyed stock'],
      ['view_purchases', 'Purchases', 'View purchase ledger lists'],
      ['create_purchases', 'Purchases', 'Record distributor invoices'],
      ['delete_purchases', 'Purchases', 'Cancel purchase orders'],
      ['view_vendors', 'Vendors', 'View supplier master directory'],
      ['create_vendors', 'Vendors', 'Create vendor profiles'],
      ['edit_vendors', 'Vendors', 'Edit vendor parameters'],
      ['manage_vendors', 'Vendors', 'Manage vendor ledgers'],
      ['view_sales', 'Sales', 'View sales history'],
      ['create_sales', 'Sales', 'Generate sales POS billing'],
      ['delete_sales', 'Sales', 'Void sales invoices'],
      ['manage_customers', 'Customers', 'Manage customer profiles'],
      ['manage_users', 'Users', 'Create employee logins'],
      ['view_activity_logs', 'System', 'Audit staff logs'],
      ['view_borrow', 'Borrow', 'View outstanding customer Udhaar summary'],
      ['create_borrow', 'Borrow', 'Record custom borrow/payback transaction log'],
      ['manage_borrow', 'Borrow', 'Settle customer credit debts'],
      ['view_returns', 'Returns', 'View product returns logs'],
      ['create_returns', 'Returns', 'Record vendor/customer returns'],
      ['approve_returns', 'Returns', 'Approve return credits']
    ];

    for (const tenant of tenants) {
      if (!tenant.database_name) continue;
      console.log(`Syncing permissions for tenant database: "${tenant.database_name}" (${tenant.store_name})...`);

      try {
        const tenantConn = await mysql.createConnection({
          host,
          port,
          user,
          password,
          database: tenant.database_name
        });

        // 1. Ensure all permissions exist in permissions table
        const permMap = {};
        for (const [pName, pModule, pDesc] of requiredPermissions) {
          const [existing] = await tenantConn.query('SELECT id FROM permissions WHERE name = ?', [pName]);
          if (existing.length === 0) {
            const [ins] = await tenantConn.query(
              'INSERT INTO permissions (name, module, description) VALUES (?, ?, ?)',
              [pName, pModule, pDesc]
            );
            permMap[pName] = ins.insertId;
          } else {
            permMap[pName] = existing[0].id;
          }
        }

        // 2. Fetch all roles in tenant DB
        const [roles] = await tenantConn.query('SELECT id, name FROM roles');
        const roleMap = {};
        roles.forEach(r => { roleMap[r.name] = r.id; });

        // Map Admin to ALL permissions
        if (roleMap['Admin']) {
          for (const pId of Object.values(permMap)) {
            await tenantConn.query(
              'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [roleMap['Admin'], pId]
            );
          }
        }

        // Map Purchase Manager to full product, stock, purchase, vendor, report & import permissions
        if (roleMap['Purchase Manager']) {
          const pmPerms = ['view_dashboard', 'view_reports', 'export_reports', 'view_purchases', 'create_purchases', 'delete_purchases', 'view_vendors', 'manage_vendors', 'view_products', 'create_products', 'edit_products', 'delete_products', 'import_products', 'export_products', 'view_categories', 'create_categories', 'edit_categories', 'delete_categories', 'view_stock', 'view_stock_history', 'adjust_stock', 'transfer_stock', 'destroy_stock', 'view_returns', 'create_returns', 'approve_returns', 'manage_users'];
          for (const pName of pmPerms) {
            if (permMap[pName]) {
              await tenantConn.query(
                'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                [roleMap['Purchase Manager'], permMap[pName]]
              );
            }
          }
        }

        // Map Sales Manager
        if (roleMap['Sales Manager']) {
          const smPerms = ['view_dashboard', 'view_reports', 'export_reports', 'view_sales', 'create_sales', 'delete_sales', 'manage_customers', 'view_borrow', 'create_borrow', 'manage_borrow', 'view_products', 'view_categories', 'view_stock', 'view_returns', 'create_returns', 'approve_returns', 'manage_users'];
          for (const pName of smPerms) {
            if (permMap[pName]) {
              await tenantConn.query(
                'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                [roleMap['Sales Manager'], permMap[pName]]
              );
            }
          }
        }

        // Map Employee & Purchase Employee
        const empRoles = ['Employee', 'Purchase Employee'];
        for (const roleName of empRoles) {
          if (roleMap[roleName]) {
            const empPerms = ['view_dashboard', 'view_reports', 'export_reports', 'view_purchases', 'create_purchases', 'delete_purchases', 'view_vendors', 'create_vendors', 'edit_vendors', 'manage_vendors', 'delete_vendors', 'view_products', 'create_products', 'edit_products', 'delete_products', 'import_products', 'export_products', 'view_categories', 'create_categories', 'edit_categories', 'delete_categories', 'view_stock', 'view_stock_history', 'adjust_stock', 'destroy_stock', 'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'manage_customers', 'view_borrow', 'create_borrow', 'manage_borrow', 'delete_borrow'];
            for (const pName of empPerms) {
              if (permMap[pName]) {
                await tenantConn.query(
                  'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                  [roleMap[roleName], permMap[pName]]
                );
              }
            }
          }
        }

        console.log(`  ✓ All permissions synced for "${tenant.database_name}".`);
        await tenantConn.end();
      } catch (err) {
        console.error(`  ✕ Error syncing permissions for "${tenant.database_name}":`, err.message);
      }
    }

    console.log('\n======================================================');
    console.log('SUCCESS: All Tenant Databases Synced with Complete Permissions Map!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during permission sync:', err);
  } finally {
    await masterConn.end();
  }
}

syncAllPermissions();
