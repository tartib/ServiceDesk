/**
 * Notifications Internal API — Facade Implementation
 *
 * Implements INotificationsApi from shared/internal-api/types.ts
 * so other modules can send notifications without importing internals.
 */

import { INotificationsApi } from '../../../shared/internal-api/types';
import { notificationDispatcher } from '../services/NotificationDispatcher';
import {
  NotificationType,
  NotificationSource,
  NotificationLevel,
} from '../domain/interfaces';

export class NotificationsApiImpl implements INotificationsApi {
  readonly moduleName = 'notifications';

  async send(
    userId: string,
    notification: {
      title: string;
      titleAr?: string;
      body: string;
      bodyAr?: string;
      type: string;
      link?: string;
    }
  ): Promise<void> {
    await notificationDispatcher.dispatch({
      userId,
      type: (notification.type as NotificationType) ?? NotificationType.SYSTEM,
      source: NotificationSource.SYSTEM,
      level: NotificationLevel.INFO,
      title: notification.title,
      titleAr: notification.titleAr,
      message: notification.body,
      messageAr: notification.bodyAr,
      actionUrl: notification.link,
    });
  }

  async sendBulk(
    userIds: string[],
    notification: {
      title: string;
      titleAr?: string;
      body: string;
      bodyAr?: string;
      type: string;
      link?: string;
    }
  ): Promise<void> {
    await notificationDispatcher.dispatchBulk(userIds, {
      type: (notification.type as NotificationType) ?? NotificationType.SYSTEM,
      source: NotificationSource.SYSTEM,
      level: NotificationLevel.INFO,
      title: notification.title,
      titleAr: notification.titleAr,
      message: notification.body,
      messageAr: notification.bodyAr,
      actionUrl: notification.link,
    });
  }
}
