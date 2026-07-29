import express from 'express';
import {
  getBrands,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
} from '../controllers/brandController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_products'), getBrands);
router.post('/', checkPermission('create_products'), readOnlyForSuperAdmin, createBrand);
router.put('/:id', checkPermission('edit_products'), readOnlyForSuperAdmin, updateBrand);
router.patch('/:id/status', checkPermission('edit_products'), readOnlyForSuperAdmin, toggleBrandStatus);
router.delete('/:id', checkPermission('delete_products'), readOnlyForSuperAdmin, deleteBrand);

export default router;
