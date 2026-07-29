import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';

const check = async () => {
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database: 'kirana_erp_master' });
    
    const [tenants] = await conn.query('SELECT * FROM tenants');
    console.log('--- TENANTS ---');
    console.table(tenants);

    const [users] = await conn.query('SELECT id, tenant_id, email, role, status, login_id FROM users');
    console.log('--- USERS ---');
    console.table(users);

  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
};

check();
