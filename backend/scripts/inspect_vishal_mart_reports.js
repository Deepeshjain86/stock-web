import mysql from 'mysql2/promise';
import { 
  getExecutiveDashboardKPIs,
  calculateInventoryValuation, 
  calculateTotalSales, 
  calculateCOGS, 
  calculateNetProfit, 
  calculateStockAdjustments,
  calculatePurchaseExpenses
} from '../services/calculationService.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_vishal001'
};

async function inspectVishalMart() {
  console.log('================================================================');
  console.log('   INSPECTING VISHAL MEGA MART (shop_vishal001) REPORT METRICS ');
  console.log('================================================================\n');

  const db = await mysql.createConnection(dbConfig);
  try {
    const [products] = await db.query('SELECT id, name, purchase_price, selling_price, mrp FROM products');
    console.log(`[Products] Count: ${products.length}`, products);

    const [stock] = await db.query('SELECT * FROM stock');
    console.log(`[Stock] Rows: ${stock.length}`, stock);

    const [batches] = await db.query('SELECT * FROM purchase_batches');
    console.log(`[Purchase Batches] Rows: ${batches.length}`, batches);

    const [purchases] = await db.query('SELECT * FROM purchases');
    console.log(`[Purchases] Rows: ${purchases.length}`, purchases);

    const [sales] = await db.query('SELECT * FROM sales');
    console.log(`[Sales] Rows: ${sales.length}`, sales);

    const [adjustments] = await db.query('SELECT * FROM stock_adjustments');
    console.log(`[Stock Adjustments] Rows: ${adjustments.length}`, adjustments);

    console.log('\n--- EXECUTING REPORT ENGINES FOR VISHAL MEGA MART ---');
    const kpis = await getExecutiveDashboardKPIs(db, {});
    console.log('[Executive KPIs Output]:', kpis);

    const valuation = await calculateInventoryValuation(db, {});
    console.log('[Valuation Output]:', valuation);

    const salesMetrics = await calculateTotalSales(db, {});
    console.log('[Sales Metrics Output]:', salesMetrics);

    const cogs = await calculateCOGS(db, {});
    console.log('[COGS Output]:', cogs);

    const netProfit = await calculateNetProfit(db, {});
    console.log('[Net Profit Output]:', netProfit);

    const stockAdj = await calculateStockAdjustments(db, {});
    console.log('[Stock Adjustments Output]:', stockAdj);

  } catch (err) {
    console.error('Error inspecting Vishal Mega Mart:', err);
  } finally {
    await db.end();
  }
}

inspectVishalMart();
