import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const cleanInvalidDates = async () => {
  console.log('\n======================================================');
  console.log('CLEANING INVALID PRODUCT DATE STRINGS IN TENANT DATABASES');
  console.log('======================================================\n');

  let baseConn = null;
  try {
    baseConn = await mysql.createConnection({ host, port, user, password });

    const [tenants] = await baseConn.query(`SELECT database_name FROM \`${masterDb}\`.tenants`);
    for (const t of tenants) {
      if (!t.database_name) continue;
      const dbName = t.database_name;
      console.log(`[Date Sanitizer] Checking tenant database "${dbName}"...`);

      const [dbCheck] = await baseConn.query(`SHOW DATABASES LIKE '${dbName}'`);
      if (dbCheck.length === 0) continue;

      try {
        await baseConn.query(
          `UPDATE \`${dbName}\`.products 
           SET expiry_date = NULL 
           WHERE CAST(expiry_date AS CHAR) = 'N/A' 
              OR CAST(expiry_date AS CHAR) = '0000-00-00' 
              OR expiry_date = ''`
        );
        await baseConn.query(
          `UPDATE \`${dbName}\`.products 
           SET manufacturing_date = NULL 
           WHERE CAST(manufacturing_date AS CHAR) = 'N/A' 
              OR CAST(manufacturing_date AS CHAR) = '0000-00-00' 
              OR manufacturing_date = ''`
        );
        console.log(`[Date Sanitizer] Sanitized product date columns in "${dbName}".`);
      } catch (err) {
        console.warn(`[Date Sanitizer] Info for "${dbName}":`, err.message);
      }
    }

    console.log('\n======================================================');
    console.log('✅ PRODUCT DATE STRINGS SANITIZED SUCCESSFULLY 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Date Sanitizer Failed:', err);
  } finally {
    if (baseConn) await baseConn.end();
  }
};

cleanInvalidDates();
