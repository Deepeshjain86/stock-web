import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetMohanPass() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);

  // Update in Master DB
  await masterDb.query(
    'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) = "MOHAN001"',
    [hash]
  );

  // Update in Tenant DB
  try {
    const tenantDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'shop_mohan001'
    });
    await tenantDb.query(
      'UPDATE users SET password = ? WHERE LOWER(email) LIKE "%mohan%" OR UPPER(login_id) = "MOHAN001"',
      [hash]
    );
    await tenantDb.end();
  } catch (err) {
    console.warn('Tenant DB update warning:', err.message);
  }

  console.log('✅ Password for Mohan (mohan@kiranamart.com / MOHAN001) reset to: "password123"');
  await masterDb.end();
}

resetMohanPass();
