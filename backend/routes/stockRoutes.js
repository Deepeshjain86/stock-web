import express from 'express';
import { 
  getStockSummary, 
  adjustStock, 
  getStockAdjustments, 
  reverseStockAdjustment, 
  revalueInventory,
  transferStock, 
  getStockLogs, 
  getStockAlerts, 
  getStockTransfers 
} from '../controllers/stockController.js';
import { 
  getStockDestroys, 
  getStockDestroyKPIs, 
  createStockDestroy, 
  confirmStockDestroy,
  cancelStockDestroy,
  getProductBatches
} from '../controllers/stockDestroyController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect); // Require login for inventory updates

router.get('/', checkPermission('view_stock'), getStockSummary);
router.get('/summary', checkPermission('view_stock'), getStockSummary);
router.get('/logs', checkPermission('view_stock_history'), getStockLogs);
router.get('/adjustments', checkPermission('view_stock'), getStockAdjustments);
router.get('/transfers', checkPermission('view_stock'), getStockTransfers);
router.get('/alerts', checkPermission('view_stock'), getStockAlerts);
router.get('/product-batches/:productId', checkPermission('view_stock'), getProductBatches);
router.post('/adjust', checkPermission('adjust_stock'), readOnlyForSuperAdmin, adjustStock);
router.post('/adjust/:id/reverse', checkPermission('adjust_stock'), readOnlyForSuperAdmin, reverseStockAdjustment);
router.post('/revaluation', checkPermission('adjust_stock'), readOnlyForSuperAdmin, revalueInventory);
router.post('/transfer', checkPermission('transfer_stock'), readOnlyForSuperAdmin, transferStock);

// Stock Destroy Routes
router.get('/destroy', checkPermission('view_stock'), getStockDestroys);
router.get('/destroy/kpis', checkPermission('view_stock'), getStockDestroyKPIs);
router.post('/destroy/create', checkPermission('destroy_stock'), readOnlyForSuperAdmin, createStockDestroy);
router.post('/destroy/:id/confirm', checkPermission('destroy_stock'), readOnlyForSuperAdmin, confirmStockDestroy);
router.post('/destroy/:id/cancel', checkPermission('destroy_stock'), readOnlyForSuperAdmin, cancelStockDestroy);

export default router;
