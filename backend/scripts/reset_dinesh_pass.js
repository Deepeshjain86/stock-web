import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetPass() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const hash = await bcrypt.hash('password123', 10);
  await masterDb.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'dinesh@kiranaerp.com']);
  console.log('✅ Set password for dinesh@kiranaerp.com to "password123"');

  await masterDb.end();
}

resetPass();
