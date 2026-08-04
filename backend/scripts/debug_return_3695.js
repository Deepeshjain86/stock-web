import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugInvoice3695() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'shop_ayyan001'
  });

  const [sales] = await db.query('SELECT * FROM sales WHERE invoice_no LIKE "%3695%"');
  console.log('Sales 3695:', sales);

  if (sales.length > 0) {
    const sale = sales[0];
    const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
    console.log('Sale items:', items);

    const [returns] = await db.query('SELECT * FROM sales_returns WHERE sale_id = ?', [sale.id]);
    console.log('Existing returns:', returns);
  }

  await db.end();
}

debugInvoice3695();
