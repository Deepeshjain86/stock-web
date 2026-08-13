import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'kirana_erp_master',
  port: Number(process.env.DB_PORT) || 3306
};

async function inspectTenants() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to master DB...');

    const [tenants] = await connection.query('SELECT * FROM tenants');
    console.log('Tenants List:', JSON.stringify(tenants, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

inspectTenants();
