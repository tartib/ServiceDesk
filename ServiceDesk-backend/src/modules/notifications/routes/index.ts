/**
 * Notifications Module — v2 REST Routes
 *
 * All business logic delegated to notification.controller.ts.
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { NotificationSource } from '../domain/interfaces';
import * as notifCtrl from '../controllers/notification.controller';
import { notificationDispatcher } from '../services/NotificationDispatcher';
import alertRoutes from './alert.routes';

const router = Router();

// ── Alerts (migrated from legacy) ──
router.use('/alerts', alertRoutes);

/**
 * GET /api/v2/notifications/channels
 * Returns which notification channels are currently operational.
 */
router.get('/channels', (_req, res) => {
  res.json({ success: true, data: notificationDispatcher.getChannelCapabilities() });
});

/**
 * GET /api/v2/notifications
 * List user notifications (with optional filters)
 */
router.get(
  '/',
  [
    query('source').optional().isIn(Object.values(NotificationSource)),
    query('isRead').optional().isBoolean(),
    query('projectId').optional().isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  notifCtrl.listNotifications
);

/**
 * GET /api/v2/notifications/unread
 * Get unread notifications
 */
router.get('/unread', notifCtrl.getUnread);

/**
 * GET /api/v2/notifications/critical
 * Get unread critical-level notifications
 */
router.get('/critical', notifCtrl.getCritical);

/**
 * GET /api/v2/notifications/unread-count
 * Get unread count only (lightweight)
 */
router.get('/unread-count', notifCtrl.getUnreadCount);

/**
 * PUT /api/v2/notifications/read-all
 * Mark all notifications as read
 * MUST be registered before /:notifId/read to avoid param shadowing
 */
router.put('/read-all', notifCtrl.markAllAsRead);

/**
 * PUT /api/v2/notifications/:notifId/read
 * Mark notification as read
 */
router.put(
  '/:notifId/read',
  [param('notifId').isMongoId().withMessage('Invalid notification ID')],
  notifCtrl.markAsRead
);

/**
 * DELETE /api/v2/notifications/:notifId
 * Delete a notification
 */
router.delete(
  '/:notifId',
  [param('notifId').isMongoId().withMessage('Invalid notification ID')],
  notifCtrl.deleteNotification
);

export default router;
