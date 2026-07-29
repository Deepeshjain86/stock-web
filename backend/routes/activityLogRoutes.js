import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getActivityLogs);

export default router;
