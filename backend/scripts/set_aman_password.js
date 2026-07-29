import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';

const setAmanPassword = async () => {
  const masterConn = await mysql.createConnection({ host, port, user, password, database: 'kirana_erp_master' });
  const tenantConn = await mysql.createConnection({ host, port, user, password, database: 'shop_aman001' });

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Aman@123', salt);

  await masterConn.query('UPDATE users SET password = ? WHERE email = "aman@kiranaerp.com"', [hash]);
  console.log('✅ Master DB: Password updated for aman@kiranaerp.com -> Aman@123');

  await tenantConn.query('UPDATE users SET password = ? WHERE email = "aman@kiranaerp.com"', [hash]);
  console.log('✅ Tenant DB (shop_aman001): Password updated for aman@kiranaerp.com -> Aman@123');

  await masterConn.end();
  await tenantConn.end();
};

setAmanPassword();
