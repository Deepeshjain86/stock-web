import express from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', readOnlyForSuperAdmin, createCustomer); // Any staff can register a new customer during checkout
router.put('/:id', restrictTo('Admin'), readOnlyForSuperAdmin, updateCustomer);
router.delete('/:id', restrictTo('Admin'), readOnlyForSuperAdmin, deleteCustomer);

export default router;
