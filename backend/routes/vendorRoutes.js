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
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getVendors);
router.get('/payments/:paymentId/receipt', getPaymentReceipt);
router.get('/:id/profile', getVendorProfile);
router.get('/:id/ledger', getVendorLedger);
router.get('/:id/payments', getVendorPayments);
router.get('/:id/invoices', getVendorInvoices);
router.get('/:id', getVendorById);

router.post('/', restrictTo('Admin', 'Manager'), createVendor);
router.post('/:id/payments', restrictTo('Admin', 'Manager'), recordSupplierPayment);
router.put('/:id', restrictTo('Admin', 'Manager'), updateVendor);
router.patch('/:id/status', restrictTo('Admin', 'Manager'), toggleVendorStatus);
router.delete('/:id', restrictTo('Admin'), deleteVendor);

export default router;
