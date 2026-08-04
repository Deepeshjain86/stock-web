import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugDinesh9747() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'shop_dinesh001'
  });

  const [sales] = await db.query('SELECT * FROM sales WHERE invoice_no LIKE "%9747%"');
  console.log('Sales 9747:', sales);

  if (sales.length > 0) {
    const sale = sales[0];
    const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    console.log('Sale items 9747:', items);

    const [returns] = await db.query('SELECT * FROM sales_returns WHERE sale_id = ?', [sale.id]);
    console.log('Existing returns 9747:', returns);

    const [cust] = await db.query('SELECT * FROM customers WHERE id = ?', [sale.customer_id]);
    console.log('Customer for 9747:', cust);
  }

  await db.end();
}

debugDinesh9747();
