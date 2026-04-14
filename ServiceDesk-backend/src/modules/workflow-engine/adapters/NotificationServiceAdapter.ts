/**
 * NotificationServiceAdapter
 *
 * Bridges IWFNotificationService → NotificationDispatcher + EmailAdapter.
 * Used by ActionExecutor for NOTIFY / SEND_EMAIL actions.
 */

import type { IWFNotificationService } from '../engine/ActionExecutor';
import { notificationDispatcher } from '../../notifications/services/NotificationDispatcher';
import {
  NotificationType,
  NotificationSource,
  NotificationLevel,
  NotificationChannel,
} from '../../notifications/domain/interfaces';
import { emailAdapter } from '../../../integrations/channels/email.adapter';
import logger from '../../../utils/logger';

export class NotificationServiceAdapter implements IWFNotificationService {
  async send(params: {
    to: string;
    template: string;
    data: Record<string, any>;
    channel?: 'email' | 'push' | 'in_app' | 'sms';
  }): Promise<void> {
    const { to, template, data, channel } = params;

    // Always create in-app notification
    try {
      await notificationDispatcher.dispatch({
        userId: to,
        type: NotificationType.SYSTEM,
        source: NotificationSource.WORKFLOW,
        level: NotificationLevel.INFO,
        channel: this.mapChannel(channel),
        title: data.definitionName || template || 'Workflow Notification',
        message: this.buildMessage(template, data),
        relatedEntityId: data.entityId,
        relatedEntityType: data.entityType,
        organizationId: data.organizationId,
        metadata: data,
      });
    } catch (err: any) {
      logger.error('[NotificationServiceAdapter] dispatch failed', { error: err.message, to, template });
      throw err;
    }

    // If channel is explicitly email, also send via email adapter
    if (channel === 'email' && emailAdapter.enabled) {
      try {
        await emailAdapter.handleOutbound({
          adapter: 'email',
          action: 'send',
          target: to, // userId — caller should resolve to email beforehand
          data: {
            eventType: template,
            eventData: data,
          },
        });
      } catch (err: any) {
        logger.warn('[NotificationServiceAdapter] email send failed (non-fatal)', { error: err.message });
      }
    }
  }

  private mapChannel(channel?: string): NotificationChannel {
    switch (channel) {
      case 'email': return NotificationChannel.EMAIL;
      case 'push': return NotificationChannel.PUSH;
      case 'in_app': return NotificationChannel.IN_APP;
      default: return NotificationChannel.IN_APP;
    }
  }

  private buildMessage(template: string, data: Record<string, any>): string {
    const entity = data.entityType ? `${data.entityType} ${data.entityId || ''}` : '';
    const state = data.currentState ? `State: ${data.currentState}` : '';
    return [template, entity, state].filter(Boolean).join(' — ');
  }
}
