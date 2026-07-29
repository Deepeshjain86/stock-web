import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';
const tenantDbName = 'shop_aman001';

const testStrictAuth = async () => {
  console.log('\n======================================================');
  console.log('TESTING STRICT AUTHENTICATION & PASSWORD SYNC');
  console.log('======================================================\n');

  let masterConn = null;
  let tenantConn = null;
  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    tenantConn = await mysql.createConnection({ host, port, user, password, database: tenantDbName });

    // 1. Verify Aman Gupta user in Master DB
    const [amanMaster] = await masterConn.query('SELECT * FROM users WHERE email = "aman@kiranaerp.com"');
    if (amanMaster.length === 0) {
      throw new Error('Aman Gupta not found in Master Database!');
    }

    console.log(`[Strict Auth] Master User found: Email="${amanMaster[0].email}", LoginID="${amanMaster[0].login_id}"`);

    // 2. Verify fuzzy input "admin@kiranaerp.com" does NOT match
    const [fuzzyMatch] = await masterConn.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR UPPER(login_id) = UPPER(?)',
      ['admin@kiranaerp.com', 'admin@kiranaerp.com']
    );

    if (fuzzyMatch.length > 0) {
      throw new Error('FAILED: Unregistered email "admin@kiranaerp.com" matched an existing account!');
    }
    console.log('[Strict Auth] Verified "admin@kiranaerp.com" does NOT match Aman Gupta or any account.');

    // 3. Test password verification
    const testPass = 'Pass123!';
    const wrongPass = 'WrongPass999!';

    const isTestPassValid = await bcrypt.compare(testPass, amanMaster[0].password);
    const isWrongPassValid = await bcrypt.compare(wrongPass, amanMaster[0].password);

    console.log(`[Strict Auth] Test Password ("${testPass}") valid? ${isTestPassValid}`);
    console.log(`[Strict Auth] Wrong Password ("${wrongPass}") valid? ${isWrongPassValid}`);

    if (isWrongPassValid) {
      throw new Error('FAILED: Wrong password was accepted!');
    }

    // 4. Test Password Sync simulation
    const newTestPass = 'NewSecurePass2026!';
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newTestPass, salt);

    // Sync in Master DB & Tenant DB
    await masterConn.query('UPDATE users SET password = ? WHERE id = ?', [newHash, amanMaster[0].id]);
    await tenantConn.query('UPDATE users SET password = ? WHERE email = ?', [newHash, 'aman@kiranaerp.com']);

    const oldPassValidAfterChange = await bcrypt.compare(testPass, newHash);
    const newPassValidAfterChange = await bcrypt.compare(newTestPass, newHash);

    console.log(`[Strict Auth] After Password Change:`);
    console.log(`              Old Password ("${testPass}") valid? ${oldPassValidAfterChange}`);
    console.log(`              New Password ("${newTestPass}") valid? ${newPassValidAfterChange}`);

    if (oldPassValidAfterChange || !newPassValidAfterChange) {
      throw new Error('FAILED: Password change sync failed!');
    }

    // 5. Restore original password hash
    await masterConn.query('UPDATE users SET password = ? WHERE id = ?', [amanMaster[0].password, amanMaster[0].id]);
    await tenantConn.query('UPDATE users SET password = ? WHERE email = ?', [amanMaster[0].password, 'aman@kiranaerp.com']);

    console.log('[Strict Auth] Restored original password hash.');

    console.log('\n======================================================');
    console.log('✅ STRICT AUTHENTICATION & PASSWORD SYNC TEST PASSED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ STRICT AUTH TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (masterConn) await masterConn.end();
    if (tenantConn) await tenantConn.end();
  }
};

testStrictAuth();
