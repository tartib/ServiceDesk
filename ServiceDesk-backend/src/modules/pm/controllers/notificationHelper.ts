/**
 * @deprecated Use modules/notifications/services/NotificationService.ts instead.
 * This file is retained for backward compatibility with PM controllers.
 * New code should use the NotificationDispatcher from modules/notifications.
 */

import mongoose from 'mongoose';
import PMNotification from '../models/Notification';
import Project from '../models/Project';
import logger from '../../../utils/logger';

type NotificationType = 'task' | 'comment' | 'mention' | 'assignment' | 'deadline' | 'system';

interface NotificationPayload {
  projectId: string | mongoose.Types.ObjectId;
  organizationId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a single user. Silently logs errors so callers are not disrupted.
 */
export const notifyUser = async (
  userId: string | mongoose.Types.ObjectId,
  payload: NotificationPayload
): Promise<void> => {
  try {
    await PMNotification.create({
      userId,
      ...payload,
    });
  } catch (err) {
    logger.error('notifyUser failed:', err);
  }
};

/**
 * Create notifications for multiple users at once (deduplicates the actorId).
 */
export const notifyUsers = async (
  userIds: Array<string | mongoose.Types.ObjectId>,
  payload: NotificationPayload,
  excludeUserId?: string | mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const excludeStr = excludeUserId?.toString();
    const unique = [...new Set(userIds.map((id) => id.toString()))].filter(
      (id) => id !== excludeStr
    );
    if (unique.length === 0) return;
    await PMNotification.insertMany(
      unique.map((userId) => ({ userId, ...payload }))
    );
  } catch (err) {
    logger.error('notifyUsers failed:', err);
  }
};

/**
 * Notify all members of a project, optionally excluding the actor.
 */
export const notifyProjectMembers = async (
  projectId: string | mongoose.Types.ObjectId,
  payload: Omit<NotificationPayload, 'projectId' | 'organizationId'>,
  excludeUserId?: string | mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const project = await Project.findById(projectId).select('members organizationId').lean();
    if (!project) return;
    const memberIds = (project.members || [])
      .map((m: any) => m.userId?.toString() || m.toString())
      .filter(Boolean);
    await notifyUsers(
      memberIds,
      { projectId, organizationId: project.organizationId, ...payload },
      excludeUserId
    );
  } catch (err) {
    logger.error('notifyProjectMembers failed:', err);
  }
};
