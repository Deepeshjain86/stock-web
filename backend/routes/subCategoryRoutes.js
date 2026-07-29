import express from 'express';
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  toggleSubCategoryStatus,
  deleteSubCategory
} from '../controllers/subCategoryController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_products'), getSubCategories);
router.post('/', checkPermission('create_products'), readOnlyForSuperAdmin, createSubCategory);
router.put('/:id', checkPermission('edit_products'), readOnlyForSuperAdmin, updateSubCategory);
router.patch('/:id/status', checkPermission('edit_products'), readOnlyForSuperAdmin, toggleSubCategoryStatus);
router.delete('/:id', checkPermission('delete_products'), readOnlyForSuperAdmin, deleteSubCategory);

export default router;
