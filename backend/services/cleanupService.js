import { masterPool, getTenantPool } from '../config/tenantDb.js';

/**
 * Clean up expired Walk-in Customers across all tenant databases.
 * Runs Walk-in Customer deletion after updating their sales history to point to the generic Walk-in customer (ID 1).
 */
export const cleanExpiredWalkinCustomers = async () => {
  console.log('[Cleanup] Starting expired Walk-in Customers cleanup...');
  try {
    const [tenants] = await masterPool.query('SELECT database_name FROM tenants WHERE database_name IS NOT NULL');
    
    for (const tenant of tenants) {
      const dbName = tenant.database_name;
      console.log(`[Cleanup] Processing database: "${dbName}"`);
      const pool = getTenantPool(dbName);
      const conn = await pool.getConnection();
      
      try {
        await conn.beginTransaction();

        // 1. Find all expired Walk-in customers (excluding default customer ID 1)
        const [expiredCustomers] = await conn.query(
          `SELECT id FROM customers 
           WHERE customer_type = 'Walk-in' 
             AND expires_at IS NOT NULL 
             AND expires_at < NOW() 
             AND id != 1`
        );

        if (expiredCustomers.length > 0) {
          const ids = expiredCustomers.map(c => c.id);
          console.log(`[Cleanup] Found ${ids.length} expired Walk-in Customer(s) in "${dbName}":`, ids);

          // 2. Re-route historical sales invoices to default Walk-in Customer (ID 1)
          await conn.query(
            `UPDATE sales SET customer_id = 1 WHERE customer_id IN (?)`,
            [ids]
          );
          console.log(`  -> Historical sales invoices successfully redirected to default Walk-in Customer (ID 1).`);

          // 3. Delete the temporary customer records
          await conn.query(
            `DELETE FROM customers WHERE id IN (?)`,
            [ids]
          );
          console.log(`  -> Expired Walk-in Customer records successfully deleted.`);
        } else {
          console.log(`[Cleanup] No expired Walk-in Customers found in "${dbName}".`);
        }

        await conn.commit();
      } catch (err) {
        await conn.rollback();
        console.error(`[Cleanup] Failed to clean up database "${dbName}":`, err.message);
      } finally {
        conn.release();
      }
    }
    console.log('[Cleanup] Finished Walk-in Customers cleanup job.');
  } catch (error) {
    console.error('[Cleanup] Error in cleanup service:', error.message);
  }
};

/**
 * Initialize the hourly background job
 */
export const startCleanupScheduler = () => {
  // Run once immediately on startup
  setTimeout(cleanExpiredWalkinCustomers, 5000);

  // Run every 1 hour (3600000 milliseconds)
  setInterval(cleanExpiredWalkinCustomers, 3600000);
  console.log('[Cleanup] Walk-in Customers cleanup scheduler initialized (runs hourly).');
};
