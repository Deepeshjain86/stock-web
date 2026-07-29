import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'kirana_erp';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  
  // Establish connection without database to create it if not exists
  const baseConnection = await mysql.createConnection({ host, port, user, password });
  
  console.log(`Ensuring database "${dbName}" exists...`);
  await baseConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await baseConnection.end();

  // Connect to the specific database
  const connection = await mysql.createConnection({ host, port, user, password, database: dbName, multipleStatements: true });
  console.log(`Connected to database "${dbName}".`);

  // Check if database is already provisioned and seeded
  let alreadySeeded = false;
  try {
    const [tables] = await connection.query(`SHOW TABLES LIKE 'users'`);
    if (tables.length > 0) {
      const [users] = await connection.query(`SELECT id FROM users LIMIT 1`);
      if (users.length > 0) {
        alreadySeeded = true;
      }
    }
  } catch (err) {
    console.log('Users check failed, running database seeding...', err.message);
  }

  if (alreadySeeded) {
    console.log(`Database "${dbName}" is already provisioned and seeded. Skipping schema replication and seeder to preserve existing data.`);
    await connection.end();
    return;
  }

  console.log('Loading schema...');

  // Read schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema.sql (multiple statements enabled)
  await connection.query(schemaSql);
  console.log('Database schema created successfully.');

  console.heading = (text) => console.log(`\n=== ${text} ===`);

  // --- SEED DEFAULT TENANT ---
  console.heading('Seeding Primary Tenant Store');
  await connection.query(`
    INSERT INTO tenants (id, tenant_uuid, store_name, owner_name, email, phone, address, gstin, subscription_status, subscription_plan)
    VALUES (1, 'TENT-KIRANAMART-001', 'Kirana Mart Delhi', 'Deepesh Jain', 'admin@kiranamart.com', '9876543210', '102, Malviya Nagar, New Delhi', '07AAAAA1111A1Z1', 'Active', 'Premium')
  `);
  console.log('Primary tenant seeded.');

  // --- SEED ROLES ---
  console.heading('Seeding Roles');
  await connection.query(`
    INSERT INTO roles (id, tenant_id, name, description) VALUES
    (1, NULL, 'Super Admin', 'Platform administrator with total SaaS control panel privileges'),
    (2, 1, 'Admin', 'Store owner administrative profile with billing and settings control'),
    (3, 1, 'Manager', 'Store operational supervisor for inventory and catalog updates'),
    (4, 1, 'Staff', 'Sales clerk and point-of-sale checkout attendant')
  `);
  console.log('Roles seeded.');

  // --- SEED PERMISSIONS ---
  console.heading('Seeding Permissions');
  const permissions = [
    // Dashboard & Reports
    { name: 'view_dashboard', module: 'Dashboard', description: 'Access dashboard metrics and business analytics' },
    { name: 'view_reports', module: 'Reports', description: 'View sales, stock, and P&L financial reports' },
    { name: 'export_reports', module: 'Reports', description: 'Export reports to PDF, Excel, and CSV' },
    // Products & Categories
    { name: 'view_products', module: 'Products', description: 'View product catalog and price list' },
    { name: 'create_products', module: 'Products', description: 'Create new products in the catalog' },
    { name: 'edit_products', module: 'Products', description: 'Edit product specifications and prices' },
    { name: 'delete_products', module: 'Products', description: 'Remove products from the database' },
    // Stock & Inventory
    { name: 'view_stock', module: 'Stock', description: 'View stock levels across warehouses' },
    { name: 'adjust_stock', module: 'Stock', description: 'Perform stock adjustments and level balances' },
    { name: 'transfer_stock', module: 'Stock', description: 'Perform warehouse inventory stock transfers' },
    // Purchases
    { name: 'view_purchases', module: 'Purchases', description: 'View purchase invoices and orders' },
    { name: 'create_purchases', module: 'Purchases', description: 'Add new purchase order transactions' },
    { name: 'delete_purchases', module: 'Purchases', description: 'Delete purchase records' },
    // Sales & POS
    { name: 'view_sales', module: 'Sales', description: 'View sales invoices history' },
    { name: 'create_sales', module: 'Sales', description: 'Generate new sales billing invoices' },
    { name: 'delete_sales', module: 'Sales', description: 'Cancel or delete sales invoices' },
    // Partners (Vendors/Customers)
    { name: 'manage_vendors', module: 'Vendors', description: 'View and manage vendors list' },
    { name: 'manage_customers', module: 'Customers', description: 'View and manage customers list' },
    // Settings & Admin
    { name: 'manage_settings', module: 'Settings', description: 'Change system properties, tax rates, and store profiles' },
    { name: 'manage_users', module: 'Settings', description: 'Create, modify, and manage ERP user accounts and privileges' },
    { name: 'view_logs', module: 'Settings', description: 'Inspect audit trail and user activities logs' }
  ];

  for (let i = 0; i < permissions.length; i++) {
    const p = permissions[i];
    await connection.query('INSERT INTO permissions (id, name, module, description) VALUES (?, ?, ?, ?)', [i + 1, p.name, p.module, p.description]);
  }
  console.log(`${permissions.length} Permissions seeded.`);

  // --- SEED ROLE-PERMISSIONS ---
  console.heading('Mapping Role Permissions');
  
  // Super Admin (role_id 1) and Admin (role_id 2) get all permissions
  for (let pId = 1; pId <= permissions.length; pId++) {
    await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)', [pId]);
    await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (2, ?)', [pId]);
  }
  
  // Manager (role_id 3) gets most permissions
  const managerPerms = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15, 17, 18, 20];
  for (const pId of managerPerms) {
    await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (3, ?)', [pId]);
  }

  // Staff (role_id 4) gets POS checkout and catalog viewing
  const staffPerms = [1, 4, 8, 14, 15, 18];
  for (const pId of staffPerms) {
    await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (4, ?)', [pId]);
  }
  console.log('Role Permissions mappings completed.');

  // --- SEED USERS ---
  console.heading('Seeding Administrative Users');
  const salt = await bcrypt.genSalt(10);
  const superadminPasswordHash = await bcrypt.hash('superadminpassword', salt);
  const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
  const managerPasswordHash = await bcrypt.hash('managerpassword', salt);
  const staffPasswordHash = await bcrypt.hash('staffpassword', salt);

  await connection.query(`
    INSERT INTO users (id, tenant_id, name, email, password, role_id, status) VALUES
    (1, NULL, 'SaaS Super Admin', 'superadmin@kiranamart.com', ?, 1, 'Active'),
    (2, 1, 'Deepesh Jain', 'admin@kiranamart.com', ?, 2, 'Active'),
    (3, 1, 'Rajesh Kumar', 'manager@kiranamart.com', ?, 3, 'Active'),
    (4, 1, 'Suresh Patel', 'staff@kiranamart.com', ?, 4, 'Active')
  `, [superadminPasswordHash, adminPasswordHash, managerPasswordHash, staffPasswordHash]);
  console.log('Default accounts seeded: superadmin@kiranamart.com, admin@kiranamart.com, manager@kiranamart.com, staff@kiranamart.com.');

  // --- SEED CATEGORIES ---
  console.heading('Seeding Product Categories');
  await connection.query(`
    INSERT INTO categories (id, tenant_id, name, description) VALUES
    (1, 1, 'Beverages', 'Soft drinks, fruit juices, tea, coffee, and energy drinks'),
    (2, 1, 'Snacks & Packaged Foods', 'Chips, biscuits, noodles, and ready-to-eat packages'),
    (3, 1, 'Dairy & Bakery', 'Milk, butter, cheese, bread, and paneer'),
    (4, 1, 'Spices & Groceries', 'Rice, wheat flour, pulses, cooking oils, and whole spices'),
    (5, 1, 'Household & Cleaning', 'Detergents, soaps, floor cleaners, and kitchen scrubs'),
    (6, 1, 'Personal Care', 'Shampoos, dental paste, hand washes, and body creams')
  `);
  console.log('Categories seeded.');

  // --- SEED WAREHOUSES ---
  console.heading('Seeding Warehouses');
  await connection.query(`
    INSERT INTO warehouses (id, tenant_id, name, location, status) VALUES
    (1, 1, 'Main Storage', 'Ground Floor Stockroom', 'Active'),
    (2, 1, 'Store Counter Shelf', 'Front Counter Display', 'Active'),
    (3, 1, 'Cold Storage', 'Rear Refrigerator Zone', 'Active')
  `);
  console.log('Warehouses seeded.');

  // --- SEED VENDORS ---
  console.heading('Seeding Suppliers / Vendors');
  await connection.query(`
    INSERT INTO vendors (id, tenant_id, name, phone, email, address, gstin) VALUES
    (1, 1, 'Balaji Wholesale Traders', '9876543211', 'sales@balajitraders.com', '124, Ghee Mandi, City Center', '07AAAAA1111A1Z1'),
    (2, 1, 'Shivam Dairy Supply', '9826012345', 'delivery@shivamdairy.com', 'Plot 4, Dairy Colony, Outer Bypass', '07BBBBB2222B2Z2'),
    (3, 1, 'Metro Cash & Carry', '18001021122', 'info@metrodistribution.in', 'Warehouse Area, Sector 5', '07CCCCC3333C3Z3')
  `);
  console.log('Vendors seeded.');

  // --- SEED CUSTOMERS ---
  console.heading('Seeding Customers');
  await connection.query(`
    INSERT INTO customers (id, tenant_id, name, phone, email, address) VALUES
    (1, 1, 'Walk-in Customer', '0000000000', 'walkin@kiranamart.com', 'Counter Billing'),
    (2, 1, 'Rahul Sharma', '9425098765', 'rahul@gmail.com', 'Sector A, Pocket 2, Flat 104'),
    (3, 1, 'Priya Patel', '9988776655', 'priya.patel@yahoo.com', 'Bungalow 12, Orchid Garden')
  `);
  console.log('Customers seeded.');

  // --- SEED PRODUCTS ---
  console.heading('Seeding Products Catalog');
  const products = [
    [1, 1, 'Coca-Cola 1.5L Bottle', '5449000000996', 'BEV-COKE-1.5', 'Coca-Cola', 1, 'Pcs', 52.00, 70.00, 75.00, 18.00, '22021010', '2026-05-01', '2026-11-01', 'Refreshing carbonated soft drink.'],
    [2, 1, 'Taj Mahal Tea 250g', '8901030753063', 'BEV-TAJ-250', 'Brooke Bond', 1, 'Pkt', 115.00, 140.00, 150.00, 5.00, '09021010', '2026-03-01', '2027-09-01', 'Premium rich black tea.'],
    [3, 1, 'Maggi 2-Min Noodles 12-Pack', '8901058002311', 'SNA-MAGG-12P', 'Nestle', 2, 'Pkt', 145.00, 172.00, 180.00, 18.00, '19023010', '2026-06-01', '2027-03-01', 'Instant noodles family pack.'],
    [4, 1, 'Britannia Marie Gold 250g', '8901063013142', 'SNA-MARI-250', 'Britannia', 2, 'Pkt', 28.00, 35.00, 40.00, 18.00, '19053100', '2026-04-01', '2026-12-01', 'Crisp tea biscuit.'],
    [5, 1, 'Amul Fresh Cream 250ml', '8901262010170', 'DY-AMUL-CRM', 'Amul', 3, 'Pcs', 48.00, 58.00, 60.00, 5.00, '04022100', '2026-06-25', '2026-07-25', 'Low-fat fresh kitchen cream.'],
    [6, 1, 'Amul Salted Butter 100g', '8901262020018', 'DY-AMUL-BTR', 'Amul', 3, 'Pcs', 44.00, 52.00, 56.00, 12.00, '04051000', '2026-05-10', '2026-11-10', 'Delicious salted table butter.'],
    [7, 1, 'Fortune Soyabean Oil 1L', '8906007281316', 'GRO-FORT-SOY', 'Fortune', 4, 'Ltr', 110.00, 135.00, 145.00, 5.00, '15079010', '2026-02-01', '2027-02-01', 'Refined edible soyabean oil.'],
    [8, 1, 'Tata Salt 1kg', '8901058895081', 'GRO-TATA-SLT', 'Tata', 4, 'Pkt', 20.00, 26.00, 28.00, 0.00, '25010021', '2026-01-01', '2030-01-01', 'Iodized kitchen table salt.'],
    [9, 1, 'Surf Excel Easy Wash 1kg', '8901030755913', 'HOU-SURF-1K', 'Unilever', 5, 'Pkt', 115.00, 138.00, 145.00, 18.00, '34029019', '2026-03-01', '2029-03-01', 'Detergent powder for washing.'],
    [10, 1, 'Colgate MaxFresh Paste 150g', '8901314545568', 'PC-COLG-MAX', 'Colgate', 6, 'Pcs', 75.00, 92.00, 99.00, 18.00, '33061020', '2026-05-15', '2028-05-15', 'Peppermint cooling gel toothpaste.']
  ];

  for (const p of products) {
    await connection.query(`
      INSERT INTO products (id, tenant_id, name, barcode, sku, brand, category_id, unit, purchase_price, selling_price, mrp, gst, hsn_code, manufacturing_date, expiry_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, p);
  }
  console.log(`${products.length} Products seeded.`);

  // --- SEED STOCK AND STOCK LOGS ---
  console.heading('Seeding Inventory Stocks and Audit Trail');
  const stocks = [
    { product_id: 1, warehouse_id: 1, quantity: 50 },
    { product_id: 1, warehouse_id: 2, quantity: 15 },
    { product_id: 2, warehouse_id: 1, quantity: 30 },
    { product_id: 2, warehouse_id: 2, quantity: 8 },
    { product_id: 3, warehouse_id: 1, quantity: 45 },
    { product_id: 3, warehouse_id: 2, quantity: 2 },
    { product_id: 4, warehouse_id: 1, quantity: 60 },
    { product_id: 4, warehouse_id: 2, quantity: 20 },
    { product_id: 5, warehouse_id: 3, quantity: 25 },
    { product_id: 5, warehouse_id: 2, quantity: 4 },
    { product_id: 6, warehouse_id: 3, quantity: 30 },
    { product_id: 7, warehouse_id: 1, quantity: 10 },
    { product_id: 7, warehouse_id: 2, quantity: 2 },
    { product_id: 8, warehouse_id: 1, quantity: 100 },
    { product_id: 8, warehouse_id: 2, quantity: 15 },
    { product_id: 9, warehouse_id: 1, quantity: 40 },
    { product_id: 10, warehouse_id: 1, quantity: 35 }
  ];

  for (const s of stocks) {
    await connection.query('INSERT INTO stock (tenant_id, product_id, warehouse_id, quantity) VALUES (1, ?, ?, ?)', [s.product_id, s.warehouse_id, s.quantity]);
    
    await connection.query(`
      INSERT INTO stock_logs (tenant_id, product_id, warehouse_id, type, quantity, reference_no, notes, user_id)
      VALUES (1, ?, ?, 'Stock In', ?, 'SYS-INIT-2026', 'Initial stock entry upon system seed setup', 2)
    `, [s.product_id, s.warehouse_id, s.quantity]);
  }
  console.log('Stocks and initial stock movements logged.');

  // --- SEED PURCHASES ---
  console.heading('Seeding Purchases History');
  await connection.query(`
    INSERT INTO purchases (id, tenant_id, purchase_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, payment_status, delivery_status, payment_method)
    VALUES (1, 1, 'PUR-001-2026', 1, 1, '2026-06-15', 7340.00, 300.00, 1141.20, 8181.20, 'Paid', 'Received', 'NetBanking')
  `);
  
  await connection.query(`
    INSERT INTO purchase_items (tenant_id, purchase_id, product_id, quantity, purchase_price, gst, total)
    VALUES 
    (1, 1, 1, 50, 52.00, 18.00, 3068.00),
    (1, 1, 3, 30, 145.00, 18.00, 5133.20)
  `);

  await connection.query(`
    INSERT INTO purchases (id, tenant_id, purchase_no, vendor_id, warehouse_id, date, subtotal, discount, gst_amount, total, payment_status, delivery_status, payment_method)
    VALUES (2, 1, 'PUR-002-2026', 3, 1, '2026-07-01', 11500.00, 500.00, 2070.00, 13070.00, 'Pending', 'Pending', 'UPI')
  `);

  await connection.query(`
    INSERT INTO purchase_items (tenant_id, purchase_id, product_id, quantity, purchase_price, gst, total)
    VALUES (1, 2, 9, 100, 115.00, 18.00, 13570.00)
  `);
  console.log('Purchase records seeded.');

  // --- SEED SALES ---
  console.heading('Seeding Sales Transactions');
  await connection.query(`
    INSERT INTO sales (id, tenant_id, invoice_no, customer_id, warehouse_id, date, subtotal, discount, gst_amount, total, payment_status, payment_method)
    VALUES (1, 1, 'INV-2026-0001', 1, 2, '2026-07-02', 365.00, 15.00, 48.60, 398.60, 'Paid', 'UPI')
  `);

  await connection.query(`
    INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, selling_price, gst, total)
    VALUES 
    (1, 1, 1, 2, 70.00, 18.00, 165.20),
    (1, 1, 2, 1, 140.00, 5.00, 147.00),
    (1, 1, 8, 3, 26.00, 0.00, 78.00)
  `);

  await connection.query(`
    INSERT INTO sales (id, tenant_id, invoice_no, customer_id, warehouse_id, date, subtotal, discount, gst_amount, total, payment_status, payment_method)
    VALUES (2, 1, 'INV-2026-0002', 2, 2, '2026-07-03', 230.00, 0.00, 41.40, 271.40, 'Paid', 'Cash')
  `);

  await connection.query(`
    INSERT INTO sale_items (tenant_id, sale_id, product_id, quantity, selling_price, gst, total)
    VALUES (1, 2, 3, 1, 172.00, 18.00, 202.96)
  `);
  console.log('Sales transactions seeded.');

  // --- SEED NOTIFICATIONS ---
  console.heading('Seeding Default Notifications');
  await connection.query(`
    INSERT INTO notifications (tenant_id, type, title, message, is_read) VALUES
    (1, 'Low Stock', 'Critical Stock Warning', 'Fortune Soyabean Oil 1L is below the minimum threshold of 5 units (Current: 2).', FALSE),
    (1, 'Near Expiry', 'Product Near Expiry', 'Amul Fresh Cream 250ml batch "BATCH-AC2" is expiring within 30 days (Expiry: 2026-07-25).', FALSE),
    (1, 'System', 'Welcome to Kirana ERP', 'The system database has been initialized with the premium Zoho-inspired ERP modules.', TRUE)
  `);
  console.log('Notifications seeded.');

  // --- SEED SETTINGS ---
  console.heading('Seeding System Settings');
  const settingsData = {
    store_name: 'Kirana Mart Delhi',
    store_address: '102, Malviya Nagar, New Delhi',
    store_phone: '+91-98765-43210',
    store_email: 'support@kiranamart.com',
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
    await connection.query('INSERT INTO settings (tenant_id, `key`, `value`) VALUES (1, ?, ?)', [key, val]);
  }
  console.log('System settings seeded.');

  // --- SEED ACTIVITY LOGS ---
  console.heading('Seeding Initial Activity Logs');
  await connection.query(`
    INSERT INTO activity_logs (tenant_id, user_id, action, module, details, ip_address) VALUES
    (NULL, 1, 'SaaS Platform Seeded', 'System', 'The Super Admin seeded platform configurations.', '127.0.0.1'),
    (1, 2, 'Database Initialized', 'System', 'The backend SQL database schema was created and standard seed records populated.', '127.0.0.1'),
    (1, 2, 'User Login Success', 'Auth', 'Deepesh Jain logged into the Store Admin Panel dashboard.', '127.0.0.1')
  `);
  console.log('Activity audit trail seeded.');

  await connection.end();
  console.log('\n======================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY');
  console.log('======================================\n');
}

runSeed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
