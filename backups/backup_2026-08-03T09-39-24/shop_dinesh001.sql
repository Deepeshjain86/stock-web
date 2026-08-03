-- Kirana ERP Automated Database Backup
-- Database: shop_dinesh001
-- Generated At: 2026-08-03T09:39:25.343Z

SET FOREIGN_KEY_CHECKS=0;

-- Table structure for table `activity_logs`
DROP TABLE IF EXISTS `activity_logs`;
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `activity_logs`
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (1, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:03:59');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (2, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Main Category', 'Categories', 'Created Main Category "Bakery" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:04:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (3, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Sub Category', 'Categories', 'Created Sub Category "Butter" under "Bakery" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:05:18');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (4, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Brand', 'Brands', 'Created Brand "Amul" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:05:29');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (5, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Product', 'Products', 'Created product "Amul Butter 500g" (Barcode: BAR-1785737355221-4654, ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:09:15');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (6, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Supplier', 'Vendors', 'Created Supplier "Rohit Mehta" (SUP-0001)', 'SUP-0001', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:11:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (7, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0001-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:11:55');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (8, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:15:00');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (9, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:18:41');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (10, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:24:26');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (11, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 06:29:17');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (12, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0001-2026" for PO "PO-0001-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:31:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (13, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0001-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:31:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (14, 1, 'Dinesh Kumar', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0001-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:31:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (15, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0002-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:33:09');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (16, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0002-2026" for PO "PO-0002-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:33:28');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (17, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0002-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:33:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (18, 1, 'Dinesh Kumar', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0002-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:33:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (19, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 06:47:09');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (20, 1, 'Dinesh Kumar', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-0001" (Customer ID: 1)', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 06:47:09');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (21, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 07:46:20');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (22, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 09:38:54');

-- Table structure for table `borrow_records`
DROP TABLE IF EXISTS `borrow_records`;
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

-- Table structure for table `borrow_transactions`
DROP TABLE IF EXISTS `borrow_transactions`;
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

-- Table structure for table `brands`
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `brands`
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (1, 'Amul', 'Active', NULL, '2026-08-03 06:05:29', '2026-08-03 06:05:29');

-- Table structure for table `categories`
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `category_type` enum('Main','Sub') NOT NULL DEFAULT 'Main',
  `category_code` varchar(20) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `sub_category` varchar(100) DEFAULT NULL,
  `brand_name` varchar(150) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `sort_order` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_name_parent` (`name`,`parent_id`),
  KEY `fk_cat_parent` (`parent_id`),
  CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories`
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (1, 'Bakery', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-08-03 06:04:57', '2026-08-03 06:04:57');

-- Table structure for table `customers`
DROP TABLE IF EXISTS `customers`;
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

-- Dumping data for table `customers`
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES (1, NULL, 'Walk-in Customer', '0000000000', NULL, 'walkin@3.com', 'Counter Billing', NULL, NULL, NULL, 'Walk-in', 'Active', 'Cash', NULL, NULL, NULL, '2026-08-03 06:03:45', '2026-08-03 06:03:45');

-- Table structure for table `grn_items`
DROP TABLE IF EXISTS `grn_items`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `grn_items`
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (1, 1, 1, 10, 0, 0, NULL, NULL, '2026-08-24 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (2, 2, 1, 10, 0, 0, NULL, '63.00', '2026-10-06 18:30:00');

-- Table structure for table `grns`
DROP TABLE IF EXISTS `grns`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `grns`
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (1, 'GRN-0001-2026', 1, 1, 1, '2026-08-02 18:30:00', NULL, '2026-08-03 06:31:42');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (2, 'GRN-0002-2026', 2, 1, 1, '2026-08-02 18:30:00', NULL, '2026-08-03 06:33:28');

-- Table structure for table `notification_user_states`
DROP TABLE IF EXISTS `notification_user_states`;
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

-- Table structure for table `notifications`
DROP TABLE IF EXISTS `notifications`;
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `notifications`
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (1, NULL, 'System', 'Database Isolated successfully', 'Welcome to your dedicated tenant-database Kirana ERP.', 'Medium', NULL, NULL, NULL, NULL, NULL, 'Admin,Manager,Staff', 0, NULL, NULL, NULL, NULL, '2026-08-03 06:03:45');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (2, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:03:59');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (3, NULL, 'Supplier', 'New Supplier Registered', 'Supplier "Rohit Mehta" (SUP-0001) was created.', 'Low', 'Supplier', 'Supplier', 1, 'Vendor', 'Dinesh Kumar', 'Admin,Manager,Staff', 0, 1, 'Dinesh Kumar', 'Admin', 'Supplier', '2026-08-03 06:11:35');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (4, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 06:12:23');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (5, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:15:00');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (6, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 06:15:03');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (7, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:18:41');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (8, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 06:20:43');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (9, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:24:26');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (10, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:29:17');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (11, NULL, 'Purchase Invoice', 'New Purchase Recorded', 'Purchase invoice "PUR-0001-2026" recorded from supplier "Rohit Mehta" for total amount ₹550.', 'Medium', 'Purchases', 'Purchases', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager,Staff', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'Purchase Invoice', '2026-08-03 06:31:47');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (12, NULL, 'Purchase Invoice', 'New Purchase Recorded', 'Purchase invoice "PUR-0002-2026" recorded from supplier "Rohit Mehta" for total amount ₹550.', 'Medium', 'Purchases', 'Purchases', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager,Staff', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'Purchase Invoice', '2026-08-03 06:33:35');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (13, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 06:47:09');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (14, NULL, 'Sales Invoice', 'Sales Invoice Generated', 'Sales invoice "INV-2026-0001" generated for total amount ₹780. Stock deducted.', 'Medium', 'Sales', 'Sales', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager,Staff', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'Sales Invoice', '2026-08-03 06:47:09');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (15, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 06:49:36');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (16, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 07:46:20');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (17, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 07:47:18');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (18, NULL, 'User Login', 'Employee Logged In', 'Admin "Dinesh Kumar" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, NULL, 'dinesh@kiranaerp.com', 'System', 'User Login', '2026-08-03 09:38:54');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (19, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Dinesh Kumar" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'dinesh@kiranaerp.com', 'Admin,Manager', 0, 1, 'dinesh@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 09:39:01');

-- Table structure for table `permissions`
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `permissions`
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (1, 'view_dashboard', 'Dashboard', 'View dashboard metrics', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (2, 'view_reports', 'Reports', 'View sales and stock reports', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (3, 'export_reports', 'Reports', 'Export PDF/Excel inventory statements', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (4, 'view_products', 'Products', 'View product catalogue details', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (5, 'create_products', 'Products', 'Create new product listings', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (6, 'edit_products', 'Products', 'Edit product parameters', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (7, 'delete_products', 'Products', 'Permanently delete items', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (8, 'import_products', 'Products', 'Bulk import products via Excel/CSV', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (9, 'export_products', 'Products', 'Bulk export products catalog', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (10, 'view_categories', 'Categories', 'View category listings', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (11, 'create_categories', 'Categories', 'Create category master records', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (12, 'edit_categories', 'Categories', 'Edit category details', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (13, 'delete_categories', 'Categories', 'Delete unused category department groupings', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (14, 'view_stock', 'Stock', 'View inventory levels', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (15, 'adjust_stock', 'Stock', 'Manually adjust stock balances', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (16, 'transfer_stock', 'Stock', 'Transfer stocks between warehouses', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (17, 'view_stock_history', 'Stock', 'View stock audit history logs', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (18, 'destroy_stock', 'Stock', 'Record damaged or destroyed stock', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (19, 'view_purchases', 'Purchases', 'View purchase ledger lists', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (20, 'create_purchases', 'Purchases', 'Record distributor invoices', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (21, 'delete_purchases', 'Purchases', 'Cancel purchase orders', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (22, 'view_vendors', 'Vendors', 'View supplier master directory', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (23, 'create_vendors', 'Vendors', 'Create vendor profiles', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (24, 'edit_vendors', 'Vendors', 'Edit vendor parameters', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (25, 'manage_vendors', 'Vendors', 'Manage vendor ledgers', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (26, 'view_sales', 'Sales', 'View sales history', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (27, 'create_sales', 'Sales', 'Generate sales POS billing', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (28, 'delete_sales', 'Sales', 'Void sales invoices', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (29, 'manage_customers', 'Customers', 'Manage customer profiles', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (30, 'manage_users', 'Users', 'Create employee logins', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (31, 'view_activity_logs', 'System', 'Audit staff logs', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (32, 'view_borrow', 'Borrow', 'View outstanding customer Udhaar summary', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (33, 'create_borrow', 'Borrow', 'Record custom borrow/payback transaction log', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (34, 'manage_borrow', 'Borrow', 'Settle customer credit debts', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (35, 'view_returns', 'Returns', 'View product returns logs', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (36, 'create_returns', 'Returns', 'Record vendor/customer returns', '2026-08-03 06:03:45');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (37, 'approve_returns', 'Returns', 'Approve return credits', '2026-08-03 06:03:45');

-- Table structure for table `products`
DROP TABLE IF EXISTS `products`;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `products`
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (1, 'Amul Butter 500g', 'BAR-1785737355221-4654', 'SKU-1785737355221-9797', 'Amul', 1, 1, 1, 'Butter', 'Packet', '55.00', '60.00', '63.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_dinesh001/products/image-1785737355203-933080989.jpg', NULL, '2026-10-06 18:30:00', NULL, NULL, '2026-08-03 06:09:15', '2026-08-03 06:47:09');

-- Table structure for table `purchase_batches`
DROP TABLE IF EXISTS `purchase_batches`;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_batches`
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (1, 1, 'BATCH-1785738702556', 10, 0, '2026-08-02 18:30:00', '2026-08-24 18:30:00', '0.00', '61.00', '60.00', 1, 1, 1, NULL, '2026-08-03 06:31:42', '2026-08-03 06:47:09');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (3, 1, 'BATCH-1785738808660', 10, 7, '2026-08-02 18:30:00', '2026-10-06 18:30:00', '0.00', '63.00', '60.00', 1, 1, 2, NULL, '2026-08-03 06:33:28', '2026-08-03 06:47:09');

-- Table structure for table `purchase_items`
DROP TABLE IF EXISTS `purchase_items`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_items`
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (1, 1, 1, 10, '55.00', '61.00', '0.00', '550.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (2, 2, 1, 10, '55.00', '61.00', '0.00', '550.00');

-- Table structure for table `purchase_order_items`
DROP TABLE IF EXISTS `purchase_order_items`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_order_items`
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (1, 1, 1, 10, 10, '55.00', NULL, '0.00', '550.00', '2026-08-03 06:11:55');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (2, 2, 1, 10, 10, '55.00', NULL, '0.00', '550.00', '2026-08-03 06:33:09');

-- Table structure for table `purchase_orders`
DROP TABLE IF EXISTS `purchase_orders`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_orders`
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (1, 'PO-0001-2026', 1, 1, '2026-08-02 18:30:00', NULL, '550.00', '0.00', '0.00', '550.00', 'Completed', NULL, 1, '2026-08-03 06:11:55', '2026-08-03 06:31:42');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (2, 'PO-0002-2026', 1, 1, '2026-08-02 18:30:00', '2026-09-02 18:30:00', '550.00', '0.00', '0.00', '550.00', 'Completed', NULL, 1, '2026-08-03 06:33:09', '2026-08-03 06:33:28');

-- Table structure for table `purchase_return_status_history`
DROP TABLE IF EXISTS `purchase_return_status_history`;
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

-- Table structure for table `purchase_returns`
DROP TABLE IF EXISTS `purchase_returns`;
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

-- Table structure for table `purchases`
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_no` varchar(50) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `grn_id` int(11) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchases`
INSERT INTO `purchases` (`id`, `purchase_no`, `purchase_order_id`, `grn_id`, `vendor_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (1, 'PUR-0001-2026', 1, NULL, 1, 1, '2026-08-02 18:30:00', '550.00', '0.00', '0.00', '550.00', '550.00', 'Paid', 'Received', 'Cash', '2026-08-03 06:31:47', '2026-08-03 06:31:47');
INSERT INTO `purchases` (`id`, `purchase_no`, `purchase_order_id`, `grn_id`, `vendor_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (2, 'PUR-0002-2026', 2, NULL, 1, 1, '2026-08-02 18:30:00', '550.00', '0.00', '0.00', '550.00', '550.00', 'Paid', 'Received', 'Cash', '2026-08-03 06:33:35', '2026-08-03 06:33:35');

-- Table structure for table `role_permissions`
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `role_permissions`
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 1);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 5);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 5);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 5);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 5);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 6);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 6);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 6);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 6);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 7);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 7);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 11);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 11);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 11);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 11);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 12);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 12);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 12);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 12);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 13);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 13);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 19);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 19);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 19);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 23);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 31);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 34);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 35);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 36);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 37);

-- Table structure for table `roles`
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `roles`
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (1, 'Admin', 'Store owner administrative profile with billing and settings control', '2026-08-03 06:03:45', '2026-08-03 06:03:45');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (2, 'Sales Manager', 'Sales department head with sales metrics and staff control', '2026-08-03 06:03:45', '2026-08-03 06:03:45');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (3, 'Purchase Manager', 'Purchase and stock department head with inventory control', '2026-08-03 06:03:45', '2026-08-03 06:03:45');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (4, 'Employee', 'Store staff and point-of-sale checkout cashier', '2026-08-03 06:03:45', '2026-08-03 06:03:45');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (5, 'Purchase Employee', 'Purchase and inventory staff member for GRN and stock entry', '2026-08-03 06:03:45', '2026-08-03 06:03:45');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (6, 'Sales Employee', 'Sales and POS cashier staff member for checkout and customer logs', '2026-08-03 06:03:45', '2026-08-03 06:03:45');

-- Table structure for table `sale_items`
DROP TABLE IF EXISTS `sale_items`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sale_items`
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (1, 1, 1, 10, '60.00', '61.00', 'BATCH-1785738702556', '0.00', '600.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (2, 1, 1, 3, '60.00', '63.00', 'BATCH-1785738808660', '0.00', '180.00');

-- Table structure for table `sale_payments`
DROP TABLE IF EXISTS `sale_payments`;
CREATE TABLE `sale_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
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

-- Table structure for table `sales`
DROP TABLE IF EXISTS `sales`;
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
  `balance_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sales`
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (1, 'INV-2026-0001', 1, 1, 1, '2026-08-02 18:30:00', '780.00', '0.00', '0.00', '780.00', 'Paid', 'Cash', '780.00', '0.00', '0.00', '2026-08-02 18:30:00', NULL, '2026-08-03 06:47:09', '2026-08-03 06:47:09');

-- Table structure for table `sales_returns`
DROP TABLE IF EXISTS `sales_returns`;
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

-- Table structure for table `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `settings`
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (1, 'store_name', 'Dinesh Kirana Mart', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (2, 'store_address', 'Enter store address...', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (3, 'store_phone', '0000000000', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (4, 'store_email', 'dinesh@kiranaerp.com', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (5, 'currency', 'INR', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (6, 'timezone', 'Asia/Kolkata', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (7, 'gstin', '07AAAAA1111A1Z1', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (8, 'invoice_prefix', 'KM-INV-', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (9, 'low_stock_limit', '5', '2026-08-03 06:03:45');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (10, 'expiry_alert_days', '30', '2026-08-03 06:03:45');

-- Table structure for table `stock`
DROP TABLE IF EXISTS `stock`;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock`
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (1, 1, 1, NULL, 7, '2026-08-03 06:09:15', '2026-08-03 06:47:09');

-- Table structure for table `stock_destroys`
DROP TABLE IF EXISTS `stock_destroys`;
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

-- Table structure for table `stock_logs`
DROP TABLE IF EXISTS `stock_logs`;
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
  `previous_quantity` int(11) DEFAULT 0,
  `new_quantity` int(11) DEFAULT 0,
  `batch_number` varchar(100) DEFAULT NULL,
  `mrp` decimal(12,2) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_logs_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_logs_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_logs_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock_logs`
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (1, 1, 1, 1, 'Stock In', 10, 'GRN-0001-2026', 'Goods Received (PO: PO-0001-2026)', 1, '2026-08-03 06:31:42', 0, 10, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (2, 1, 1, 1, 'Stock In', 10, 'PUR-0001-2026', 'Purchase Invoice Entry', 1, '2026-08-03 06:31:47', 10, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (3, 1, 1, 1, 'Stock In', 10, 'GRN-0002-2026', 'Goods Received (PO: PO-0002-2026)', 1, '2026-08-03 06:33:28', 20, 30, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (4, 1, 1, 1, 'Stock In', 10, 'PUR-0002-2026', 'Purchase Invoice Entry', 1, '2026-08-03 06:33:35', 30, 40, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (5, 1, 1, NULL, 'Stock Out', -13, 'INV-2026-0001', 'Sales Billing Entry (FIFO)', 1, '2026-08-03 06:47:09', 20, 7, NULL, NULL, NULL);

-- Table structure for table `sub_categories`
DROP TABLE IF EXISTS `sub_categories`;
CREATE TABLE `sub_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subcat_category` (`category_id`),
  CONSTRAINT `sub_categories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sub_categories`
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (1, 'Butter', 1, 'Active', NULL, '2026-08-03 06:05:18', '2026-08-03 06:05:18');

-- Table structure for table `supplier_payments`
DROP TABLE IF EXISTS `supplier_payments`;
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

-- Table structure for table `user_permissions`
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
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

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (1, 'Dinesh Kumar', 'dinesh@kiranaerp.com', 'DINESH001', '$2a$10$Gj10P0XCj64v/sGerwLsIOND/PdS7fKWDJcxnpxDhqmSjgs.W6iRy', NULL, 1, 'Active', NULL, NULL, NULL, NULL, '2026-08-03 09:38:54', '2026-08-03 06:03:45', '2026-08-03 09:38:54');

-- Table structure for table `vendor_ledger`
DROP TABLE IF EXISTS `vendor_ledger`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `vendor_ledger`
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (1, 1, 1, NULL, '2026-08-02 18:30:00', 'PURCHASE_INVOICE', 'PUR-0001-2026', 'Purchase Invoice PUR-0001-2026', '550.00', '0.00', '0.00', '2026-08-03 06:31:47');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (2, 1, 2, NULL, '2026-08-02 18:30:00', 'PURCHASE_INVOICE', 'PUR-0002-2026', 'Purchase Invoice PUR-0002-2026', '550.00', '0.00', '0.00', '2026-08-03 06:33:35');

-- Table structure for table `vendors`
DROP TABLE IF EXISTS `vendors`;
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
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `supplier_code` varchar(50) DEFAULT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `alternate_phone` varchar(20) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `categories_supplied` text DEFAULT NULL,
  `opening_balance` decimal(12,2) DEFAULT 0.00,
  `opening_balance_type` enum('Payable','Advance') DEFAULT 'Payable',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `vendors`
INSERT INTO `vendors` (`id`, `name`, `company_name`, `phone`, `email`, `address`, `gstin`, `payment_terms`, `bank_name`, `account_number`, `ifsc_code`, `outstanding_balance`, `credit_limit`, `total_purchases`, `total_paid`, `status`, `created_at`, `updated_at`, `supplier_code`, `contact_person`, `alternate_phone`, `pan`, `city`, `state`, `pincode`, `categories_supplied`, `opening_balance`, `opening_balance_type`, `notes`) VALUES (1, 'Rohit Mehta', 'Shree Foods Distributors', '9865234525', 'rohit@gmail.com', '45 Transport Nagar', '565656268620D54', 'Net 30', 'HDFC Bank', '56587465235', 'HDFC0000123', '0.00', '0.00', '1100.00', '1100.00', 'Active', '2026-08-03 06:11:35', '2026-08-03 06:33:35', 'SUP-0001', 'Kamal', '8965236521', 'dbmbad4', 'Bhopal', 'Madhya Pradesh', '462001', 'Dairy', '0.00', 'Payable', NULL);

-- Table structure for table `warehouses`
DROP TABLE IF EXISTS `warehouses`;
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

-- Dumping data for table `warehouses`
INSERT INTO `warehouses` (`id`, `name`, `location`, `status`, `created_at`, `updated_at`) VALUES (1, 'Main Storage', 'Ground Floor Stockroom', 'Active', '2026-08-03 06:03:45', '2026-08-03 06:03:45');

SET FOREIGN_KEY_CHECKS=1;
