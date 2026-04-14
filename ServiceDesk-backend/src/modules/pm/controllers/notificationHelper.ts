/**
 * PM Notification Helper
 *
 * Delegates to modules/notifications unified service.
 * Keeps the same exported function signatures so PM controllers work unchanged.
 */

import mongoose from 'mongoose';
import Project from '../models/Project';
import logger from '../../../utils/logger';
import { notificationDispatcher } from '../../notifications/services/NotificationDispatcher';
import { NotificationSource, NotificationType as UnifiedType } from '../../notifications/domain/interfaces';

type NotificationType = 'task' | 'comment' | 'mention' | 'assignment' | 'deadline' | 'system';

/** Maps PM-specific type strings to unified NotificationType enum values */
const PM_TYPE_MAP: Record<NotificationType, UnifiedType> = {
  task: UnifiedType.TASK,
  comment: UnifiedType.COMMENT,
  mention: UnifiedType.MENTION,
  assignment: UnifiedType.ASSIGNMENT,
  deadline: UnifiedType.DEADLINE,
  system: UnifiedType.SYSTEM,
};

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
    await notificationDispatcher.dispatch({
      userId: userId.toString(),
      type: PM_TYPE_MAP[payload.type] ?? UnifiedType.SYSTEM,
      source: NotificationSource.PM,
      title: payload.title,
      message: payload.message,
      projectId: payload.projectId.toString(),
      organizationId: payload.organizationId.toString(),
      actionUrl: payload.actionUrl,
      metadata: payload.metadata,
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
    await notificationDispatcher.dispatchBulk(unique, {
      type: PM_TYPE_MAP[payload.type] ?? UnifiedType.SYSTEM,
      source: NotificationSource.PM,
      title: payload.title,
      message: payload.message,
      projectId: payload.projectId.toString(),
      organizationId: payload.organizationId.toString(),
      actionUrl: payload.actionUrl,
      metadata: payload.metadata,
    });
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
