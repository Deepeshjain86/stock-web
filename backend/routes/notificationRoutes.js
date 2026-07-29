import express from 'express';
import { 
  getNotifications, 
  getUnreadCount,
  markAsRead, 
  markAsUnread,
  markAllAsRead, 
  deleteNotification, 
  clearAllNotifications,
  createNotificationApi 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/', createNotificationApi);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.put('/:id/unread', markAsUnread);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
