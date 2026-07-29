/**
 * Tenant Auto-Initialization Service
 * Handles automatic seeding of reference data for new Kirana store tenant registrations
 */

export const initializeTenantData = async (connection, tenantId, storeName) => {
  try {
    // 1. Fetch all permissions from the database to map them correctly
    const [permissions] = await connection.query('SELECT id, name FROM permissions');
    const permMap = {};
    permissions.forEach(p => {
      permMap[p.name] = p.id;
    });

    // 2. Insert Store-Specific Roles
    // We get the insert IDs to map permissions next
    const [adminResult] = await connection.query(
      'INSERT INTO roles (tenant_id, name, description) VALUES (?, "Admin", "Store owner administrative profile with billing and settings control")',
      [tenantId]
    );
    const adminRoleId = adminResult.insertId;

    const [managerResult] = await connection.query(
      'INSERT INTO roles (tenant_id, name, description) VALUES (?, "Manager", "Store operational supervisor for inventory and catalog updates")',
      [tenantId]
    );
    const managerRoleId = managerResult.insertId;

    const [staffResult] = await connection.query(
      'INSERT INTO roles (tenant_id, name, description) VALUES (?, "Staff", "Sales clerk and point-of-sale checkout attendant")',
      [tenantId]
    );
    const staffRoleId = staffResult.insertId;

    // 3. Map Permissions to Roles
    // Admin gets all permissions
    const adminPermIds = permissions.map(p => p.id);
    for (const pId of adminPermIds) {
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [adminRoleId, pId]);
    }

    // Manager gets standard operations permissions (exclude setting changes/logs/user management)
    const managerPermNames = [
      'view_dashboard', 'view_reports', 'export_reports',
      'view_products', 'create_products', 'edit_products',
      'view_stock', 'adjust_stock', 'transfer_stock',
      'view_purchases', 'create_purchases',
      'view_sales', 'create_sales',
      'manage_vendors', 'manage_customers'
    ];
    for (const name of managerPermNames) {
      if (permMap[name]) {
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [managerRoleId, permMap[name]]);
      }
    }

    // Staff gets POS billing and catalogue view permissions
    const staffPermNames = [
      'view_dashboard', 'view_products', 'view_stock',
      'view_sales', 'create_sales', 'manage_customers'
    ];
    for (const name of staffPermNames) {
      if (permMap[name]) {
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [staffRoleId, permMap[name]]);
      }
    }

    // 4. Insert Default Categories
    const categories = [
      ['Beverages', 'Soft drinks, juices, tea, coffee, and energy drinks'],
      ['Snacks & Packaged Foods', 'Chips, biscuits, noodles, and ready-to-eat packages'],
      ['Dairy & Bakery', 'Milk, butter, cheese, bread, and paneer'],
      ['Spices & Groceries', 'Rice, wheat flour, pulses, cooking oils, and whole spices'],
      ['Household & Cleaning', 'Detergents, soaps, floor cleaners, and kitchen scrubs'],
      ['Personal Care', 'Shampoos, dental paste, hand washes, and body creams']
    ];
    for (const cat of categories) {
      await connection.query(
        'INSERT INTO categories (tenant_id, name, description) VALUES (?, ?, ?)',
        [tenantId, cat[0], cat[1]]
      );
    }

    // 5. Insert Default Warehouse
    await connection.query(
      'INSERT INTO warehouses (tenant_id, name, location, status) VALUES (?, "Main Storage", "Ground Floor Stockroom", "Active")',
      [tenantId]
    );

    // 6. Insert Default Walk-in Customer for POS billing
    await connection.query(
      'INSERT INTO customers (tenant_id, name, phone, email, address) VALUES (?, "Walk-in Customer", "0000000000", ?, "Counter Billing")',
      [tenantId, `walkin@${tenantId}.com`]
    );

    // 7. Insert Default Settings Config keys
    const settingsData = {
      store_name: storeName,
      store_address: 'Enter store address...',
      store_phone: '0000000000',
      store_email: `support@${tenantId}.com`,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      gstin: '07AAAAA1111A1Z1',
      invoice_prefix: 'KM-INV-',
      low_stock_limit: '5',
      expiry_alert_days: '30',
      theme: 'light',
      enable_notifications: 'true',
      backup_frequency: 'daily'
    };

    for (const [key, val] of Object.entries(settingsData)) {
      await connection.query('INSERT INTO settings (tenant_id, `key`, `value`) VALUES (?, ?, ?)', [tenantId, key, val]);
    }

    // 8. Insert Welcome Notification Alert
    await connection.query(
      'INSERT INTO notifications (tenant_id, type, title, message, is_read) VALUES (?, "System", "Welcome to SaaS Kirana ERP", "Your multi-tenant store has been successfully initialized.", FALSE)',
      [tenantId]
    );

    return { adminRoleId, managerRoleId, staffRoleId };
  } catch (error) {
    console.error('Error auto-initializing tenant data:', error);
    throw error;
  }
};
