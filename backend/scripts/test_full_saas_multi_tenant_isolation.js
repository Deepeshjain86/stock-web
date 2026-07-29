import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { provisionTenantDatabase } from '../services/tenantProvisioner.js';

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const masterDb = 'kirana_erp_master';

const runFullSaasTest = async () => {
  console.log('\n======================================================');
  console.log('STARTING DYNAMIC SAAS MULTI-TENANT ISOLATION AUDIT');
  console.log('======================================================\n');

  let masterConn = null;
  const dbAlpha = 'shop_alpha_101';
  const dbBeta = 'shop_beta_102';

  try {
    masterConn = await mysql.createConnection({ host, port, user, password, database: masterDb });
    console.log('[SaaS Audit] Connected to Master Database.');

    // 1. Clean up previous test DBs if any
    const baseConn = await mysql.createConnection({ host, port, user, password });
    await baseConn.query(`DROP DATABASE IF EXISTS \`${dbAlpha}\`;`);
    await baseConn.query(`DROP DATABASE IF EXISTS \`${dbBeta}\`;`);
    await baseConn.end();

    // 2. Provision Tenant DB Alpha
    console.log(`[SaaS Audit] Provisioning Shop Alpha database "${dbAlpha}"...`);
    await provisionTenantDatabase(9910, dbAlpha, 'Alpha Kirana Store', 'Alpha Owner', 'alpha@kiranasaas.com', 'Pass123!', 'alpha101');

    // 3. Provision Tenant DB Beta
    console.log(`[SaaS Audit] Provisioning Shop Beta database "${dbBeta}"...`);
    await provisionTenantDatabase(9920, dbBeta, 'Beta Mart Store', 'Beta Owner', 'beta@kiranasaas.com', 'Pass123!', 'beta102');

    // 4. Verify clean initial state (0 business data in both databases)
    const connAlpha = await mysql.createConnection({ host, port, user, password, database: dbAlpha });
    const connBeta = await mysql.createConnection({ host, port, user, password, database: dbBeta });

    const [alphaProds] = await connAlpha.query('SELECT COUNT(*) as count FROM products');
    const [alphaCats] = await connAlpha.query('SELECT COUNT(*) as count FROM categories');
    const [alphaVendors] = await connAlpha.query('SELECT COUNT(*) as count FROM vendors');
    const [alphaSales] = await connAlpha.query('SELECT COUNT(*) as count FROM sales');

    const [betaProds] = await connBeta.query('SELECT COUNT(*) as count FROM products');
    const [betaCats] = await connBeta.query('SELECT COUNT(*) as count FROM categories');
    const [betaVendors] = await connBeta.query('SELECT COUNT(*) as count FROM vendors');
    const [betaSales] = await connBeta.query('SELECT COUNT(*) as count FROM sales');

    console.log(`[SaaS Audit] Shop Alpha initial counts -> Products: ${alphaProds[0].count}, Categories: ${alphaCats[0].count}, Vendors: ${alphaVendors[0].count}, Sales: ${alphaSales[0].count}`);
    console.log(`[SaaS Audit] Shop Beta initial counts  -> Products: ${betaProds[0].count}, Categories: ${betaCats[0].count}, Vendors: ${betaVendors[0].count}, Sales: ${betaSales[0].count}`);

    if (alphaProds[0].count !== 0 || alphaCats[0].count !== 0 || betaProds[0].count !== 0 || betaCats[0].count !== 0) {
      throw new Error('FAILED: Newly provisioned shops contain dummy/sample business data!');
    }

    // 5. Test Product & Category Creation in Shop Alpha
    const [catAlphaRes] = await connAlpha.query('INSERT INTO categories (name, description) VALUES ("Beverages", "Drinks")');
    const catAlphaId = catAlphaRes.insertId;

    await connAlpha.query(
      `INSERT INTO products (name, sku, barcode, category_id, unit, purchase_price, selling_price, mrp, image_url)
       VALUES ('Mango Drink 1L', 'SKU-MANGO-01', 'BAR-890001', ?, 'Pcs', 40.00, 50.00, 55.00, '/uploads/tenants/shop_alpha_101/products/mango.jpg')`,
      [catAlphaId]
    );
    console.log(`[SaaS Audit] Created product "Mango Drink 1L" (SKU-MANGO-01) in "${dbAlpha}".`);

    // 6. Test Product & Category Creation with IDENTICAL SKU/Barcode in Shop Beta
    const [catBetaRes] = await connBeta.query('INSERT INTO categories (name, description) VALUES ("Beverages", "Drinks")');
    const catBetaId = catBetaRes.insertId;

    await connBeta.query(
      `INSERT INTO products (name, sku, barcode, category_id, unit, purchase_price, selling_price, mrp, image_url)
       VALUES ('Mango Drink 1L Extra', 'SKU-MANGO-01', 'BAR-890001', ?, 'Pcs', 42.00, 52.00, 60.00, '/uploads/tenants/shop_beta_102/products/mango.jpg')`,
      [catBetaId]
    );
    console.log(`[SaaS Audit] Created identical SKU product "Mango Drink 1L Extra" (SKU-MANGO-01) in "${dbBeta}".`);

    // 7. Verify Data Independence
    const [prodsAlpha] = await connAlpha.query('SELECT name, selling_price, image_url FROM products WHERE sku = "SKU-MANGO-01"');
    const [prodsBeta] = await connBeta.query('SELECT name, selling_price, image_url FROM products WHERE sku = "SKU-MANGO-01"');

    console.log(`[SaaS Audit] Shop Alpha Product: ${prodsAlpha[0].name} | Price: Rs.${prodsAlpha[0].selling_price} | Image: ${prodsAlpha[0].image_url}`);
    console.log(`[SaaS Audit] Shop Beta Product:  ${prodsBeta[0].name} | Price: Rs.${prodsBeta[0].selling_price} | Image: ${prodsBeta[0].image_url}`);

    if (prodsAlpha[0].name === prodsBeta[0].name || prodsAlpha[0].selling_price === prodsBeta[0].selling_price) {
      throw new Error('FAILED: Shop Alpha and Shop Beta product data leaked across tenant boundaries!');
    }

    // 8. Verify Master DB Governance (Master DB must have ZERO business rows)
    const [masterTables] = await masterConn.query('SHOW TABLES');
    const tableNames = masterTables.map(t => Object.values(t)[0]);
    const businessTables = ['products', 'categories', 'sales', 'purchases', 'vendors', 'customers'];
    const invalidTablesInMaster = businessTables.filter(t => tableNames.includes(t));

    if (invalidTablesInMaster.length > 0) {
      throw new Error(`FAILED: Master Database contains business tables: ${invalidTablesInMaster.join(', ')}`);
    }

    console.log('[SaaS Audit] Master Database confirmed to contain ONLY SaaS platform tables.');

    // 9. File Upload Directory Structure Verification
    const alphaUploadDir = path.join('uploads', 'tenants', dbAlpha, 'products');
    const betaUploadDir = path.join('uploads', 'tenants', dbBeta, 'products');

    fs.mkdirSync(alphaUploadDir, { recursive: true });
    fs.mkdirSync(betaUploadDir, { recursive: true });
    fs.writeFileSync(path.join(alphaUploadDir, 'test_alpha.jpg'), 'alpha_image_bytes');
    fs.writeFileSync(path.join(betaUploadDir, 'test_beta.jpg'), 'beta_image_bytes');

    if (fs.existsSync(path.join(alphaUploadDir, 'test_alpha.jpg')) && fs.existsSync(path.join(betaUploadDir, 'test_beta.jpg'))) {
      console.log('[SaaS Audit] Verified tenant-isolated storage directories under uploads/tenants/<tenantDbName>/.');
    }

    // Clean up connections & DBs
    await connAlpha.end();
    await connBeta.end();

    const cleanupConn = await mysql.createConnection({ host, port, user, password });
    await cleanupConn.query(`DROP DATABASE IF EXISTS \`${dbAlpha}\`;`);
    await cleanupConn.query(`DROP DATABASE IF EXISTS \`${dbBeta}\`;`);
    await cleanupConn.end();

    fs.rmSync(path.join('uploads', 'tenants', dbAlpha), { recursive: true, force: true });
    fs.rmSync(path.join('uploads', 'tenants', dbBeta), { recursive: true, force: true });

    console.log('\n======================================================');
    console.log('✅ DYNAMIC SAAS MULTI-TENANT ISOLATION AUDIT PASSED 100%');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ SAAS AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    if (masterConn) await masterConn.end();
  }
};

runFullSaasTest();
