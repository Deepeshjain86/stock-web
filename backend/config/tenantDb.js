import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Registry of active tenant connection pools
const tenantPools = new Map();
const tenantMigrationPromises = new Map();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDbName = 'kirana_erp_master';

const completedMigrations = new Set();

// 1. Establish static pool connection to Master database
export const masterPool = mysql.createPool({
  host,
  port,
  user,
  password,
  database: masterDbName,
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

import { runCategorySchemaMigrations } from './schemaMigration.js';
import { runCategoryDataMigration } from './dataMigration.js';

/**
 * Retrieves or instantiates the connection pool for a specific tenant database.
 */
export const getTenantPool = (dbName) => {
  if (!dbName) {
    throw new Error('Tenant database name is missing.');
  }

  // If pool is already cached, return it directly
  if (tenantPools.has(dbName)) {
    return tenantPools.get(dbName);
  }

  console.log(`[Registry] Instantiating connection pool for database: "${dbName}"`);
  
  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 25,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  tenantPools.set(dbName, pool);

  // Asynchronously trigger schema & data migration once per process lifetime
  if (!completedMigrations.has(dbName)) {
    completedMigrations.add(dbName);
    const migrationPromise = runCategorySchemaMigrations(pool)
      .then(() => runCategoryDataMigration(pool))
      .catch(err => {
        console.error(`[Data Migration] Failed to auto-migrate category data for ${dbName}:`, err);
      });
    tenantMigrationPromises.set(dbName, migrationPromise);
  }

  return pool;
};

export const ensureTenantMigrations = async (dbName) => {
  const migrationPromise = tenantMigrationPromises.get(dbName);
  if (migrationPromise) {
    await migrationPromise;
  }
};

/**
 * Pre-loads connection pools for all registered tenants.
 */
export const initializeTenantPools = async () => {
  try {
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants');
    console.log(`[Registry] Pre-loading connection pools for ${tenants.length} tenant(s)...`);
    for (const tenant of tenants) {
      if (tenant.database_name) {
        getTenantPool(tenant.database_name);
      }
    }
    console.log('[Registry] All tenant pools successfully loaded.');
  } catch (error) {
    console.error('[Registry] Failed to pre-load tenant connection pools:', error);
  }
};

/**
 * Closes all connection pools gracefully (for shutdown events)
 */
export const closeAllPools = async () => {
  console.log('[Registry] Closing all dynamic tenant pools...');
  for (const [dbName, pool] of tenantPools.entries()) {
    await pool.end();
    console.log(`[Registry] Closed pool for: "${dbName}"`);
  }
  tenantPools.clear();
  await masterPool.end();
  console.log('[Registry] Closed master pool connection.');
};
