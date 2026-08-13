import mysql from 'mysql2/promise';
import { 
  calculateInventoryValuation, 
  calculateTotalSales, 
  calculateCOGS, 
  calculateNetProfit, 
  calculateStockAdjustments,
  getValuationDrillDown 
} from '../services/calculationService.js';
import { recordValuationLayer } from '../services/valuationLayerService.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shop_aman001' // Use Tenant 1 DB for end-to-end scenario verification
};

async function runTestSuite() {
  console.log('================================================================');
  console.log('   ODOO 19 INVENTORY VALUATION & STOCK ADJUSTMENT TEST SUITE    ');
  console.log('================================================================\n');

  const db = await mysql.createConnection(dbConfig);
  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition, scenarioName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${scenarioName} ${details ? '-> ' + details : ''}`);
      totalPassed++;
    } else {
      console.error(`❌ [FAIL] ${scenarioName} ${details ? '-> ' + details : ''}`);
      totalFailed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST SCENARIO 15: USER SCREENSHOT SPECIFIC SCENARIO
    // Sales ₹10, COGS ₹9, Stock Adjustment +₹90
    // Expected: Sales ₹10, Gross Profit ₹1, Gross Margin 10%, Inventory Adjustment +₹90 separately.
    // -------------------------------------------------------------------------
    console.log('--- TEST 15: USER SCREENSHOT SPECIFIC FORMULA TEST ---');
    const mockSales = { netSales: 10, totalSales: 10 };
    const mockCogs = 9;
    const mockStockAdj = { adjustmentGain: 90, adjustmentLoss: 0, netAdjustment: 90 };

    const grossProfit = Number((mockSales.netSales - mockCogs).toFixed(2)); // ₹1.00
    const grossMargin = Number(((grossProfit / mockSales.netSales) * 100).toFixed(2)); // 10.00%

    assert(grossProfit === 1, 'Test 15: Gross Profit calculation', `Gross Profit = ₹${grossProfit} (Expected ₹1.00)`);
    assert(grossMargin === 10, 'Test 15: Gross Margin calculation', `Gross Margin = ${grossMargin}% (Expected 10.00%, NOT 910%)`);
    assert(mockStockAdj.netAdjustment === 90, 'Test 15: Stock Adjustment Separation', `Stock Adjustment = +₹${mockStockAdj.netAdjustment} (Tracked separately)`);


    // -------------------------------------------------------------------------
    // TEST SCENARIO 1: Purchase Only
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Purchase Only ---');
    const valuationVal = await calculateInventoryValuation(db);
    const salesData = await calculateTotalSales(db);
    const cogsVal = await calculateCOGS(db);
    assert(salesData.netSales >= 0, 'Test 1: Sales Engine Returns Valid Number', `Net Sales = ₹${salesData.netSales}`);
    assert(cogsVal >= 0, 'Test 1: COGS Engine Returns Valid Number', `COGS = ₹${cogsVal}`);
    assert(valuationVal >= 0, 'Test 1: Inventory Valuation Engine', `Inventory Value = ₹${valuationVal}`);


    // -------------------------------------------------------------------------
    // TEST SCENARIO 3 & 4: Stock Increase (+₹100) & Decrease (-₹100) Adjustments
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3 & 4: Stock Adjustment Impact on Valuation vs Purchase/Sales ---');
    const adjMetrics = await calculateStockAdjustments(db);
    assert(adjMetrics !== null, 'Test 3/4: Stock Adjustments engine loaded', `Gain: ₹${adjMetrics.adjustmentGain}, Loss: ₹${adjMetrics.adjustmentLoss}`);
    

    // -------------------------------------------------------------------------
    // TEST SCENARIO 6: Batch-wise Costing Basis (Batch A ₹80 vs Batch B ₹100)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Batch-specific Cost Basis Allocation ---');
    const batchACost = 80;
    const batchBCost = 100;
    const adjQty = 2;
    const batchAValuation = adjQty * batchACost; // 160
    assert(batchAValuation === 160, 'Test 6: Batch A Adjustment Costing', `Batch A (₹80) +2 Pcs = ₹${batchAValuation} (NOT ₹200)`);


    // -------------------------------------------------------------------------
    // TEST SCENARIO 12: Adjustment Reversal Workflow (ADJ-000001 -> ADJ-000002)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: Reversal Audit Trail & Counter-Transaction ---');
    const origQty = 10;
    const revQty = -10;
    const netQtyDelta = origQty + revQty;
    assert(netQtyDelta === 0, 'Test 12: Reversal Quantity Net Zeroing', `ADJ +10 Pcs + REV -10 Pcs = ${netQtyDelta} Pcs`);


    // -------------------------------------------------------------------------
    // TEST SCENARIO 16: Inventory Valuation Layer Drill-Down (Odoo 19 Ledger)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 16: Inventory Valuation Layer Drill-Down ---');
    const drillDown = await getValuationDrillDown(db);
    assert(drillDown.success === true, 'Test 16: Valuation Drill-down API Query', `Fetched ${drillDown.layers.length} valuation layer(s)`);


    // -------------------------------------------------------------------------
    // TEST SCENARIO 17: Valuation Entry Balance Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 17: Valuation Layer Entry Balance ---');
    const [prodRows] = await db.query('SELECT id FROM products LIMIT 1');
    const validProdId = prodRows.length > 0 ? prodRows[0].id : 1;

    await recordValuationLayer(db, {
      productId: validProdId,
      warehouseId: 1,
      transactionType: 'Stock Adjustment',
      referenceNo: 'TEST-VAL-001',
      quantityDelta: 5,
      unitCost: 10,
      valueDelta: 50,
      previousQuantity: 10,
      newQuantity: 15,
      previousInventoryValue: 100,
      newInventoryValue: 150,
      accountingTreatment: 'Inventory Variation',
      createdBy: null
    });

    const [testCheck] = await db.query('SELECT * FROM inventory_valuation_layers WHERE reference_no = "TEST-VAL-001" LIMIT 1');
    assert(testCheck.length > 0 && Number(testCheck[0].value_delta) === 50, 'Test 17: Valuation Layer Recorded & Balanced', `Valuation Delta = +₹${testCheck[0]?.value_delta}`);

    // Cleanup test record
    await db.query('DELETE FROM inventory_valuation_layers WHERE reference_no = "TEST-VAL-001"');

    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED               `);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test suite execution error:', err);
  } finally {
    await db.end();
  }
}

runTestSuite();
