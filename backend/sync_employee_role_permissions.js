import mysql from 'mysql2/promise';

async function syncEmployeeRolePermissions() {
  console.log('=== SYNCING EMPLOYEE ROLE PERMISSIONS IN ALL TENANT DATABASES ===\n');

  const sysDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  const [dbs] = await sysDb.query("SHOW DATABASES LIKE 'AMAN01'");
  const [tenantDbs] = await sysDb.query("SHOW DATABASES LIKE 'kirana_erp_tenant_%'");

  const allTenantDbs = [
    ...dbs.map(d => Object.values(d)[0]),
    ...tenantDbs.map(d => Object.values(d)[0])
  ];

  const employeeOpPerms = [
    'view_dashboard', 'view_reports', 'view_sales', 'create_sales', 'view_pos', 
    'manage_customers', 'view_borrow', 'create_borrow', 'manage_borrow', 
    'view_purchases', 'create_purchases', 'view_vendors', 'manage_vendors', 
    'view_products', 'create_products', 'edit_products', 'view_categories', 
    'view_stock', 'view_stock_history', 'adjust_stock', 'destroy_stock', 
    'view_returns', 'create_returns', 'approve_returns', 'view_notifications'
  ];

  for (const dbName of allTenantDbs) {
    console.log(`Processing Database: ${dbName}...`);
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: dbName
    });

    try {
      // Find role_id for Employee
      const [eRole] = await db.query('SELECT id FROM roles WHERE name = "Employee"');
      if (eRole.length > 0) {
        const empRoleId = eRole[0].id;

        // Fetch permission IDs for employeeOpPerms
        const [perms] = await db.query(
          `SELECT id, name FROM permissions WHERE name IN (?)`,
          [employeeOpPerms]
        );

        for (const p of perms) {
          await db.query(
            'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [empRoleId, p.id]
          );
        }
        console.log(`  [✓] Updated role_permissions for Employee (role_id=${empRoleId}) in ${dbName}.`);
      }
    } catch (err) {
      console.error(`  [X] Error updating ${dbName}:`, err);
    } finally {
      await db.end();
    }
  }

  await sysDb.end();
  console.log('\n=== SYNC COMPLETE ===');
}

syncEmployeeRolePermissions().catch(err => console.error(err));
