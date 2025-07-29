import { Request, Response } from 'express';
import { TokenPayload } from '../utils/jwt';

interface AuthRequest extends Request {
  user?: TokenPayload;
}
import { prisma } from '../lib/prisma';


// Get all notifications for a user (optionally filter by read status)
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};


// Mark a notification as read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
};


// Create a notification
export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, title, message, actionUrl, actionLabel, module, tenantId } = req.body;
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        actionLabel,
        module,
        tenantId,
      },
    });
    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error });
  }
};


// Mark all notifications as read for a user
export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error });
  }
};
