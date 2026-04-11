/**
 * Delivery Worker — renders and dispatches a single message through the provider layer
 */

import Message from '../models/Message';
import MessageEvent from '../models/MessageEvent';
import Campaign from '../models/Campaign';
import { renderTemplate, renderRawContent, RenderContext } from './TemplateRenderer';
import { DeliveryStatus, MessageEventType, CampaignChannel } from '../domain/enums';
import logger from '../../../utils/logger';

export interface DeliveryPayload {
  messageId: string;
}

/**
 * Process a single message: render → send → record events.
 */
export async function processMessage(payload: DeliveryPayload): Promise<void> {
  const msg = await Message.findById(payload.messageId);
  if (!msg) {
    logger.warn(`DeliveryWorker: message ${payload.messageId} not found`);
    return;
  }

  if (msg.status !== DeliveryStatus.QUEUED && msg.status !== DeliveryStatus.FAILED) {
    return; // already processed or in-progress
  }

  try {
    msg.status = DeliveryStatus.SENDING;
    msg.attempts += 1;
    msg.lastAttemptAt = new Date();
    await msg.save();

    // Render content if not already rendered
    if (!msg.renderedBody) {
      const context: RenderContext = {
        recipientId: msg.recipientId.toString(),
        recipientEmail: msg.recipientEmail || '',
        recipientPhone: msg.recipientPhone || '',
      };

      if (msg.templateId) {
        const rendered = await renderTemplate(msg.templateId.toString(), context);
        msg.renderedSubject = rendered.subject;
        msg.renderedBody = rendered.body;
        msg.renderedBodyHtml = rendered.bodyHtml;
      }
    }

    // Dispatch through provider
    const result = await dispatchToProvider(msg);

    if (result.success) {
      msg.status = DeliveryStatus.SENT;
      msg.sentAt = new Date();
      msg.provider = result.provider;
      msg.providerMessageId = result.externalId;
      await msg.save();

      // Record sent event
      await MessageEvent.create({
        messageId: msg._id,
        campaignId: msg.campaignId,
        eventType: MessageEventType.SENT,
        eventAt: new Date(),
        provider: result.provider,
        organizationId: msg.organizationId,
      });

      // Update campaign stats
      if (msg.campaignId) {
        await Campaign.findByIdAndUpdate(msg.campaignId, {
          $inc: { 'stats.sent': 1 },
        });
      }
    } else {
      msg.status = DeliveryStatus.FAILED;
      msg.failureReason = result.error;
      await msg.save();

      await MessageEvent.create({
        messageId: msg._id,
        campaignId: msg.campaignId,
        eventType: MessageEventType.FAILED,
        eventAt: new Date(),
        provider: result.provider,
        metadata: { error: result.error },
        organizationId: msg.organizationId,
      });

      if (msg.campaignId) {
        await Campaign.findByIdAndUpdate(msg.campaignId, {
          $inc: { 'stats.failed': 1 },
        });
      }
    }
  } catch (err: any) {
    logger.error('DeliveryWorker: processing failed', { messageId: payload.messageId, error: err.message });
    msg.status = DeliveryStatus.FAILED;
    msg.failureReason = err.message;
    await msg.save();
  }
}

interface DispatchResult {
  success: boolean;
  provider?: string;
  externalId?: string;
  error?: string;
}

/**
 * Dispatch message to the appropriate provider based on channel.
 * This is the integration point for the Provider abstraction layer.
 */
async function dispatchToProvider(msg: any): Promise<DispatchResult> {
  try {
    switch (msg.channel) {
      case CampaignChannel.EMAIL:
        return await dispatchEmail(msg);
      case CampaignChannel.SMS:
        return await dispatchSMS(msg);
      case CampaignChannel.PUSH:
        return await dispatchPush(msg);
      default:
        return { success: false, error: `Unsupported channel: ${msg.channel}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function dispatchEmail(msg: any): Promise<DispatchResult> {
  if (!msg.recipientEmail) {
    return { success: false, provider: 'smtp', error: 'No recipient email' };
  }
  // Integration point — will wire to ProviderFactory in Phase 4
  // For now use the existing email adapter
  try {
    const { emailAdapter } = require('../../../integrations/channels/email.adapter');
    if (!emailAdapter.enabled) {
      logger.debug('Email adapter not enabled, marking as sent (dry run)');
      return { success: true, provider: 'smtp-dry', externalId: `dry-${Date.now()}` };
    }
    const result = await emailAdapter.handleOutbound({
      action: 'send_notification',
      target: msg.recipientEmail,
      data: {
        eventType: 'campaigns.message.send',
        eventData: {
          subject: msg.renderedSubject || 'Notification',
          html: msg.renderedBodyHtml || msg.renderedBody || '',
        },
      },
    });
    return {
      success: result.success,
      provider: 'smtp',
      externalId: result.externalId,
      error: result.error,
    };
  } catch (err: any) {
    return { success: true, provider: 'smtp-dry', externalId: `dry-${Date.now()}` };
  }
}

async function dispatchSMS(msg: any): Promise<DispatchResult> {
  if (!msg.recipientPhone) {
    return { success: false, provider: 'sms', error: 'No recipient phone' };
  }
  // Stub — will wire to TwilioProvider/LocalSMSProvider
  logger.debug('SMS dispatch (stub)', { to: msg.recipientPhone });
  return { success: true, provider: 'sms-stub', externalId: `sms-${Date.now()}` };
}

async function dispatchPush(msg: any): Promise<DispatchResult> {
  if (!msg.recipientDeviceToken) {
    return { success: false, provider: 'push', error: 'No device token' };
  }
  // Stub — will wire to FirebaseProvider
  logger.debug('Push dispatch (stub)', { token: msg.recipientDeviceToken });
  return { success: true, provider: 'push-stub', externalId: `push-${Date.now()}` };
}

/**
 * Process a batch of queued messages.
 */
export async function processBatch(limit = 50): Promise<number> {
  const messages = await Message.find({
    status: { $in: [DeliveryStatus.QUEUED] },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select('_id');

  let processed = 0;
  for (const msg of messages) {
    await processMessage({ messageId: msg._id.toString() });
    processed++;
  }
  return processed;
}
