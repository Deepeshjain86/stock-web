-- XAMPP-Lite 8.5.5
-- https://xampplite.sf.net/
-- ----------------------------------------------------------------
-- Server version: 11.4.10-MariaDB-log
-- Date: Wed, 29 Jul 2026 10:33:43 +0100

-- MySQL compatibility and import directives (DO NOT REMOVE)
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Table `vendors` ================================================
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `outstanding_balance` decimal(12,2) DEFAULT 0.00,
  `credit_limit` decimal(12,2) DEFAULT 0.00,
  `total_purchases` decimal(12,2) DEFAULT 0.00,
  `total_paid` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `customers` ==============================================
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `alternate_phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `customer_type` enum('Walk-in','Borrow') NOT NULL DEFAULT 'Walk-in',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `payment_mode` varchar(50) DEFAULT 'Cash',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES
  (1,	NULL,	'Walk-in Customer',	'0000000000',	NULL,	'walkin@16.com',	'Counter Billing',	NULL,	NULL,	NULL,	'Walk-in',	'Active',	'Cash',	NULL,	NULL,	NULL,	'2026-07-29 08:10:36',	'2026-07-29 08:10:36');


-- Table `settings` ===============================================
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES
  (1,	'store_name',	'Abhishek Kirana Mart',	'2026-07-29 08:10:36'),
  (2,	'store_address',	'Enter store address...',	'2026-07-29 08:10:36'),
  (3,	'store_phone',	'0000000000',	'2026-07-29 08:10:36'),
  (4,	'store_email',	'abhishek@kiranaerp.com',	'2026-07-29 08:10:36'),
  (5,	'currency',	'INR',	'2026-07-29 08:10:36'),
  (6,	'timezone',	'Asia/Kolkata',	'2026-07-29 08:10:36'),
  (7,	'gstin',	'07AAAAA1111A1Z1',	'2026-07-29 08:10:36'),
  (8,	'invoice_prefix',	'KM-INV-',	'2026-07-29 08:10:36'),
  (9,	'low_stock_limit',	'5',	'2026-07-29 08:10:36'),
  (10,	'expiry_alert_days',	'30',	'2026-07-29 08:10:36');


-- Table `brands` =================================================
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES
  (1,	'Amul',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (2,	'Tata',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (3,	'Thums-up',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (4,	'Close-up',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (5,	'Fortune',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (6,	'Daawat',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (7,	'Priniti',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (8,	'Primum',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (9,	'Nescafe',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (10,	'Parle-G',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (11,	'vedaka',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54'),
  (12,	'Nirma',	'Active',	NULL,	'2026-07-29 08:31:54',	'2026-07-29 08:31:54');


-- Table `roles` ==================================================
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
  (1,	'Admin',	'Store owner administrative profile with billing and settings control',	'2026-07-29 08:10:35',	'2026-07-29 08:10:35'),
  (2,	'Sales Manager',	'Sales department head with sales metrics and staff control',	'2026-07-29 08:10:35',	'2026-07-29 08:10:35'),
  (3,	'Purchase Manager',	'Purchase and stock department head with inventory control',	'2026-07-29 08:10:35',	'2026-07-29 08:10:35'),
  (4,	'Employee',	'Store staff and point-of-sale checkout cashier',	'2026-07-29 08:10:35',	'2026-07-29 08:10:35');


-- Table `permissions` ============================================
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES
  (1,	'view_dashboard',	'Dashboard',	'View dashboard metrics',	'2026-07-29 08:10:35'),
  (2,	'view_reports',	'Reports',	'View sales and stock reports',	'2026-07-29 08:10:35'),
  (3,	'export_reports',	'Reports',	'Export PDF/Excel inventory statements',	'2026-07-29 08:10:36'),
  (4,	'view_products',	'Products',	'View product catalogue details',	'2026-07-29 08:10:36'),
  (5,	'create_products',	'Products',	'Create new product listings',	'2026-07-29 08:10:36'),
  (6,	'edit_products',	'Products',	'Edit product parameters',	'2026-07-29 08:10:36'),
  (7,	'delete_products',	'Products',	'Permanently delete items',	'2026-07-29 08:10:36'),
  (8,	'view_stock',	'Stock',	'View inventory levels',	'2026-07-29 08:10:36'),
  (9,	'adjust_stock',	'Stock',	'Manually adjust stock balances',	'2026-07-29 08:10:36'),
  (10,	'transfer_stock',	'Stock',	'Transfer stocks between warehouses',	'2026-07-29 08:10:36'),
  (11,	'view_purchases',	'Purchases',	'View purchase ledger lists',	'2026-07-29 08:10:36'),
  (12,	'create_purchases',	'Purchases',	'Record distributor invoices',	'2026-07-29 08:10:36'),
  (13,	'delete_purchases',	'Purchases',	'Cancel purchase orders',	'2026-07-29 08:10:36'),
  (14,	'view_sales',	'Sales',	'View sales history',	'2026-07-29 08:10:36'),
  (15,	'create_sales',	'Sales',	'Generate sales POS billing',	'2026-07-29 08:10:36'),
  (16,	'delete_sales',	'Sales',	'Void sales invoices',	'2026-07-29 08:10:36'),
  (17,	'manage_customers',	'Customers',	'Manage customer profiles',	'2026-07-29 08:10:36'),
  (18,	'manage_users',	'Users',	'Create employee logins',	'2026-07-29 08:10:36'),
  (19,	'view_activity_logs',	'System',	'Audit staff logs',	'2026-07-29 08:10:36'),
  (20,	'view_borrow',	'Borrow',	'View outstanding customer Udhaar summary',	'2026-07-29 08:10:36'),
  (21,	'create_borrow',	'Borrow',	'Record custom borrow/payback transaction log',	'2026-07-29 08:10:36');


-- Table `warehouses` =============================================
CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `warehouses` (`id`, `name`, `location`, `status`, `created_at`, `updated_at`) VALUES
  (1,	'Main Storage',	'Ground Floor Stockroom',	'Active',	'2026-07-29 08:10:36',	'2026-07-29 08:10:36');


-- Table `notifications` ==========================================
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(30) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` varchar(255) NOT NULL,
  `priority` varchar(20) DEFAULT 'Medium',
  `module` varchar(50) DEFAULT NULL,
  `related_module` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `related_user` varchar(150) DEFAULT NULL,
  `target_roles` varchar(255) DEFAULT 'Admin,Manager,Staff',
  `is_read` tinyint(1) DEFAULT 0,
  `actor_id` int(11) DEFAULT NULL,
  `actor_name` varchar(150) DEFAULT NULL,
  `actor_role` varchar(50) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES
  (1,	NULL,	'System',	'Database Isolated successfully',	'Welcome to your dedicated tenant-database Kirana ERP.',	'Medium',	NULL,	NULL,	NULL,	NULL,	NULL,	'Admin,Manager,Staff',	0,	NULL,	NULL,	NULL,	NULL,	'2026-07-29 08:10:36'),
  (2,	NULL,	'User Login',	'Employee Logged In',	'Admin \"Abhishek Roy\" logged in successfully.',	'Low',	'Auth',	'Auth',	NULL,	NULL,	'abhishek@kiranaerp.com',	'Admin,Manager',	0,	NULL,	'abhishek@kiranaerp.com',	'System',	'User Login',	'2026-07-29 08:13:39'),
  (3,	NULL,	'User Logout',	'Employee Logged Out',	'Admin \"Abhishek Roy\" logged out.',	'Low',	'Auth',	'Auth',	NULL,	NULL,	'abhishek@kiranaerp.com',	'Admin,Manager',	0,	1,	'abhishek@kiranaerp.com',	'Admin',	'User Logout',	'2026-07-29 08:48:30');


-- Table `grns` ===================================================
CREATE TABLE `grns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grn_no` varchar(50) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `grn_no` (`grn_no`),
  KEY `vendor_id` (`vendor_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `grns_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `grns_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `borrow_transactions` ====================================
CREATE TABLE `borrow_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `invoice_no` varchar(50) DEFAULT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('Pending','Partial Paid','Paid','Overdue') NOT NULL DEFAULT 'Pending',
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `borrow_transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchases` ==============================================
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_no` varchar(50) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` varchar(20) DEFAULT 'Pending',
  `delivery_status` varchar(20) DEFAULT 'Pending',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_no` (`purchase_no`),
  KEY `vendor_id` (`vendor_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `borrow_records` =========================================
CREATE TABLE `borrow_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('Borrow','Payback','Return') NOT NULL,
  `date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `borrow_records_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `products` ===============================================
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `sku` varchar(50) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `sub_category_id` int(11) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'Pcs',
  `purchase_price` decimal(12,2) DEFAULT 0.00,
  `selling_price` decimal(12,2) DEFAULT 0.00,
  `mrp` decimal(12,2) DEFAULT 0.00,
  `gst` decimal(5,2) DEFAULT 0.00,
  `hsn_code` varchar(20) DEFAULT NULL,
  `min_stock` int(11) DEFAULT 5,
  `max_stock` int(11) DEFAULT 100,
  `image_url` varchar(255) DEFAULT NULL,
  `manufacturing_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `measurement_value` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `category_id` (`category_id`),
  KEY `sub_category_id` (`sub_category_id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`sub_category_id`) REFERENCES `sub_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES
  (23,	'Amul Butter 500g',	'BAR-1784014901594-1914',	'BAR-1784014901594-1914',	'Amul',	1,	1,	1,	'Butter',	'Packet',	580.00,	580.00,	610.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (24,	'Amul Milk 500ml',	'BAR-1784014735777-3469',	'BAR-1784014735777-3469',	'Amul',	1,	1,	2,	'milk',	'Packet',	32.00,	32.00,	36.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'25',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (25,	'Britannia Bread',	'BAR-1784015082277-6307',	'BAR-1784015082277-6307',	NULL,	NULL,	1,	3,	'Bread',	'Packet',	100.00,	100.00,	112.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'12',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (26,	'Chana Dal 1kg',	'BAR-1784013739790-8346',	'BAR-1784013739790-8346',	'Tata',	2,	2,	4,	'Dal',	'Packet',	200.00,	200.00,	215.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'14',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (27,	'Coca-Cola 750ml',	'BAR-1784017205887-4921',	'BAR-1784017205887-4921',	'Thums-up',	3,	3,	5,	'Coldring',	'Packet',	33.00,	33.00,	40.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (28,	'Colgate Strong Teeth 200g',	'BAR-1784019743834-3202',	'BAR-1784019743834-3202',	'Close-up',	4,	4,	6,	'Colgate',	'Packet',	63.00,	63.00,	75.00,	12.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (29,	'Dove Shampoo 340ml',	'BAR-1784020076565-2521',	'BAR-1784020076565-2521',	NULL,	NULL,	4,	7,	'Shampoo',	'Packet',	45.00,	45.00,	54.99,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (30,	'Fortune Sunflower Oil 1L',	'BAR-1784012460511-3867',	'BAR-1784012460511-3867',	'Fortune',	5,	2,	8,	'Oil',	'Packet',	150.00,	150.00,	169.99,	5.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'10',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (31,	'Good Day Cookies',	'BAR-1784019908810-1821',	'BAR-1784019908810-1821',	NULL,	NULL,	5,	9,	'Biskit',	'Packet',	9.00,	9.00,	0.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'12',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (32,	'India Gate Basmati Rice 5kg',	'BAR-1784012634094-8050',	'BAR-1784012634094-8050',	'Daawat',	6,	2,	10,	'Rice',	'Packet',	480.00,	480.00,	559.98,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'15',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (33,	'Kurkure Masala Munch',	'BAR-1784017014927-4063',	'BAR-1784017014927-4063',	NULL,	NULL,	5,	11,	'KurKure',	'Packet',	18.00,	18.00,	22.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'25',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (34,	'Lay\'s Chips 52g',	'BAR-1784015613038-7712',	'BAR-1784015613038-7712',	NULL,	NULL,	5,	12,	'Chips',	'Packet',	20.00,	20.00,	27.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'25',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (35,	'Maggi Noodles',	'BAR-1784015456229-4537',	'BAR-1784015456229-4537',	NULL,	NULL,	5,	13,	'Noodles',	'Packet',	40.00,	40.00,	47.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'30',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (36,	'Moong Dal',	'BAR-1784805672594-9177',	'BAR-1784805672594-9177',	'Priniti',	7,	2,	4,	'Dal',	'Packet',	83.00,	83.00,	94.99,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'10',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (37,	'Nariyal',	'BAR-1784892150617-5620',	'BAR-1784892150617-5620',	'Primum',	8,	6,	14,	'Nariyal',	'Piece',	22.00,	22.00,	28.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'10',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (38,	'Nescafe Classic 100g',	'BAR-1784017486401-3175',	'BAR-1784017486401-3175',	'Nescafe',	9,	1,	15,	'Coffee',	'Packet',	445.00,	445.00,	465.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (39,	'Parle-G Biscuits',	'BAR-1784015219192-9597',	'BAR-1784015219192-9597',	'Parle-G',	10,	5,	9,	'Biskit',	'Packet',	130.00,	130.00,	137.98,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (40,	'peanuts',	'BAR-1784808040837-5422',	'BAR-1784808040837-5422',	'vedaka',	11,	2,	16,	'namkeen',	'Packet',	55.00,	55.00,	65.00,	5.00,	NULL,	5,	100,	'/uploads/tenants/shop_abhishek001/products/image-1785314801033-147306061.webp',	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:46:41'),
  (41,	'Surf Excel 1kg',	'BAR-1784017875417-9609',	'BAR-1784017875417-9609',	'Nirma',	12,	7,	17,	'Detergent',	'Packet',	155.00,	155.00,	175.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (42,	'Tata Salt 1kg',	'BAR-1784013830554-4873',	'BAR-1784013830554-4873',	'Tata',	2,	5,	18,	'Salt',	'Packet',	22.00,	22.00,	30.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'10',	NULL,	'2026-07-29 08:39:27',	'2026-07-29 08:43:31'),
  (43,	'Toor Dal 1kg',	'BAR-1784012868882-3393',	'BAR-1784012868882-3393',	NULL,	NULL,	2,	4,	'Dal',	'Packet',	210.00,	210.00,	222.00,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'30',	NULL,	'2026-07-29 08:39:28',	'2026-07-29 08:43:31'),
  (44,	'Vim Dishwash Bar',	'BAR-1784019562779-2542',	'BAR-1784019562779-2542',	NULL,	NULL,	7,	19,	'Dishwash',	'Packet',	51.00,	51.00,	59.98,	0.00,	NULL,	5,	100,	NULL,	NULL,	NULL,	'20',	NULL,	'2026-07-29 08:39:28',	'2026-07-29 08:43:31');


-- Table `users` ==================================================
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `login_id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `department` varchar(50) DEFAULT NULL,
  `employee_serial_id` int(11) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `login_id` (`login_id`),
  UNIQUE KEY `employee_serial_id` (`employee_serial_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES
  (1,	'Abhishek Roy',	'abhishek@kiranaerp.com',	'ABHISHEK001',	'$2a$10$3FgGSZISDPA8U0ekKRo50ONo96GjJfnegN40EyPog0Ha/XgtUxE0q',	NULL,	1,	'Active',	NULL,	NULL,	NULL,	NULL,	'2026-07-29 08:13:39',	'2026-07-29 08:10:36',	'2026-07-29 08:13:39');


-- Table `role_permissions` =======================================
CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (1,	1),
  (2,	1),
  (3,	1),
  (4,	1),
  (1,	2),
  (2,	2),
  (3,	2),
  (1,	3),
  (1,	4),
  (3,	4),
  (4,	4),
  (1,	5),
  (3,	5),
  (1,	6),
  (3,	6),
  (1,	7),
  (3,	7),
  (1,	8),
  (3,	8),
  (4,	8),
  (1,	9),
  (3,	9),
  (1,	10),
  (3,	10),
  (1,	11),
  (3,	11),
  (1,	12),
  (3,	12),
  (1,	13),
  (3,	13),
  (1,	14),
  (2,	14),
  (4,	14),
  (1,	15),
  (2,	15),
  (4,	15),
  (1,	16),
  (2,	16),
  (1,	17),
  (2,	17),
  (4,	17),
  (1,	18),
  (2,	18),
  (3,	18),
  (1,	19),
  (1,	20),
  (2,	20),
  (4,	20),
  (1,	21),
  (2,	21),
  (4,	21);


-- Table `notification_user_states` ===============================
CREATE TABLE `notification_user_states` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`notification_id`,`user_id`),
  KEY `idx_notification_user_states_user` (`user_id`,`is_deleted`,`is_read`),
  CONSTRAINT `notification_user_states_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchase_returns` =======================================
CREATE TABLE `purchase_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `return_no` varchar(50) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `purchase_no` varchar(50) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `return_price` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `return_type` varchar(30) NOT NULL DEFAULT 'Refund',
  `reason` varchar(255) NOT NULL,
  `remarks` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `batch_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_no` (`return_no`),
  KEY `purchase_id` (`purchase_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `purchase_returns_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_returns_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_returns_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_returns_ibfk_4` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `activity_logs` ==========================================
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `record_id` varchar(100) DEFAULT NULL,
  `previous_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Success',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES
  (1,	1,	NULL,	NULL,	NULL,	'User Login Success',	'Auth',	'Logged in to isolated store console.',	NULL,	NULL,	NULL,	'::1',	NULL,	NULL,	'Success',	'2026-07-29 08:13:39'),
  (2,	1,	'Abhishek Roy',	'Admin',	NULL,	'Bulk Import Products',	'Products',	'Imported 22 products successfully (0 records failed)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:31:54'),
  (3,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Moong Dal\" (ID: 14)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:36:48'),
  (4,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Nariyal\" (ID: 15)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:36:54'),
  (5,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Kurkure Masala Munch\" (ID: 11)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:02'),
  (6,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Lay\'s Chips 52g\" (ID: 12)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:07'),
  (7,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Maggi Noodles\" (ID: 13)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:12'),
  (8,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Nescafe Classic 100g\" (ID: 16)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:17'),
  (9,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Parle-G Biscuits\" (ID: 17)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:22'),
  (10,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"peanuts\" (ID: 18)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:27'),
  (11,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Surf Excel 1kg\" (ID: 19)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:33'),
  (12,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Tata Salt 1kg\" (ID: 20)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:40'),
  (13,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Toor Dal 1kg\" (ID: 21)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:45'),
  (14,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Vim Dishwash Bar\" (ID: 22)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:50'),
  (15,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Amul Butter 500g\" (ID: 1)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:37:59'),
  (16,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Amul Milk 500ml\" (ID: 2)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:04'),
  (17,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Britannia Bread\" (ID: 3)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:10'),
  (18,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Chana Dal 1kg\" (ID: 4)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:16'),
  (19,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Coca-Cola 750ml\" (ID: 5)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:21'),
  (20,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Colgate Strong Teeth 200g\" (ID: 6)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:27'),
  (21,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Dove Shampoo 340ml\" (ID: 7)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:32'),
  (22,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Fortune Sunflower Oil 1L\" (ID: 8)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:37'),
  (23,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"Good Day Cookies\" (ID: 9)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:42'),
  (24,	1,	'Abhishek Roy',	'Admin',	NULL,	'Delete Product',	'Products',	'Deleted product \"India Gate Basmati Rice 5kg\" (ID: 10)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:38:48'),
  (25,	1,	'Abhishek Roy',	'Admin',	NULL,	'Bulk Import Products',	'Products',	'Imported 22 products successfully (0 records failed)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:39:28'),
  (26,	1,	'Abhishek Roy',	'Admin',	NULL,	'Update Product',	'Products',	'Updated product details for \"peanuts\" (ID: 40)',	NULL,	NULL,	NULL,	'::1',	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',	NULL,	'Success',	'2026-07-29 08:46:41');


-- Table `stock_destroys` =========================================
CREATE TABLE `stock_destroys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `destroy_no` varchar(50) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `warehouse_name` varchar(100) DEFAULT 'Main Storage',
  `available_stock` decimal(10,2) DEFAULT 0.00,
  `destroy_quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'Pcs',
  `purchase_price` decimal(10,2) DEFAULT 0.00,
  `selling_price` decimal(10,2) DEFAULT 0.00,
  `destroy_value` decimal(10,2) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `remarks` text DEFAULT NULL,
  `evidence_image` longtext DEFAULT NULL,
  `destroyed_by_id` int(11) DEFAULT NULL,
  `destroyed_by_name` varchar(255) DEFAULT NULL,
  `status` enum('Confirmed','Cancelled') DEFAULT 'Confirmed',
  `cancel_reason` text DEFAULT NULL,
  `cancelled_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `destroy_no` (`destroy_no`),
  KEY `idx_destroy_no` (`destroy_no`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `stock_destroys_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `stock_logs` =============================================
CREATE TABLE `stock_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `type` varchar(30) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_logs_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_logs_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_logs_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchase_orders` ========================================
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_no` varchar(50) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` varchar(30) DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_order_no` (`purchase_order_no`),
  KEY `vendor_id` (`vendor_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `stock` ==================================================
CREATE TABLE `stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_warehouse_vendor` (`product_id`,`warehouse_id`,`vendor_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES
  (23,	23,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (24,	24,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (25,	25,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (26,	26,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (27,	27,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (28,	28,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (29,	29,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (30,	30,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (31,	31,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (32,	32,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (33,	33,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (34,	34,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (35,	35,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (36,	36,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (37,	37,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (38,	38,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (39,	39,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (40,	40,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (41,	41,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (42,	42,	1,	NULL,	0,	'2026-07-29 08:39:27',	'2026-07-29 08:39:27'),
  (43,	43,	1,	NULL,	0,	'2026-07-29 08:39:28',	'2026-07-29 08:39:28'),
  (44,	44,	1,	NULL,	0,	'2026-07-29 08:39:28',	'2026-07-29 08:39:28');


-- Table `purchase_items` =========================================
CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `purchase_price` decimal(12,2) NOT NULL,
  `mrp` decimal(12,2) DEFAULT NULL,
  `gst` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `user_permissions` =======================================
CREATE TABLE `user_permissions` (
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `sales` ==================================================
CREATE TABLE `sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(50) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` varchar(20) DEFAULT 'Paid',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `due_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `customer_id` (`customer_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchase_batches` =======================================
CREATE TABLE `purchase_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `purchase_quantity` int(11) NOT NULL DEFAULT 0,
  `remaining_quantity` int(11) NOT NULL DEFAULT 0,
  `purchase_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT 0.00,
  `mrp` decimal(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `supplier_id` int(11) DEFAULT NULL,
  `warehouse_id` int(11) DEFAULT 1,
  `grn_id` int(11) DEFAULT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_prod_rem` (`product_id`,`remaining_quantity`,`purchase_date`,`id`),
  CONSTRAINT `purchase_batches_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `grn_items` ==============================================
CREATE TABLE `grn_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grn_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_received` int(11) NOT NULL DEFAULT 0,
  `quantity_damaged` int(11) NOT NULL DEFAULT 0,
  `quantity_rejected` int(11) NOT NULL DEFAULT 0,
  `batch_number` varchar(100) DEFAULT NULL,
  `mrp` decimal(12,2) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `grn_id` (`grn_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `grn_items_ibfk_1` FOREIGN KEY (`grn_id`) REFERENCES `grns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grn_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `supplier_payments` ======================================
CREATE TABLE `supplier_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(50) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `payment_date` datetime NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_mode` enum('Cash','Bank Transfer','UPI','Cheque','NEFT/RTGS','Other') NOT NULL DEFAULT 'Cash',
  `reference_no` varchar(100) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_no` (`payment_no`),
  KEY `vendor_id` (`vendor_id`),
  KEY `purchase_id` (`purchase_id`),
  CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_payments_ibfk_2` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchase_return_status_history` =========================
CREATE TABLE `purchase_return_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_return_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `user_name` varchar(150) NOT NULL DEFAULT 'System',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `purchase_return_id` (`purchase_return_id`),
  CONSTRAINT `purchase_return_status_history_ibfk_1` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `purchase_order_items` ===================================
CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `received_quantity` int(11) DEFAULT 0,
  `purchase_price` decimal(12,2) NOT NULL,
  `mrp` decimal(12,2) DEFAULT NULL,
  `gst` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `vendor_ledger` ==========================================
CREATE TABLE `vendor_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `date` datetime NOT NULL,
  `transaction_type` enum('PURCHASE_INVOICE','SUPPLIER_PAYMENT','PURCHASE_RETURN','OPENING_BALANCE','ADJUSTMENT') NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `debit_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `credit_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `running_balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `vendor_ledger_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vendor_ledger_ibfk_2` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vendor_ledger_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `supplier_payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `sale_payments` ==========================================
CREATE TABLE `sale_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sale_payments_sale` (`sale_id`),
  CONSTRAINT `sale_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `sale_items` =============================================
CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `selling_price` decimal(12,2) NOT NULL,
  `mrp` decimal(12,2) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `gst` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--


-- Table `sales_returns` ==========================================
CREATE TABLE `sales_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sales_returns_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_returns_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--



/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

-- Dump completed on: Wed, 29 Jul 2026 10:33:43 +0100
