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
  getInventorySummary
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

export default router;
