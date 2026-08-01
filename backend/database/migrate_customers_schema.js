import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function migrateCustomersSchema() {
  console.log('🚀 Migrating customers table schema across tenant databases...');
  
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
        const [cols] = await tenantConn.query('DESCRIBE customers');
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('notes')) {
          await tenantConn.query('ALTER TABLE customers ADD COLUMN notes TEXT NULL AFTER address');
          console.log(`  ✅ Added column notes to customers in "${dbName}"`);
        }

        if (!colNames.includes('opening_balance')) {
          await tenantConn.query('ALTER TABLE customers ADD COLUMN opening_balance DECIMAL(12,2) DEFAULT 0.00 AFTER notes');
          console.log(`  ✅ Added column opening_balance to customers in "${dbName}"`);
        }

        if (!colNames.includes('credit_limit')) {
          await tenantConn.query('ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(12,2) DEFAULT 0.00 AFTER opening_balance');
          console.log(`  ✅ Added column credit_limit to customers in "${dbName}"`);
        }

        if (!colNames.includes('outstanding_balance')) {
          await tenantConn.query('ALTER TABLE customers ADD COLUMN outstanding_balance DECIMAL(12,2) DEFAULT 0.00 AFTER credit_limit');
          console.log(`  ✅ Added column outstanding_balance to customers in "${dbName}"`);
        }

        if (!colNames.includes('customer_code')) {
          await tenantConn.query('ALTER TABLE customers ADD COLUMN customer_code VARCHAR(50) NULL AFTER id');
          console.log(`  ✅ Added column customer_code to customers in "${dbName}"`);
        }

        console.log(`  ✅ Customers schema migration complete for "${dbName}".`);

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

migrateCustomersSchema();
