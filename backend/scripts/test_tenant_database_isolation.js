import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const testIsolation = async () => {
  console.log('\n==========================================');
  console.log('STARTING SEPARATE DB PER TENANT ISOLATION TEST');
  console.log('==========================================\n');

  let masterConn = null;
  const db1Name = 'shop_test_1001';
  const db2Name = 'shop_test_1002';

  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    console.log('[Test] Connected to Master Database.');

    // 1. Clean up old test DBs if they exist
    const baseConn = await mysql.createConnection({ host, port, user, password });
    await baseConn.query(`DROP DATABASE IF EXISTS \`${db1Name}\`;`);
    await baseConn.query(`DROP DATABASE IF EXISTS \`${db2Name}\`;`);
    await baseConn.end();

    // 2. Provision Tenant DB 1
    console.log(`[Test] Provisioning dedicated database "${db1Name}"...`);
    await provisionTenantDatabase(9901, db1Name, 'Test Shop 1001', 'Owner One', 'owner1@test1001.com', 'Pass123!', 'test1001');

    // 3. Provision Tenant DB 2
    console.log(`[Test] Provisioning dedicated database "${db2Name}"...`);
    await provisionTenantDatabase(9902, db2Name, 'Test Shop 1002', 'Owner Two', 'owner2@test1002.com', 'Pass123!', 'test1002');

    // 4. Verify DB 1 schema and zero business data
    const conn1 = await mysql.createConnection({ host, port, user, password, database: db1Name });
    const [tables1] = await conn1.query('SHOW TABLES');
    console.log(`[Test] "${db1Name}" initialized with ${tables1.length} tables.`);

    const [prodCount1] = await conn1.query('SELECT COUNT(*) as count FROM products');
    const [catCount1] = await conn1.query('SELECT COUNT(*) as count FROM categories');
    console.log(`[Test] "${db1Name}" initial business items: Products=${prodCount1[0].count}, Categories=${catCount1[0].count}`);

    if (prodCount1[0].count !== 0 || catCount1[0].count !== 0) {
      throw new Error('Test Failed: New tenant database contains dummy business data!');
    }

    // 5. Insert category and product in DB 1
    const [catRes1] = await conn1.query('INSERT INTO categories (name, description) VALUES ("General", "Default Category")');
    const catId1 = catRes1.insertId;

    await conn1.query(
      `INSERT INTO products (name, sku, barcode, category_id, unit, purchase_price, selling_price, mrp)
       VALUES ('Rice 5kg', 'SKU-RICE-001', 'BAR-89012345', ?, 'Pcs', 250.00, 300.00, 320.00)`,
      [catId1]
    );
    console.log(`[Test] Successfully created product "Rice 5kg" (SKU: SKU-RICE-001) in "${db1Name}".`);

    // 6. Insert SAME SKU & Barcode product in DB 2
    const conn2 = await mysql.createConnection({ host, port, user, password, database: db2Name });
    const [catRes2] = await conn2.query('INSERT INTO categories (name, description) VALUES ("General", "Default Category")');
    const catId2 = catRes2.insertId;

    await conn2.query(
      `INSERT INTO products (name, sku, barcode, category_id, unit, purchase_price, selling_price, mrp)
       VALUES ('Rice 5kg Premium', 'SKU-RICE-001', 'BAR-89012345', ?, 'Pcs', 280.00, 340.00, 350.00)`,
      [catId2]
    );
    console.log(`[Test] Successfully created identical SKU & Barcode product "Rice 5kg Premium" (SKU: SKU-RICE-001) in "${db2Name}".`);

    // 7. Verify independence of product records
    const [prods1] = await conn1.query('SELECT * FROM products WHERE sku = "SKU-RICE-001"');
    const [prods2] = await conn2.query('SELECT * FROM products WHERE sku = "SKU-RICE-001"');

    console.log(`[Test] "${db1Name}" product price: Rs.${prods1[0].selling_price}`);
    console.log(`[Test] "${db2Name}" product price: Rs.${prods2[0].selling_price}`);

    if (prods1.length === 1 && prods2.length === 1 && prods1[0].selling_price !== prods2[0].selling_price) {
      console.log('\n✅ TENANT DATABASE ISOLATION VERIFIED SUCCESSFULLY!');
    } else {
      throw new Error('Test Failed: Product data cross-contamination or conflict detected!');
    }

    await conn1.end();
    await conn2.end();

    // Clean up test DBs
    const cleanupConn = await mysql.createConnection({ host, port, user, password });
    await cleanupConn.query(`DROP DATABASE IF EXISTS \`${db1Name}\`;`);
    await cleanupConn.query(`DROP DATABASE IF EXISTS \`${db2Name}\`;`);
    await cleanupConn.end();
    console.log('[Test] Cleaned up temporary test databases.');

  } catch (err) {
    console.error('\n❌ SEPARATE DB PER TENANT TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

testIsolation();
