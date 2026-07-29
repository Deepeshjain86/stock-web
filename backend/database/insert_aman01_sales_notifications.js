import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';

const insertAmanSalesNotifications = async () => {
  console.log('[AMAN01 Seed] Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  try {
    await conn.query("USE `AMAN01`;");
    console.log('[AMAN01 Seed] Inserting rich Sales & Customer notifications into AMAN01...');

    await conn.query(`
      INSERT INTO notifications (tenant_id, type, title, message, priority, module, related_module, target_roles, is_read, related_user, created_at) VALUES
      (9, 'Sales Invoice', 'POS Counter Billing Billed', 'Sales invoice INV-2026-089 generated for Walk-in Customer (₹1,450.00). Stock deducted.', 'Medium', 'Sales', 'Sales', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'Priya Verm', NOW() - INTERVAL 12 MINUTE),
      (9, 'Customer Payback', 'Udhaar Payback Received', 'Udhaar payback payment of ₹1,800 received from customer "Sunil Sharma".', 'Medium', 'Customer', 'Customer', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'Suresh Patel', NOW() - INTERVAL 40 MINUTE),
      (9, 'Customer Credit', 'Udhaar Credit Issued', 'Udhaar credit of ₹2,500 issued to customer "Ramesh Kumar" for bill INV-2026-088.', 'Medium', 'Customer', 'Customer', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'Priya Verm', NOW() - INTERVAL 2 HOUR),
      (9, 'Sales Staff', 'Sales Employee Registered', 'New Sales Employee "Abhi Namdev" registered under Sales department.', 'Low', 'Sales', 'Sales', 'Admin,Sales Manager', 0, 'Priya Verm', NOW() - INTERVAL 4 HOUR),
      (9, 'Sales Return', 'Sales Return Approved', 'Sales Return VRN-104 approved for invoice INV-2026-042 (Refund Amount: ₹320.00).', 'High', 'Sales', 'Sales', 'Admin,Sales Manager,Sales Employee', 0, 'Priya Verm', NOW() - INTERVAL 6 HOUR),
      (9, 'Stock Alert', 'Low Stock Warning', 'Low stock alert: Product "Aashirvaad Atta 10kg" quantity is down to 3 units.', 'High', 'Sales', 'Inventory', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'System', NOW() - INTERVAL 1 DAY);
    `);

    console.log('[AMAN01 Seed] 6 Sales notifications successfully inserted into AMAN01.');
  } catch (error) {
    console.error('[AMAN01 Seed] Failed to insert notifications:', error);
  } finally {
    await conn.end();
  }
};

insertAmanSalesNotifications();
