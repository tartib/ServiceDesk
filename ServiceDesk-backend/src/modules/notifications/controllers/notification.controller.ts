/**
 * Notification Controller
 *
 * Extracted from inline route handlers to follow the
 * separation-of-concerns pattern used by all other modules.
 */

import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { NotificationSource, NotificationLevel } from '../domain/interfaces';
import UnifiedNotification from '../models/Notification';
import { sendSuccess, sendError } from '../../../utils/ApiResponse';
import logger from '../../../utils/logger';

export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const isRead = req.query.isRead !== undefined
      ? req.query.isRead === 'true'
      : undefined;

    const filters = {
      userId,
      isRead,
      source: req.query.source as NotificationSource | undefined,
      projectId: req.query.projectId as string | undefined,
    };

    const [notifications, unreadCount] = await Promise.all([
      notificationService.getByUser(filters, limit, page),
      notificationService.getUnreadCount(userId),
    ]);

    sendSuccess(req, res, {
      notifications,
      count: notifications.length,
      unreadCount,
      pagination: { page, limit },
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error });
    sendError(req, res, 500, 'Failed to fetch notifications');
  }
};

export const getUnread = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getByUser({ userId, isRead: false });

    sendSuccess(req, res, { notifications, count: notifications.length });
  } catch (error) {
    logger.error('Error fetching unread notifications', { error });
    sendError(req, res, 500, 'Failed to fetch unread notifications');
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    sendSuccess(req, res, { unreadCount: count });
  } catch (error) {
    logger.error('Error fetching unread count', { error });
    sendError(req, res, 500, 'Failed to fetch unread count');
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const existing = await UnifiedNotification.findById(req.params.notifId).lean();
    if (!existing) {
      sendError(req, res, 404, 'Notification not found');
      return;
    }
    if (existing.userId.toString() !== userId) {
      sendError(req, res, 403, 'Forbidden');
      return;
    }

    const notification = await notificationService.markAsRead(req.params.notifId);
    sendSuccess(req, res, notification, 'Notification marked as read');
  } catch (error) {
    logger.error('Error marking notification as read', { error });
    sendError(req, res, 500, 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const modifiedCount = await notificationService.markAllAsRead(userId);

    sendSuccess(req, res, { modifiedCount }, 'All notifications marked as read');
  } catch (error) {
    logger.error('Error marking all notifications as read', { error });
    sendError(req, res, 500, 'Failed to mark all as read');
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const existing = await UnifiedNotification.findById(req.params.notifId).lean();
    if (!existing) {
      sendError(req, res, 404, 'Notification not found');
      return;
    }
    if (existing.userId.toString() !== userId) {
      sendError(req, res, 403, 'Forbidden');
      return;
    }

    await notificationService.deleteNotification(req.params.notifId);
    sendSuccess(req, res, null, 'Notification deleted');
  } catch (error) {
    logger.error('Error deleting notification', { error });
    sendError(req, res, 500, 'Failed to delete notification');
  }
};

export const getCritical = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationService.getByUser({
      userId,
      level: NotificationLevel.CRITICAL,
      isRead: false,
    });

    sendSuccess(req, res, { notifications, count: notifications.length });
  } catch (error) {
    logger.error('Error fetching critical notifications', { error });
    sendError(req, res, 500, 'Failed to fetch critical notifications');
  }
};
