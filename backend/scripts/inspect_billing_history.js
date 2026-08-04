import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectBillingHistory() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [bills] = await masterDb.query('SELECT * FROM billing_history');
  console.log('Billing History entries:', bills);

  const [subs] = await masterDb.query('SELECT * FROM subscriptions');
  console.log('Subscriptions entries:', subs);

  await masterDb.end();
}

inspectBillingHistory();
