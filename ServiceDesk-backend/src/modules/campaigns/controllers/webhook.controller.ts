/**
 * Webhook Controller — receives provider callback events (delivery, open, click, bounce, etc.)
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import MessageEvent from '../models/MessageEvent';
import Campaign from '../models/Campaign';
import { DeliveryStatus, MessageEventType } from '../domain/enums';
import logger from '../../../utils/logger';

/**
 * POST /webhooks/:provider — generic provider webhook handler
 */
export async function handleProviderWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const payload = req.body;

    logger.debug('Webhook received', { provider, payload: JSON.stringify(payload).slice(0, 500) });

    // Extract event type and message ID from provider-specific payload
    const { eventType, providerMessageId, metadata } = normalizeWebhookPayload(provider, payload);

    if (!eventType || !providerMessageId) {
      res.status(200).json({ success: true, message: 'Ignored — missing event data' });
      return;
    }

    // Find the message by provider message ID
    const message = await Message.findOne({ providerMessageId });
    if (!message) {
      logger.warn('Webhook: message not found for providerMessageId', { providerMessageId, provider });
      res.status(200).json({ success: true, message: 'Message not found' });
      return;
    }

    // Record the event
    await MessageEvent.create({
      messageId: message._id,
      campaignId: message.campaignId,
      eventType,
      eventAt: new Date(),
      provider,
      rawPayload: payload,
      metadata,
      organizationId: message.organizationId,
    });

    // Update message status
    const statusUpdate: any = {};
    switch (eventType) {
      case MessageEventType.DELIVERED:
        statusUpdate.status = DeliveryStatus.DELIVERED;
        statusUpdate.deliveredAt = new Date();
        break;
      case MessageEventType.OPENED:
        statusUpdate.openedAt = new Date();
        break;
      case MessageEventType.CLICKED:
        statusUpdate.clickedAt = new Date();
        break;
      case MessageEventType.BOUNCED:
      case MessageEventType.FAILED:
        statusUpdate.status = DeliveryStatus.FAILED;
        statusUpdate.failureReason = metadata?.reason || 'Provider reported failure';
        break;
    }

    if (Object.keys(statusUpdate).length > 0) {
      await Message.findByIdAndUpdate(message._id, { $set: statusUpdate });
    }

    // Update campaign stats
    if (message.campaignId) {
      const statsInc: any = {};
      if (eventType === MessageEventType.DELIVERED) statsInc['stats.delivered'] = 1;
      if (eventType === MessageEventType.OPENED) statsInc['stats.opened'] = 1;
      if (eventType === MessageEventType.CLICKED) statsInc['stats.clicked'] = 1;
      if (eventType === MessageEventType.UNSUBSCRIBED) statsInc['stats.unsubscribed'] = 1;

      if (Object.keys(statsInc).length > 0) {
        await Campaign.findByIdAndUpdate(message.campaignId, { $inc: statsInc });
      }
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    logger.error('handleProviderWebhook error', { error: err.message });
    res.status(200).json({ success: true }); // Always 200 to prevent provider retries
  }
}

/**
 * Normalize provider-specific payload to common format.
 */
function normalizeWebhookPayload(
  provider: string,
  payload: any
): { eventType?: MessageEventType; providerMessageId?: string; metadata?: Record<string, unknown> } {
  switch (provider) {
    case 'sendgrid':
      return normalizeSendgrid(payload);
    case 'ses':
    case 'aws-ses':
      return normalizeSES(payload);
    case 'twilio':
      return normalizeTwilio(payload);
    default:
      // Generic fallback
      return {
        eventType: mapGenericEventType(payload.event || payload.eventType),
        providerMessageId: payload.messageId || payload.providerMessageId || payload.id,
        metadata: payload,
      };
  }
}

function normalizeSendgrid(payload: any) {
  const events: Record<string, MessageEventType> = {
    delivered: MessageEventType.DELIVERED,
    open: MessageEventType.OPENED,
    click: MessageEventType.CLICKED,
    bounce: MessageEventType.BOUNCED,
    dropped: MessageEventType.FAILED,
    unsubscribe: MessageEventType.UNSUBSCRIBED,
    spamreport: MessageEventType.COMPLAINED,
  };

  const firstEvent = Array.isArray(payload) ? payload[0] : payload;
  return {
    eventType: events[firstEvent?.event],
    providerMessageId: firstEvent?.sg_message_id?.split('.')[0],
    metadata: { email: firstEvent?.email, reason: firstEvent?.reason },
  };
}

function normalizeSES(payload: any) {
  const events: Record<string, MessageEventType> = {
    Delivery: MessageEventType.DELIVERED,
    Open: MessageEventType.OPENED,
    Click: MessageEventType.CLICKED,
    Bounce: MessageEventType.BOUNCED,
    Complaint: MessageEventType.COMPLAINED,
  };

  const notificationType = payload.notificationType || payload.eventType;
  return {
    eventType: events[notificationType],
    providerMessageId: payload.mail?.messageId,
    metadata: payload,
  };
}

function normalizeTwilio(payload: any) {
  const events: Record<string, MessageEventType> = {
    delivered: MessageEventType.DELIVERED,
    failed: MessageEventType.FAILED,
    undelivered: MessageEventType.FAILED,
  };

  return {
    eventType: events[payload.MessageStatus] || events[payload.SmsStatus],
    providerMessageId: payload.MessageSid || payload.SmsSid,
    metadata: { errorCode: payload.ErrorCode, errorMessage: payload.ErrorMessage },
  };
}

function mapGenericEventType(event?: string): MessageEventType | undefined {
  if (!event) return undefined;
  const map: Record<string, MessageEventType> = {
    delivered: MessageEventType.DELIVERED,
    opened: MessageEventType.OPENED,
    open: MessageEventType.OPENED,
    clicked: MessageEventType.CLICKED,
    click: MessageEventType.CLICKED,
    bounced: MessageEventType.BOUNCED,
    bounce: MessageEventType.BOUNCED,
    failed: MessageEventType.FAILED,
    unsubscribed: MessageEventType.UNSUBSCRIBED,
    complained: MessageEventType.COMPLAINED,
  };
  return map[event.toLowerCase()];
}
