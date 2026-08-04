import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function showDbs() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const [dbs] = await db.query('SHOW DATABASES');
  console.log('Databases:', dbs);
  await db.end();
}

showDbs();
