import { Router } from 'express';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  registerToken
} from '../controllers/notificationController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR'), createNotification);
router.get('/', authenticateJWT, getNotifications);
router.get('/unread-count', authenticateJWT, getUnreadCount);
router.patch('/mark-all-read', authenticateJWT, markAllRead);
router.patch('/:id/read', authenticateJWT, markAsRead);
router.delete('/:id', authenticateJWT, deleteNotification);
router.post('/token', authenticateJWT, registerToken);

export default router;
