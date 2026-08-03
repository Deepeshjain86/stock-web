-- Kirana ERP Automated Database Backup
-- Database: shop_ayyan001
-- Generated At: 2026-08-03T09:39:25.193Z

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
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `activity_logs`
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (1, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:06:59');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (2, 1, 'Ayyan Khan', 'Admin', NULL, 'Create User', 'Users', 'Created user account for "Sameer Khan" (Email: sameer@gmail.com, Role: Sales Manager, Dept: Sales)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:08:17');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (3, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:09:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (4, 1, 'Ayyan Khan', 'Admin', NULL, 'Create User', 'Users', 'Created user account for "Sohil Khan 2" (Email: sohil_2@gmail.com, Role: Sales Employee, Dept: Sales)', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 06:16:55');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (5, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:17:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (8, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:19:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (9, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:29:09');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (10, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, NULL, NULL, NULL, 'Success', '2026-07-31 06:30:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (11, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, NULL, NULL, NULL, 'Success', '2026-07-31 06:30:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (12, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, NULL, NULL, NULL, 'Success', '2026-07-31 06:30:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (13, 1, 'Ayyan Khan', 'Admin', NULL, 'Create User', 'Users', 'Created user account for "Parth Khan" (Email: parth_3972@gmail.com, Role: Purchase Employee, Dept: Purchase)', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 06:32:43');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (14, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Toggle Staff Status', 'Users', 'Changed staff member "Parth Khan" (parth_3972@gmail.com) status from "Active" to "Inactive"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:34:02');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (15, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create User', 'Users', 'Created user account for "Dhanish Khan" (Email: dhanish@gmail.com, Role: Purchase Employee, Dept: Purchase)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:34:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (16, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Toggle Staff Status', 'Users', 'Changed staff member "Parth Khan" (parth_3972@gmail.com) status from "Inactive" to "Active"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:34:53');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (17, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:38:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (18, 1, 'Ayyan Khan', 'Admin', NULL, 'Create User', 'Users', 'Created user account for "Ajay Sharma" (Email: ajay@gmail.com, Role: Employee, Dept: General)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:42:38');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (19, 7, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 06:42:46');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (20, 7, 'Ajay Sharma', 'Employee', 'General', 'Bulk Import Products', 'Products', 'Imported 22 products successfully (0 records failed)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 06:56:38');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (21, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Amul Butter 500g" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:05:18');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (22, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Amul Milk 500ml" (ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:06:21');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (23, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Britannia Bread" (ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:06:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (24, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Chana Dal 1kg" (ID: 4)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:07:54');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (25, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Coca-Cola 750ml" (ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:08:10');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (26, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Colgate Strong Teeth 200g" (ID: 6)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:08:28');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (27, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Dove Shampoo 340ml" (ID: 7)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:09:51');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (28, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Fortune Sunflower Oil 1L" (ID: 8)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:10:58');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (29, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Good Day Cookies" (ID: 9)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:11:21');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (30, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "India Gate Basmati Rice 5kg" (ID: 10)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:12:52');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (31, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Kurkure Masala Munch" (ID: 11)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:13:27');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (32, 7, 'Ajay Sharma', 'Employee', 'General', 'Update Product', 'Products', 'Updated product details for "Lay''s Chips 52g" (ID: 12)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:13:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (33, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 07:15:12');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (34, 5, 'Parth Khan', 'Purchase Employee', 'Purchase', 'Bulk Import Products', 'Products', 'Imported 2 products successfully (0 records failed)', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 07:22:03');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (35, 5, 'Parth Khan', 'Purchase Employee', 'Purchase', 'Create Product', 'Products', 'Created product "Maggi Noodles JFIF Test 1785482742238" (Barcode: BAR-1785482742302-4895, ID: 25)', NULL, NULL, NULL, '::ffff:127.0.0.1', 'axios/1.18.1', NULL, 'Success', '2026-07-31 07:25:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (36, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Maggi Noodles" (ID: 13)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:26:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (37, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Delete Product', 'Products', 'Deleted product "Maggi Noodles JFIF Test 1785482742238" (ID: 25)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:26:55');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (38, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Moong Dal" (ID: 14)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:27:23');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (39, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Nariyal" (ID: 15)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:27:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (40, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Nescafe Classic 100g" (ID: 16)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:29:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (41, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Parle-G Biscuits" (ID: 17)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:30:15');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (42, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "peanuts" (ID: 18)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:30:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (43, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Surf Excel 1kg" (ID: 19)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:32:04');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (44, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 07:32:28');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (45, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 07:33:21');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (46, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Tata Salt 1kg" (ID: 20)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:33:55');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (47, 5, 'Parth Khan', 'Purchase Employee', 'Purchase', 'Delete Product', 'Products', 'Deleted product "Temp Delete Test Item" (ID: 26)', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 07:36:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (48, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Delete Product', 'Products', 'Deleted product "Test Imported Coffee 1563" (ID: 24)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:37:38');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (49, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Delete Product', 'Products', 'Deleted product "Test Imported Tea 1563" (ID: 23)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:37:45');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (50, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Toor Dal 1kg" (ID: 21)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:38:06');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (51, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Vim Dishwash Bar" (ID: 22)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:38:26');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (52, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Household & Cleaning" (ID: 7) to Inactive', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:38:46');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (53, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Household & Cleaning" (ID: 7) to Active', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:38:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (54, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 07:38:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (55, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Product', 'Products', 'Created product "Agarbatti" (Barcode: BAR-1785483689091-1026, ID: 27)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:41:29');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (56, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Agarbatti" (ID: 27)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:42:41');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (57, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Supplier', 'Vendors', 'Created Supplier "Sharma Wholesale Traders" (SUP-0001)', 'SUP-0001', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:55:46');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (58, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Supplier', 'Vendors', 'Created Supplier "Maheshwari Foods" (SUP-0002)', 'SUP-0002', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 07:59:17');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (59, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 07:59:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (60, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create Supplier', 'Vendors', 'Created Supplier "Jain Agro Suppliers" (SUP-0003)', 'SUP-0003', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 08:06:00');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (61, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 08:06:25');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (62, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 08:06:40');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (63, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Supplier', 'Vendors', 'Created Supplier "Sharma Wholesale Traders" (SUP-0004)', 'SUP-0004', NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 08:10:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (64, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Supplier', 'Vendors', 'Created Supplier "Verma FMCG Suppliers" (SUP-0005)', 'SUP-0005', NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 08:12:10');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (65, 5, 'Parth Khan', 'Purchase Employee', 'Purchase', 'Create Supplier', 'Vendors', 'Created Supplier "Verma FMCG Suppliers" (SUP-0006)', 'SUP-0006', NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 08:26:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (66, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Supplier', 'Vendors', 'Created Supplier "Verma FMCG Suppliers" (SUP-0007)', 'SUP-0007', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 08:31:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (67, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Supplier', 'Vendors', 'Created Supplier "Verma FMCG Suppliers" (SUP-0003)', 'SUP-0003', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 08:39:32');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (68, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0001-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 08:41:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (69, 5, 'Parth Khan', 'Purchase Employee', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0001-2026" for PO "PO-0001-2026"', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-07-31 10:01:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (70, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0002-2026" for PO "PO-0001-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 10:02:28');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (71, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0001-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 10:02:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (72, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0001-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 10:02:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (73, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0002-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 11:58:41');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (74, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0003-2026" for PO "PO-0002-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 11:59:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (75, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0002-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 11:59:40');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (76, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0002-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 11:59:40');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (77, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Process Purchase Return', 'Stock', 'Processed purchase return PRN-00001 for supplier "Jain Agro Suppliers" (ID: 2) — Return Value: ₹200.00', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:03:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (78, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Beverages" (ID: 3) to Inactive', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:07:26');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (79, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Dairy & Bakery" (ID: 1) to Inactive', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:07:27');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (80, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-07-31 12:07:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (81, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0003-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:09:06');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (82, 1, 'Ayyan Khan', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0004-2026" for PO "PO-0003-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:12:23');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (83, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0003-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:12:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (84, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0003-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-07-31 12:12:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (85, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0004-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:18:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (86, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 05:19:14');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (87, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0005-2026" for PO "PO-0004-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:19:55');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (88, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0004-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:20:02');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (89, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0004-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:20:02');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (90, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Update Product', 'Products', 'Updated product details for "Dove Shampoo 340ml" (ID: 7)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:20:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (91, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 05:22:41');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (92, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0005-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:32:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (93, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0004-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:32:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (94, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 05:33:38');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (95, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 05:36:51');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (96, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0005-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:38:05');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (97, 1, 'Ayyan Khan', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0006-2026" for PO "PO-0005-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:38:31');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (98, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0006-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:38:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (99, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0005-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:38:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (100, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Vim Dishwash Bar" (ID: 22)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:39:40');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (101, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Toor Dal 1kg" (ID: 21)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:40:00');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (102, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Surf Excel 1kg" (ID: 19)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:40:23');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (103, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "peanuts" (ID: 18)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:40:54');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (104, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Parle-G Biscuits" (ID: 17)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:41:07');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (105, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Nescafe Classic 100g" (ID: 16)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:41:54');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (106, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Nariyal" (ID: 15)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:42:18');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (107, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Moong Dal" (ID: 14)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:42:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (108, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Maggi Noodles" (ID: 13)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:42:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (109, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Lay''s Chips 52g" (ID: 12)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:43:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (110, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Kurkure Masala Munch" (ID: 11)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:44:15');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (111, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "India Gate Basmati Rice 5kg" (ID: 10)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:44:32');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (112, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Agarbatti" (ID: 27)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:48:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (113, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Amul Butter 500g" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:48:28');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (114, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Amul Milk 500ml" (ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:48:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (115, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Britannia Bread" (ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:49:24');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (116, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Chana Dal 1kg" (ID: 4)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:49:51');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (117, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Coca-Cola 750ml" (ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:50:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (118, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Colgate Strong Teeth 200g" (ID: 6)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:50:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (119, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Fortune Sunflower Oil 1L" (ID: 8)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:51:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (120, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Good Day Cookies" (ID: 9)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 05:52:04');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (121, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0006-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:01:15');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (122, 1, 'Ayyan Khan', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0007-2026" for PO "PO-0006-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:01:32');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (123, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0007-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:01:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (124, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0006-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:01:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (125, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0007-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:04:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (126, 1, 'Ayyan Khan', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0008-2026" for PO "PO-0007-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:05:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (127, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0008-2026" (Vendor ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:05:26');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (128, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0007-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:05:27');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (129, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 06:05:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (130, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 06:08:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (131, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0008-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:09:19');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (132, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0009-2026" for PO "PO-0008-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:10:06');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (133, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0009-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:10:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (134, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0008-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 06:10:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (135, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 06:24:29');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (136, 1, 'Ayyan Khan', 'Admin', NULL, 'Process Purchase Return', 'Stock', 'Processed purchase return PRN-00002 for supplier "Jain Agro Suppliers" (ID: 2) — Return Value: ₹400.00', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 07:01:33');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (137, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0009-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 07:18:33');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (138, 1, 'Ayyan Khan', 'Admin', NULL, 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0010-2026" for PO "PO-0009-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 07:18:43');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (139, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0010-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 07:18:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (140, 1, 'Ayyan Khan', 'Admin', NULL, 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0009-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 07:18:48');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (141, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 07:21:20');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (142, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 07:31:20');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (143, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Chana Dal 1kg" (ID: 4)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:37:44');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (144, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Fortune Sunflower Oil 1L" (ID: 8)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:38:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (145, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Amul Butter 500g" (ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:38:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (146, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Britannia Bread" (ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:38:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (147, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Surf Excel 1kg" (ID: 19)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:39:30');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (148, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "peanuts" (ID: 18)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:39:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (149, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Parle-G Biscuits" (ID: 17)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:40:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (150, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Toor Dal 1kg" (ID: 21)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:40:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (151, 1, 'Ayyan Khan', 'Admin', NULL, 'Update Product', 'Products', 'Updated product details for "Tata Salt 1kg" (ID: 20)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:40:52');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (152, 1, 'Ayyan Khan', 'Admin', NULL, 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Dairy & Bakery" (ID: 1) to Active', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:43:14');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (153, 1, 'Ayyan Khan', 'Admin', NULL, 'Toggle Category Status', 'Categories', 'Toggled status of Main Category "Beverages" (ID: 3) to Active', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:43:17');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (154, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-9650" (Customer ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:48:05');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (155, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Customer', 'Customers', 'Created customer "Deepesh Jain" (CUST-00003, Type: Borrow)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 08:54:19');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (156, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-7713" (Customer ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 09:01:13');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (157, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-9648" (Customer ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 09:07:43');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (158, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Customer', 'Customers', 'Created customer "Ayyan Ali Khan" (CUST-00004, Type: Borrow)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 09:12:25');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (159, 1, 'Ayyan Khan', 'Admin', NULL, 'Record Payback', 'Borrow', 'Recorded payment of ₹50 from customer "Deepesh Jain"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 09:21:03');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (160, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 10:38:14');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (161, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-8283" (Customer ID: 4)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:01:30');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (162, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3652" (Customer ID: 4)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:04:40');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (163, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Customer', 'Customers', 'Created customer "Ajay" (CUST-00005, Type: Borrow)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:22:08');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (164, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3099" (Customer ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:23:12');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (165, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:32:00');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (166, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:32:13');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (167, 2, 'Sameer Khan', 'Sales Manager', 'Sales', 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3200" (Customer ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:32:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (168, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:33:27');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (169, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:33:49');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (170, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:35:56');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (171, 2, 'Sameer Khan', 'Sales Manager', 'Sales', 'Create User', 'Users', 'Created user account for "Sandeep Singh" (Email: sandeep@gmail.com, Role: Employee, Dept: Sales)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:36:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (172, 8, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:37:07');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (173, 8, 'Sandeep Singh', 'Employee', 'Sales', 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-9019" (Customer ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:37:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (174, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 11:42:25');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (175, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-8470" (Customer ID: 5)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 11:49:15');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (176, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 12:01:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (177, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 12:06:12');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (178, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-01 12:06:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (179, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Product', 'Products', 'Created product "Test Product 999" (Barcode: BAR-1785585997315-4214, ID: 30)', NULL, NULL, NULL, '::1', 'axios/1.18.1', NULL, 'Success', '2026-08-01 12:06:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (180, 1, 'Ayyan Khan', 'Admin', NULL, 'Delete Product', 'Products', 'Deleted product "Test Product 999" (ID: 30)', NULL, NULL, NULL, '::1', 'axios/1.18.1', NULL, 'Success', '2026-08-01 12:06:37');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (181, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Product', 'Products', 'Created product "MadAngle" (Barcode: BAR-1785586159723-5829, ID: 31)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 12:09:19');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (182, 1, 'Ayyan Khan', 'Admin', NULL, 'Delete Product', 'Products', 'Deleted product "MadAngle" (ID: 31)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 12:09:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (183, 1, 'Ayyan Khan', 'Admin', NULL, 'Delete Product', 'Products', 'Deleted product "Test Product 999" (ID: 29)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-01 12:10:12');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (184, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 05:35:01');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (185, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 05:35:22');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (186, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0010-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:35:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (187, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create GRN', 'Purchases', 'Created Goods Received Note "GRN-0011-2026" for PO "PO-0010-2026"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:36:05');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (188, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Create Purchase', 'Purchases', 'Recorded purchase invoice "PUR-0011-2026" (Vendor ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:36:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (189, 4, 'Pranav Khan', 'Purchase Manager', 'Purchase', 'Update PO Status', 'Purchases', 'Updated Purchase Order "PO-0010-2026" status to "Completed"', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:36:11');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (190, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 05:36:34');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (191, 2, 'Sameer Khan', 'Sales Manager', 'Sales', 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-5072" (Customer ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:37:18');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (192, 2, 'Sameer Khan', 'Sales Manager', 'Sales', 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-4233" (Customer ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:49:14');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (193, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 05:55:04');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (194, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 05:55:57');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (195, 2, 'Sameer Khan', 'Sales Manager', 'Sales', 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3360" (Customer ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:56:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (196, 6, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 05:59:07');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (197, 6, 'Dhanish Khan', 'Purchase Employee', 'Purchase', 'Create Purchase Order', 'Purchases', 'Created Purchase Order "PO-0011-2026" (Vendor ID: 2)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 05:59:42');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (198, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:00:12');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (199, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::ffff:127.0.0.1', NULL, NULL, 'Success', '2026-08-03 06:13:35');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (200, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:14:51');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (201, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:20:47');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (202, 2, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:21:18');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (203, 8, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:21:36');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (204, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 06:49:39');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (205, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3695" (Customer ID: 1)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 06:49:58');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (206, 1, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 07:47:24');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (207, 1, 'Ayyan Khan', 'Admin', NULL, 'Create Sale', 'Sales', 'Generated sales invoice "INV-2026-3403" (Customer ID: 3)', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 07:47:51');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (208, 1, 'Ayyan Khan', 'Admin', NULL, 'Supplier Payment Recorded', 'Vendors', 'Paid ₹4000 to Supplier "Jain Agro Suppliers" via Cash (Ref: VPAY-0001-2026)', 'VPAY-0001-2026', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', NULL, 'Success', '2026-08-03 07:52:09');
INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `role`, `department`, `action`, `module`, `details`, `record_id`, `previous_value`, `new_value`, `ip_address`, `device_info`, `session_id`, `status`, `created_at`) VALUES (209, 4, NULL, NULL, NULL, 'User Login Success', 'Auth', 'Logged in to isolated store console.', NULL, NULL, NULL, '::1', NULL, NULL, 'Success', '2026-08-03 09:39:08');

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `borrow_records`
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (1, 3, '50.00', 'Borrow', '2026-07-31 18:30:00', 'POS credit invoice: INV-2026-9648', '2026-08-01 09:07:43');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (2, 3, '50.00', 'Payback', '2026-07-31 18:30:00', 'Udhaar Payback Payment', '2026-08-01 09:21:03');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (3, 4, '200.00', 'Borrow', '2026-07-31 18:30:00', 'POS credit invoice: INV-2026-3652', '2026-08-01 11:04:40');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (4, 5, '278.00', 'Borrow', '2026-07-30 18:30:00', 'POS credit invoice: INV-2026-3099', '2026-08-01 11:27:58');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (5, 5, '8.00', 'Payback', '2026-07-30 18:30:00', 'Upfront payment for invoice: INV-2026-3099', '2026-08-01 11:27:58');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (6, 5, '78.00', 'Borrow', '2026-07-31 18:30:00', 'POS credit invoice: INV-2026-3200', '2026-08-01 11:32:49');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (7, 5, '158.00', 'Borrow', '2026-07-31 18:30:00', 'POS credit invoice: INV-2026-9019', '2026-08-01 11:37:47');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (8, 5, '78.00', 'Borrow', '2026-07-31 18:30:00', 'POS credit invoice: INV-2026-8470', '2026-08-01 11:49:15');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (9, 5, '18.00', 'Payback', '2026-07-31 18:30:00', 'Upfront payment for invoice: INV-2026-8470', '2026-08-01 11:49:15');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (10, 3, '50.00', 'Borrow', '2026-08-02 18:30:00', 'POS credit invoice: INV-2026-5072', '2026-08-03 05:37:18');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (11, 3, '50.00', 'Borrow', '2026-08-02 18:30:00', 'POS credit invoice: INV-2026-4233', '2026-08-03 05:49:14');
INSERT INTO `borrow_records` (`id`, `customer_id`, `amount`, `type`, `date`, `notes`, `created_at`) VALUES (12, 3, '100.00', 'Borrow', '2026-08-02 18:30:00', 'POS credit invoice: INV-2026-3403', '2026-08-03 07:47:51');

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `borrow_transactions`
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (1, 3, 'INV-2026-9648', '2026-07-31 18:30:00', '2026-08-15 18:30:00', '50.00', '50.00', '0.00', 'Paid', 'POS credit invoice: INV-2026-9648', 1, '2026-08-01 09:07:43', '2026-08-01 09:21:03');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (2, 4, 'INV-2026-3652', '2026-07-31 18:30:00', '2026-08-15 18:30:00', '200.00', '0.00', '200.00', 'Pending', 'POS credit invoice: INV-2026-3652', 1, '2026-08-01 11:04:40', '2026-08-01 11:04:40');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (3, 5, 'INV-2026-3099', '2026-07-30 18:30:00', '2026-08-14 18:30:00', '278.00', '8.00', '270.00', 'Partial Paid', 'POS split credit invoice: INV-2026-3099', 1, '2026-08-01 11:27:58', '2026-08-01 11:27:58');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (4, 5, 'INV-2026-3200', '2026-07-31 18:30:00', '2026-08-15 18:30:00', '78.00', '0.00', '78.00', 'Pending', 'POS credit invoice: INV-2026-3200', 2, '2026-08-01 11:32:49', '2026-08-01 11:32:49');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (5, 5, 'INV-2026-9019', '2026-07-31 18:30:00', '2026-08-15 18:30:00', '158.00', '0.00', '158.00', 'Pending', 'POS credit invoice: INV-2026-9019', 8, '2026-08-01 11:37:47', '2026-08-01 11:37:47');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (6, 5, 'INV-2026-8470', '2026-07-31 18:30:00', '2026-08-15 18:30:00', '78.00', '18.00', '60.00', 'Partial Paid', 'POS credit invoice: INV-2026-8470', 1, '2026-08-01 11:49:15', '2026-08-01 11:49:15');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (7, 3, 'INV-2026-5072', '2026-08-02 18:30:00', '2026-08-17 18:30:00', '50.00', '0.00', '50.00', 'Pending', 'POS credit invoice: INV-2026-5072', 2, '2026-08-03 05:37:18', '2026-08-03 05:37:18');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (8, 3, 'INV-2026-4233', '2026-08-02 18:30:00', '2026-08-17 18:30:00', '50.00', '0.00', '50.00', 'Pending', 'POS credit invoice: INV-2026-4233', 2, '2026-08-03 05:49:14', '2026-08-03 05:49:14');
INSERT INTO `borrow_transactions` (`id`, `customer_id`, `invoice_no`, `borrow_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `payment_status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES (9, 3, 'INV-2026-3403', '2026-08-02 18:30:00', '2026-08-17 18:30:00', '100.00', '0.00', '100.00', 'Pending', 'POS credit invoice: INV-2026-3403', 1, '2026-08-03 07:47:51', '2026-08-03 07:47:51');

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `brands`
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (1, 'Amul', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (2, 'Tata', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (3, 'Thums-up', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (4, 'Close-up', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (5, 'Fortune', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (6, 'Daawat', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (7, 'Priniti', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (8, 'Primum', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (9, 'Nescafe', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (10, 'Parle-G', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (11, 'vedaka', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (12, 'Nirma', 'Active', NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `brands` (`id`, `name`, `status`, `description`, `created_at`, `updated_at`) VALUES (13, 'Bingo', 'Active', NULL, '2026-08-01 12:03:12', '2026-08-01 12:03:12');

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories`
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (1, 'Dairy & Bakery', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-08-01 08:43:14');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (2, 'Spices & Groceries', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (3, 'Beverages', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-08-01 08:43:17');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (4, 'Personal Care', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (5, 'Snacks & Packaged Foods', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (6, 'Pooja', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-07-31 06:56:38');
INSERT INTO `categories` (`id`, `name`, `parent_id`, `category_type`, `category_code`, `display_order`, `sub_category`, `brand_name`, `status`, `sort_order`, `description`, `created_at`, `updated_at`) VALUES (7, 'Household & Cleaning', NULL, 'Main', NULL, 0, NULL, NULL, 'Active', 0, NULL, '2026-07-31 06:56:38', '2026-07-31 07:38:48');

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
  `notes` text DEFAULT NULL,
  `opening_balance` decimal(12,2) DEFAULT 0.00,
  `credit_limit` decimal(12,2) DEFAULT 0.00,
  `outstanding_balance` decimal(12,2) DEFAULT 0.00,
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `customers`
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `notes`, `opening_balance`, `credit_limit`, `outstanding_balance`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES (1, NULL, 'Walk-in Customer', '0000000000', NULL, 'walkin@18.com', 'Counter Billing', NULL, '0.00', '0.00', '0.00', NULL, NULL, NULL, 'Walk-in', 'Active', 'Cash', NULL, NULL, NULL, '2026-07-31 06:02:29', '2026-07-31 06:02:29');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `notes`, `opening_balance`, `credit_limit`, `outstanding_balance`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES (3, 'CUST-00003', 'Deepesh Jain', '8640083589', NULL, NULL, 'Ganj Basoda, Madhya Pradesh', NULL, '0.00', '0.00', '200.00', NULL, NULL, NULL, 'Borrow', 'Active', 'Credit/Borrow', 1, NULL, NULL, '2026-08-01 08:54:19', '2026-08-03 07:47:51');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `notes`, `opening_balance`, `credit_limit`, `outstanding_balance`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES (4, 'CUST-00004', 'Ayyan Ali Khan', '8965874589', NULL, NULL, 'Bhopal', NULL, '0.00', '0.00', '200.00', NULL, NULL, NULL, 'Borrow', 'Active', 'Credit/Borrow', 1, NULL, NULL, '2026-08-01 09:12:25', '2026-08-01 11:04:40');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `phone`, `alternate_phone`, `email`, `address`, `notes`, `opening_balance`, `credit_limit`, `outstanding_balance`, `city`, `state`, `pincode`, `customer_type`, `status`, `payment_mode`, `created_by`, `updated_by`, `expires_at`, `created_at`, `updated_at`) VALUES (5, 'CUST-00005', 'Ajay', '3652145632', NULL, NULL, 'Indore', NULL, '0.00', '0.00', '566.00', NULL, NULL, NULL, 'Borrow', 'Active', 'Credit/Borrow', 1, NULL, NULL, '2026-08-01 11:22:08', '2026-08-01 11:49:15');

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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `grn_items`
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (4, 4, 1, 0, 0, 0, 'BATCH-2026-001', '100.00', NULL);
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (5, 5, 27, 20, 0, 0, NULL, NULL, '2026-08-04 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (6, 6, 1, 20, 0, 0, NULL, NULL, '2026-08-07 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (7, 6, 2, 20, 0, 0, NULL, NULL, '2026-08-06 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (8, 6, 6, 20, 0, 0, NULL, NULL, '2026-08-05 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (9, 7, 6, 20, 0, 0, NULL, NULL, '2026-08-04 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (10, 7, 11, 20, 0, 0, NULL, NULL, '2026-08-12 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (11, 7, 18, 20, 0, 0, NULL, NULL, '2026-08-19 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (12, 7, 19, 25, 0, 0, NULL, NULL, '2026-08-21 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (13, 7, 21, 25, 0, 0, NULL, NULL, '2026-09-04 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (14, 8, 17, 25, 0, 0, NULL, NULL, '2026-09-06 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (15, 8, 13, 25, 0, 0, NULL, NULL, '2026-09-01 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (16, 8, 10, 20, 0, 0, NULL, NULL, '2026-09-16 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (17, 8, 8, 25, 0, 0, NULL, NULL, '2026-09-29 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (18, 9, 3, 25, 0, 0, NULL, NULL, '2026-09-08 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (19, 9, 5, 20, 0, 0, NULL, NULL, '2026-09-15 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (20, 9, 4, 25, 0, 0, NULL, NULL, '2026-09-15 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (21, 10, 7, 20, 0, 0, NULL, NULL, '2026-09-21 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (22, 11, 14, 18, 0, 0, NULL, NULL, '2026-09-27 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (23, 11, 12, 4, 0, 0, NULL, NULL, '2026-09-24 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (24, 11, 22, 15, 0, 0, NULL, NULL, '2026-09-21 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (25, 12, 15, 15, 0, 0, NULL, '30.00', '2026-09-20 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (26, 12, 9, 15, 0, 0, NULL, NULL, '2026-09-29 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (27, 12, 16, 15, 0, 0, NULL, NULL, '2026-10-06 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (28, 12, 20, 20, 0, 0, NULL, NULL, '2026-10-20 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (29, 13, 10, 7, 0, 0, NULL, NULL, '2026-09-30 18:30:00');
INSERT INTO `grn_items` (`id`, `grn_id`, `product_id`, `quantity_received`, `quantity_damaged`, `quantity_rejected`, `batch_number`, `mrp`, `expiry_date`) VALUES (30, 14, 13, 5, 0, 0, NULL, NULL, '2026-10-13 18:30:00');

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `grns`
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (4, 'GRN-0001-2026', 1, 2, 1, '2026-07-30 18:30:00', 'All items received in good condition', '2026-07-31 10:01:36');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (5, 'GRN-0002-2026', 1, 2, 1, '2026-07-30 18:30:00', NULL, '2026-07-31 10:02:27');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (6, 'GRN-0003-2026', 2, 1, 1, '2026-07-30 18:30:00', NULL, '2026-07-31 11:59:36');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (7, 'GRN-0004-2026', 3, 3, 1, '2026-07-30 18:30:00', NULL, '2026-07-31 12:12:23');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (8, 'GRN-0005-2026', 4, 1, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 05:19:54');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (9, 'GRN-0006-2026', 5, 3, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 05:38:31');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (10, 'GRN-0007-2026', 6, 2, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 06:01:32');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (11, 'GRN-0008-2026', 7, 1, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 06:05:21');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (12, 'GRN-0009-2026', 8, 3, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 06:10:06');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (13, 'GRN-0010-2026', 9, 2, 1, '2026-07-31 18:30:00', NULL, '2026-08-01 07:18:43');
INSERT INTO `grns` (`id`, `grn_no`, `purchase_order_id`, `vendor_id`, `warehouse_id`, `date`, `notes`, `created_at`) VALUES (14, 'GRN-0011-2026', 10, 3, 1, '2026-08-02 18:30:00', NULL, '2026-08-03 05:36:05');

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
  PRIMARY KEY (`id`),
  KEY `idx_tenant_notif_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=153 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `notifications`
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (151, NULL, 'User Logout', 'Employee Logged Out', 'Admin "Ayyan Khan" logged out.', 'Low', 'Auth', 'Auth', NULL, NULL, 'ayyan@kiranaerp.com', 'Admin,Manager', 0, 1, 'ayyan@kiranaerp.com', 'Admin', 'User Logout', '2026-08-03 09:38:45');
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `priority`, `module`, `related_module`, `reference_id`, `reference_type`, `related_user`, `target_roles`, `is_read`, `actor_id`, `actor_name`, `actor_role`, `action`, `created_at`) VALUES (152, NULL, 'User Login', 'Employee Logged In', 'Purchase Manager "Pranav Khan" logged in successfully.', 'Low', 'Auth', 'Auth', NULL, NULL, 'pranav@gmail.com', 'Admin,Manager', 0, NULL, 'pranav@gmail.com', 'System', 'User Login', '2026-08-03 09:39:08');

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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `permissions`
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (1, 'view_dashboard', 'Dashboard', 'View dashboard metrics', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (2, 'view_reports', 'Reports', 'View sales and stock reports', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (3, 'export_reports', 'Reports', 'Export PDF/Excel inventory statements', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (4, 'view_products', 'Products', 'View product catalogue details', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (5, 'create_products', 'Products', 'Create new product listings', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (6, 'edit_products', 'Products', 'Edit product parameters', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (7, 'delete_products', 'Products', 'Permanently delete items', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (8, 'view_stock', 'Stock', 'View inventory levels', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (9, 'adjust_stock', 'Stock', 'Manually adjust stock balances', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (10, 'transfer_stock', 'Stock', 'Transfer stocks between warehouses', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (11, 'view_purchases', 'Purchases', 'View purchase ledger lists', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (12, 'create_purchases', 'Purchases', 'Record distributor invoices', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (13, 'delete_purchases', 'Purchases', 'Cancel purchase orders', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (14, 'view_sales', 'Sales', 'View sales history', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (15, 'create_sales', 'Sales', 'Generate sales POS billing', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (16, 'delete_sales', 'Sales', 'Void sales invoices', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (17, 'manage_customers', 'Customers', 'Manage customer profiles', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (18, 'manage_users', 'Users', 'Create employee logins', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (19, 'view_activity_logs', 'System', 'Audit staff logs', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (20, 'view_borrow', 'Borrow', 'View outstanding customer Udhaar summary', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (21, 'create_borrow', 'Borrow', 'Record custom borrow/payback transaction log', '2026-07-31 06:02:29');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (22, 'import_products', 'Products', 'Bulk import products via Excel/CSV', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (23, 'export_products', 'Products', 'Bulk export products catalog', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (24, 'view_categories', 'Categories', 'View category listings', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (25, 'create_categories', 'Categories', 'Create category master records', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (26, 'edit_categories', 'Categories', 'Edit category details', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (27, 'delete_categories', 'Categories', 'Delete unused category department groupings', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (28, 'view_stock_history', 'Stock', 'View stock audit history logs', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (29, 'destroy_stock', 'Stock', 'Record damaged or destroyed stock', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (30, 'view_vendors', 'Vendors', 'View supplier master directory', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (31, 'create_vendors', 'Vendors', 'Create vendor profiles', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (32, 'edit_vendors', 'Vendors', 'Edit vendor parameters', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (33, 'manage_vendors', 'Vendors', 'Manage vendor ledgers', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (34, 'manage_borrow', 'Borrow', 'Settle customer credit debts', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (35, 'view_returns', 'Returns', 'View product returns logs', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (36, 'create_returns', 'Returns', 'Record vendor/customer returns', '2026-07-31 06:51:50');
INSERT INTO `permissions` (`id`, `name`, `module`, `description`, `created_at`) VALUES (37, 'approve_returns', 'Returns', 'Approve return credits', '2026-07-31 06:51:50');

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
  KEY `sub_category_id` (`sub_category_id`),
  KEY `brand_id` (`brand_id`),
  KEY `idx_products_barcode` (`barcode`),
  KEY `idx_products_sku` (`sku`),
  KEY `idx_products_category` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`sub_category_id`) REFERENCES `sub_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `products`
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (1, 'Amul Butter 500g', 'BAR-1784014901594-1914', 'BAR-1784014901594-1914', 'Amul', 1, 1, 1, 'Butter', 'Packet', '80.00', '95.00', '100.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481518030-176746912.webp', NULL, '2026-08-07 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-01 11:01:30');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (2, 'Amul Milk 500ml', 'BAR-1784014735777-3469', 'BAR-1784014735777-3469', 'Amul', 1, 1, 2, 'milk', 'Packet', '32.00', '40.00', '36.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481581420-763294202.webp', NULL, '2026-08-06 18:30:00', '25', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (3, 'Britannia Bread', 'BAR-1784015082277-6307', 'BAR-1784015082277-6307', 'Parle-G', 10, 1, 3, 'Bread', 'Packet', '90.00', '100.00', '112.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481617673-899014119.jpg', NULL, '2026-09-08 18:30:00', '12', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (4, 'Chana Dal 1kg', 'BAR-1784013739790-8346', 'BAR-1784013739790-8346', 'Tata', 2, 2, 4, 'Dal', 'Packet', '180.00', '200.00', '212.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481674263-293866328.jpg', NULL, '2026-09-15 18:30:00', '14', NULL, '2026-07-31 06:56:38', '2026-08-01 11:04:40');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (5, 'Coca-Cola 750ml', 'BAR-1784017205887-4921', 'BAR-1784017205887-4921', 'Thums-up', 3, 3, 5, 'Coldring', 'Packet', '33.00', '38.00', '40.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481690423-654350166.webp', NULL, '2026-09-15 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (6, 'Colgate Strong Teeth 200g', 'BAR-1784019743834-3202', 'BAR-1784019743834-3202', 'Close-up', 4, 4, 6, 'Colgate', 'Packet', '63.00', '70.00', '75.00', '12.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481708331-101697917.jpg', NULL, '2026-08-05 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-01 11:23:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (7, 'Dove Shampoo 340ml', 'BAR-1784020076565-2521', 'BAR-1784020076565-2521', 'Priniti', 7, 4, 7, 'Shampoo', 'Packet', '40.00', '45.00', '54.99', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481791606-190565056.jpg', NULL, '2026-09-21 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-01 06:01:32');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (8, 'Fortune Sunflower Oil 1L', 'BAR-1784012460511-3867', 'BAR-1784012460511-3867', 'Fortune', 5, 2, 8, 'Oil', 'Packet', '140.00', '150.00', '169.99', '5.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481858041-832322001.jpg', NULL, '2026-09-29 18:30:00', '10', NULL, '2026-07-31 06:56:38', '2026-08-01 11:37:47');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (9, 'Good Day Cookies', 'BAR-1784019908810-1821', 'BAR-1784019908810-1821', 'vedaka', 11, 5, 9, 'Biskit', 'Packet', '9.00', '15.00', '20.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481881454-689509789.jpg', NULL, '2026-09-29 18:30:00', '12', NULL, '2026-07-31 06:56:38', '2026-08-01 06:10:06');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (10, 'India Gate Basmati Rice 5kg', 'BAR-1784012634094-8050', 'BAR-1784012634094-8050', 'Daawat', 6, 2, 10, 'Rice', 'Packet', '480.00', '500.00', '559.98', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785481972401-501840460.png', NULL, '2026-09-16 18:30:00', '15', NULL, '2026-07-31 06:56:38', '2026-08-01 07:18:43');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (11, 'Kurkure Masala Munch', 'BAR-1784017014927-4063', 'BAR-1784017014927-4063', 'Primum', 8, 5, 11, 'KurKure', 'Packet', '18.00', '25.00', '22.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482007620-594012101.webp', NULL, '2026-08-12 18:30:00', '25', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (12, 'Lay''s Chips 52g', 'BAR-1784015613038-7712', 'BAR-1784015613038-7712', 'Parle-G', 10, 5, 12, 'Chips', 'Packet', '20.00', '30.00', '27.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482029883-597907127.jpg', NULL, '2026-09-24 18:30:00', '25', NULL, '2026-07-31 06:56:38', '2026-08-01 06:05:22');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (13, 'Maggi Noodles', 'BAR-1784015456229-4537', 'BAR-1784015456229-4537', 'Parle-G', 10, 5, 13, 'Noodles', 'Packet', '40.00', '50.00', '47.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482781996-430353517.jfif', NULL, '2026-09-01 18:30:00', '30', NULL, '2026-07-31 06:56:38', '2026-08-03 05:36:05');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (14, 'Moong Dal', 'BAR-1784805672594-9177', 'BAR-1784805672594-9177', 'Priniti', 7, 2, 4, 'Dal', 'Packet', '83.00', '90.00', '94.99', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482843393-830814041.jpg', NULL, '2026-09-27 18:30:00', '10', NULL, '2026-07-31 06:56:38', '2026-08-01 06:05:21');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (15, 'Nariyal', 'BAR-1784892150617-5620', 'BAR-1784892150617-5620', 'Primum', 8, 6, 14, 'Nariyal', 'Piece', '22.00', '28.00', '30.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482877094-292743676.webp', NULL, '2026-09-20 18:30:00', '10', NULL, '2026-07-31 06:56:38', '2026-08-01 06:10:06');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (16, 'Nescafe Classic 100g', 'BAR-1784017486401-3175', 'BAR-1784017486401-3175', 'Nescafe', 9, 1, 15, 'Coffee', 'Packet', '435.00', '445.00', '465.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785482997072-198013148.jpg', NULL, '2026-10-06 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-01 06:10:06');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (17, 'Parle-G Biscuits', 'BAR-1784015219192-9597', 'BAR-1784015219192-9597', 'Parle-G', 10, 5, 9, 'Biskit', 'Packet', '130.00', '140.00', '137.98', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483015776-218422808.webp', NULL, '2026-09-06 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (18, 'peanuts', 'BAR-1784808040837-5422', 'BAR-1784808040837-5422', 'vedaka', 11, 2, 16, 'namkeen', 'Packet', '55.00', '60.00', '65.00', '5.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483034307-118007553.webp', NULL, '2026-08-19 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (19, 'Surf Excel 1kg', 'BAR-1784017875417-9609', 'BAR-1784017875417-9609', 'Nirma', 12, 7, 17, 'Detergent', 'Packet', '155.00', '170.00', '175.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483124503-460731311.jpg', NULL, '2026-08-21 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (20, 'Tata Salt 1kg', 'BAR-1784013830554-4873', 'BAR-1784013830554-4873', 'Tata', 2, 5, 18, 'Salt', 'Packet', '22.00', '28.00', '30.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483235604-799563605.webp', NULL, '2026-10-20 18:30:00', '10', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (21, 'Toor Dal 1kg', 'BAR-1784012868882-3393', 'BAR-1784012868882-3393', 'Primum', 8, 2, 4, 'Dal', 'Packet', '210.00', '220.00', '222.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483486879-806225832.webp', NULL, '2026-09-04 18:30:00', '30', NULL, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (22, 'Vim Dishwash Bar', 'BAR-1784019562779-2542', 'BAR-1784019562779-2542', 'Nirma', 12, 7, 19, 'Dishwash', 'Packet', '40.00', '50.00', '59.98', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483506609-514732421.webp', NULL, '2026-09-21 18:30:00', '20', NULL, '2026-07-31 06:56:38', '2026-08-01 06:05:22');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (27, 'Agarbatti', 'BAR-1785483689091-1026', 'SKU-1785483689091-6739', 'Primum', 8, 6, 20, 'agarbatti', 'Packet', '40.00', '50.00', '55.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785483689080-437479035.jpg', NULL, '2026-08-04 18:30:00', NULL, NULL, '2026-07-31 07:41:29', '2026-08-01 08:48:05');
INSERT INTO `products` (`id`, `name`, `barcode`, `sku`, `brand`, `brand_id`, `category_id`, `sub_category_id`, `sub_category`, `unit`, `purchase_price`, `selling_price`, `mrp`, `gst`, `hsn_code`, `min_stock`, `max_stock`, `image_url`, `manufacturing_date`, `expiry_date`, `measurement_value`, `description`, `created_at`, `updated_at`) VALUES (28, 'MadAngle', 'BAR-1785585792526-6888', 'SKU-1785585792526-6812', 'Bingo', 13, 5, 11, 'KurKure', 'Packet', '9.00', '10.00', '11.00', '0.00', NULL, 5, 100, '/uploads/tenants/shop_ayyan001/products/image-1785585792468-117759797.jpg', NULL, NULL, NULL, NULL, '2026-08-01 12:03:12', '2026-08-01 12:03:12');

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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_batches`
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (4, 27, 'BATCH-1785492148015', 20, 10, '2026-07-30 18:30:00', '2026-08-04 18:30:00', '40.00', '55.00', '50.00', 2, 1, 5, NULL, '2026-07-31 10:02:28', '2026-08-03 06:49:58');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (5, 1, 'BATCH-1785499176202', 20, 20, '2026-07-30 18:30:00', '2026-08-07 18:30:00', '580.00', '100.00', '580.00', 1, 1, 6, NULL, '2026-07-31 11:59:36', '2026-08-01 11:07:26');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (6, 2, 'BATCH-1785499176281', 20, 20, '2026-07-30 18:30:00', '2026-08-06 18:30:00', '32.00', '36.00', '32.00', 1, 1, 6, NULL, '2026-07-31 11:59:36', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (7, 6, 'BATCH-1785499176304', 20, 16, '2026-07-30 18:30:00', '2026-08-05 18:30:00', '63.00', '75.00', '63.00', 1, 1, 6, NULL, '2026-07-31 11:59:36', '2026-08-03 05:56:42');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (8, 6, 'BATCH-1785499943496', 20, 20, '2026-07-30 18:30:00', '2026-08-04 18:30:00', '63.00', '75.00', '63.00', 3, 1, 7, NULL, '2026-07-31 12:12:23', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (9, 11, 'BATCH-1785499943581', 20, 20, '2026-07-30 18:30:00', '2026-08-12 18:30:00', '18.00', '22.00', '18.00', 3, 1, 7, NULL, '2026-07-31 12:12:23', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (10, 18, 'BATCH-1785499943590', 20, 20, '2026-07-30 18:30:00', '2026-08-19 18:30:00', '55.00', '65.00', '55.00', 3, 1, 7, NULL, '2026-07-31 12:12:23', '2026-08-01 07:08:59');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (11, 19, 'BATCH-1785499943598', 25, 25, '2026-07-30 18:30:00', '2026-08-21 18:30:00', '155.00', '175.00', '155.00', 3, 1, 7, NULL, '2026-07-31 12:12:23', '2026-08-01 07:08:59');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (12, 21, 'BATCH-1785499943602', 25, 25, '2026-07-30 18:30:00', '2026-09-04 18:30:00', '210.00', '222.00', '210.00', 3, 1, 7, NULL, '2026-07-31 12:12:23', '2026-08-01 07:08:59');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (13, 17, 'BATCH-1785561594914', 25, 25, '2026-07-31 18:30:00', '2026-09-06 18:30:00', '130.00', '137.98', '130.00', 1, 1, 8, NULL, '2026-08-01 05:19:54', '2026-08-01 07:08:59');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (14, 13, 'BATCH-1785561594953', 25, 25, '2026-07-31 18:30:00', '2026-09-01 18:30:00', '40.00', '47.00', '40.00', 1, 1, 8, NULL, '2026-08-01 05:19:54', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (15, 10, 'BATCH-1785561594985', 20, 20, '2026-07-31 18:30:00', '2026-09-16 18:30:00', '480.00', '559.98', '480.00', 1, 1, 8, NULL, '2026-08-01 05:19:54', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (16, 8, 'BATCH-1785561595038', 25, 24, '2026-07-31 18:30:00', '2026-09-29 18:30:00', '150.00', '169.99', '150.00', 1, 1, 8, NULL, '2026-08-01 05:19:55', '2026-08-01 11:37:47');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (17, 3, 'BATCH-1785562711113', 25, 24, '2026-07-31 18:30:00', '2026-09-08 18:30:00', '100.00', '112.00', '100.00', 3, 1, 9, NULL, '2026-08-01 05:38:31', '2026-08-03 07:47:51');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (18, 5, 'BATCH-1785562711140', 20, 20, '2026-07-31 18:30:00', '2026-09-15 18:30:00', '33.00', '40.00', '33.00', 3, 1, 9, NULL, '2026-08-01 05:38:31', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (19, 4, 'BATCH-1785562711165', 25, 23, '2026-07-31 18:30:00', '2026-09-15 18:30:00', '200.00', '212.00', '200.00', 3, 1, 9, NULL, '2026-08-01 05:38:31', '2026-08-01 11:23:12');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (20, 7, 'BATCH-1785564092074', 20, 20, '2026-07-31 18:30:00', '2026-09-21 18:30:00', '40.00', '54.99', '45.00', 2, 1, 10, NULL, '2026-08-01 06:01:32', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (21, 14, 'BATCH-1785564321950', 18, 18, '2026-07-31 18:30:00', '2026-09-27 18:30:00', '83.00', '94.99', '90.00', 1, 1, 11, NULL, '2026-08-01 06:05:21', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (22, 12, 'BATCH-1785564322029', 4, 4, '2026-07-31 18:30:00', '2026-09-24 18:30:00', '20.00', '27.00', '30.00', 1, 1, 11, NULL, '2026-08-01 06:05:22', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (23, 22, 'BATCH-1785564322057', 15, 15, '2026-07-31 18:30:00', '2026-09-21 18:30:00', '40.00', '59.98', '50.00', 1, 1, 11, NULL, '2026-08-01 06:05:22', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (24, 15, 'BATCH-1785564606872', 15, 15, '2026-07-31 18:30:00', '2026-09-20 18:30:00', '22.00', '30.00', '28.00', 3, 1, 12, NULL, '2026-08-01 06:10:06', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (25, 9, 'BATCH-1785564606904', 15, 15, '2026-07-31 18:30:00', '2026-09-29 18:30:00', '9.00', '20.00', '15.00', 3, 1, 12, NULL, '2026-08-01 06:10:06', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (26, 16, 'BATCH-1785564606925', 15, 15, '2026-07-31 18:30:00', '2026-10-06 18:30:00', '435.00', '465.00', '445.00', 3, 1, 12, NULL, '2026-08-01 06:10:06', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (27, 20, 'BATCH-1785564606956', 20, 20, '2026-07-31 18:30:00', '2026-10-20 18:30:00', '22.00', '30.00', '22.00', 3, 1, 12, NULL, '2026-08-01 06:10:06', '2026-08-01 06:39:49');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (28, 10, 'BATCH-1785568723316', 7, 7, '2026-07-31 18:30:00', '2026-09-30 18:30:00', '0.00', '559.98', '500.00', 2, 1, 13, NULL, '2026-08-01 07:18:43', '2026-08-01 07:18:43');
INSERT INTO `purchase_batches` (`id`, `product_id`, `batch_number`, `purchase_quantity`, `remaining_quantity`, `purchase_date`, `expiry_date`, `purchase_price`, `mrp`, `selling_price`, `supplier_id`, `warehouse_id`, `grn_id`, `purchase_id`, `created_at`, `updated_at`) VALUES (30, 13, 'BATCH-1785735365901', 5, 5, '2026-08-02 18:30:00', '2026-10-13 18:30:00', '0.00', '47.00', '50.00', 3, 1, 14, NULL, '2026-08-03 05:36:05', '2026-08-03 05:36:05');

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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_items`
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (1, 1, 27, 20, '40.00', '0.00', '0.00', '800.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (2, 2, 1, 20, '580.00', '0.00', '0.00', '11600.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (3, 2, 2, 20, '32.00', '0.00', '0.00', '640.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (4, 2, 6, 20, '63.00', '0.00', '12.00', '1411.20');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (5, 3, 6, 20, '63.00', '0.00', '12.00', '1411.20');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (6, 3, 11, 20, '18.00', '0.00', '0.00', '360.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (7, 3, 18, 20, '55.00', '0.00', '5.00', '1155.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (8, 3, 19, 25, '155.00', '0.00', '0.00', '3875.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (9, 3, 21, 25, '210.00', '0.00', '0.00', '5250.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (10, 4, 17, 25, '130.00', '0.00', '0.00', '3250.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (11, 4, 13, 25, '40.00', '0.00', '0.00', '1000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (12, 4, 10, 20, '480.00', '0.00', '0.00', '9600.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (13, 4, 8, 25, '150.00', '0.00', '5.00', '3937.50');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (18, 6, 3, 25, '100.00', '0.00', '0.00', '2500.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (19, 6, 5, 20, '33.00', '0.00', '0.00', '660.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (20, 6, 4, 25, '200.00', '0.00', '0.00', '5000.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (21, 7, 7, 20, '40.00', '0.00', '0.00', '800.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (22, 8, 14, 18, '83.00', '0.00', '0.00', '1494.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (23, 8, 12, 4, '20.00', '0.00', '0.00', '80.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (24, 8, 22, 15, '40.00', '0.00', '0.00', '600.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (25, 9, 15, 15, '22.00', '0.00', '0.00', '330.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (26, 9, 9, 15, '9.00', '0.00', '0.00', '135.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (27, 9, 16, 15, '435.00', '0.00', '0.00', '6525.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (28, 9, 20, 20, '22.00', '0.00', '0.00', '440.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (29, 10, 10, 7, '480.00', '559.98', '0.00', '3360.00');
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `mrp`, `gst`, `total`) VALUES (30, 11, 13, 5, '40.00', '47.00', '0.00', '200.00');

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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_order_items`
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (1, 1, 27, 20, 20, '40.00', NULL, '0.00', '800.00', '2026-07-31 08:41:35');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (2, 2, 1, 20, 20, '580.00', NULL, '0.00', '11600.00', '2026-07-31 11:58:41');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (3, 2, 2, 20, 20, '32.00', NULL, '0.00', '640.00', '2026-07-31 11:58:41');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (4, 2, 6, 20, 20, '63.00', NULL, '12.00', '1411.20', '2026-07-31 11:58:41');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (5, 3, 6, 20, 20, '63.00', NULL, '12.00', '1411.20', '2026-07-31 12:09:06');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (6, 3, 11, 20, 20, '18.00', NULL, '0.00', '360.00', '2026-07-31 12:09:06');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (7, 3, 18, 20, 20, '55.00', NULL, '5.00', '1155.00', '2026-07-31 12:09:06');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (8, 3, 19, 25, 25, '155.00', NULL, '0.00', '3875.00', '2026-07-31 12:09:06');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (9, 3, 21, 25, 25, '210.00', NULL, '0.00', '5250.00', '2026-07-31 12:09:06');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (10, 4, 17, 25, 25, '130.00', NULL, '0.00', '3250.00', '2026-08-01 05:18:56');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (11, 4, 13, 25, 25, '40.00', NULL, '0.00', '1000.00', '2026-08-01 05:18:56');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (12, 4, 10, 20, 20, '480.00', NULL, '0.00', '9600.00', '2026-08-01 05:18:56');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (13, 4, 8, 25, 25, '150.00', NULL, '5.00', '3937.50', '2026-08-01 05:18:56');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (14, 5, 3, 25, 25, '100.00', NULL, '0.00', '2500.00', '2026-08-01 05:38:05');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (15, 5, 5, 20, 20, '33.00', NULL, '0.00', '660.00', '2026-08-01 05:38:05');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (16, 5, 4, 25, 25, '200.00', NULL, '0.00', '5000.00', '2026-08-01 05:38:05');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (17, 6, 7, 20, 20, '40.00', NULL, '0.00', '800.00', '2026-08-01 06:01:15');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (18, 7, 14, 18, 18, '83.00', NULL, '0.00', '1494.00', '2026-08-01 06:04:48');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (19, 7, 12, 4, 4, '20.00', NULL, '0.00', '80.00', '2026-08-01 06:04:48');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (20, 7, 22, 15, 15, '40.00', NULL, '0.00', '600.00', '2026-08-01 06:04:48');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (21, 8, 15, 15, 15, '22.00', NULL, '0.00', '330.00', '2026-08-01 06:09:19');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (22, 8, 9, 15, 15, '9.00', NULL, '0.00', '135.00', '2026-08-01 06:09:19');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (23, 8, 16, 15, 15, '435.00', NULL, '0.00', '6525.00', '2026-08-01 06:09:19');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (24, 8, 20, 20, 20, '22.00', NULL, '0.00', '440.00', '2026-08-01 06:09:19');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (25, 9, 10, 7, 7, '480.00', NULL, '0.00', '3360.00', '2026-08-01 07:18:33');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (26, 10, 13, 5, 5, '40.00', NULL, '0.00', '200.00', '2026-08-03 05:35:47');
INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `product_id`, `quantity`, `received_quantity`, `purchase_price`, `mrp`, `gst`, `total`, `created_at`) VALUES (27, 11, 20, 10, 0, '22.00', NULL, '0.00', '220.00', '2026-08-03 05:59:42');

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchase_orders`
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (1, 'PO-0001-2026', 2, 1, '2026-07-30 18:30:00', '2026-07-31 18:30:00', '800.00', '0.00', '0.00', '800.00', 'Completed', NULL, 6, '2026-07-31 08:41:35', '2026-07-31 10:02:28');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (2, 'PO-0002-2026', 1, 1, '2026-07-30 18:30:00', NULL, '13500.00', '0.00', '151.20', '13651.20', 'Completed', NULL, 6, '2026-07-31 11:58:41', '2026-07-31 11:59:36');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (3, 'PO-0003-2026', 3, 1, '2026-07-30 18:30:00', '2026-08-05 18:30:00', '11845.00', '0.00', '206.20', '12051.20', 'Completed', NULL, 1, '2026-07-31 12:09:06', '2026-07-31 12:12:23');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (4, 'PO-0004-2026', 1, 1, '2026-07-31 18:30:00', '2026-08-25 18:30:00', '17600.00', '0.00', '187.50', '17787.50', 'Completed', NULL, 1, '2026-08-01 05:18:56', '2026-08-01 05:19:55');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (5, 'PO-0005-2026', 3, 1, '2026-07-31 18:30:00', '2026-09-17 18:30:00', '8160.00', '0.00', '0.00', '8160.00', 'Completed', NULL, 1, '2026-08-01 05:38:05', '2026-08-01 05:38:31');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (6, 'PO-0006-2026', 2, 1, '2026-07-31 18:30:00', '2026-08-26 18:30:00', '800.00', '0.00', '0.00', '800.00', 'Completed', NULL, 1, '2026-08-01 06:01:15', '2026-08-01 06:01:32');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (7, 'PO-0007-2026', 1, 1, '2026-07-31 18:30:00', '2026-09-07 18:30:00', '2174.00', '0.00', '0.00', '2174.00', 'Completed', NULL, 1, '2026-08-01 06:04:48', '2026-08-01 06:05:22');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (8, 'PO-0008-2026', 3, 1, '2026-07-31 18:30:00', '2026-08-31 18:30:00', '7430.00', '0.00', '0.00', '7430.00', 'Completed', NULL, 4, '2026-08-01 06:09:19', '2026-08-01 06:10:06');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (9, 'PO-0009-2026', 2, 1, '2026-07-31 18:30:00', '2026-08-11 18:30:00', '3360.00', '0.00', '0.00', '3360.00', 'Completed', NULL, 1, '2026-08-01 07:18:33', '2026-08-01 07:18:43');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (10, 'PO-0010-2026', 3, 1, '2026-08-02 18:30:00', '2026-08-25 18:30:00', '200.00', '0.00', '0.00', '200.00', 'Completed', NULL, 4, '2026-08-03 05:35:47', '2026-08-03 05:36:05');
INSERT INTO `purchase_orders` (`id`, `purchase_order_no`, `vendor_id`, `warehouse_id`, `date`, `expected_delivery_date`, `subtotal`, `discount`, `gst_amount`, `total`, `status`, `notes`, `user_id`, `created_at`, `updated_at`) VALUES (11, 'PO-0011-2026', 2, 1, '2026-08-02 18:30:00', '2026-08-24 18:30:00', '220.00', '0.00', '0.00', '220.00', 'Draft', NULL, 6, '2026-08-03 05:59:42', '2026-08-03 05:59:42');

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `purchases`
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_no` varchar(50) NOT NULL,
  `supplier_invoice_no` varchar(100) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `grn_id` int(11) DEFAULT NULL,
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
  KEY `warehouse_id` (`warehouse_id`),
  KEY `idx_purchases_date` (`date`),
  KEY `idx_purchases_vendor` (`vendor_id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `purchases`
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (1, 'PUR-0001-2026', NULL, 2, 1, NULL, 1, '2026-07-29 18:30:00', '800.00', '0.00', '0.00', '800.00', '800.00', 'Paid', 'Received', 'Cash', '2026-07-31 10:02:44', '2026-07-31 10:02:44');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (2, 'PUR-0002-2026', NULL, 1, 2, NULL, 1, '2026-07-29 18:30:00', '13651.20', '0.00', '151.20', '13651.20', '13651.20', 'Paid', 'Received', 'Cash', '2026-07-31 11:59:40', '2026-08-01 06:49:45');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (3, 'PUR-0003-2026', NULL, 3, 3, NULL, 1, '2026-07-29 18:30:00', '12051.20', '0.00', '206.20', '12051.20', '12051.20', 'Paid', 'Received', 'Cash', '2026-07-31 12:12:48', '2026-08-01 06:49:45');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (4, 'PUR-0004-2026', NULL, 1, 4, NULL, 1, '2026-07-30 18:30:00', '17787.50', '0.00', '187.50', '17787.50', '17787.50', 'Paid', 'Received', 'Cash', '2026-08-01 05:20:02', '2026-08-01 06:49:45');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (6, 'PUR-0006-2026', NULL, 3, 5, NULL, 1, '2026-07-30 18:30:00', '8160.00', '0.00', '0.00', '8160.00', '8160.00', 'Paid', 'Received', 'Cash', '2026-08-01 05:38:34', '2026-08-01 05:38:34');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (7, 'PUR-0007-2026', NULL, 2, 6, NULL, 1, '2026-07-30 18:30:00', '800.00', '0.00', '0.00', '800.00', '800.00', 'Paid', 'Received', 'Cash', '2026-08-01 06:01:36', '2026-08-01 06:01:36');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (8, 'PUR-0008-2026', NULL, 1, 7, NULL, 1, '2026-07-30 18:30:00', '2174.00', '0.00', '0.00', '2174.00', '2174.00', 'Paid', 'Received', 'Cash', '2026-08-01 06:05:26', '2026-08-01 06:05:26');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (9, 'PUR-0009-2026', NULL, 3, 8, NULL, 1, '2026-07-30 18:30:00', '7430.00', '0.00', '0.00', '7430.00', '7430.00', 'Paid', 'Received', 'Cash', '2026-08-01 06:10:11', '2026-08-01 06:10:11');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (10, 'PUR-0010-2026', NULL, 2, 9, NULL, 1, '2026-07-30 18:30:00', '3360.00', '0.00', '0.00', '3360.00', '3360.00', 'Paid', 'Received', 'Cash', '2026-08-01 07:18:47', '2026-08-01 07:18:47');
INSERT INTO `purchases` (`id`, `purchase_no`, `supplier_invoice_no`, `vendor_id`, `purchase_order_id`, `grn_id`, `warehouse_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `paid_amount`, `payment_status`, `delivery_status`, `payment_method`, `created_at`, `updated_at`) VALUES (11, 'PUR-0011-2026', NULL, 3, 10, NULL, 1, '2026-08-01 18:30:00', '200.00', '0.00', '0.00', '200.00', '200.00', 'Paid', 'Received', 'Cash', '2026-08-03 05:36:11', '2026-08-03 05:36:11');

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
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 2);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 3);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 4);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 4);
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
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 7);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 7);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 8);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 9);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 10);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 10);
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
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 13);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 13);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 14);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 15);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 16);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 17);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 18);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 19);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 20);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 21);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 22);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 23);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 23);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 23);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 23);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 24);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 25);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 26);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 27);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 28);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 29);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (6, 30);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 31);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 31);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 31);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 32);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 33);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 34);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 34);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (4, 34);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (5, 34);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 35);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 35);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 35);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 36);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 36);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 36);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1, 37);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (2, 37);
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (3, 37);

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
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (1, 'Admin', 'Store owner administrative profile with billing and settings control', '2026-07-31 06:02:29', '2026-07-31 06:02:29');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (2, 'Sales Manager', 'Sales department head with sales metrics and staff control', '2026-07-31 06:02:29', '2026-07-31 06:02:29');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (3, 'Purchase Manager', 'Purchase and stock department head with inventory control', '2026-07-31 06:02:29', '2026-07-31 06:02:29');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (4, 'Employee', 'Store staff and point-of-sale checkout cashier', '2026-07-31 06:02:29', '2026-07-31 06:02:29');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (5, 'Purchase Employee', 'Purchase and inventory staff member for GRN and stock entry', '2026-07-31 06:14:27', '2026-07-31 06:14:27');
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES (6, 'Sales Employee', 'Sales and POS cashier staff member for checkout and customer logs', '2026-07-31 06:14:27', '2026-07-31 06:14:27');

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sale_items`
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (1, 2, 27, 2, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '100.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (2, 3, 27, 2, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '100.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (3, 4, 27, 1, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '50.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (5, 6, 4, 1, '200.00', '212.00', 'BATCH-1785562711165', '0.00', '200.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (6, 7, 4, 1, '200.00', '212.00', 'BATCH-1785562711165', '0.00', '200.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (7, 7, 6, 1, '70.00', '75.00', 'BATCH-1785499176304', '12.00', '70.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (8, 8, 6, 1, '70.00', '75.00', 'BATCH-1785499176304', '12.00', '70.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (9, 9, 8, 1, '150.00', '169.99', 'BATCH-1785561595038', '5.00', '150.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (10, 10, 6, 1, '70.00', '75.00', 'BATCH-1785499176304', '12.00', '70.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (11, 11, 27, 1, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '50.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (12, 12, 27, 1, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '50.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (13, 13, 6, 1, '70.00', '75.00', 'BATCH-1785499176304', '12.00', '70.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (14, 14, 27, 3, '50.00', '55.00', 'BATCH-1785492148015', '0.00', '150.00');
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `selling_price`, `mrp`, `batch_number`, `gst`, `total`) VALUES (15, 15, 3, 1, '100.00', '112.00', 'BATCH-1785562711113', '0.00', '100.00');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sale_payments`
INSERT INTO `sale_payments` (`id`, `tenant_id`, `sale_id`, `payment_method`, `amount`, `reference_no`, `notes`, `created_at`) VALUES (1, NULL, 14, 'Cash', '150.00', NULL, NULL, '2026-08-03 06:49:58');

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
  `balance_amount` decimal(12,2) DEFAULT 0.00,
  `payment_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_sales_date` (`date`),
  KEY `idx_sales_customer` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sales`
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (2, 'INV-2026-9650', 1, 1, 1, '2026-07-31 18:30:00', '100.00', '0.00', '0.00', '100.00', 'Paid', 'Split (Cash ₹80 + UPI ₹20)', '100.00', '0.00', '0.00', '2026-07-31 18:30:00', NULL, '2026-08-01 08:48:05', '2026-08-01 08:48:05');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (3, 'INV-2026-7713', 3, 1, 1, '2026-07-31 18:30:00', '100.00', '0.00', '0.00', '100.00', 'Paid', 'Store Credit', '100.00', '0.00', '0.00', '2026-07-31 18:30:00', NULL, '2026-08-01 09:01:13', '2026-08-01 09:01:13');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (4, 'INV-2026-9648', 3, 1, 1, '2026-07-31 18:30:00', '50.00', '0.00', '0.00', '50.00', 'Paid', 'Credit/Borrow', '50.00', '0.00', '0.00', '2026-07-31 18:30:00', NULL, '2026-08-01 09:07:43', '2026-08-01 09:21:03');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (6, 'INV-2026-3652', 4, 1, 1, '2026-07-31 18:30:00', '200.00', '0.00', '0.00', '200.00', 'Pending', 'Credit/Borrow', '0.00', '200.00', '200.00', NULL, NULL, '2026-08-01 11:04:40', '2026-08-01 11:04:40');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (7, 'INV-2026-3099', 5, 1, 1, '2026-07-31 18:30:00', '270.00', '0.00', '8.40', '278.00', 'Partial', 'Split (Credit / Udhaar ₹270 + Cash ₹8)', '8.00', '270.00', '270.00', '2026-07-31 18:30:00', NULL, '2026-08-01 11:23:12', '2026-08-01 11:27:58');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (8, 'INV-2026-3200', 5, 1, 2, '2026-07-31 18:30:00', '70.00', '0.00', '8.40', '78.00', 'Pending', 'Credit / Udhaar', '0.00', '78.00', '78.00', NULL, NULL, '2026-08-01 11:32:49', '2026-08-01 11:32:49');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (9, 'INV-2026-9019', 5, 1, 8, '2026-07-31 18:30:00', '150.00', '0.00', '7.50', '158.00', 'Pending', 'Credit / Udhaar', '0.00', '158.00', '158.00', NULL, NULL, '2026-08-01 11:37:47', '2026-08-01 11:37:47');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (10, 'INV-2026-8470', 5, 1, 1, '2026-07-31 18:30:00', '70.00', '0.00', '8.40', '78.00', 'Partial', 'Split (Credit / Udhaar ₹60 + UPI ₹18)', '18.00', '60.00', '60.00', NULL, NULL, '2026-08-01 11:49:15', '2026-08-01 11:49:15');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (11, 'INV-2026-5072', 3, 1, 2, '2026-08-02 18:30:00', '50.00', '0.50', '0.00', '50.00', 'Pending', 'Credit / Udhaar', '0.00', '50.00', '50.00', NULL, NULL, '2026-08-03 05:37:18', '2026-08-03 05:37:18');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (12, 'INV-2026-4233', 3, 1, 2, '2026-08-02 18:30:00', '50.00', '0.00', '0.00', '50.00', 'Pending', 'Credit / Udhaar', '0.00', '50.00', '50.00', NULL, NULL, '2026-08-03 05:49:14', '2026-08-03 05:49:14');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (13, 'INV-2026-3360', 1, 1, 2, '2026-08-02 18:30:00', '70.00', '0.00', '8.40', '78.00', 'Paid', 'Cash', '78.00', '0.00', '0.00', '2026-08-02 18:30:00', NULL, '2026-08-03 05:56:42', '2026-08-03 05:56:42');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (14, 'INV-2026-3695', 1, 1, 1, '2026-08-02 18:30:00', '150.00', '0.00', '0.00', '150.00', 'Paid', 'Cash', '150.00', '0.00', '0.00', '2026-08-02 18:30:00', NULL, '2026-08-03 06:49:58', '2026-08-03 06:49:58');
INSERT INTO `sales` (`id`, `invoice_no`, `customer_id`, `warehouse_id`, `user_id`, `date`, `subtotal`, `discount`, `gst_amount`, `total`, `payment_status`, `payment_method`, `amount_paid`, `due_amount`, `balance_amount`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES (15, 'INV-2026-3403', 3, 1, 1, '2026-08-02 18:30:00', '100.00', '0.00', '0.00', '100.00', 'Pending', 'Credit / Udhaar', '0.00', '100.00', '100.00', NULL, NULL, '2026-08-03 07:47:51', '2026-08-03 07:47:51');

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
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (1, 'store_name', 'Ayyan Kirana Mart', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (2, 'store_address', 'Enter store address...', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (3, 'store_phone', '0000000000', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (4, 'store_email', 'ayyan@kiranaerp.com', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (5, 'currency', 'INR', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (6, 'timezone', 'Asia/Kolkata', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (7, 'gstin', '07AAAAA1111A1Z1', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (8, 'invoice_prefix', 'KM-INV-', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (9, 'low_stock_limit', '5', '2026-07-31 06:02:29');
INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES (10, 'expiry_alert_days', '30', '2026-07-31 06:02:29');

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
  UNIQUE KEY `unique_product_warehouse` (`product_id`,`warehouse_id`),
  UNIQUE KEY `unique_product_warehouse_vendor` (`product_id`,`warehouse_id`,`vendor_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock`
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (1, 1, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 11:07:26');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (2, 2, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (3, 3, 1, NULL, 24, '2026-07-31 06:56:38', '2026-08-03 07:47:51');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (4, 4, 1, NULL, 23, '2026-07-31 06:56:38', '2026-08-01 11:23:12');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (5, 5, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (6, 6, 1, NULL, 36, '2026-07-31 06:56:38', '2026-08-03 05:56:42');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (7, 7, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (8, 8, 1, NULL, 24, '2026-07-31 06:56:38', '2026-08-01 11:37:47');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (9, 9, 1, NULL, 15, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (10, 10, 1, NULL, 27, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (11, 11, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (12, 12, 1, NULL, 4, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (13, 13, 1, NULL, 30, '2026-07-31 06:56:38', '2026-08-03 06:41:12');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (14, 14, 1, NULL, 18, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (15, 15, 1, NULL, 15, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (16, 16, 1, NULL, 15, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (17, 17, 1, NULL, 25, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (18, 18, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (19, 19, 1, NULL, 25, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (20, 20, 1, NULL, 20, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (21, 21, 1, NULL, 25, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (22, 22, 1, NULL, 15, '2026-07-31 06:56:38', '2026-08-01 07:08:59');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (26, 27, 1, NULL, 10, '2026-07-31 07:41:29', '2026-08-03 06:49:58');
INSERT INTO `stock` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `quantity`, `created_at`, `updated_at`) VALUES (52, 28, 1, NULL, 0, '2026-08-03 06:41:12', '2026-08-03 06:41:12');

-- Table structure for table `stock_destroy`
DROP TABLE IF EXISTS `stock_destroy`;
CREATE TABLE `stock_destroy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Approved',
  `notes` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_stock_destroy_prod` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock_logs`
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (1, 27, 1, 2, 'Stock In', 20, 'GRN-0002-2026', 'Goods Received (PO: PO-0001-2026)', 6, '2026-07-31 10:02:28', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (2, 1, 1, 1, 'Stock In', 20, 'GRN-0003-2026', 'Goods Received (PO: PO-0002-2026)', 6, '2026-07-31 11:59:36', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (3, 2, 1, 1, 'Stock In', 20, 'GRN-0003-2026', 'Goods Received (PO: PO-0002-2026)', 6, '2026-07-31 11:59:36', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (4, 6, 1, 1, 'Stock In', 20, 'GRN-0003-2026', 'Goods Received (PO: PO-0002-2026)', 6, '2026-07-31 11:59:36', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (6, 6, 1, 3, 'Stock In', 20, 'GRN-0004-2026', 'Goods Received (PO: PO-0003-2026)', 1, '2026-07-31 12:12:23', 20, 40, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (7, 11, 1, 3, 'Stock In', 20, 'GRN-0004-2026', 'Goods Received (PO: PO-0003-2026)', 1, '2026-07-31 12:12:23', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (8, 18, 1, 3, 'Stock In', 20, 'GRN-0004-2026', 'Goods Received (PO: PO-0003-2026)', 1, '2026-07-31 12:12:23', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (9, 19, 1, 3, 'Stock In', 25, 'GRN-0004-2026', 'Goods Received (PO: PO-0003-2026)', 1, '2026-07-31 12:12:23', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (10, 21, 1, 3, 'Stock In', 25, 'GRN-0004-2026', 'Goods Received (PO: PO-0003-2026)', 1, '2026-07-31 12:12:23', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (11, 17, 1, 1, 'Stock In', 25, 'GRN-0005-2026', 'Goods Received (PO: PO-0004-2026)', 6, '2026-08-01 05:19:54', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (12, 13, 1, 1, 'Stock In', 25, 'GRN-0005-2026', 'Goods Received (PO: PO-0004-2026)', 6, '2026-08-01 05:19:54', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (13, 10, 1, 1, 'Stock In', 20, 'GRN-0005-2026', 'Goods Received (PO: PO-0004-2026)', 6, '2026-08-01 05:19:55', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (14, 8, 1, 1, 'Stock In', 25, 'GRN-0005-2026', 'Goods Received (PO: PO-0004-2026)', 6, '2026-08-01 05:19:55', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (15, 3, 1, 3, 'Stock In', 25, 'GRN-0006-2026', 'Goods Received (PO: PO-0005-2026)', 1, '2026-08-01 05:38:31', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (16, 5, 1, 3, 'Stock In', 20, 'GRN-0006-2026', 'Goods Received (PO: PO-0005-2026)', 1, '2026-08-01 05:38:31', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (17, 4, 1, 3, 'Stock In', 25, 'GRN-0006-2026', 'Goods Received (PO: PO-0005-2026)', 1, '2026-08-01 05:38:31', 0, 25, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (18, 7, 1, 2, 'Stock In', 20, 'GRN-0007-2026', 'Goods Received (PO: PO-0006-2026)', 1, '2026-08-01 06:01:32', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (19, 14, 1, 1, 'Stock In', 18, 'GRN-0008-2026', 'Goods Received (PO: PO-0007-2026)', 1, '2026-08-01 06:05:21', 0, 18, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (20, 12, 1, 1, 'Stock In', 4, 'GRN-0008-2026', 'Goods Received (PO: PO-0007-2026)', 1, '2026-08-01 06:05:22', 0, 4, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (21, 22, 1, 1, 'Stock In', 15, 'GRN-0008-2026', 'Goods Received (PO: PO-0007-2026)', 1, '2026-08-01 06:05:22', 0, 15, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (22, 15, 1, 3, 'Stock In', 15, 'GRN-0009-2026', 'Goods Received (PO: PO-0008-2026)', 4, '2026-08-01 06:10:06', 0, 15, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (23, 9, 1, 3, 'Stock In', 15, 'GRN-0009-2026', 'Goods Received (PO: PO-0008-2026)', 4, '2026-08-01 06:10:06', 0, 15, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (24, 16, 1, 3, 'Stock In', 15, 'GRN-0009-2026', 'Goods Received (PO: PO-0008-2026)', 4, '2026-08-01 06:10:06', 0, 15, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (25, 20, 1, 3, 'Stock In', 20, 'GRN-0009-2026', 'Goods Received (PO: PO-0008-2026)', 4, '2026-08-01 06:10:06', 0, 20, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (27, 10, 1, 2, 'Stock In', 7, 'GRN-0010-2026', 'Goods Received (PO: PO-0009-2026)', 1, '2026-08-01 07:18:43', 20, 27, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (28, 10, 1, 2, 'Stock In', 7, 'PUR-0010-2026', 'Purchase Invoice Entry', 1, '2026-08-01 07:18:48', 27, 34, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (29, 27, 1, NULL, 'Stock Out', -2, 'INV-2026-9650', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 08:48:05', 5, 3, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (30, 27, 1, NULL, 'Stock Out', -2, 'INV-2026-7713', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 09:01:13', 3, 1, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (31, 27, 1, NULL, 'Stock Out', -1, 'INV-2026-9648', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 09:07:43', 1, 0, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (32, 1, 1, NULL, 'Stock Out', -1, 'INV-2026-8283', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 11:01:30', 20, 19, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (33, 4, 1, NULL, 'Stock Out', -1, 'INV-2026-3652', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 11:04:40', 25, 24, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (34, 1, 1, NULL, 'Stock In', 1, 'INV-2026-8283', 'Void Sales Invoice INV-2026-8283 (Stock Restored)', 1, '2026-08-01 11:07:26', 0, 0, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (35, 4, 1, NULL, 'Stock Out', -1, 'INV-2026-3099', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 11:23:12', 24, 23, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (36, 6, 1, NULL, 'Stock Out', -1, 'INV-2026-3099', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 11:23:12', 40, 39, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (37, 6, 1, NULL, 'Stock Out', -1, 'INV-2026-3200', 'Sales Billing Entry (FIFO)', 2, '2026-08-01 11:32:49', 39, 38, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (38, 8, 1, NULL, 'Stock Out', -1, 'INV-2026-9019', 'Sales Billing Entry (FIFO)', 8, '2026-08-01 11:37:47', 25, 24, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (39, 6, 1, NULL, 'Stock Out', -1, 'INV-2026-8470', 'Sales Billing Entry (FIFO)', 1, '2026-08-01 11:49:15', 38, 37, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (40, 13, 1, 3, 'Stock In', 5, 'GRN-0011-2026', 'Goods Received (PO: PO-0010-2026)', 4, '2026-08-03 05:36:05', 25, 30, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (41, 13, 1, 3, 'Stock In', 5, 'PUR-0011-2026', 'Purchase Invoice Entry', 4, '2026-08-03 05:36:11', 30, 35, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (42, 27, 1, NULL, 'Stock Out', -1, 'INV-2026-5072', 'Sales Billing Entry (FIFO)', 2, '2026-08-03 05:37:18', 15, 14, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (43, 27, 1, NULL, 'Stock Out', -1, 'INV-2026-4233', 'Sales Billing Entry (FIFO)', 2, '2026-08-03 05:49:14', 14, 13, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (44, 6, 1, NULL, 'Stock Out', -1, 'INV-2026-3360', 'Sales Billing Entry (FIFO)', 2, '2026-08-03 05:56:42', 37, 36, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (45, 27, 1, NULL, 'Stock Out', -3, 'INV-2026-3695', 'Sales Billing Entry (FIFO)', 1, '2026-08-03 06:49:58', 13, 10, NULL, NULL, NULL);
INSERT INTO `stock_logs` (`id`, `product_id`, `warehouse_id`, `vendor_id`, `type`, `quantity`, `reference_no`, `notes`, `user_id`, `created_at`, `previous_quantity`, `new_quantity`, `batch_number`, `mrp`, `unit_price`) VALUES (46, 3, 1, NULL, 'Stock Out', -1, 'INV-2026-3403', 'Sales Billing Entry (FIFO)', 1, '2026-08-03 07:47:51', 25, 24, NULL, NULL, NULL);

-- Table structure for table `stock_transfer_items`
DROP TABLE IF EXISTS `stock_transfer_items`;
CREATE TABLE `stock_transfer_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transfer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_transfer_items` (`transfer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `stock_transfers`
DROP TABLE IF EXISTS `stock_transfers`;
CREATE TABLE `stock_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transfer_no` varchar(50) NOT NULL,
  `from_warehouse_id` int(11) NOT NULL,
  `to_warehouse_id` int(11) NOT NULL,
  `transfer_date` date NOT NULL,
  `status` enum('Pending','In-Transit','Completed','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_no` (`transfer_no`),
  KEY `idx_transfers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sub_categories`
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (1, 'Butter', 1, 'Active', NULL, '2026-07-31 07:05:18', '2026-07-31 07:05:18');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (2, 'milk', 1, 'Active', NULL, '2026-07-31 07:06:21', '2026-07-31 07:06:21');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (3, 'Bread', 1, 'Active', NULL, '2026-07-31 07:06:57', '2026-07-31 07:06:57');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (4, 'Dal', 2, 'Active', NULL, '2026-07-31 07:07:54', '2026-07-31 07:07:54');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (5, 'Coldring', 3, 'Active', NULL, '2026-07-31 07:08:10', '2026-07-31 07:08:10');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (6, 'Colgate', 4, 'Active', NULL, '2026-07-31 07:08:28', '2026-07-31 07:08:28');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (7, 'Shampoo', 4, 'Active', NULL, '2026-07-31 07:09:51', '2026-07-31 07:09:51');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (8, 'Oil', 2, 'Active', NULL, '2026-07-31 07:10:58', '2026-07-31 07:10:58');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (9, 'Biskit', 5, 'Active', NULL, '2026-07-31 07:11:21', '2026-07-31 07:11:21');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (10, 'Rice', 2, 'Active', NULL, '2026-07-31 07:12:52', '2026-07-31 07:12:52');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (11, 'KurKure', 5, 'Active', NULL, '2026-07-31 07:13:27', '2026-07-31 07:13:27');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (12, 'Chips', 5, 'Active', NULL, '2026-07-31 07:13:49', '2026-07-31 07:13:49');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (13, 'Noodles', 5, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (14, 'Nariyal', 6, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (15, 'Coffee', 1, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (16, 'namkeen', 2, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (17, 'Detergent', 7, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (18, 'Salt', 5, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (19, 'Dishwash', 7, 'Active', NULL, '2026-07-31 07:25:36', '2026-07-31 07:25:36');
INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `status`, `description`, `created_at`, `updated_at`) VALUES (20, 'agarbatti', 6, 'Active', NULL, '2026-07-31 07:41:29', '2026-07-31 07:41:29');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `supplier_payments`
INSERT INTO `supplier_payments` (`id`, `payment_no`, `vendor_id`, `purchase_id`, `payment_date`, `amount`, `payment_mode`, `reference_no`, `bank_account`, `remarks`, `attachment_url`, `created_by`, `created_at`) VALUES (1, 'VPAY-0001-2026', 2, NULL, '2026-08-02 18:30:00', '4000.00', 'Cash', NULL, NULL, NULL, NULL, 1, '2026-08-03 07:52:09');

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

-- Dumping data for table `user_permissions`
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 1);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 1);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 2);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 2);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 3);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 3);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 4);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 4);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 5);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 6);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 7);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 8);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 8);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 9);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 10);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 11);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 12);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 13);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 14);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 14);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 15);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 15);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 16);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 16);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 17);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 17);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 19);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 20);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 20);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (7, 21);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 21);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 24);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 34);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 35);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 36);
INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES (8, 37);

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
  KEY `idx_users_email` (`email`),
  KEY `idx_users_login_id` (`login_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (1, 'Ayyan Khan', 'ayyan@kiranaerp.com', 'AYYAN001', '$2a$10$cVE8JCb429hLeZJGIus4g.g.qdRnmVGKPoMs9BpdgRfhTMe3FByIW', NULL, 1, 'Active', NULL, NULL, NULL, NULL, '2026-08-03 07:47:24', '2026-07-31 06:02:29', '2026-08-03 07:47:24');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (2, 'Sameer Khan', 'sameer@gmail.com', 'AYYAN001-SM0001', '$2a$10$7cgb9g1/jy9wjd2rAXxhSu3WPilLEDvOfuSGD5toELin6EKc.LWRG', '958986254', 2, 'Active', 'Sales', 1, NULL, NULL, '2026-08-03 06:21:18', '2026-07-31 06:08:17', '2026-08-03 06:22:28');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (3, 'Sohil Khan 2', 'sohil_2@gmail.com', 'AYYAN001-SE0001', '$2a$10$pIjzT7YshYZGraotxqd1A.kdwTyZrVkaCnT9oQE/K7bf2lgEAWa6e', '968742', 6, 'Active', 'Sales', 2, NULL, NULL, NULL, '2026-07-31 06:16:55', '2026-08-03 06:22:28');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (4, 'Pranav Khan', 'pranav@gmail.com', 'AYYAN001-PM0001', '$2a$10$sOFQQh8ZMMtZxyXeobAspua6zykfFR0xKFYWXjVJaFQuQgHiE0ZUy', '8654412589', 3, 'Active', 'Purchase', 3, NULL, NULL, '2026-08-03 09:39:08', '2026-07-31 06:19:08', '2026-08-03 09:39:08');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (5, 'Parth Khan', 'parth_3972@gmail.com', 'AYYAN001-PE0001', '$2a$10$DjcRIXCUg4wbs8Ibuc.2eOrxY1AMRi8Nwx6ihXKd1oYGf6eEIiZD2', '8965234404', 5, 'Active', 'Purchase', 4, NULL, NULL, NULL, '2026-07-31 06:32:43', '2026-08-03 06:22:28');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (6, 'Dhanish Khan', 'dhanish@gmail.com', 'AYYAN001-PE0002', '$2a$10$3pe5Evsib2XE8HWZLwngv.KEFJv0bJOsZNbpbJl3Hcp6q3XAj5xGy', '7898586985', 5, 'Active', 'Purchase', 5, NULL, NULL, '2026-08-03 05:59:07', '2026-07-31 06:34:44', '2026-08-03 06:22:28');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (7, 'Ajay Sharma', 'ajay@gmail.com', 'AYYAN001-EM0001', '$2a$10$YNltQrH7WXxuvei3aVVsR.x77MGUI1GuLKz5D/hw86addJsA5f5Li', '9858963254', 4, 'Active', 'General', 6, NULL, NULL, '2026-07-31 06:42:46', '2026-07-31 06:42:38', '2026-08-03 06:22:28');
INSERT INTO `users` (`id`, `name`, `email`, `login_id`, `password`, `contact`, `role_id`, `status`, `department`, `employee_serial_id`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`) VALUES (8, 'Sandeep Singh', 'sandeep@gmail.com', 'AYYAN001-SE0002', '$2a$10$p0WYmIyjndgAoaMMURSCJOVcE7q8MbUOL0KRP8jjfyBSM9GVF9mbO', '9856985632', 4, 'Active', 'Sales', 7, NULL, NULL, '2026-08-03 06:21:36', '2026-08-01 11:36:57', '2026-08-03 06:22:29');

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `vendor_ledger`
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (1, 2, 1, NULL, '2026-07-29 18:30:00', 'PURCHASE_INVOICE', 'PUR-0001-2026', 'Purchase Invoice PUR-0001-2026', '800.00', '0.00', '0.00', '2026-07-31 10:02:44');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (2, 1, 2, NULL, '2026-07-29 18:30:00', 'PURCHASE_INVOICE', 'PUR-0002-2026', 'Purchase Invoice PUR-0002-2026', '13651.20', '0.00', '0.00', '2026-07-31 11:59:40');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (3, 3, 3, NULL, '2026-07-29 18:30:00', 'PURCHASE_INVOICE', 'PUR-0003-2026', 'Purchase Invoice PUR-0003-2026', '12051.20', '0.00', '0.00', '2026-07-31 12:12:48');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (4, 1, 4, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0004-2026', 'Purchase Invoice PUR-0004-2026', '17787.50', '0.00', '0.00', '2026-08-01 05:20:02');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (5, 1, NULL, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0005-2026', 'Purchase Invoice PUR-0005-2026', '17787.50', '0.00', '0.00', '2026-08-01 05:32:34');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (6, 3, 6, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0006-2026', 'Purchase Invoice PUR-0006-2026', '8160.00', '0.00', '0.00', '2026-08-01 05:38:34');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (7, 2, 7, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0007-2026', 'Purchase Invoice PUR-0007-2026', '800.00', '0.00', '0.00', '2026-08-01 06:01:36');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (8, 1, 8, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0008-2026', 'Purchase Invoice PUR-0008-2026', '2174.00', '0.00', '0.00', '2026-08-01 06:05:26');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (9, 3, 9, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0009-2026', 'Purchase Invoice PUR-0009-2026', '7430.00', '0.00', '0.00', '2026-08-01 06:10:11');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (10, 2, 10, NULL, '2026-07-30 18:30:00', 'PURCHASE_INVOICE', 'PUR-0010-2026', 'Purchase Invoice PUR-0010-2026', '3360.00', '0.00', '0.00', '2026-08-01 07:18:48');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (11, 3, 11, NULL, '2026-08-01 18:30:00', 'PURCHASE_INVOICE', 'PUR-0011-2026', 'Purchase Invoice PUR-0011-2026', '200.00', '0.00', '0.00', '2026-08-03 05:36:11');
INSERT INTO `vendor_ledger` (`id`, `vendor_id`, `purchase_id`, `payment_id`, `date`, `transaction_type`, `reference_no`, `description`, `debit_amount`, `credit_amount`, `running_balance`, `created_at`) VALUES (12, 2, NULL, 1, '2026-08-02 18:30:00', 'SUPPLIER_PAYMENT', 'VPAY-0001-2026', 'Supplier Payment via Cash', '0.00', '4000.00', '960.00', '2026-08-03 07:52:09');

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `vendors`
INSERT INTO `vendors` (`id`, `name`, `company_name`, `phone`, `email`, `address`, `gstin`, `payment_terms`, `bank_name`, `account_number`, `ifsc_code`, `outstanding_balance`, `credit_limit`, `total_purchases`, `total_paid`, `status`, `created_at`, `updated_at`, `supplier_code`, `contact_person`, `alternate_phone`, `pan`, `city`, `state`, `pincode`, `categories_supplied`, `opening_balance`, `opening_balance_type`, `notes`) VALUES (1, 'Maheshwari Foods', 'Parle Products Distributor', '9826012345', 'maheshwari.foods@gmail.com', 'Main Road, New Market', '23PQRSM5678K1Z2', 'Net 30', 'ICICI Bank', '104505678912', 'ICIC0000456', '0.00', '0.00', '51400.20', '51400.20', 'Active', '2026-07-31 07:59:17', '2026-08-01 06:05:26', 'SUP-0001', 'Vikas Maheshwari', '9893012345', 'PQRSM5678K', 'Indore', 'Madhya Pradesh', '456001', 'Biscuits, Snacks', '0.00', 'Payable', NULL);
INSERT INTO `vendors` (`id`, `name`, `company_name`, `phone`, `email`, `address`, `gstin`, `payment_terms`, `bank_name`, `account_number`, `ifsc_code`, `outstanding_balance`, `credit_limit`, `total_purchases`, `total_paid`, `status`, `created_at`, `updated_at`, `supplier_code`, `contact_person`, `alternate_phone`, `pan`, `city`, `state`, `pincode`, `categories_supplied`, `opening_balance`, `opening_balance_type`, `notes`) VALUES (2, 'Jain Agro Suppliers', 'Fortune Foods Distribution', '9893456789', 'jain.agro@gmail.com', 'Transport Nagar', '27JKLMN4321P1Z7', 'Net 30', 'Axis Bank', '918273645001', 'UTIB0000789', '960.00', '0.00', '4960.00', '4000.00', 'Active', '2026-07-31 08:06:00', '2026-08-03 07:52:09', 'SUP-0002', 'Sandeep Jain', '9755512345', 'JKLMN4321P', 'Nagpur', 'Maharashtra', '440008', 'Edible Oils, Pulses', '0.00', 'Payable', NULL);
INSERT INTO `vendors` (`id`, `name`, `company_name`, `phone`, `email`, `address`, `gstin`, `payment_terms`, `bank_name`, `account_number`, `ifsc_code`, `outstanding_balance`, `credit_limit`, `total_purchases`, `total_paid`, `status`, `created_at`, `updated_at`, `supplier_code`, `contact_person`, `alternate_phone`, `pan`, `city`, `state`, `pincode`, `categories_supplied`, `opening_balance`, `opening_balance_type`, `notes`) VALUES (3, 'Verma FMCG Suppliers', 'ITC FMCG Distributor', '9811122233', 'verma.fmcg@gmail.com', 'Sector 18 Market', '09WERT5678L1Z4', 'Net 30', 'Punjab National Bank', '123456789012', 'PUNB0123456', '0.00', '0.00', '27841.20', '27841.20', 'Active', '2026-07-31 08:39:32', '2026-08-03 05:36:11', 'SUP-0003', 'Rakesh Verma', '9877001122', 'WERT5678L', 'Noida', 'Uttar Pradesh', '201301', 'Personal Care, Grocery', '0.00', 'Payable', NULL);

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
INSERT INTO `warehouses` (`id`, `name`, `location`, `status`, `created_at`, `updated_at`) VALUES (1, 'Main Storage', 'Ground Floor Stockroom', 'Active', '2026-07-31 06:02:29', '2026-07-31 06:02:29');

SET FOREIGN_KEY_CHECKS=1;
