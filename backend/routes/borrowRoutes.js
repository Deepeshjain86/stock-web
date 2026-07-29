import express from 'express';
import { 
  getBorrowSummary, 
  getBorrowHistory, 
  getBorrowTransactions, 
  addBorrowTransaction, 
  addPaybackPayment, 
  getBorrowKPIs, 
  deleteBorrowTransaction,
  deleteBorrowRecord
} from '../controllers/borrowController.js';
import { protect } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

// Summary & KPI Routes
router.get('/', getBorrowSummary);
router.get('/summary', getBorrowSummary);
router.get('/kpis', getBorrowKPIs);
router.get('/history', getBorrowHistory);

// Payback Route
router.post('/payback', readOnlyForSuperAdmin, addPaybackPayment);

// Transaction Routes
router.route('/transactions')
  .get(getBorrowTransactions)
  .post(readOnlyForSuperAdmin, addBorrowTransaction);

router.route('/transactions/:id')
  .delete(readOnlyForSuperAdmin, deleteBorrowTransaction);

router.delete('/:id', readOnlyForSuperAdmin, deleteBorrowRecord);

export default router;
