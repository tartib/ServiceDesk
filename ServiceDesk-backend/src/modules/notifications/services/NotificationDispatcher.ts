/**
 * Notification Dispatcher
 *
 * Multi-channel dispatch layer. Currently only in-app is implemented;
 * email, push, and Slack are placeholder hooks for future integration.
 */

import { NotificationChannel, CreateNotificationDTO } from '../domain/interfaces';
import { notificationService } from './NotificationService';
import logger from '../../../utils/logger';

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

    // Additional channels (future)
    if (channel === NotificationChannel.EMAIL) {
      for (const uid of userIds) {
        await this.sendEmail({ ...data, userId: uid });
      }
    }
  }

  // ── Channel Implementations (stubs) ──────────────────────────

  private async sendEmail(data: CreateNotificationDTO): Promise<void> {
    // TODO: Integrate with integration layer email adapter
    logger.debug('Email dispatch placeholder', {
      userId: data.userId,
      title: data.title,
    });
  }

  private async sendPush(data: CreateNotificationDTO): Promise<void> {
    // TODO: Integrate with push notification service (FCM / APNs)
    logger.debug('Push dispatch placeholder', {
      userId: data.userId,
      title: data.title,
    });
  }

  private async sendSlack(data: CreateNotificationDTO): Promise<void> {
    // TODO: Integrate with integration layer Slack adapter
    logger.debug('Slack dispatch placeholder', {
      userId: data.userId,
      title: data.title,
    });
  }
}

/** Default singleton */
export const notificationDispatcher = new NotificationDispatcher();
