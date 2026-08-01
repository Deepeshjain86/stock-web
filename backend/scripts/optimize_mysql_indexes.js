import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function optimizeIndexes() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const masterDb = 'kirana_erp_master';

  console.log('Connecting to Master DB for index optimization...');
  const masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });

  const addIndex = async (conn, dbName, table, indexName, columnsSql) => {
    try {
      const [existing] = await conn.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [dbName, table, indexName]
      );
      if (existing.length === 0) {
        console.log(`  -> Adding index "${indexName}" on table "${table}" (${columnsSql})...`);
        await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columnsSql})`);
      }
    } catch (err) {
      console.warn(`  [Index Warn] Failed to add index ${indexName} on ${table}:`, err.message);
    }
  };

  try {
    // 1. Master DB Indexes
    await addIndex(masterConn, masterDb, 'users', 'idx_users_email', 'email');
    await addIndex(masterConn, masterDb, 'users', 'idx_users_login_id', 'login_id');
    await addIndex(masterConn, masterDb, 'users', 'idx_users_tenant_role', 'tenant_id, role');
    await addIndex(masterConn, masterDb, 'tenants', 'idx_tenants_email', 'email');
    await addIndex(masterConn, masterDb, 'notifications', 'idx_master_notif_created', 'created_at');
    await addIndex(masterConn, masterDb, 'activity_logs', 'idx_master_logs_created', 'created_at');

    // 2. Tenant DB Indexes
    const [tenants] = await masterConn.query('SELECT id, store_name, database_name FROM tenants');

    for (const tenant of tenants) {
      if (!tenant.database_name) continue;
      console.log(`Optimizing indexes for tenant database: "${tenant.database_name}"...`);

      try {
        const tenantConn = await mysql.createConnection({
          host,
          port,
          user,
          password,
          database: tenant.database_name
        });

        await addIndex(tenantConn, tenant.database_name, 'users', 'idx_users_email', 'email');
        await addIndex(tenantConn, tenant.database_name, 'users', 'idx_users_login_id', 'login_id');
        await addIndex(tenantConn, tenant.database_name, 'products', 'idx_products_barcode', 'barcode');
        await addIndex(tenantConn, tenant.database_name, 'products', 'idx_products_sku', 'sku');
        await addIndex(tenantConn, tenant.database_name, 'products', 'idx_products_category', 'category_id');
        await addIndex(tenantConn, tenant.database_name, 'sales', 'idx_sales_date', 'date');
        await addIndex(tenantConn, tenant.database_name, 'sales', 'idx_sales_customer', 'customer_id');
        await addIndex(tenantConn, tenant.database_name, 'purchases', 'idx_purchases_date', 'date');
        await addIndex(tenantConn, tenant.database_name, 'purchases', 'idx_purchases_vendor', 'vendor_id');
        await addIndex(tenantConn, tenant.database_name, 'notifications', 'idx_tenant_notif_created', 'created_at');

        await tenantConn.end();
        console.log(`  ✓ Indexes optimized for "${tenant.database_name}".`);
      } catch (err) {
        console.error(`  ✕ Error optimizing tenant DB "${tenant.database_name}":`, err.message);
      }
    }

    console.log('\n======================================================');
    console.log('SUCCESS: All Database Indexes Optimized for Maximum Query Performance!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during index optimization:', err);
  } finally {
    await masterConn.end();
  }
}

optimizeIndexes();
