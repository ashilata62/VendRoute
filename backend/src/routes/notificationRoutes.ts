import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
} from '../controllers/notificationController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJWT, getNotifications);
router.get('/unread-count', authenticateJWT, getUnreadCount);
router.patch('/mark-all-read', authenticateJWT, markAllRead);
router.patch('/:id/read', authenticateJWT, markAsRead);

export default router;
