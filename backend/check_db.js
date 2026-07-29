import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  try {
    const conn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    console.log('Connected to DB');
    const [tenants] = await conn.query('SELECT * FROM tenants');
    console.log('Tenants:', tenants);
    const [users] = await conn.query('SELECT * FROM users');
    console.log('Users:', users);
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
