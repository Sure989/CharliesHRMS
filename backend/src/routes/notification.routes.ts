import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  createNotification,
  markAllNotificationsRead
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', getNotifications);

// POST /api/notifications
router.post('/', createNotification);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markNotificationRead);

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', markAllNotificationsRead);

export default router;
