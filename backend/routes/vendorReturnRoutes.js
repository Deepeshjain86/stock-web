import express from 'express';
import {
  getVendorReturns,
  createVendorReturn,
  getAvailableReturnStock,
  updateVendorReturnStatus,
  getSupplierLedger,
  getProductsPurchasedByVendor,
  getPurchasesForVendorProduct,
  deleteVendorReturn
} from '../controllers/vendorReturnController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_returns'), getVendorReturns);
router.get('/available-stock', checkPermission('view_returns'), getAvailableReturnStock);
router.post('/', checkPermission('create_returns'), readOnlyForSuperAdmin, createVendorReturn);
router.put('/:id/status', checkPermission('create_returns'), readOnlyForSuperAdmin, updateVendorReturnStatus);
router.get('/ledger/:vendorId', checkPermission('view_returns'), getSupplierLedger);
router.get('/products-purchased', checkPermission('view_returns'), getProductsPurchasedByVendor);
router.get('/purchases-by-product', checkPermission('view_returns'), getPurchasesForVendorProduct);
router.delete('/:id', checkPermission('adjust_stock'), readOnlyForSuperAdmin, deleteVendorReturn);

export default router;
