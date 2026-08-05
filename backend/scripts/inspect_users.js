import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectUsers() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [users] = await masterDb.query('SELECT * FROM users');
  console.table(users);
  await masterDb.end();
}

inspectUsers();
