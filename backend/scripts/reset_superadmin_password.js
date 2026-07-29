import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const resetSuperAdmin = async () => {
  const conn = await mysql.createConnection({ host, port, user, password, database: masterDb });
  const [users] = await conn.query('SELECT id, email, login_id, role FROM users WHERE role = "Super Admin"');
  console.log('Super Admin accounts:', users);

  if (users.length > 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Pass123!', salt);
    await conn.query('UPDATE users SET password = ? WHERE role = "Super Admin"', [hash]);
    console.log('✅ Reset Super Admin password to "Pass123!" for email:', users[0].email);
  }
  await conn.end();
};

resetSuperAdmin();
