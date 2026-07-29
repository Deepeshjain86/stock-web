import express from 'express';
import { getStockSummary, adjustStock, transferStock, getStockLogs, getStockAlerts } from '../controllers/stockController.js';
import { 
  getStockDestroys, 
  getStockDestroyKPIs, 
  createStockDestroy, 
  cancelStockDestroy 
} from '../controllers/stockDestroyController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect); // Require login for inventory updates

router.get('/', checkPermission('view_stock'), getStockSummary);
router.get('/logs', checkPermission('view_stock'), getStockLogs);
router.get('/alerts', checkPermission('view_stock'), getStockAlerts);
router.post('/adjust', checkPermission('adjust_stock'), readOnlyForSuperAdmin, adjustStock);
router.post('/transfer', checkPermission('transfer_stock'), readOnlyForSuperAdmin, transferStock);

// Stock Destroy Routes
router.get('/destroy', checkPermission('view_stock'), getStockDestroys);
router.get('/destroy/kpis', checkPermission('view_stock'), getStockDestroyKPIs);
router.post('/destroy/create', checkPermission('destroy_stock'), readOnlyForSuperAdmin, createStockDestroy);
router.post('/destroy/:id/cancel', checkPermission('destroy_stock'), readOnlyForSuperAdmin, cancelStockDestroy);

export default router;
