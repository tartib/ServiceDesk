/**
 * Campaign Orchestrator — creates messages for campaign recipients, enqueues to delivery pipeline
 */

import mongoose from 'mongoose';
import Campaign from '../models/Campaign';
import Message from '../models/Message';
import MessageEvent from '../models/MessageEvent';
import { resolveSegment } from './SegmentResolver';
import { renderTemplate, renderRawContent, RenderContext } from './TemplateRenderer';
import { processBatch } from './DeliveryWorker';
import {
  CampaignStatus,
  DeliveryStatus,
  MessageEventType,
  CampaignMode,
} from '../domain/enums';
import logger from '../../../utils/logger';

/**
 * Execute a campaign: resolve audience → create messages → trigger delivery.
 */
export async function executeCampaign(campaignId: string): Promise<{
  recipientCount: number;
  messagesCreated: number;
}> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (campaign.status !== CampaignStatus.SCHEDULED && campaign.status !== CampaignStatus.DRAFT) {
    throw new Error(`Campaign ${campaignId} is in status ${campaign.status}, cannot execute`);
  }

  // Transition to running
  campaign.status = CampaignStatus.RUNNING;
  campaign.sentAt = new Date();
  await campaign.save();

  try {
    // Resolve recipients
    let userIds: string[] = [];

    if (campaign.segmentId) {
      const result = await resolveSegment(
        campaign.segmentId.toString(),
        campaign.organizationId.toString()
      );
      userIds = result.userIds;
    } else {
      // No segment = all active users in organization (fallback)
      const User = mongoose.model('User');
      const users = await User.find({ is_active: true })
        .select('_id email phone fcm_token')
        .limit(50000)
        .lean();
      userIds = users.map((u: any) => String(u._id));
    }

    campaign.recipientCount = userIds.length;
    campaign.stats.queued = userIds.length;
    await campaign.save();

    // Create messages in batches
    const batchSize = 500;
    let messagesCreated = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Fetch user details for the batch
      const User = mongoose.model('User');
      const users = await User.find({ _id: { $in: batch } })
        .select('_id email phone fcm_token')
        .lean();

      const messageDocs = users.map((user: any) => ({
        campaignId: campaign._id,
        recipientId: user._id,
        recipientEmail: user.email,
        recipientPhone: user.phone,
        recipientDeviceToken: user.fcm_token,
        templateId: campaign.templateId,
        renderedSubject: campaign.subject,
        renderedBody: campaign.body,
        renderedBodyHtml: campaign.bodyHtml,
        channel: campaign.channel,
        status: DeliveryStatus.QUEUED,
        organizationId: campaign.organizationId,
      }));

      await Message.insertMany(messageDocs, { ordered: false });
      messagesCreated += messageDocs.length;
    }

    logger.info(`Campaign ${campaignId}: ${messagesCreated} messages created for ${userIds.length} recipients`);

    // Start processing (async — don't await completion)
    processMessagesAsync(campaignId).catch((err) => {
      logger.error(`Campaign ${campaignId}: async processing failed`, { error: err.message });
    });

    return { recipientCount: userIds.length, messagesCreated };
  } catch (err: any) {
    campaign.status = CampaignStatus.FAILED;
    await campaign.save();
    throw err;
  }
}

/**
 * Process all queued messages for a campaign in background.
 */
async function processMessagesAsync(campaignId: string): Promise<void> {
  const batchSize = 100;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const messages = await Message.find({
      campaignId,
      status: DeliveryStatus.QUEUED,
    })
      .sort({ createdAt: 1 })
      .limit(batchSize)
      .select('_id');

    if (messages.length === 0) {
      hasMore = false;
      break;
    }

    for (const msg of messages) {
      try {
        const { processMessage } = require('./DeliveryWorker');
        await processMessage({ messageId: msg._id.toString() });
        processed++;
      } catch (err: any) {
        logger.error(`Failed to process message ${msg._id}`, { error: err.message });
      }
    }
  }

  // Mark campaign as completed
  const campaign = await Campaign.findById(campaignId);
  if (campaign && campaign.status === CampaignStatus.RUNNING) {
    // Recalculate stats
    const [sentCount, deliveredCount, failedCount] = await Promise.all([
      Message.countDocuments({ campaignId, status: DeliveryStatus.SENT }),
      Message.countDocuments({ campaignId, status: DeliveryStatus.DELIVERED }),
      Message.countDocuments({ campaignId, status: DeliveryStatus.FAILED }),
    ]);

    campaign.stats.sent = sentCount;
    campaign.stats.delivered = deliveredCount;
    campaign.stats.failed = failedCount;
    campaign.status = CampaignStatus.COMPLETED;
    campaign.completedAt = new Date();
    await campaign.save();

    logger.info(`Campaign ${campaignId}: completed. sent=${sentCount} delivered=${deliveredCount} failed=${failedCount}`);
  }
}

/**
 * Send a test message for a campaign to a specific user.
 */
export async function sendTestMessage(
  campaignId: string,
  recipientEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  const msg = await Message.create({
    campaignId: campaign._id,
    recipientId: new mongoose.Types.ObjectId(), // test placeholder
    recipientEmail,
    templateId: campaign.templateId,
    renderedSubject: campaign.subject || 'Test Campaign',
    renderedBody: campaign.body || 'Test message body',
    renderedBodyHtml: campaign.bodyHtml,
    channel: campaign.channel,
    status: DeliveryStatus.QUEUED,
    organizationId: campaign.organizationId,
  });

  const { processMessage } = require('./DeliveryWorker');
  await processMessage({ messageId: msg._id.toString() });

  const updated = await Message.findById(msg._id).lean();
  return {
    success: updated?.status === DeliveryStatus.SENT,
    messageId: msg._id.toString(),
    error: updated?.failureReason,
  };
}
