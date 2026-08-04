import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function showTables() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tables] = await db.query('SHOW TABLES');
  console.log('Tables in kirana_erp_master:', tables);
  await db.end();
}

showTables();
