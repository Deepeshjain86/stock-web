import express from 'express';
import { 
  getCategories, 
  getHierarchy, 
  createCategory, 
  updateCategory, 
  toggleCategoryStatus,
  deleteCategory 
} from '../controllers/categoryController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/tree', checkPermission('view_products'), getHierarchy);
router.get('/', checkPermission('view_products'), getCategories);
router.post('/', checkPermission('create_products'), readOnlyForSuperAdmin, createCategory);
router.put('/:id', checkPermission('edit_products'), readOnlyForSuperAdmin, updateCategory);
router.patch('/:id/status', checkPermission('edit_products'), readOnlyForSuperAdmin, toggleCategoryStatus);
router.delete('/:id', checkPermission('delete_products'), readOnlyForSuperAdmin, deleteCategory);

export default router;
