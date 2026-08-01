import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import mysql from 'mysql2/promise';

async function fixBatchPrices() {
  console.log('🚀 Starting purchase_batches price cleanup across all tenant databases...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password });

  try {
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'shop_%'");
    const dbNames = dbs.map(d => Object.values(d)[0]);
    
    // Also include kirana_erp if exists
    const [kiranaDbs] = await connection.query("SHOW DATABASES LIKE 'kirana_erp'");
    if (kiranaDbs.length > 0) dbNames.push('kirana_erp');

    console.log(`Found ${dbNames.length} tenant database(s) to process:`, dbNames);

    for (const dbName of dbNames) {
      console.log(`Processing database: "${dbName}"...`);
      const tenantConn = await mysql.createConnection({ host, port, user, password, database: dbName });
      
      try {
        const [tables] = await tenantConn.query("SHOW TABLES LIKE 'purchase_batches'");
        if (tables.length > 0) {
          const [rows] = await tenantConn.query(
            `UPDATE purchase_batches pb
             JOIN products p ON pb.product_id = p.id
             SET pb.selling_price = p.selling_price
             WHERE pb.selling_price = pb.purchase_price
               AND p.selling_price > 0
               AND p.selling_price <> p.purchase_price`
          );
          console.log(`  ✅ Cleaned up purchase_batches in "${dbName}": ${rows.affectedRows} row(s) updated.`);
        } else {
          console.log(`  ℹ️ Table 'purchase_batches' does not exist in "${dbName}".`);
        }
      } catch (err) {
        console.error(`  ❌ Error updating purchase_batches in "${dbName}":`, err.message);
      } finally {
        await tenantConn.end();
      }
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

fixBatchPrices();
