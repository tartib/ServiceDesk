/**
 * Notifications Module — v2 REST Routes
 *
 * Replaces the stub at api/v2/core/notification.routes.ts
 * with real implementations backed by NotificationService.
 */

import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth';
import { notificationService } from '../services/NotificationService';
import { NotificationSource } from '../domain/interfaces';
import logger from '../../../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v2/notifications
 * List user notifications (with optional filters)
 */
router.get(
  '/',
  [
    query('source').optional().isIn(Object.values(NotificationSource)),
    query('isRead').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const isRead = req.query.isRead !== undefined
        ? req.query.isRead === 'true'
        : undefined;

      const notifications = await notificationService.getByUser(
        {
          userId,
          isRead,
          source: req.query.source as NotificationSource | undefined,
        },
        limit
      );

      const unreadCount = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
        unreadCount,
      });
    } catch (error) {
      logger.error('Error fetching notifications', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }
);

/**
 * GET /api/v2/notifications/unread
 * Get unread notifications
 */
router.get('/unread', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const notifications = await notificationService.getByUser({
      userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    logger.error('Error fetching unread notifications', { error });
    res.status(500).json({ success: false, message: 'Failed to fetch unread notifications' });
  }
});

/**
 * GET /api/v2/notifications/unread-count
 * Get unread count only (lightweight)
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    logger.error('Error fetching unread count', { error });
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

/**
 * PUT /api/v2/notifications/:notifId/read
 * Mark notification as read
 */
router.put(
  '/:notifId/read',
  [param('notifId').isMongoId().withMessage('Invalid notification ID')],
  async (req: Request, res: Response) => {
    try {
      const notification = await notificationService.markAsRead(req.params.notifId);

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (error) {
      logger.error('Error marking notification as read', { error });
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }
);

/**
 * PUT /api/v2/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const modifiedCount = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount },
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error });
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

export default router;
