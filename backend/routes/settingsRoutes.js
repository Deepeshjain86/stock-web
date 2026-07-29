import express from 'express';
import { getSettings, updateSettings, getWarehouses, uploadLogo, logoUploadMulter } from '../controllers/settingsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getSettings);
router.get('/warehouses', getWarehouses);
router.put('/', restrictTo('Admin'), updateSettings);
router.post('/upload-logo', restrictTo('Admin'), logoUploadMulter.single('logo'), uploadLogo);

export default router;
