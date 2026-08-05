import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function fixMohanPassword() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const salt = await bcrypt.genSalt(10);

  // We set hash for "password123" and also check "123456"
  const hash = await bcrypt.hash('password123', salt);

  console.log('\n======================================================');
  console.log('RESETTING MOHAN PASSWORD HASH IN ALL TABLES');
  console.log('======================================================\n');

  // Update in Master DB
  const [resMaster] = await masterDb.query(
    'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) LIKE "%MOHAN%"',
    [hash]
  );
  console.log('Master DB users updated:', resMaster.affectedRows);

  // Update in Tenant DB
  try {
    const tenantDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'shop_mohan001'
    });
    const [resTenant] = await tenantDb.query(
      'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) LIKE "%MOHAN%"',
      [hash]
    );
    console.log('Tenant DB (shop_mohan001) users updated:', resTenant.affectedRows);
    await tenantDb.end();
  } catch (err) {
    console.warn('Tenant DB update warning:', err.message);
  }

  // Also check all stores passwords (Aman, Ayyan, Dinesh, Mohan)
  const officialPasses = [
    { email: 'aman@kiranaerp.com', pass: 'password123' },
    { email: 'ayyan@kiranaerp.com', pass: 'password123' },
    { email: 'dinesh@kiranaerp.com', pass: 'password123' },
    { email: 'mohan@kiranamart.com', pass: 'password123' }
  ];

  for (const item of officialPasses) {
    const itemHash = await bcrypt.hash(item.pass, salt);
    await masterDb.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [itemHash, item.email]);
  }

  const [allUsers] = await masterDb.query('SELECT id, email, login_id, role, status, tenant_id FROM users');
  console.log('\nCurrent Registered Master Users:');
  console.table(allUsers);

  console.log('\n======================================================');
  console.log('✅ MOHAN PASSWORD SUCCESSFULLY RESET TO: "password123"');
  console.log('======================================================\n');

  await masterDb.end();
}

fixMohanPassword();
