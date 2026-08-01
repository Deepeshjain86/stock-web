import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function syncBorrowOutstandingBalances() {
  console.log('🚀 Synchronizing customers.outstanding_balance with borrow_transactions across tenant databases...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'shop_%'");
    const dbNames = dbs.map(d => Object.values(d)[0]);

    const [kiranaDbs] = await connection.query("SHOW DATABASES LIKE 'kirana_erp'");
    if (kiranaDbs.length > 0) dbNames.push('kirana_erp');

    for (const dbName of dbNames) {
      console.log(`Processing database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });

      try {
        await tenantConn.query(`
          UPDATE customers c
          SET c.outstanding_balance = COALESCE(
            (SELECT SUM(bt.remaining_amount) FROM borrow_transactions bt WHERE bt.customer_id = c.id AND bt.payment_status != 'Paid'),
            0
          )
        `);

        const [custBalances] = await tenantConn.query(`
          SELECT id, name, phone, customer_type, outstanding_balance 
          FROM customers 
          WHERE outstanding_balance > 0 OR customer_type = 'Borrow'
        `);

        console.log(`  📊 "${dbName}" Borrow Customers Sync Summary:`);
        console.table(custBalances);

      } catch (err) {
        console.error(`  ❌ Error processing "${dbName}":`, err.message);
      } finally {
        await tenantConn.end();
      }
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

syncBorrowOutstandingBalances();
