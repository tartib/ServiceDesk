/**
 * Notification Service
 *
 * Core CRUD + query logic for unified notifications.
 * Consolidates logic from:
 *   - src/services/notificationService.ts   (legacy OPS)
 *   - modules/pm/controllers/notificationHelper.ts (PM)
 */

import mongoose from 'mongoose';
import UnifiedNotification, { IUnifiedNotification } from '../models/Notification';
import {
  CreateNotificationDTO,
  NotificationFilters,
  NotificationLevel,
  NotificationChannel,
  NotificationSource,
  INotificationService,
} from '../domain/interfaces';
import logger from '../../../utils/logger';

export class NotificationService implements INotificationService {
  // ── Create ───────────────────────────────────────────────────

  async create(data: CreateNotificationDTO): Promise<IUnifiedNotification> {
    const notification = await UnifiedNotification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      source: data.source,
      level: data.level ?? NotificationLevel.INFO,
      channel: data.channel ?? NotificationChannel.IN_APP,
      title: data.title,
      titleAr: data.titleAr,
      message: data.message,
      messageAr: data.messageAr,
      relatedEntityId: data.relatedEntityId
        ? new mongoose.Types.ObjectId(data.relatedEntityId)
        : undefined,
      relatedEntityType: data.relatedEntityType,
      projectId: data.projectId
        ? new mongoose.Types.ObjectId(data.projectId)
        : undefined,
      organizationId: data.organizationId
        ? new mongoose.Types.ObjectId(data.organizationId)
        : undefined,
      isEscalation: data.isEscalation ?? false,
      escalatedFrom: data.escalatedFrom
        ? new mongoose.Types.ObjectId(data.escalatedFrom)
        : undefined,
      actionRequired: data.actionRequired ?? false,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      sentAt: new Date(),
    });

    logger.debug('Notification created', {
      id: notification._id,
      userId: data.userId,
      type: data.type,
      source: data.source,
    });

    return notification;
  }

  /**
   * Bulk-create the same notification for multiple users.
   * Deduplicates user IDs and returns the count of created documents.
   */
  async createBulk(
    userIds: string[],
    data: Omit<CreateNotificationDTO, 'userId'>
  ): Promise<number> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return 0;

    const docs = unique.map((uid) => ({
      userId: new mongoose.Types.ObjectId(uid),
      type: data.type,
      source: data.source,
      level: data.level ?? NotificationLevel.INFO,
      channel: data.channel ?? NotificationChannel.IN_APP,
      title: data.title,
      titleAr: data.titleAr,
      message: data.message,
      messageAr: data.messageAr,
      relatedEntityId: data.relatedEntityId
        ? new mongoose.Types.ObjectId(data.relatedEntityId)
        : undefined,
      relatedEntityType: data.relatedEntityType,
      projectId: data.projectId
        ? new mongoose.Types.ObjectId(data.projectId)
        : undefined,
      organizationId: data.organizationId
        ? new mongoose.Types.ObjectId(data.organizationId)
        : undefined,
      isEscalation: data.isEscalation ?? false,
      escalatedFrom: data.escalatedFrom
        ? new mongoose.Types.ObjectId(data.escalatedFrom)
        : undefined,
      actionRequired: data.actionRequired ?? false,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      sentAt: new Date(),
    }));

    const result = await UnifiedNotification.insertMany(docs);

    logger.debug('Bulk notifications created', {
      count: result.length,
      type: data.type,
      source: data.source,
    });

    return result.length;
  }

  // ── Read ─────────────────────────────────────────────────────

  async getByUser(
    filters: NotificationFilters,
    limit: number = 50
  ): Promise<any[]> {
    const query: Record<string, any> = { userId: filters.userId };

    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.source) query.source = filters.source;
    if (filters.type) query.type = filters.type;
    if (filters.level) query.level = filters.level;
    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    return UnifiedNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return UnifiedNotification.countDocuments({ userId, isRead: false });
  }

  // ── Update ───────────────────────────────────────────────────

  async markAsRead(notificationId: string): Promise<IUnifiedNotification | null> {
    const notification = await UnifiedNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      logger.debug('Notification marked as read', { id: notificationId });
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await UnifiedNotification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    logger.debug('All notifications marked as read', {
      userId,
      modifiedCount: result.modifiedCount,
    });

    return result.modifiedCount;
  }

  // ── Delete ─────────────────────────────────────────────────

  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await UnifiedNotification.findByIdAndDelete(notificationId);

    if (result) {
      logger.debug('Notification deleted', { id: notificationId });
    }

    return !!result;
  }

  // ── Cleanup ──────────────────────────────────────────────────

  async cleanOld(daysOld: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await UnifiedNotification.deleteMany({
      createdAt: { $lt: cutoff },
      isRead: true,
    });

    logger.info('Cleaned old notifications', {
      deletedCount: result.deletedCount,
      daysOld,
    });

    return result.deletedCount;
  }
}

/** Default singleton */
export const notificationService = new NotificationService();
