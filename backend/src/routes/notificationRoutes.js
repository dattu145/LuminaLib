import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', requireAuth, getMyNotifications);
router.get('/notifications/unread-count', requireAuth, getUnreadCount);
router.post('/notifications/:id/read', requireAuth, markAsRead);
router.post('/notifications/mark-all-read', requireAuth, markAllAsRead);

export default router;
