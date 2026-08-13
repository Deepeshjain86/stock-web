import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getExecutiveDashboardKPIs } from '../services/calculationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_abhishek001',
  port: Number(process.env.DB_PORT) || 3306
};

async function checkKpis() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const kpis = await getExecutiveDashboardKPIs(connection);
    console.log('\n--- Abhi Mart Current KPIs ---');
    console.log(JSON.stringify(kpis, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.end();
  }
}

checkKpis();
