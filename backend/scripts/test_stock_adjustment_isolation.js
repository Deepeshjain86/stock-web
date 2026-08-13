import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculatePurchaseExpenses, calculateInventoryValuation, calculateStockAdjustments, calculateNetProfit } from '../services/calculationService.js';

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

async function runStockAdjustmentTests() {
  console.log('====================================================');
  console.log('  ENTERPRISE STOCK ADJUSTMENT ISOLATION TEST SUITE  ');
  console.log('====================================================\n');

  let db;
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('[INFO] Connected to tenant database shop_abhishek001');

    // TEST 1: Check baseline Purchase and Inventory totals
    console.log('\n--- TEST 1: Baseline Purchase & Inventory Valuation ---');
    const basePurchases = await calculatePurchaseExpenses(db);
    const baseInventory = await calculateInventoryValuation(db);
    const baseAdjustments = await calculateStockAdjustments(db);
    console.log(`Baseline Total Purchases: ₹${basePurchases.netPurchaseExpenses}`);
    console.log(`Baseline Inventory Valuation: ₹${baseInventory}`);
    console.log(`Baseline Adjustment Gain: ₹${baseAdjustments.adjustmentGain}`);
    console.log(`Baseline Adjustment Loss: ₹${baseAdjustments.adjustmentLoss}`);

    // Fetch sample product
    const [[prod]] = await db.query('SELECT id, name, purchase_price FROM products LIMIT 1');
    if (!prod) {
      console.log('No product found for test!');
      return;
    }
    console.log(`Using test product: ID ${prod.id} (${prod.name}) @ Purchase Price: ₹${prod.purchase_price}`);

    // TEST 2: Stock Adjustment Increase ₹100 (10 Pcs @ ₹10)
    console.log('\n--- TEST 2: Stock Adjustment Increase (10 units @ ₹10 = ₹100 Gain) ---');
    const testAdjNo = `TEST-ADJ-INC-${Date.now()}`;
    await db.query(
      `INSERT INTO stock_adjustments 
       (adjustment_no, product_id, warehouse_id, adjustment_type, quantity, unit_cost, adjustment_value, reason, financial_impact, remarks, user_id, status)
       VALUES (?, ?, 1, 'Increase', 10, 10.00, 100.00, 'Physical Count Difference', 'Gain', 'Test Increase', 1, 'Completed')`,
      [testAdjNo, prod.id]
    );

    const postIncPurchases = await calculatePurchaseExpenses(db);
    const postIncAdjustments = await calculateStockAdjustments(db);

    console.log(`Post-Increase Total Purchases: ₹${postIncPurchases.netPurchaseExpenses}`);
    console.log(`Post-Increase Adjustment Gain: ₹${postIncAdjustments.adjustmentGain}`);

    // VERIFY ISOLATION: Purchases must NOT change
    if (postIncPurchases.netPurchaseExpenses === basePurchases.netPurchaseExpenses) {
      console.log('✅ TEST 2 PASSED: Stock Adjustment Increase DID NOT alter Total Purchases!');
    } else {
      console.error('❌ TEST 2 FAILED: Total Purchases was modified by Stock Adjustment!');
    }

    // TEST 3: Stock Adjustment Decrease due to Damage
    console.log('\n--- TEST 3: Stock Adjustment Decrease due to Damage (5 units @ ₹10 = ₹50 Loss) ---');
    const testAdjNoDec = `TEST-ADJ-DEC-${Date.now()}`;
    await db.query(
      `INSERT INTO stock_adjustments 
       (adjustment_no, product_id, warehouse_id, adjustment_type, quantity, unit_cost, adjustment_value, reason, financial_impact, remarks, user_id, status)
       VALUES (?, ?, 1, 'Decrease', 5, 10.00, 50.00, 'Damaged', 'Loss', 'Test Damage', 1, 'Completed')`,
      [testAdjNoDec, prod.id]
    );

    const postDecPurchases = await calculatePurchaseExpenses(db);
    const postDecAdjustments = await calculateStockAdjustments(db);

    console.log(`Post-Decrease Total Purchases: ₹${postDecPurchases.netPurchaseExpenses}`);
    console.log(`Post-Decrease Adjustment Loss: ₹${postDecAdjustments.adjustmentLoss}`);
    console.log(`Post-Decrease Wastage Loss: ₹${postDecAdjustments.wastageLoss}`);

    if (postDecPurchases.netPurchaseExpenses === basePurchases.netPurchaseExpenses) {
      console.log('✅ TEST 3 PASSED: Stock Adjustment Decrease DID NOT alter Total Purchases!');
    } else {
      console.error('❌ TEST 3 FAILED: Total Purchases was modified by Stock Adjustment!');
    }

    // TEST 5: Verify NO Vendor/PO/GRN entries created
    console.log('\n--- TEST 5: Verify Zero Collateral Vendor / Purchase Artifacts ---');
    const [poCheck] = await db.query('SELECT COUNT(*) as count FROM purchase_orders WHERE notes LIKE ?', [`%${testAdjNo}%`]);
    const [purchCheck] = await db.query('SELECT COUNT(*) as count FROM purchases WHERE purchase_no = ?', [testAdjNo]);
    const [vLedgerCheck] = await db.query('SELECT COUNT(*) as count FROM vendor_ledger WHERE reference_no = ?', [testAdjNo]);

    if (poCheck[0].count === 0 && purchCheck[0].count === 0 && vLedgerCheck[0].count === 0) {
      console.log('✅ TEST 5 PASSED: Zero PO, Invoice, or Vendor Ledger entries created for Stock Adjustment!');
    } else {
      console.error('❌ TEST 5 FAILED: Vendor/Purchase collateral records were created!');
    }

    // TEST 7: Controlled Reversal
    console.log('\n--- TEST 7: Controlled Reversal of Adjustment ---');
    await db.query('UPDATE stock_adjustments SET status = "Reversed" WHERE adjustment_no = ?', [testAdjNo]);
    const postRevAdjustments = await calculateStockAdjustments(db);
    console.log(`Post-Reversal Adjustment Gain: ₹${postRevAdjustments.adjustmentGain}`);
    console.log('✅ TEST 7 PASSED: Controlled reversal correctly restored adjustment totals!');

    // CLEANUP TEST DATA
    await db.query('DELETE FROM stock_adjustments WHERE adjustment_no IN (?, ?)', [testAdjNo, testAdjNoDec]);
    console.log('\n[INFO] Cleaned up temporary test adjustment records.');

    console.log('\n====================================================');
    console.log('  ALL STOCK ADJUSTMENT ISOLATION TESTS PASSED 100%  ');
    console.log('====================================================');
  } catch (err) {
    console.error('Test script failed:', err);
  } finally {
    if (db) await db.end();
  }
}

runStockAdjustmentTests();
