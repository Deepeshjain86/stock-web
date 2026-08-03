import express from 'express';
import { 
  getPlatformKPIs, 
  getStores, 
  createStore, 
  updateStore, 
  toggleStoreStatus,
  deleteStore,
  handleSubscriptionAction,
  getBackups,
  triggerManualBackup
} from '../controllers/superAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('Super Admin'));

router.get('/kpis', getPlatformKPIs);
router.get('/stores', getStores);
router.post('/stores', createStore);
router.put('/stores/:id', updateStore);
router.patch('/stores/:id/status', toggleStoreStatus);
router.delete('/stores/:id', deleteStore);
router.post('/stores/:id/subscription-action', handleSubscriptionAction);

// Backup Routes
router.get('/backups', getBackups);
router.post('/backups/trigger', triggerManualBackup);

export default router;
