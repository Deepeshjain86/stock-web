import express from 'express';
import { getSales, getSaleById, createSale, deleteSale } from '../controllers/salesController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_sales'), getSales);
router.get('/:id', checkPermission('view_sales'), getSaleById);
router.post('/', checkPermission('create_sales'), readOnlyForSuperAdmin, createSale);
router.delete('/:id', checkPermission('delete_sales'), readOnlyForSuperAdmin, deleteSale);

export default router;
