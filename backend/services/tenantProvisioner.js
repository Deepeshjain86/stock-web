import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Provisions a separate database for a new Store Tenant.
 */
export const provisionTenantDatabase = async (tenantId, dbName, storeName, ownerName, ownerEmail, ownerPassword, adminId) => {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  let tenantConn = null;
  try {
    // 1. Connect without DB selected to create the database on the server
    const baseConn = await mysql.createConnection({ host, port, user, password });
    await baseConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await baseConn.end();

    // 2. Connect directly to the new tenant database with multipleStatements enabled
    tenantConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: dbName,
      multipleStatements: true
    });

    // Check if roles table already exists and has Admin role to prevent duplicate seeding
    let alreadySeeded = false;
    try {
      const [tables] = await tenantConn.query(`SHOW TABLES LIKE 'roles'`);
      if (tables.length > 0) {
        const [roles] = await tenantConn.query(`SELECT id FROM roles WHERE name = 'Admin' LIMIT 1`);
        if (roles.length > 0) {
          alreadySeeded = true;
        }
      }
    } catch (err) {
      console.log(`[Provisioner] Roles check failed, proceeding with database initialization:`, err.message);
    }

    if (alreadySeeded) {
      console.log(`[Provisioner] Database "${dbName}" is already provisioned and seeded. Skipping seeder and schema replication to preserve tenant data.`);
      const [roles] = await tenantConn.query(`SELECT id, name FROM roles`);
      const roleMap = {};
      roles.forEach(r => {
        roleMap[r.name] = r.id;
      });
      return {
        adminRoleId: roleMap['Admin'],
        salesManagerRoleId: roleMap['Sales Manager'] || roleMap['Manager'],
        purchaseManagerRoleId: roleMap['Purchase Manager'],
        employeeRoleId: roleMap['Employee'] || roleMap['Staff']
      };
    }

    // 3. Load and execute the schema_tenant.sql script
    const schemaPath = path.join(__dirname, '../database/schema_tenant.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await tenantConn.query(schemaSql);

    // 4. Seed Local Store Specific Roles
    const [adminRoleResult] = await tenantConn.query(
      'INSERT INTO roles (name, description) VALUES ("Admin", "Store owner administrative profile with billing and settings control")'
    );
    const adminRoleId = adminRoleResult.insertId;

    const [salesManagerResult] = await tenantConn.query(
      'INSERT INTO roles (name, description) VALUES ("Sales Manager", "Sales department head with sales metrics and staff control")'
    );
    const salesManagerRoleId = salesManagerResult.insertId;

    const [purchaseManagerResult] = await tenantConn.query(
      'INSERT INTO roles (name, description) VALUES ("Purchase Manager", "Purchase and stock department head with inventory control")'
    );
    const purchaseManagerRoleId = purchaseManagerResult.insertId;

    const [employeeRoleResult] = await tenantConn.query(
      'INSERT INTO roles (name, description) VALUES ("Employee", "Store staff and point-of-sale checkout cashier")'
    );
    const employeeRoleId = employeeRoleResult.insertId;

    // 5. Seed Permissions List
    const permissions = [
      ['view_dashboard', 'Dashboard', 'View dashboard metrics'],
      ['view_reports', 'Reports', 'View sales and stock reports'],
      ['export_reports', 'Reports', 'Export PDF/Excel inventory statements'],
      ['view_products', 'Products', 'View product catalogue details'],
      ['create_products', 'Products', 'Create new product listings'],
      ['edit_products', 'Products', 'Edit product parameters'],
      ['delete_products', 'Products', 'Permanently delete items'],
      ['view_stock', 'Stock', 'View inventory levels'],
      ['adjust_stock', 'Stock', 'Manually adjust stock balances'],
      ['transfer_stock', 'Stock', 'Transfer stocks between warehouses'],
      ['view_purchases', 'Purchases', 'View purchase ledger lists'],
      ['create_purchases', 'Purchases', 'Record distributor invoices'],
      ['delete_purchases', 'Purchases', 'Cancel purchase orders'],
      ['view_sales', 'Sales', 'View sales history'],
      ['create_sales', 'Sales', 'Generate sales POS billing'],
      ['delete_sales', 'Sales', 'Void sales invoices'],
      ['manage_customers', 'Customers', 'Manage customer profiles'],
      ['manage_users', 'Users', 'Create employee logins'],
      ['view_activity_logs', 'System', 'Audit staff logs'],
      ['view_borrow', 'Borrow', 'View outstanding customer Udhaar summary'],
      ['create_borrow', 'Borrow', 'Record custom borrow/payback transaction log']
    ];

    const permMap = {};
    for (const perm of permissions) {
      const [result] = await tenantConn.query(
        'INSERT INTO permissions (name, module, description) VALUES (?, ?, ?)',
        [perm[0], perm[1], perm[2]]
      );
      permMap[perm[0]] = result.insertId;
    }

    // 6. Map Permissions to Roles
    // Admin gets all permissions
    for (const pId of Object.values(permMap)) {
      await tenantConn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [adminRoleId, pId]);
    }

    // Sales Manager gets full access only to the Sales module, Sales Dashboard, Borrow, and Customer management
    const salesManagerPerms = [
      'view_dashboard', 'view_sales', 'create_sales', 'delete_sales', 
      'manage_customers', 'view_reports', 'view_borrow', 'create_borrow', 'manage_users'
    ];
    for (const name of salesManagerPerms) {
      if (permMap[name]) {
        await tenantConn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [salesManagerRoleId, permMap[name]]);
      }
    }

    // Purchase Manager gets full access to Purchases, Products, Inventory (Stock), Purchase Dashboard, and Vendor management
    const purchaseManagerPerms = [
      'view_dashboard', 'view_purchases', 'create_purchases', 'delete_purchases', 
      'view_products', 'create_products', 'edit_products', 'delete_products', 
      'view_stock', 'adjust_stock', 'transfer_stock', 'manage_vendors', 'view_reports', 'manage_users'
    ];
    for (const name of purchaseManagerPerms) {
      if (permMap[name]) {
        await tenantConn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [purchaseManagerRoleId, permMap[name]]);
      }
    }

    // Employee gets checkout billing and inventory lookup access by default
    const employeePerms = ['view_dashboard', 'view_products', 'view_stock', 'view_sales', 'create_sales', 'manage_customers', 'view_borrow', 'create_borrow'];
    for (const name of employeePerms) {
      if (permMap[name]) {
        await tenantConn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [employeeRoleId, permMap[name]]);
      }
    }

    // 7. Seed Default Warehouse
    await tenantConn.query('INSERT INTO warehouses (name, location, status) VALUES ("Main Storage", "Ground Floor Stockroom", "Active")');

    // 9. Seed POS Walk-in Customer
    await tenantConn.query('INSERT INTO customers (name, phone, email, address) VALUES ("Walk-in Customer", "0000000000", ?, "Counter Billing")', [`walkin@${tenantId}.com`]);

    // 10. Seed default settings configuration keys
    const settings = {
      store_name: storeName,
      store_address: 'Enter store address...',
      store_phone: '0000000000',
      store_email: ownerEmail,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      gstin: '07AAAAA1111A1Z1',
      invoice_prefix: 'KM-INV-',
      low_stock_limit: '5',
      expiry_alert_days: '30'
    };
    for (const [k, v] of Object.entries(settings)) {
      await tenantConn.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [k, v]);
    }

    // 11. Hash and insert Store Admin user locally
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);
    await tenantConn.query(
      'INSERT INTO users (name, email, password, role_id, status, login_id) VALUES (?, ?, ?, ?, "Active", ?)',
      [ownerName, ownerEmail, hashedPassword, adminRoleId, adminId]
    );

    // 12. Create Welcome notification alert
    await tenantConn.query(
      'INSERT INTO notifications (type, title, message, is_read) VALUES ("System", "Database Isolated successfully", "Welcome to your dedicated tenant-database Kirana ERP.", FALSE)'
    );

    // 13. Ensure tenant-isolated upload storage directory exists on disk
    try {
      const tenantUploadDir = path.join(__dirname, '../uploads/tenants', dbName);
      const subDirs = ['products', 'logos', 'documents', 'invoices', 'exports', 'imports'];
      for (const sub of subDirs) {
        const dirPath = path.join(tenantUploadDir, sub);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
      console.log(`[Provisioner] Created dedicated tenant upload storage folders under "uploads/tenants/${dbName}/"`);
    } catch (fsErr) {
      console.warn(`[Provisioner] Could not create upload directory for ${dbName}:`, fsErr.message);
    }

    return { adminRoleId, salesManagerRoleId, purchaseManagerRoleId, employeeRoleId };
  } catch (error) {
    console.error(`Error provisioning database ${dbName}:`, error);
    throw error;
  } finally {
    if (tenantConn) {
      await tenantConn.end();
    }
  }
};
