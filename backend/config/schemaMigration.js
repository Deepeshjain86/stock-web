export const runCategorySchemaMigrations = async (pool) => {
  try {
    // 1. Ensure sub_categories table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INT NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_subcat_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ensure brands table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Ensure columns sub_category_id and brand_id exist on products table
    const [cols] = await pool.query('DESCRIBE products');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('sub_category_id')) {
      await pool.query('ALTER TABLE products ADD COLUMN sub_category_id INT NULL AFTER category_id');
    }
    if (!colNames.includes('brand_id')) {
      await pool.query('ALTER TABLE products ADD COLUMN brand_id INT NULL AFTER sub_category_id');
    }

    // 4. Ensure sale_payments table exists for Split Payment / Multiple Payment Modes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NULL,
        sale_id INT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        reference_no VARCHAR(100) NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sale_payments_sale (sale_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4b. Per-user notification state for non-admin staff.
    // Admin continues to use notifications.is_read/delete directly.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_user_states (
        notification_id INT NOT NULL,
        user_id INT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        is_deleted TINYINT(1) NOT NULL DEFAULT 0,
        read_at TIMESTAMP NULL,
        deleted_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (notification_id, user_id),
        INDEX idx_notification_user_states_user (user_id, is_deleted, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Ensure batch-wise MRP columns exist across purchase_batches, sale_items, and purchase_items
    try {
      const [pbCols] = await pool.query('DESCRIBE purchase_batches');
      const pbColNames = pbCols.map(c => c.Field);
      if (!pbColNames.includes('mrp')) {
        await pool.query('ALTER TABLE purchase_batches ADD COLUMN mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER purchase_price');
      }
      if (!pbColNames.includes('selling_price')) {
        await pool.query('ALTER TABLE purchase_batches ADD COLUMN selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER mrp');
      }
    } catch (e) {
      console.warn('[Schema Migration] purchase_batches table check:', e.message);
    }

    try {
      const [siCols] = await pool.query('DESCRIBE sale_items');
      const siColNames = siCols.map(c => c.Field);
      if (!siColNames.includes('mrp')) {
        await pool.query('ALTER TABLE sale_items ADD COLUMN mrp DECIMAL(12,2) NULL AFTER selling_price');
      }
      if (!siColNames.includes('batch_number')) {
        await pool.query('ALTER TABLE sale_items ADD COLUMN batch_number VARCHAR(100) NULL AFTER mrp');
      }
    } catch (e) {
      console.warn('[Schema Migration] sale_items table check:', e.message);
    }

    try {
      const [piCols] = await pool.query('DESCRIBE purchase_items');
      const piColNames = piCols.map(c => c.Field);
      if (!piColNames.includes('mrp')) {
        await pool.query('ALTER TABLE purchase_items ADD COLUMN mrp DECIMAL(12,2) NULL AFTER purchase_price');
      }
    } catch (e) {
      console.warn('[Schema Migration] purchase_items table check:', e.message);
    }

    try {
      const [vCols] = await pool.query('DESCRIBE vendors');
      const vColNames = vCols.map(c => c.Field);
      const expectedVendorCols = [
        { name: 'supplier_code', type: 'VARCHAR(50) NULL' },
        { name: 'company_name', type: 'VARCHAR(150) NULL' },
        { name: 'contact_person', type: 'VARCHAR(150) NULL' },
        { name: 'alternate_phone', type: 'VARCHAR(20) NULL' },
        { name: 'pan', type: 'VARCHAR(10) NULL' },
        { name: 'city', type: 'VARCHAR(100) NULL' },
        { name: 'state', type: 'VARCHAR(100) NULL' },
        { name: 'pincode', type: 'VARCHAR(20) NULL' },
        { name: 'categories_supplied', type: 'TEXT NULL' },
        { name: 'payment_terms', type: 'VARCHAR(100) NULL' },
        { name: 'credit_limit', type: 'DECIMAL(12,2) DEFAULT 0.00' },
        { name: 'opening_balance', type: 'DECIMAL(12,2) DEFAULT 0.00' },
        { name: 'opening_balance_type', type: "ENUM('Payable', 'Advance') DEFAULT 'Payable'" },
        { name: 'notes', type: 'TEXT NULL' },
        { name: 'bank_name', type: 'VARCHAR(100) NULL' },
        { name: 'account_number', type: 'VARCHAR(50) NULL' },
        { name: 'ifsc_code', type: 'VARCHAR(20) NULL' }
      ];
      for (const col of expectedVendorCols) {
        if (!vColNames.includes(col.name)) {
          await pool.query(`ALTER TABLE vendors ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (e) {
      console.warn('[Schema Migration] vendors table check:', e.message);
    }

    try {
      const [slCols] = await pool.query('DESCRIBE stock_logs');
      const slColNames = slCols.map(c => c.Field);
      const expectedStockLogCols = [
        { name: 'previous_quantity', type: 'INT NULL DEFAULT 0' },
        { name: 'new_quantity', type: 'INT NULL DEFAULT 0' },
        { name: 'batch_number', type: 'VARCHAR(100) NULL' },
        { name: 'mrp', type: 'DECIMAL(12,2) NULL' },
        { name: 'unit_price', type: 'DECIMAL(12,2) NULL' }
      ];
      for (const col of expectedStockLogCols) {
        if (!slColNames.includes(col.name)) {
          await pool.query(`ALTER TABLE stock_logs ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (e) {
      console.warn('[Schema Migration] stock_logs table check:', e.message);
    }
  } catch (err) {
    console.error('[Schema Migration] Category schema migration notice:', err.message);
  }
};
