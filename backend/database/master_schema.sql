-- Master Database Schema for SaaS Multi-Tenant Kirana ERP


-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_uuid VARCHAR(50) NOT NULL UNIQUE,
  store_name VARCHAR(150) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  address TEXT NULL,
  gstin VARCHAR(15) NULL,
  logo_url VARCHAR(255) NULL,
  database_name VARCHAR(100) NOT NULL UNIQUE,
  subscription_status VARCHAR(20) DEFAULT 'Trial', -- 'Trial', 'Active', 'Suspended', 'Expired'
  subscription_plan VARCHAR(30) DEFAULT 'Trial', -- 'Trial', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'
  subscription_expires_at DATE NULL,
  trial_started_at TIMESTAMP NULL,
  trial_ended_at TIMESTAMP NULL,
  trial_used BOOLEAN DEFAULT FALSE,
  first_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Global Users authentication table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL, -- NULL for Super Admin
  email VARCHAR(100) NOT NULL UNIQUE,
  login_id VARCHAR(50) NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'Super Admin', 'Admin', 'Employee'
  status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Suspended'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. Billing History logs
CREATE TABLE IF NOT EXISTS billing_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  plan VARCHAR(30) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'Paid', -- 'Paid', 'Failed', 'Pending'
  billing_date DATE NOT NULL,
  next_renewal_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'AutoPay',
  invoice_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 4. Subscription State change Logs
CREATE TABLE IF NOT EXISTS subscription_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'Trial Started', 'Upgraded', 'Downgraded', 'Suspended', 'Renewed', 'Cancelled'
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 5. Activity Logs (Global/Master Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Notifications Table (Master Platform-wide Alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  type VARCHAR(30) NOT NULL, -- 'Low Stock', 'Near Expiry', 'Expired', 'System', 'Auth', etc.
  title VARCHAR(150) NOT NULL,
  message VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
  related_user VARCHAR(150) NULL,
  related_module VARCHAR(50) NULL,
  target_roles VARCHAR(255) DEFAULT 'Super Admin',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

