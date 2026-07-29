import express from 'express';
import { 
  getBillingStatus, 
  subscribeStorePlan, 
  cancelStorePlan,
  createPaymentOrder,
  verifyPaymentSignature,
  downloadInvoice
} from '../controllers/billingController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('Admin')); // Billing configurations only managed by Tenant Admin

router.get('/status', getBillingStatus);
router.post('/subscribe', subscribeStorePlan);
router.post('/cancel', cancelStorePlan);

// Razorpay & Invoice endpoints
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPaymentSignature);
router.get('/invoice/:id/download', downloadInvoice);

export default router;
