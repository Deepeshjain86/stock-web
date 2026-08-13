import { getTenantPool, masterPool } from '../config/tenantDb.js';

async function fetchVishalReport() {
  try {
    const [tenants] = await masterPool.query(
      "SELECT id, store_name, database_name, owner_name, email FROM tenants WHERE database_name LIKE '%vishal%' OR store_name LIKE '%vishal%'"
    );
    console.log('--- Tenant Info ---');
    console.log(tenants);

    const dbName = tenants[0]?.database_name || 'shop_vishal001';
    const storeName = tenants[0]?.store_name || 'Vishal Mega Mart';
    const pool = getTenantPool(dbName);

    // Fetch Stock Destroys
    const [destroys] = await pool.query(`
      SELECT d.id, d.destroy_no, d.product_id, d.product_name, d.barcode, d.sku, d.batch_no,
             d.warehouse_name, d.source_location, d.scrap_location, d.available_stock,
             d.destroy_quantity, d.unit, d.unit_cost, d.purchase_price, d.selling_price,
             d.destroy_value, d.reason, d.remarks, d.destroyed_by_name, d.status, d.cancel_reason, d.created_at
      FROM stock_destroys d
      ORDER BY d.id DESC
    `);

    // Fetch Stock Adjustments
    const [adjustments] = await pool.query(`
      SELECT a.id, a.adjustment_no, a.product_id, p.name as product_name, p.barcode,
             a.adjustment_type, a.quantity, a.unit_cost, a.adjustment_value, a.reason,
             a.financial_impact, a.remarks, a.previous_quantity, a.new_quantity,
             a.previous_inventory_value, a.new_inventory_value, a.accounting_treatment,
             u.name as user_name, a.status, a.created_at
      FROM stock_adjustments a
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC
    `);

    console.log('\n=== VISHAL MEGA MART STORE REPORT ===');
    console.log('Store Name:', storeName);
    console.log('Database:', dbName);

    console.log('\n--- STOCK DESTROYS (SCRAP) ---');
    console.log(JSON.stringify(destroys, null, 2));

    console.log('\n--- STOCK ADJUSTMENTS ---');
    console.log(JSON.stringify(adjustments, null, 2));

  } catch (error) {
    console.error('Error fetching report:', error);
  } finally {
    process.exit(0);
  }
}

fetchVishalReport();
