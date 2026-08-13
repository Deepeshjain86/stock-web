import express from 'express';
import { 
  getDashboardKPIs, 
  getDashboardCharts, 
  getInventoryReport, 
  getSalesReport, 
  getPurchaseReport, 
  getSalesDashboardData,
  getVendorPurchasesReport,
  getVendorInventoryReport,
  getVendorReturnsReport,
  getAdvancedAnalyticsData,
  getInventorySummary,
  getStockAgingReport,
  getInventoryTurnoverReport,
  getABCAnalysisReport,
  getBatchValuationReport,
  getReservedStockReport,
  getInventoryReconciliationReport,
  getStockAdjustmentReport,
  getValuationLayerReport
} from '../controllers/reportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/inventory-summary', getInventorySummary);
router.get('/dashboard-kpis', getDashboardKPIs);
router.get('/dashboard-charts', getDashboardCharts);

router.use(restrictTo('Admin', 'Sales Manager', 'Purchase Manager', 'Employee', 'Purchase Employee', 'Sales Employee'));
router.get('/inventory', getInventoryReport);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/sales-dashboard', getSalesDashboardData);
router.get('/vendor-purchases', getVendorPurchasesReport);
router.get('/vendor-inventory', getVendorInventoryReport);
router.get('/vendor-returns', getVendorReturnsReport);
router.get('/advanced-analytics', getAdvancedAnalyticsData);
router.get('/stock-aging', getStockAgingReport);
router.get('/inventory-turnover', getInventoryTurnoverReport);
router.get('/abc-analysis', getABCAnalysisReport);
router.get('/batch-valuation', getBatchValuationReport);
router.get('/reserved-stock', getReservedStockReport);
router.get('/inventory-reconciliation', getInventoryReconciliationReport);
router.get('/stock-adjustments', getStockAdjustmentReport);
router.get('/valuation-layers', getValuationLayerReport);

export default router;
