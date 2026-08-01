import express from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
  deleteVendor,
  getVendorProfile,
  getVendorLedger,
  getVendorPayments,
  getVendorInvoices,
  recordSupplierPayment,
  getPaymentReceipt
} from '../controllers/vendorController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_vendors'), getVendors);
router.get('/payments/:paymentId/receipt', checkPermission('view_vendors'), getPaymentReceipt);
router.get('/:id/profile', checkPermission('view_vendors'), getVendorProfile);
router.get('/:id/ledger', checkPermission('view_vendors'), getVendorLedger);
router.get('/:id/payments', checkPermission('view_vendors'), getVendorPayments);
router.get('/:id/invoices', checkPermission('view_vendors'), getVendorInvoices);
router.get('/:id', checkPermission('view_vendors'), getVendorById);

router.post('/', checkPermission('create_vendors'), readOnlyForSuperAdmin, createVendor);
router.post('/:id/payments', checkPermission('manage_vendors'), readOnlyForSuperAdmin, recordSupplierPayment);
router.put('/:id', checkPermission('edit_vendors'), readOnlyForSuperAdmin, updateVendor);
router.patch('/:id/status', checkPermission('manage_vendors'), readOnlyForSuperAdmin, toggleVendorStatus);
router.delete('/:id', checkPermission('delete_vendors'), readOnlyForSuperAdmin, deleteVendor);

export default router;
