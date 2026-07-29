import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkImportProducts } from '../controllers/productController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { readOnlyForSuperAdmin } from '../middleware/readOnlyMiddleware.js';

const router = express.Router();

router.use(protect); // All product routes require login

router.get('/', checkPermission('view_products'), getProducts);
router.post('/bulk-import', checkPermission('import_products'), readOnlyForSuperAdmin, bulkImportProducts);
router.get('/:id', checkPermission('view_products'), getProductById);
router.post('/', checkPermission('create_products'), readOnlyForSuperAdmin, upload.single('image'), createProduct);
router.put('/:id', checkPermission('edit_products'), readOnlyForSuperAdmin, upload.single('image'), updateProduct);
router.delete('/:id', checkPermission('delete_products'), readOnlyForSuperAdmin, deleteProduct);

export default router;

