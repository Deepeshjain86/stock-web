import express from 'express';
import {
  getStockDestroys,
  getStockDestroyKPIs,
  createStockDestroy,
  cancelStockDestroy
} from '../controllers/stockDestroyController.js';
import { protect, checkPermission, restrictTo } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect); // Require login for inventory destroy operations

router.get('/', checkPermission('view_stock'), getStockDestroys);
router.get('/kpis', checkPermission('view_stock'), getStockDestroyKPIs);
router.post('/create', checkPermission('adjust_stock'), readOnlyForSuperAdmin, createStockDestroy);
router.post('/:id/cancel', restrictTo('Admin', 'Super Admin'), readOnlyForSuperAdmin, cancelStockDestroy);

export default router;
