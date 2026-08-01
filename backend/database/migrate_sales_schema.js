import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function migrateSalesSchema() {
  console.log('🚀 Migrating sales table schema across tenant databases...');
  
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
        const [cols] = await tenantConn.query('DESCRIBE sales');
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('balance_amount')) {
          await tenantConn.query('ALTER TABLE sales ADD COLUMN balance_amount DECIMAL(12,2) DEFAULT 0.00 AFTER due_amount');
          console.log(`  ✅ Added column balance_amount to sales in "${dbName}"`);
        }

        if (!colNames.includes('payment_date')) {
          await tenantConn.query('ALTER TABLE sales ADD COLUMN payment_date DATETIME NULL AFTER balance_amount');
          console.log(`  ✅ Added column payment_date to sales in "${dbName}"`);
        }

        if (!colNames.includes('amount_paid')) {
          await tenantConn.query('ALTER TABLE sales ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT 0.00 AFTER payment_method');
          console.log(`  ✅ Added column amount_paid to sales in "${dbName}"`);
        }

        if (!colNames.includes('due_amount')) {
          await tenantConn.query('ALTER TABLE sales ADD COLUMN due_amount DECIMAL(12,2) DEFAULT 0.00 AFTER amount_paid');
          console.log(`  ✅ Added column due_amount to sales in "${dbName}"`);
        }

        // Update balance_amount where needed
        await tenantConn.query('UPDATE sales SET balance_amount = due_amount WHERE balance_amount = 0 AND due_amount > 0');

        console.log(`  ✅ Sales schema migration complete for "${dbName}".`);

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

migrateSalesSchema();
