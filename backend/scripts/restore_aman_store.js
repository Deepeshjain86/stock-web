import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';

dotenv.config();

async function restoreAmanStore() {
  const masterDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'kirana_erp_master'
  });

  // Check if shop_aman001 exists in tenants
  const [existing] = await masterDb.query('SELECT * FROM tenants WHERE database_name = "shop_aman001" OR email = "aman@kiranaerp.com"');

  if (existing.length === 0) {
    console.log('Restoring official Aman Kirana Mart store (shop_aman001)...');
    
    // Provision tenant DB
    await provisionTenantDatabase(
      'TENT-AMAN001',
      'shop_aman001',
      'Aman Kirana Mart',
      'Aman Gupta',
      'aman@kiranaerp.com',
      'AdminPassword123!',
      'AMAN001'
    );

    // Insert into master tenants
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('AdminPassword123!', salt);

    const [tRes] = await masterDb.query(
      `INSERT INTO tenants (tenant_uuid, store_name, owner_name, email, phone, address, database_name, subscription_status, subscription_plan, subscription_expires_at, trial_started_at, trial_used)
       VALUES ('TENT-AMAN001', 'Aman Kirana Mart', 'Aman Gupta', 'aman@kiranaerp.com', '9876543210', '12 MG Road, Indore, Madhya Pradesh', 'shop_aman001', 'Active', 'Yearly', '2027-07-15 00:00:00', NOW(), 1)`,
    );

    const tenantId = tRes.insertId;

    await masterDb.query(
      `INSERT INTO users (tenant_id, name, email, password, role, is_active, admin_id)
       VALUES (?, 'Aman Gupta', 'aman@kiranaerp.com', ?, 'Admin', TRUE, 'AMAN001')`,
      [tenantId, hashedPassword]
    );

    console.log('✅ Official Aman Kirana Mart store restored successfully!');
  } else {
    console.log('Aman Kirana Mart store is already present.');
  }

  const [finalStores] = await masterDb.query('SELECT id, store_name, owner_name, email, database_name, subscription_plan FROM tenants ORDER BY id ASC');
  console.log('\n======================================================');
  console.log('EXACT 3 OFFICIAL STORES IN MASTER DB:');
  console.log(finalStores);
  console.log('======================================================\n');

  await masterDb.end();
}

restoreAmanStore();
