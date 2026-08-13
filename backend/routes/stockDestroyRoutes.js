import express from 'express';
import {
  getStockDestroys,
  getStockDestroyKPIs,
  createStockDestroy,
  confirmStockDestroy,
  cancelStockDestroy,
  getProductBatches
} from '../controllers/stockDestroyController.js';
import { protect, checkPermission, restrictTo } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect); // Require login for inventory destroy operations

router.get('/', checkPermission('view_stock'), getStockDestroys);
router.get('/kpis', checkPermission('view_stock'), getStockDestroyKPIs);
router.get('/batches/:productId', checkPermission('view_stock'), getProductBatches);
router.post('/create', checkPermission('destroy_stock'), readOnlyForSuperAdmin, createStockDestroy);
router.post('/:id/confirm', checkPermission('destroy_stock'), readOnlyForSuperAdmin, confirmStockDestroy);
router.post('/:id/cancel', restrictTo('Admin', 'Super Admin'), readOnlyForSuperAdmin, cancelStockDestroy);

export default router;
