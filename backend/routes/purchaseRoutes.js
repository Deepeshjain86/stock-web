import express from 'express';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  createGRN,
  getGRNsForPO
} from '../controllers/purchaseController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

// Purchase Orders Routes
router.get('/orders', checkPermission('view_purchases'), getPurchaseOrders);
router.get('/orders/:id', checkPermission('view_purchases'), getPurchaseOrderById);
router.post('/orders', checkPermission('create_purchases'), readOnlyForSuperAdmin, createPurchaseOrder);
router.put('/orders/:id/status', checkPermission('create_purchases'), readOnlyForSuperAdmin, updatePurchaseOrderStatus);
router.delete('/orders/:id', checkPermission('delete_purchases'), readOnlyForSuperAdmin, deletePurchaseOrder);

// GRN Routes
router.post('/orders/:id/grn', checkPermission('create_purchases'), readOnlyForSuperAdmin, createGRN);
router.get('/orders/:id/grns', checkPermission('view_purchases'), getGRNsForPO);

// Standalone Purchase Invoices Routes
router.get('/', checkPermission('view_purchases'), getPurchases);
router.get('/:id', checkPermission('view_purchases'), getPurchaseById);
router.post('/', checkPermission('create_purchases'), readOnlyForSuperAdmin, createPurchase);
router.delete('/:id', checkPermission('delete_purchases'), readOnlyForSuperAdmin, deletePurchase);

export default router;
