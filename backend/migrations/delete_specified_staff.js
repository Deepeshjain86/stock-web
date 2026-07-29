import mysql from 'mysql2/promise';

/**
 * Migration Script: Permanent Deletion of Specified Staff Members
 */
async function runStaffDeletion() {
  console.log('=== PERMANENT DELETION OF SPECIFIED STAFF MEMBERS ===\n');

  const masterDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kirana_erp_master'
  });

  const tenantDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'AMAN01'
  });

  const targetLoginIds = [
    'AMAN01-EM0004',
    'AMAN01-EM0005',
    'AMAN01-EM0006',
    'AMAN01-USR0001',
    'AMAN01-SM02',
    'AMAN01-PE0002',
    'AMAN01-USR0002',
    'AMAN01-EM0007',
    'AMAN01-EM0002',
    'AMAN01-EM0001',
    'AMAN01-SE0002'
  ];

  try {
    // 1. Fetch Tenant User IDs & Emails to delete
    const [tenantUsers] = await tenantDb.query(
      'SELECT id, email, login_id, name FROM users WHERE login_id IN (?)',
      [targetLoginIds]
    );

    console.log(`Found ${tenantUsers.length} matching staff profile(s) in AMAN01 database.`);

    if (tenantUsers.length > 0) {
      const userIds = tenantUsers.map(u => u.id);
      const emails = tenantUsers.map(u => u.email);

      // Begin transaction in tenant DB
      await tenantDb.beginTransaction();

      // Clean up user_permissions
      await tenantDb.query('DELETE FROM user_permissions WHERE user_id IN (?)', [userIds]);
      console.log('  [✓] Removed user_permissions rows.');

      // Nullify references in activity_logs
      await tenantDb.query('UPDATE activity_logs SET user_id = NULL WHERE user_id IN (?)', [userIds]);
      
      // Nullify references in stock_logs
      await tenantDb.query('UPDATE stock_logs SET user_id = NULL WHERE user_id IN (?)', [userIds]);

      // Delete from tenant users table
      const [delTenantRes] = await tenantDb.query('DELETE FROM users WHERE id IN (?)', [userIds]);
      console.log(`  [✓] Deleted ${delTenantRes.affectedRows} staff record(s) from AMAN01.users.`);

      await tenantDb.commit();

      // Begin transaction in master DB
      await masterDb.beginTransaction();

      // Nullify references in master activity_logs if present
      try {
        await masterDb.query('UPDATE activity_logs SET user_id = NULL WHERE user_id IN (SELECT id FROM users WHERE login_id IN (?) OR email IN (?))', [targetLoginIds, emails]);
      } catch (e) {}

      // Delete from master users table
      const [delMasterRes] = await masterDb.query('DELETE FROM users WHERE login_id IN (?) OR email IN (?)', [targetLoginIds, emails]);
      console.log(`  [✓] Deleted ${delMasterRes.affectedRows} staff record(s) from kirana_erp_master.users.`);

      await masterDb.commit();
    }

    console.log('\n=== STAFF DELETION COMPLETED SUCCESSFULLY ===');

  } catch (err) {
    console.error('Error during staff deletion:', err);
    await tenantDb.rollback();
    await masterDb.rollback();
  } finally {
    await tenantDb.end();
    await masterDb.end();
  }
}

runStaffDeletion().catch(err => console.error(err));
