import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`[Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    // 1. Upgrade Master Database
    console.log(`[Migration] Selecting Master Database "${masterDb}"...`);
    await conn.query(`USE \`${masterDb}\`;`);

    console.log('[Migration] Checking users table in Master DB...');
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN department VARCHAR(50) NULL;`);
      console.log('  -> Added department column to users table in Master DB.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('  -> department column already exists in Master DB.');
      } else {
        throw err;
      }
    }

    // 2. Fetch all tenants
    console.log('[Migration] Fetching registered stores...');
    const [tenants] = await conn.query('SELECT id, store_name, database_name FROM tenants');
    console.log(`[Migration] Found ${tenants.length} tenant store(s).`);

    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`\n--------------------------------------------`);
      console.log(`[Migration] Upgrading Tenant Database: "${dbName}" (${tenant.store_name})`);
      console.log(`--------------------------------------------`);

      // Select tenant DB
      await conn.query(`USE \`${dbName}\`;`);

      // Add department column to users
      try {
        await conn.query(`ALTER TABLE users ADD COLUMN department VARCHAR(50) NULL;`);
        console.log('  -> Added department column to users.');
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          console.log('  -> department column already exists.');
        } else {
          console.error(`  -> Failed to add department:`, err.message);
        }
      }

      // Create user_permissions table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          user_id INT NOT NULL,
          permission_id INT NOT NULL,
          PRIMARY KEY (user_id, permission_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );
      `);
      console.log('  -> Ensured user_permissions pivot table exists.');

      // Create sales_returns table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS sales_returns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_id INT NOT NULL,
          invoice_no VARCHAR(50) NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          refund_amount DECIMAL(10,2) NOT NULL,
          reason VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);
      console.log('  -> Ensured sales_returns table exists.');

      // Create purchase_returns table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS purchase_returns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NULL,
          purchase_no VARCHAR(50) NULL,
          vendor_id INT NOT NULL,
          product_id INT NOT NULL,
          warehouse_id INT NOT NULL,
          quantity INT NOT NULL,
          return_price DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          reason VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
        );
      `);
      console.log('  -> Ensured purchase_returns table exists.');

      // Add columns to vendors table
      const vendorColumns = [
        ['company_name', 'VARCHAR(150) NULL'],
        ['payment_terms', 'VARCHAR(100) NULL'],
        ['bank_name', 'VARCHAR(100) NULL'],
        ['account_number', 'VARCHAR(50) NULL'],
        ['ifsc_code', 'VARCHAR(20) NULL'],
        ['outstanding_balance', 'DECIMAL(12,2) DEFAULT 0.00']
      ];

      for (const col of vendorColumns) {
        try {
          await conn.query(`ALTER TABLE vendors ADD COLUMN ${col[0]} ${col[1]};`);
          console.log(`  -> Added ${col[0]} column to vendors.`);
        } catch (err) {
          if (err.code === 'ER_DUP_COLUMN_NAME') {
            // column exists
          } else {
            console.error(`  -> Failed to add vendor column ${col[0]}:`, err.message);
          }
        }
      }

      // Modify stock table to support vendor_id
      try {
        await conn.query(`ALTER TABLE stock ADD COLUMN vendor_id INT NULL;`);
        console.log('  -> Added vendor_id column to stock.');
      } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
          // already exists
        } else {
          console.error('  -> Failed to add vendor_id column to stock:', err.message);
        }
      }

      // Link existing stock to first vendor if not already set
      const [vendors] = await conn.query('SELECT id FROM vendors LIMIT 1');
      if (vendors.length > 0) {
        const defaultVendorId = vendors[0].id;
        await conn.query('UPDATE stock SET vendor_id = ? WHERE vendor_id IS NULL', [defaultVendorId]);
        console.log(`  -> Updated existing stock rows to link to default Vendor ID: ${defaultVendorId}.`);
      }

      // Alter stock vendor_id to be NOT NULL
      try {
        await conn.query('ALTER TABLE stock MODIFY COLUMN vendor_id INT NOT NULL;');
      } catch (err) {
        console.error('  -> Failed to modify stock.vendor_id to NOT NULL:', err.message);
      }

      // Add stock vendor foreign key constraint
      try {
        await conn.query('ALTER TABLE stock ADD CONSTRAINT fk_stock_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;');
        console.log('  -> Added fk_stock_vendor foreign key constraint.');
      } catch (err) {
        // Constraint already exists
      }

      // Re-structure stock unique key
      try {
        await conn.query('ALTER TABLE stock DROP KEY unique_product_warehouse;');
        console.log('  -> Dropped old unique_product_warehouse key.');
      } catch (err) {
        // Key might not exist or already dropped
      }

      try {
        await conn.query('ALTER TABLE stock ADD UNIQUE KEY unique_product_warehouse_vendor (product_id, warehouse_id, vendor_id);');
        console.log('  -> Added unique_product_warehouse_vendor constraint.');
      } catch (err) {
        // already exists
      }

      // Modify stock_logs to support vendor_id
      try {
        await conn.query('ALTER TABLE stock_logs ADD COLUMN vendor_id INT NULL;');
        await conn.query('ALTER TABLE stock_logs ADD CONSTRAINT fk_stock_logs_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;');
        console.log('  -> Added vendor_id column and foreign key to stock_logs.');
      } catch (err) {
        // Column or constraint already exists
      }

      // 3. Seed Roles and map permissions
      console.log('  -> Seeding Sales Manager and Purchase Manager roles...');
      
      // Seed Sales Manager
      let [roleCheck] = await conn.query('SELECT id FROM roles WHERE name = "Sales Manager"');
      let salesManagerRoleId;
      if (roleCheck.length === 0) {
        const [res] = await conn.query('INSERT INTO roles (name, description) VALUES ("Sales Manager", "Sales department head with sales metrics and staff control")');
        salesManagerRoleId = res.insertId;
        console.log(`    * Created Sales Manager role (ID: ${salesManagerRoleId})`);
      } else {
        salesManagerRoleId = roleCheck[0].id;
        console.log(`    * Sales Manager role already exists (ID: ${salesManagerRoleId})`);
      }

      // Seed Purchase Manager
      [roleCheck] = await conn.query('SELECT id FROM roles WHERE name = "Purchase Manager"');
      let purchaseManagerRoleId;
      if (roleCheck.length === 0) {
        const [res] = await conn.query('INSERT INTO roles (name, description) VALUES ("Purchase Manager", "Purchase and stock department head with inventory control")');
        purchaseManagerRoleId = res.insertId;
        console.log(`    * Created Purchase Manager role (ID: ${purchaseManagerRoleId})`);
      } else {
        purchaseManagerRoleId = roleCheck[0].id;
        console.log(`    * Purchase Manager role already exists (ID: ${purchaseManagerRoleId})`);
      }

      // Fetch all permissions to get their IDs
      const [permissions] = await conn.query('SELECT id, name FROM permissions');
      const permMap = {};
      permissions.forEach(p => {
        permMap[p.name] = p.id;
      });

      // Clear existing permissions for these roles to overwrite cleanly
      await conn.query('DELETE FROM role_permissions WHERE role_id IN (?, ?)', [salesManagerRoleId, purchaseManagerRoleId]);

      // Map Sales Manager permissions
      const salesManagerPerms = [
        'view_dashboard', 'view_sales', 'create_sales', 'delete_sales', 
        'manage_customers', 'view_reports', 'view_borrow', 'create_borrow', 'manage_users'
      ];
      for (const permName of salesManagerPerms) {
        const pId = permMap[permName];
        if (pId) {
          await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [salesManagerRoleId, pId]);
        }
      }
      console.log(`    * Seeding ${salesManagerPerms.length} permissions for Sales Manager role.`);

      // Map Purchase Manager permissions
      const purchaseManagerPerms = [
        'view_dashboard', 'view_purchases', 'create_purchases', 'delete_purchases', 
        'view_products', 'create_products', 'edit_products', 'delete_products', 
        'view_stock', 'adjust_stock', 'transfer_stock', 'manage_vendors', 'view_reports', 'manage_users'
      ];
      for (const permName of purchaseManagerPerms) {
        const pId = permMap[permName];
        if (pId) {
          await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [purchaseManagerRoleId, pId]);
        }
      }
      console.log(`    * Seeding ${purchaseManagerPerms.length} permissions for Purchase Manager role.`);
    }

    console.log('\n[Migration] SCHEMA UPGRADES AND ROLE SEEDING MIGRATION COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('[Migration] Failed to run migration:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runMigration();
