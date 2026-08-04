import express from 'express';
import { 
  getSalesReturns, 
  getSalesReturnById, 
  createSalesReturn, 
  searchInvoiceForReturn,
  deleteSalesReturn
} from '../controllers/salesReturnController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search-invoice', checkPermission('view_sales'), searchInvoiceForReturn);
router.get('/', checkPermission('view_sales'), getSalesReturns);
router.get('/:id', checkPermission('view_sales'), getSalesReturnById);
router.post('/', readOnlyForSuperAdmin, checkPermission('create_sales'), createSalesReturn);
router.delete('/:id', readOnlyForSuperAdmin, checkPermission('create_sales'), deleteSalesReturn);

export default router;
