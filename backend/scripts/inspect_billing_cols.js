import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectCols() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [cols] = await masterDb.query('DESCRIBE billing_history');
  console.log('Columns in billing_history:', cols);

  await masterDb.end();
}

inspectCols();
