import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const targetPermissions = [
  { name: 'view_dashboard', module: 'Dashboard', description: 'Access dashboard metrics and business analytics' },
  { name: 'view_products', module: 'Products', description: 'View product catalog and price list' },
  { name: 'view_categories', module: 'Category Master', description: 'View category master records' },
  { name: 'create_categories', module: 'Category Master', description: 'Create new product categories' },
  { name: 'edit_categories', module: 'Category Master', description: 'Modify category details' },
  { name: 'delete_categories', module: 'Category Master', description: 'Remove category listings' },
  { name: 'view_product_details', module: 'Product Master', description: 'View detailed product specifications' },
  { name: 'create_products', module: 'Product Master', description: 'Add new items to master catalog' },
  { name: 'edit_products', module: 'Product Master', description: 'Update product prices and meta' },
  { name: 'delete_products', module: 'Product Master', description: 'Permanently remove items' },
  { name: 'import_products', module: 'Product Master', description: 'Bulk import products via Excel/CSV' },
  { name: 'export_products', module: 'Product Master', description: 'Bulk export products via Excel/CSV' },
  { name: 'view_stock', module: 'Stock Management', description: 'View current inventory stocks across locations' },
  { name: 'adjust_stock', module: 'Stock Management', description: 'Perform manual inventory corrections and stock adjustments' },
  { name: 'transfer_stock', module: 'Stock Management', description: 'Initiate stocks transfers between branches' },
  { name: 'view_stock_history', module: 'Stock Management', description: 'Inspect product movement audit trails' },
  { name: 'view_purchases', module: 'Purchase', description: 'View vendor purchase records and invoices' },
  { name: 'create_purchases', module: 'Purchase', description: 'Create new purchases orders' },
  { name: 'delete_purchases', module: 'Purchase', description: 'Cancel and delete purchase records' },
  { name: 'view_sales', module: 'Sales', description: 'View sales transaction logs and billing logs' },
  { name: 'create_sales', module: 'Sales', description: 'Generate active POS bills and invoices' },
  { name: 'delete_sales', module: 'Sales', description: 'Void or cancel generated sales invoices' },
  { name: 'view_returns', module: 'Stock Return', description: 'Inspect client and supplier returns details' },
  { name: 'create_returns', module: 'Stock Return', description: 'Initiate vendor return notes or customer refund' },
  { name: 'approve_returns', module: 'Stock Return', description: 'Authorized verification for returns credit notes' },
  { name: 'view_borrow', module: 'Borrow Ledger', description: 'Inspect credit accounts and customer udhaar balances' },
  { name: 'create_borrow', module: 'Borrow Ledger', description: 'Log credit sales or customer payback payments' },
  { name: 'manage_borrow', module: 'Borrow Ledger', description: 'Forgive or settle customer accounts parameters' },
  { name: 'view_staff', module: 'Staff Management', description: 'View internal staff member lists' },
  { name: 'manage_users', module: 'Staff Management', description: 'Create, update, and manage employee accounts and roles' },
  { name: 'view_reports', module: 'Reports', description: 'View sales, stock levels, and audit trail logs report modules' },
  { name: 'export_reports', module: 'Reports', description: 'Download statistics as CSV, Excel, or PDF sheets' },
  { name: 'print_reports', module: 'Reports', description: 'Send analytics summaries directly to print devices' },
  { name: 'view_billing', module: 'Billing & Subscription', description: 'Access billing ledger and invoices' },
  { name: 'manage_subscription', module: 'Billing & Subscription', description: 'Renew plans and change subscription specifications' },
  { name: 'view_notifications', module: 'Notifications', description: 'Read system alarms, low stock alerts, and news' },
  { name: 'manage_notifications', module: 'Notifications', description: 'Mark alerts as read, delete, or modify targets' },
  { name: 'view_settings', module: 'Settings', description: 'Inspect shop metadata settings and profiles' },
  { name: 'manage_settings', module: 'Settings', description: 'Edit shop parameters, tax definitions, and profiles' },
  { name: 'view_activity_logs', module: 'Settings', description: 'Inspect administrative audit trails and actions logs' }
];

async function runPatch() {
  console.log(`[Patch] Connecting to MySQL...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log(`[Patch] Reading tenants from ${masterDb}...`);
    await conn.query(`USE \`${masterDb}\`;`);
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Patch] Found ${tenants.length} tenant database(s).`);

    const dbNames = Array.from(new Set([masterDb, 'kirana_erp', 'AMAN01', ...tenants.map(t => t.database_name)]));

    for (const dbName of dbNames) {
      console.log(`\n==========================================`);
      console.log(`[Patch] Patching Database: "${dbName}"`);
      console.log(`==========================================`);

      try {
        await conn.query(`USE \`${dbName}\`;`);
      } catch (e) {
        console.warn(`  -> Skipping "${dbName}":`, e.message);
        continue;
      }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          module VARCHAR(50) NOT NULL,
          description VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      for (const p of targetPermissions) {
        const [existing] = await conn.query('SELECT id FROM permissions WHERE name = ?', [p.name]);
        if (existing.length === 0) {
          await conn.query(
            'INSERT INTO permissions (name, module, description) VALUES (?, ?, ?)',
            [p.name, p.module, p.description]
          );
          console.log(`  -> Added permission: "${p.name}"`);
        } else {
          await conn.query(
            'UPDATE permissions SET module = ?, description = ? WHERE name = ?',
            [p.module, p.description, p.name]
          );
        }
      }

      const [roleTables] = await conn.query("SHOW TABLES LIKE 'roles'");
      if (roleTables.length > 0) {
        const [allPerms] = await conn.query('SELECT id, name FROM permissions');
        const permIds = allPerms.map(p => p.id);

        // Map all perms to Admin
        const [adminRole] = await conn.query('SELECT id FROM roles WHERE name = "Admin"');
        if (adminRole.length > 0) {
          const adminRoleId = adminRole[0].id;
          for (const pId of permIds) {
            const [exists] = await conn.query(
              'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
              [adminRoleId, pId]
            );
            if (exists.length === 0) {
              await conn.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                [adminRoleId, pId]
              );
            }
          }
        }

        // Map view_notifications & view_dashboard to ALL roles in store DB
        const [vPerms] = await conn.query('SELECT id FROM permissions WHERE name IN ("view_notifications", "view_dashboard", "view_sales")');
        const [allRoles] = await conn.query('SELECT id, name FROM roles');
        for (const r of allRoles) {
          for (const vp of vPerms) {
            const [exists] = await conn.query(
              'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
              [r.id, vp.id]
            );
            if (exists.length === 0) {
              await conn.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                [r.id, vp.id]
              );
            }
          }
          console.log(`  -> Ensured core permissions mapped for role "${r.name}".`);
        }
      }
    }

    console.log('\n[Patch] DATABASE GRANULAR PERMISSIONS SYNCHRONIZATION COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Patch] Migration patch failed:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runPatch();
