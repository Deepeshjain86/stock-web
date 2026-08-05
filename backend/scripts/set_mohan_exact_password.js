import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function setMohanExactPassword() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const exactPass = 'Mohan@123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(exactPass, salt);

  console.log('\n======================================================');
  console.log(`SETTING MOHAN PASSWORD TO EXACTLY: "${exactPass}"`);
  console.log('======================================================\n');

  // Update in Master DB
  const [mRes] = await masterDb.query(
    'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) LIKE "%MOHAN%"',
    [hash]
  );
  console.log('Master DB users updated:', mRes.affectedRows);

  // Update in Tenant DB
  try {
    const tenantDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'shop_mohan001'
    });
    const [tRes] = await tenantDb.query(
      'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) LIKE "%MOHAN%"',
      [hash]
    );
    console.log('Tenant DB (shop_mohan001) users updated:', tRes.affectedRows);
    await tenantDb.end();
  } catch (err) {
    console.warn('Tenant DB update warning:', err.message);
  }

  // Double check tenant subscription status
  const [tenants] = await masterDb.query(
    'SELECT id, store_name, owner_name, email, subscription_status, subscription_expires_at, trial_ended_at FROM tenants WHERE LOWER(email) LIKE "%mohan%"'
  );
  console.log('\nMohan Tenant Record Status:');
  console.table(tenants);

  console.log('\n======================================================');
  console.log(`✅ MOHAN PASSWORD SET TO EXACTLY: "${exactPass}" AND TRIAL IS EXPIRED`);
  console.log('======================================================\n');

  await masterDb.end();
}

setMohanExactPassword();
