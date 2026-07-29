import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runMigration = async () => {
  console.log(`[Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    console.log(`[Migration] Selecting Master Database "${masterDb}"...`);
    await conn.query(`USE \`${masterDb}\`;`);

    console.log('[Migration] Creating subscriptions table in Master DB...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        plan VARCHAR(30) NOT NULL DEFAULT 'Trial',
        status VARCHAR(20) NOT NULL DEFAULT 'Trial',
        trial_start_date DATE NULL,
        trial_end_date DATE NULL,
        subscription_start_date DATE NULL,
        subscription_expiry_date DATE NULL,
        payment_status VARCHAR(20) DEFAULT 'Pending',
        payment_gateway VARCHAR(50) DEFAULT 'Razorpay',
        payment_id VARCHAR(100) NULL,
        order_id VARCHAR(100) NULL,
        signature VARCHAR(255) NULL,
        invoice_number VARCHAR(100) NULL,
        amount DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);
    console.log('  -> subscriptions table created or verified.');

    // Fetch existing tenants to backfill subscriptions
    const [tenants] = await conn.query('SELECT * FROM tenants');
    console.log(`[Migration] Found ${tenants.length} tenants. Backfilling subscriptions...`);

    for (const tenant of tenants) {
      // Check if subscription record already exists
      const [existing] = await conn.query('SELECT id FROM subscriptions WHERE tenant_id = ?', [tenant.id]);
      if (existing.length === 0) {
        console.log(`  -> Backfilling subscription for tenant ID: ${tenant.id} (${tenant.store_name})`);
        
        let plan = tenant.subscription_plan || 'Trial';
        let status = tenant.subscription_status || 'Active';
        
        let trialStart = tenant.trial_started_at || tenant.created_at || new Date();
        let trialEnd = tenant.trial_ended_at || tenant.subscription_expires_at;
        let subStart = null;
        let subExpiry = null;

        if (plan !== 'Trial') {
          subStart = tenant.created_at || new Date();
          subExpiry = tenant.subscription_expires_at;
        }

        await conn.query(`
          INSERT INTO subscriptions 
            (tenant_id, plan, status, trial_start_date, trial_end_date, subscription_start_date, subscription_expiry_date, payment_status, payment_gateway, amount)
          VALUES 
            (?, ?, ?, ?, ?, ?, ?, 'Paid', 'System', 0.00)
        `, [tenant.id, plan, status, trialStart, trialEnd, subStart, subExpiry]);
      }
    }

    console.log('[Migration] Database Migration complete!');
  } catch (error) {
    console.error('[Migration] Failed to run database migration:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runMigration();
