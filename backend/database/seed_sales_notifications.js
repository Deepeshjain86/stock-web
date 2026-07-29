import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

const seedSalesNotifications = async () => {
  console.log('[Seed Sales Notifications] Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${masterDbName}\`;`);
    const [tRows] = await conn.query("SELECT DISTINCT database_name FROM tenants WHERE database_name IS NOT NULL AND database_name != ''");
    const tenantDbs = tRows.map(r => r.database_name);

    const [dbRows] = await conn.query("SHOW DATABASES LIKE 'kirana_erp%'");
    const systemDbs = dbRows.map(r => Object.values(r)[0]);

    const allDbs = Array.from(new Set(['kirana_erp', 'kirana_erp_master', ...tenantDbs, ...systemDbs]));

    for (const dbName of allDbs) {
      console.log(`[Seed Sales Notifications] Seeding DB: "${dbName}"`);
      try {
        await conn.query(`USE \`${dbName}\`;`);
      } catch (err) {
        console.warn(`  -> Skipping "${dbName}":`, err.message);
        continue;
      }

      try {
        await conn.query("ALTER TABLE notifications MODIFY tenant_id INT NULL;");
      } catch (err) {}

      let tid = null;
      try {
        const [tRows] = await conn.query("SELECT id FROM tenants LIMIT 1");
        if (tRows.length > 0) tid = tRows[0].id;
      } catch (err) {}

      const [countRows] = await conn.query("SELECT COUNT(*) as cnt FROM notifications WHERE module IN ('Sales', 'Customer')");
      if (countRows[0].cnt < 3) {
        await conn.query(`
          INSERT INTO notifications (tenant_id, type, title, message, priority, module, related_module, target_roles, is_read, related_user, created_at) VALUES
          (?, 'Sales Invoice', 'POS Counter Billing Billed', 'Sales invoice INV-#58 for Walk-in Customer generated for amount ₹385.', 'Medium', 'Sales', 'Sales', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'Priya Verma', NOW() - INTERVAL 10 MINUTE),
          (?, 'Customer Payback', 'Udhaar Payback Received', 'Payback payment of ₹1,500 received from customer "Ramesh Kumar".', 'Medium', 'Customer', 'Customer', 'Admin,Sales Manager,Sales Employee,Manager,Staff', 0, 'Sales Counter', NOW() - INTERVAL 45 MINUTE),
          (?, 'Sales Staff', 'Sales Employee Registered', 'Sales Employee "Amit Sharma" registered under Sales department.', 'Low', 'Sales', 'Sales', 'Admin,Sales Manager', 0, 'Priya Verma', NOW() - INTERVAL 2 HOUR),
          (?, 'Sales Return', 'Sales Return Request Approved', 'Sales return VRN-02 approved for invoice INV-#42 (Refund: ₹210).', 'High', 'Sales', 'Sales', 'Admin,Sales Manager,Sales Employee', 0, 'Priya Verma', NOW() - INTERVAL 5 HOUR)
        `, [tid, tid, tid, tid]);
        console.log(`  -> Inserted 4 Sales notifications into "${dbName}".`);
      } else {
        console.log(`  -> Sales notifications already present in "${dbName}".`);
      }
    }

    console.log('[Seed Sales Notifications] Seeding completed successfully.');
  } catch (error) {
    console.error('[Seed Sales Notifications] Seeding failed:', error);
  } finally {
    await conn.end();
  }
};

seedSalesNotifications();
