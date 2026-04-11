/**
 * Notification Controller
 *
 * Extracted from inline route handlers to follow the
 * separation-of-concerns pattern used by all other modules.
 */

import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { NotificationSource } from '../domain/interfaces';
import { sendSuccess, sendError } from '../../../utils/ApiResponse';
import logger from '../../../utils/logger';

export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const isRead = req.query.isRead !== undefined
      ? req.query.isRead === 'true'
      : undefined;

    const notifications = await notificationService.getByUser(
      {
        userId,
        isRead,
        source: req.query.source as NotificationSource | undefined,
        projectId: req.query.projectId as string | undefined,
      },
      limit
    );

    const unreadCount = await notificationService.getUnreadCount(userId);

    sendSuccess(req, res, { notifications, count: notifications.length, unreadCount });
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
    const notification = await notificationService.markAsRead(req.params.notifId);

    if (!notification) {
      sendError(req, res, 404, 'Notification not found');
      return;
    }

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
    const deleted = await notificationService.deleteNotification(req.params.notifId);

    if (!deleted) {
      sendError(req, res, 404, 'Notification not found');
      return;
    }

    sendSuccess(req, res, null, 'Notification deleted');
  } catch (error) {
    logger.error('Error deleting notification', { error });
    sendError(req, res, 500, 'Failed to delete notification');
  }
};
