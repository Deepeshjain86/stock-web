import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function inspectInvoice() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  const [tenants] = await connection.query('SELECT database_name FROM tenants');
  console.log('Found tenants:', tenants.map(t => t.database_name));

  for (const t of tenants) {
    const dbName = t.database_name;
    try {
      const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName
      });

      const [sales] = await db.query('SELECT * FROM sales WHERE invoice_no LIKE "%5888%" OR invoice_no LIKE "%3403%"');
      if (sales.length > 0) {
        console.log(`\n--- DB: ${dbName} ---`);
        for (const s of sales) {
          console.log(`Sale ID: ${s.id}, Invoice No: ${s.invoice_no}, Date: ${s.date}, Total: ${s.total}`);
          const [items] = await db.query('SELECT * FROM sale_items WHERE sale_id = ?', [s.id]);
          console.log(' Sale Items:', items);
          const [returns] = await db.query('SELECT * FROM sales_returns WHERE sale_id = ? OR invoice_no = ?', [s.id, s.invoice_no]);
          console.log(' Sales Returns Records:', returns);
        }
      }
      await db.end();
    } catch (e) {
      // ignore
    }
  }

  await connection.end();
}

inspectInvoice();
