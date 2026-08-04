import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  
  const baseConnection = await mysql.createConnection({ host, port, user, password });
  
  console.log(`Ensuring Master database "${masterDb}" exists...`);
  await baseConnection.query(`CREATE DATABASE IF NOT EXISTS \`${masterDb}\`;`);
  await baseConnection.end();

  // Connect directly to master DB
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: masterDb,
    multipleStatements: true
  });
  console.log(`Connected to master database. Loading master schema...`);

  // Load and execute master_schema.sql
  const schemaPath = path.join(__dirname, 'master_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await connection.query(schemaSql);
  console.log('Master database tables created successfully.');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const superAdminPassword = await bcrypt.hash('superadminpassword', salt);
  const adminPassword = await bcrypt.hash('adminpassword', salt);
  const employeePassword = await bcrypt.hash('staffpassword', salt);

  // 1. Seed Super Admin user in Master Users table
  console.log('Checking global platform Super Admin...');
  const [existingSuper] = await connection.query('SELECT id FROM users WHERE email = "superadmin@kiranamart.com"');
  if (existingSuper.length === 0) {
    console.log('Registering global platform Super Admin...');
    await connection.query(
      'INSERT INTO users (tenant_id, email, password, role, status, login_id) VALUES (NULL, "superadmin@kiranamart.com", ?, "Super Admin", "Active", "superadmin")',
      [superAdminPassword]
    );
  } else {
    await connection.query('UPDATE users SET password = ? WHERE email = "superadmin@kiranamart.com"', [superAdminPassword]);
    console.log('Global platform Super Admin already exists. Password updated to superadminpassword.');
  }

  console.log('\n================================================');
  console.log('MASTER DATABASE SEEDING & PROVISIONING COMPLETED');
  console.log('================================================\n');

  await connection.end();
}

runSeed().catch(err => {
  console.error('Failed to run master seeder:', err);
  process.exit(1);
});
