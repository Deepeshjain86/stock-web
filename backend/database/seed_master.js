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
    console.log('Global platform Super Admin already exists.');
  }

  // 2. Seed Default Tenant metadata
  console.log('Checking default tenant store (Delhi Kirana Mart) metadata...');
  let tenantId;
  const [existingTenant] = await connection.query('SELECT id FROM tenants WHERE tenant_uuid = "TENT-KIRANAMART-001"');
  if (existingTenant.length === 0) {
    console.log('Registering default tenant store (Delhi Kirana Mart) metadata...');
    const [tenantResult] = await connection.query(`
      INSERT INTO tenants (tenant_uuid, store_name, owner_name, email, phone, address, gstin, database_name, subscription_status, subscription_plan, subscription_expires_at, trial_used)
      VALUES ('TENT-KIRANAMART-001', 'Kirana Mart Delhi', 'Deepesh Jain', 'admin@kiranamart.com', '9876543210', '102, Malviya Nagar, New Delhi', '07AAAAA1111A1Z1', 'kirana_erp_tenant_1', 'Active', 'Yearly', DATE_ADD(NOW(), INTERVAL 12 MONTH), TRUE)
    `);
    tenantId = tenantResult.insertId;
  } else {
    tenantId = existingTenant[0].id;
    console.log(`Default tenant store already exists (ID: ${tenantId}).`);
  }

  // 3. Seed Store Admin in Master Users
  console.log('Checking store Admin in Master credentials registry...');
  const [existingAdmin] = await connection.query('SELECT id FROM users WHERE email = "admin@kiranamart.com"');
  if (existingAdmin.length === 0) {
    console.log('Registering store Admin into Master credentials registry...');
    await connection.query(
      'INSERT INTO users (tenant_id, email, password, role, status, login_id) VALUES (?, "admin@kiranamart.com", ?, "Admin", "Active", "DEEPESH01")',
      [tenantId, adminPassword]
    );
  } else {
    console.log('Store Admin already registered in Master registry.');
  }

  // 4. Seed Employee in Master Users
  console.log('Checking store Employee in Master credentials registry...');
  const [existingStaff] = await connection.query('SELECT id FROM users WHERE email = "staff@kiranamart.com"');
  if (existingStaff.length === 0) {
    console.log('Registering store Employee into Master credentials registry...');
    await connection.query(
      'INSERT INTO users (tenant_id, email, password, role, status, login_id) VALUES (?, "staff@kiranamart.com", ?, "Employee", "Active", "DEEPESH01-EM0001")',
      [tenantId, employeePassword]
    );
  } else {
    console.log('Store Employee already registered in Master registry.');
  }

  // 5. Automatically Provision and Seed the dynamic database for this default tenant
  console.log(`Provisioning separate isolated database: "kirana_erp_tenant_1"...`);
  const roleIds = await provisionTenantDatabase(
    tenantId, 
    'kirana_erp_tenant_1', 
    'Kirana Mart Delhi', 
    'Deepesh Jain', 
    'admin@kiranamart.com', 
    'adminpassword',
    'DEEPESH01'
  );

  // Also seed employee locally inside the new tenant database
  const tenantDbConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: 'kirana_erp_tenant_1'
  });
  const [localEmployee] = await tenantDbConn.query('SELECT id FROM users WHERE email = "staff@kiranamart.com"');
  if (localEmployee.length === 0) {
    console.log('Seeding employee locally inside tenant database...');
    await tenantDbConn.query(
      'INSERT INTO users (name, email, password, role_id, status, login_id) VALUES ("Staff Clerk", "staff@kiranamart.com", ?, ?, "Active", "DEEPESH01-EM0001")',
      [employeePassword, roleIds.employeeRoleId]
    );
  } else {
    console.log('Local employee already seeded inside tenant database.');
  }
  await tenantDbConn.end();

  console.log('\n================================================');
  console.log('MASTER DATABASE SEEDING & PROVISIONING COMPLETED');
  console.log('================================================\n');

  await connection.end();
}

runSeed().catch(err => {
  console.error('Failed to run master seeder:', err);
  process.exit(1);
});
