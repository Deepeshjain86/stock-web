import express from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('manage_customers'), getCustomers);
router.get('/:id', checkPermission('manage_customers'), getCustomerById);
router.post('/', checkPermission('manage_customers'), readOnlyForSuperAdmin, createCustomer);
router.put('/:id', checkPermission('manage_customers'), readOnlyForSuperAdmin, updateCustomer);
router.delete('/:id', checkPermission('manage_customers'), readOnlyForSuperAdmin, deleteCustomer);

export default router;
