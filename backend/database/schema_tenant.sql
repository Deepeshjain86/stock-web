-- MySQL Single Tenant Database Schema Template (Isolated Shop Database)

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Role Permissions Mapping Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. Users Table (Local store user profile data)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  login_id VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NULL,
  role_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Suspended'
  department VARCHAR(50) NULL, -- 'Sales', 'Purchase', 'None'
  employee_serial_id INT UNIQUE NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expires TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 4b. User-specific permissions override table
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. Main Product Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT NULL DEFAULT NULL,
  category_type ENUM('Main','Sub') NOT NULL DEFAULT 'Main',
  category_code VARCHAR(20) NULL,
  display_order INT NOT NULL DEFAULT 0,
  sub_category VARCHAR(100) NULL,
  brand_name VARCHAR(150) NULL,
  status VARCHAR(20) DEFAULT 'Active',
  sort_order INT DEFAULT 0,
  description TEXT NULL,
  costing_method ENUM('FIFO', 'AVCO', 'Standard Cost') NOT NULL DEFAULT 'FIFO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat_name_parent (name, parent_id),
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 5b. Sub-Categories Table
CREATE TABLE IF NOT EXISTS sub_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subcat_category (category_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 5c. Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Suppliers / Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  gstin VARCHAR(15) NULL,
  payment_terms VARCHAR(100) NULL,
  bank_name VARCHAR(100) NULL,
  account_number VARCHAR(50) NULL,
  ifsc_code VARCHAR(20) NULL,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  total_purchases DECIMAL(12,2) DEFAULT 0.00,
  total_paid DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(50) NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  alternate_phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(20) NULL,
  customer_type ENUM('Walk-in', 'Borrow') NOT NULL DEFAULT 'Walk-in',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  notes TEXT NULL,
  opening_balance DECIMAL(12,2) DEFAULT 0.00,
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  advance_balance DECIMAL(12,2) DEFAULT 0.00,
  created_by INT NULL,
  updated_by INT NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(255) NULL,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  barcode VARCHAR(50) NULL UNIQUE,
  sku VARCHAR(50) NOT NULL UNIQUE,
  brand VARCHAR(100) NULL,
  brand_id INT NULL,
  category_id INT NOT NULL,
  sub_category_id INT NULL,
  sub_category VARCHAR(100) NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  purchase_price DECIMAL(12,2) DEFAULT 0.00,
  selling_price DECIMAL(12,2) DEFAULT 0.00,
  mrp DECIMAL(12,2) DEFAULT 0.00,
  gst DECIMAL(5,2) DEFAULT 0.00,
  hsn_code VARCHAR(20) NULL,
  min_stock INT DEFAULT 5,
  max_stock INT DEFAULT 100,
  standard_cost DECIMAL(12,2) DEFAULT 0.00,
  image_url VARCHAR(255) NULL,
  manufacturing_date DATE NULL,
  expiry_date DATE NULL,
  measurement_value VARCHAR(50) NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- 10. Inventory Stock Table
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  vendor_id INT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_warehouse_vendor (product_id, warehouse_id, vendor_id)
);

-- 11. Stock Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  vendor_id INT NULL,
  type VARCHAR(30) NOT NULL, -- 'Stock In', 'Stock Out', 'Adjustment', 'Transfer'
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  previous_quantity DECIMAL(12,3) NULL DEFAULT 0.000,
  new_quantity DECIMAL(12,3) NULL DEFAULT 0.000,
  reference_no VARCHAR(100) NULL,
  notes TEXT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_no VARCHAR(50) NOT NULL UNIQUE,
  vendor_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  date DATE NOT NULL,
  expected_delivery_date DATE NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) DEFAULT 'Pending',
  notes TEXT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12b. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  received_quantity DECIMAL(12,3) DEFAULT 0.000,
  purchase_price DECIMAL(12,2) NOT NULL,
  mrp DECIMAL(12,2) NULL,
  gst DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 13. Purchases Invoice Table
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_order_id INT NULL,
  grn_id INT NULL,
  vendor_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'Pending',
  delivery_status VARCHAR(20) DEFAULT 'Pending',
  payment_method VARCHAR(50) DEFAULT 'Cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 14. Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  purchase_price DECIMAL(12,2) NOT NULL,
  mrp DECIMAL(12,2) NULL,
  gst DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 14b. Purchase Batches Table (FIFO Queue, Expiry & Batch-wise MRP)
CREATE TABLE IF NOT EXISTS purchase_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  batch_number VARCHAR(100) NULL,
  purchase_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  remaining_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  purchase_date DATE NOT NULL,
  expiry_date DATE NULL,
  purchase_price DECIMAL(12,2) DEFAULT 0.00,
  mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  supplier_id INT NULL,
  warehouse_id INT NULL DEFAULT 1,
  grn_id INT NULL,
  purchase_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_prod_rem (product_id, remaining_quantity, purchase_date, id)
);

-- 14c. Goods Received Notes (GRN) Master
CREATE TABLE IF NOT EXISTS grns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_order_id INT NULL,
  vendor_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 14d. GRN Items
CREATE TABLE IF NOT EXISTS grn_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grn_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  quantity_damaged DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  quantity_rejected DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  batch_number VARCHAR(100) NULL,
  mrp DECIMAL(12,2) NULL,
  expiry_date DATE NULL,
  FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 15. Sales Invoice Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  user_id INT NULL,
  date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'Paid',
  payment_method VARCHAR(50) DEFAULT 'Cash',
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 16. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  selling_price DECIMAL(12,2) NOT NULL,
  mrp DECIMAL(12,2) NULL,
  batch_number VARCHAR(100) NULL,
  gst DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 16b. Sale Payments Table (Split Payments / Multiple Modes)
CREATE TABLE IF NOT EXISTS sale_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  sale_id INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reference_no VARCHAR(100) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  INDEX idx_sale_payments_sale (sale_id)
);

-- 17. Supplier Payments Table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_no VARCHAR(50) NOT NULL UNIQUE,
  vendor_id INT NOT NULL,
  purchase_id INT NULL,
  payment_date DATETIME NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_mode ENUM('Cash', 'Bank Transfer', 'UPI', 'Cheque', 'NEFT/RTGS', 'Other') NOT NULL DEFAULT 'Cash',
  reference_no VARCHAR(100) NULL,
  bank_account VARCHAR(100) NULL,
  remarks TEXT NULL,
  attachment_url VARCHAR(255) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
);

-- 17b. Vendor Ledger Table
CREATE TABLE IF NOT EXISTS vendor_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  purchase_id INT NULL,
  payment_id INT NULL,
  date DATETIME NOT NULL,
  transaction_type ENUM('PURCHASE_INVOICE', 'SUPPLIER_PAYMENT', 'PURCHASE_RETURN', 'OPENING_BALANCE', 'ADJUSTMENT') NOT NULL,
  reference_no VARCHAR(100) NULL,
  description TEXT NULL,
  debit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  running_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES supplier_payments(id) ON DELETE SET NULL
);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium',
  module VARCHAR(50) NULL,
  related_module VARCHAR(50) NULL,
  reference_id INT NULL,
  reference_type VARCHAR(50) NULL,
  related_user VARCHAR(150) NULL,
  target_roles VARCHAR(255) DEFAULT 'Admin,Manager,Staff',
  is_read BOOLEAN DEFAULT FALSE,
  actor_id INT NULL,
  actor_name VARCHAR(150) NULL,
  actor_role VARCHAR(50) NULL,
  action VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18b. Notification Per-User Read States
CREATE TABLE IF NOT EXISTS notification_user_states (
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id),
  INDEX idx_notification_user_states_user (user_id, is_deleted, is_read),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- 19. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 20. Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_name VARCHAR(150) NULL,
  role VARCHAR(50) NULL,
  department VARCHAR(50) NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT NULL,
  record_id VARCHAR(100) NULL,
  previous_value TEXT NULL,
  new_value TEXT NULL,
  ip_address VARCHAR(45) NULL,
  device_info VARCHAR(255) NULL,
  session_id VARCHAR(100) NULL,
  status VARCHAR(50) DEFAULT 'Success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 21. Borrow Records Table (Udhaar)
CREATE TABLE IF NOT EXISTS borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Borrow',
  date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 21b. Borrow Transactions Table
CREATE TABLE IF NOT EXISTS borrow_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  invoice_no VARCHAR(50) NULL,
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('Pending', 'Partial Paid', 'Paid', 'Overdue') NOT NULL DEFAULT 'Pending',
  remarks TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_payment_status (payment_status)
);

-- 22. Sales Returns Table
CREATE TABLE IF NOT EXISTS sales_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(50) NULL,
  sale_id INT NOT NULL,
  invoice_no VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  return_type VARCHAR(50) DEFAULT 'Refund',
  refund_method VARCHAR(50) DEFAULT 'Cash',
  remarks TEXT NULL,
  replacement_product_id INT NULL,
  replacement_quantity INT NULL,
  price_difference DECIMAL(10,2) DEFAULT 0.00,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (replacement_product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 23. Purchase Returns Table
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_id INT NULL,
  purchase_no VARCHAR(50) NULL,
  vendor_id INT NOT NULL,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL,
  return_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  return_type VARCHAR(30) NOT NULL DEFAULT 'Refund',
  reason VARCHAR(255) NOT NULL,
  remarks TEXT NULL,
  image_url VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  batch_number VARCHAR(50) NULL,
  expiry_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- 23b. Purchase Return Status History Table
CREATE TABLE IF NOT EXISTS purchase_return_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_return_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  user_name VARCHAR(150) NOT NULL DEFAULT 'System',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
);

-- 24. Stock Destroys Table
CREATE TABLE IF NOT EXISTS stock_destroys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destroy_no VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) NULL,
  sku VARCHAR(100) NULL,
  batch_no VARCHAR(100) NULL,
  batch_id INT NULL,
  warehouse_name VARCHAR(100) DEFAULT 'Main Storage',
  source_location VARCHAR(150) DEFAULT 'Main Storage',
  scrap_location VARCHAR(150) DEFAULT 'Scrap / Inventory Loss Location',
  available_stock DECIMAL(12,3) DEFAULT 0.000,
  destroy_quantity DECIMAL(12,3) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Pcs',
  unit_cost DECIMAL(12,2) DEFAULT 0.00,
  purchase_price DECIMAL(12,2) DEFAULT 0.00,
  selling_price DECIMAL(12,2) DEFAULT 0.00,
  destroy_value DECIMAL(12,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  remarks TEXT NULL,
  evidence_image LONGTEXT NULL,
  destroyed_by_id INT NULL,
  destroyed_by_name VARCHAR(255) NULL,
  status ENUM('Draft', 'Confirmed', 'Cancelled') DEFAULT 'Confirmed',
  cancel_reason TEXT NULL,
  cancelled_by_name VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_destroy_no (destroy_no),
  INDEX idx_product_id (product_id)
);

-- 25. Stock Adjustments Table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adjustment_no VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL DEFAULT 1,
  batch_id INT NULL,
  batch_number VARCHAR(100) NULL,
  adjustment_type ENUM('Increase', 'Decrease') NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  adjustment_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reason VARCHAR(100) NOT NULL,
  financial_impact ENUM('Gain', 'Loss', 'None') NOT NULL DEFAULT 'None',
  remarks TEXT NULL,
  previous_quantity DECIMAL(12,3) DEFAULT 0.00,
  new_quantity DECIMAL(12,3) DEFAULT 0.00,
  previous_inventory_value DECIMAL(12,2) DEFAULT 0.00,
  new_inventory_value DECIMAL(12,2) DEFAULT 0.00,
  accounting_treatment VARCHAR(100) DEFAULT 'Inventory Variation',
  user_id INT NULL,
  status ENUM('Completed', 'Reversed') NOT NULL DEFAULT 'Completed',
  reversal_ref_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reversal_ref_id) REFERENCES stock_adjustments(id) ON DELETE SET NULL,
  INDEX idx_adj_no (adjustment_no),
  INDEX idx_adj_product (product_id),
  INDEX idx_adj_status (status)
);

-- 26. Inventory Valuation Layers (Odoo 19 Valuation Ledger)
CREATE TABLE IF NOT EXISTS inventory_valuation_layers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL DEFAULT 1,
  batch_id INT NULL,
  transaction_type ENUM('Purchase Receipt', 'Sales Delivery', 'Sales Return', 'Purchase Return', 'Stock Adjustment', 'Scrap/Wastage', 'Stock Transfer', 'Revaluation') NOT NULL,
  reference_no VARCHAR(100) NOT NULL,
  quantity_delta DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  value_delta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  previous_inventory_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  new_inventory_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  previous_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.00,
  new_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.00,
  accounting_treatment VARCHAR(100) NULL DEFAULT 'Inventory Variation',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ivl_product (product_id),
  INDEX idx_ivl_type (transaction_type),
  INDEX idx_ivl_ref (reference_no)
);

-- 27. Inventory Revaluations Table
CREATE TABLE IF NOT EXISTS inventory_revaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  revaluation_no VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL DEFAULT 1,
  batch_id INT NULL,
  old_unit_cost DECIMAL(12,2) NOT NULL,
  new_unit_cost DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  value_delta DECIMAL(12,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  remarks TEXT NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES purchase_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_rev_no (revaluation_no),
  INDEX idx_rev_product (product_id)
);

-- 28. Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transfer_no VARCHAR(50) NOT NULL UNIQUE,
  from_warehouse_id INT NOT NULL,
  to_warehouse_id INT NOT NULL,
  from_warehouse_name VARCHAR(255) DEFAULT 'Main Storage',
  to_warehouse_name VARCHAR(255) DEFAULT 'Secondary Warehouse',
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100) DEFAULT 'N/A',
  sku VARCHAR(100) DEFAULT 'N/A',
  batch_id INT NULL,
  batch_no VARCHAR(100) DEFAULT 'DEFAULT',
  expiry_date DATE NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  in_transit_quantity DECIMAL(12,3) DEFAULT 0.000,
  unit VARCHAR(50) DEFAULT 'Pcs',
  unit_cost DECIMAL(12,2) DEFAULT 0.00,
  total_value DECIMAL(12,2) DEFAULT 0.00,
  status ENUM('Draft', 'In Transit', 'Pending', 'In-Transit', 'Completed', 'Cancelled') DEFAULT 'In Transit',
  remarks TEXT NULL,
  cancel_reason TEXT NULL,
  created_by INT NULL,
  created_by_name VARCHAR(255) DEFAULT 'Admin',
  received_by INT NULL,
  received_by_name VARCHAR(255) NULL,
  shipped_at DATETIME NULL,
  received_at DATETIME NULL,
  transfer_date DATE NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_transfer_no (transfer_no),
  INDEX idx_transfer_product (product_id),
  INDEX idx_transfer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



