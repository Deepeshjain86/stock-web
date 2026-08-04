import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function findDinesh() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp'
  });

  const [stores] = await db.query('SELECT * FROM stores WHERE owner_name LIKE "%dinesh%" OR store_name LIKE "%dinesh%"');
  console.log('Stores Dinesh:', stores);
  await db.end();
}

findDinesh();
