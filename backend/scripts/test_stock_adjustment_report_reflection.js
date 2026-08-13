import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_abhishek001',
  port: Number(process.env.DB_PORT) || 3306
};

async function testStockAdjustmentReportReflection() {
  console.log('====================================================');
  console.log('   TESTING STOCK ADJUSTMENT REPORT REFLECTION      ');
  console.log('====================================================\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const { getDashboardKPIs, getAdvancedAnalyticsData } = await import('../controllers/reportController.js');
    const { adjustStock } = await import('../controllers/stockController.js');

    // 1. Get initial product
    const [[prod]] = await connection.query('SELECT id, name, purchase_price FROM products LIMIT 1');
    if (!prod) {
      console.log('No product found in DB!');
      return;
    }
    console.log(`Testing with product: ID ${prod.id} (${prod.name})`);

    // 2. Perform Stock Adjustment Increase: 10 units @ ₹25 = ₹250 Gain
    const adjReq = {
      db: {
        getConnection: async () => connection,
        query: (...args) => connection.query(...args)
      },
      body: {
        product_id: prod.id,
        warehouse_id: 1,
        type: 'Increase',
        quantity: 10,
        unit_cost: 25,
        reason: 'Physical Count Difference',
        remarks: 'Report Reflection Verification Test'
      },
      user: { id: 1 },
      ip: '127.0.0.1'
    };

    const adjRes = {
      statusCode: 200,
      status: function (c) { this.statusCode = c; return this; },
      json: function (d) { this.responseData = d; return this; }
    };

    await adjustStock(adjReq, adjRes, (err) => { if (err) console.error('Adj Error:', err); });

    console.log('\n[Stock Adjustment Result]:', adjRes.responseData);

    // 3. Fetch Dashboard KPIs Report
    const kpiReq = {
      db: { query: (...args) => connection.query(...args) },
      query: {}
    };

    const kpiRes = {
      statusCode: 200,
      status: function (c) { this.statusCode = c; return this; },
      json: function (d) { this.responseData = d; return this; }
    };

    await getDashboardKPIs(kpiReq, kpiRes, (err) => { if (err) console.error('KPI Error:', err); });

    console.log('\n--- Dashboard KPIs Report Output ---');
    console.log('Inventory Adjustment Gain:', kpiRes.responseData?.kpis?.inventoryAdjustmentGain);
    console.log('Inventory Valuation:', kpiRes.responseData?.kpis?.inventoryValuation);
    console.log('Net Adjustment:', kpiRes.responseData?.kpis?.netInventoryAdjustment);

    // 4. Fetch Advanced Analytics Report
    const advReq = {
      db: { query: (...args) => connection.query(...args) },
      query: { scope: 'overall' }
    };

    const advRes = {
      statusCode: 200,
      status: function (c) { this.statusCode = c; return this; },
      json: function (d) { this.responseData = d; return this; }
    };

    await getAdvancedAnalyticsData(advReq, advRes, (err) => { if (err) console.error('Adv Error:', err); });

    console.log('\n--- Advanced Analytics Report Output ---');
    console.log('Inventory Adjustment Gain:', advRes.responseData?.summary?.inventoryAdjustmentGain || advRes.responseData?.summary?.totalInventoryValue);

    if (kpiRes.responseData?.kpis?.inventoryAdjustmentGain === 250 && kpiRes.responseData?.kpis?.inventoryValuation === 250) {
      console.log('\n====================================================');
      console.log(' ✅ STOCK ADJUSTMENT REPORT REFLECTION TEST PASSED!');
      console.log('====================================================');
    } else {
      console.log('\nReport KPIs:', JSON.stringify(kpiRes.responseData, null, 2));
    }

  } catch (err) {
    console.error('Test Exception:', err);
  } finally {
    if (connection) await connection.end();
  }
}

testStockAdjustmentReportReflection();
