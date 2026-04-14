/**
 * Notification Dispatcher
 *
 * Multi-channel dispatch layer.
 * - in_app: fully implemented via NotificationService
 * - email:  wired to EmailAdapter (SMTP)
 * - push:   stub (not yet implemented)
 * - slack:  stub (not yet implemented)
 */

import { NotificationChannel, CreateNotificationDTO } from '../domain/interfaces';
import { notificationService } from './NotificationService';
import { emailAdapter } from '../../../integrations/channels/email.adapter';
import logger from '../../../utils/logger';
import mongoose from 'mongoose';

export class NotificationDispatcher {
  /**
   * Dispatch a notification through the appropriate channel(s).
   * Defaults to in-app if no channel specified.
   */
  async dispatch(data: CreateNotificationDTO): Promise<void> {
    const channel = data.channel ?? NotificationChannel.IN_APP;

    switch (channel) {
      case NotificationChannel.IN_APP:
        await notificationService.create(data);
        break;

      case NotificationChannel.EMAIL:
        await notificationService.create(data);
        await this.sendEmail(data);
        break;

      case NotificationChannel.PUSH:
        await notificationService.create(data);
        await this.sendPush(data);
        break;

      case NotificationChannel.SLACK:
        await this.sendSlack(data);
        break;

      default:
        await notificationService.create(data);
    }
  }

  /**
   * Dispatch same notification to multiple users.
   */
  async dispatchBulk(
    userIds: string[],
    data: Omit<CreateNotificationDTO, 'userId'>
  ): Promise<void> {
    const channel = data.channel ?? NotificationChannel.IN_APP;

    // Always persist in-app
    await notificationService.createBulk(userIds, data);

    // Additional channels — send in parallel
    if (channel === NotificationChannel.EMAIL) {
      await Promise.all(userIds.map((uid) => this.sendEmail({ ...data, userId: uid })));
    }
  }

  /**
   * Returns which channels are currently operational.
   */
  getChannelCapabilities(): Record<string, boolean> {
    return {
      in_app: true,
      email: emailAdapter.enabled,
      push: false,
      slack: false,
    };
  }

  // ── Channel Implementations ──────────────────────────────────

  private async sendEmail(data: CreateNotificationDTO): Promise<void> {
    if (!emailAdapter.enabled) {
      logger.warn('[NotificationDispatcher] Email adapter disabled — skipping email send', {
        userId: data.userId,
        title: data.title,
      });
      return;
    }

    // Resolve user email from User model
    let recipientEmail: string | undefined;
    try {
      const User = mongoose.model('User');
      const user = await User.findById(data.userId).select('email').lean() as { email?: string } | null;
      recipientEmail = user?.email;
    } catch {
      logger.warn('[NotificationDispatcher] Could not resolve user email', { userId: data.userId });
    }

    if (!recipientEmail) {
      logger.warn('[NotificationDispatcher] No email address for user — skipping', { userId: data.userId });
      return;
    }

    try {
      const result = await emailAdapter.handleOutbound({
        adapter: 'email',
        action: 'send',
        target: recipientEmail,
        data: {
          eventType: data.type || 'notification',
          eventData: {
            title: data.title,
            message: data.message,
            source: data.source,
            level: data.level,
            relatedEntityId: data.relatedEntityId,
            relatedEntityType: data.relatedEntityType,
            ...(data.metadata || {}),
          },
        },
      });

      if (!result.success) {
        logger.warn('[NotificationDispatcher] Email send failed', { error: result.error, userId: data.userId });
      }
    } catch (err: any) {
      logger.error('[NotificationDispatcher] Email send error', { error: err.message, userId: data.userId });
    }
  }

  private async sendPush(data: CreateNotificationDTO): Promise<void> {
    logger.warn('[NotificationDispatcher] Push notifications not yet implemented — skipping', {
      userId: data.userId,
      title: data.title,
    });
  }

  private async sendSlack(data: CreateNotificationDTO): Promise<void> {
    logger.warn('[NotificationDispatcher] Slack notifications not yet implemented — skipping', {
      userId: data.userId,
      title: data.title,
    });
  }
}

/** Default singleton */
export const notificationDispatcher = new NotificationDispatcher();
