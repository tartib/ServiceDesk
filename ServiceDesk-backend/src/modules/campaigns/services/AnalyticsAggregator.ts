/**
 * Analytics Aggregator — aggregates MessageEvent into per-campaign and per-channel metrics
 */

import mongoose from 'mongoose';
import Message from '../models/Message';
import MessageEvent from '../models/MessageEvent';
import Campaign from '../models/Campaign';
import { DeliveryStatus, MessageEventType, CampaignChannel } from '../domain/enums';
import logger from '../../../utils/logger';

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  channel: string;
  recipientCount: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  failureRate: number;
}

export interface ChannelAnalytics {
  channel: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

export interface OverviewAnalytics {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgDeliveryRate: number;
  byChannel: ChannelAnalytics[];
}

/**
 * Get analytics for a specific campaign.
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Count events by type
  const eventCounts = await MessageEvent.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = {};
  for (const ec of eventCounts) {
    counts[ec._id] = ec.count;
  }

  const sent = counts[MessageEventType.SENT] || campaign.stats?.sent || 0;
  const delivered = counts[MessageEventType.DELIVERED] || campaign.stats?.delivered || 0;
  const failed = counts[MessageEventType.FAILED] || campaign.stats?.failed || 0;
  const opened = counts[MessageEventType.OPENED] || campaign.stats?.opened || 0;
  const clicked = counts[MessageEventType.CLICKED] || campaign.stats?.clicked || 0;
  const unsubscribed = counts[MessageEventType.UNSUBSCRIBED] || 0;
  const bounced = counts[MessageEventType.BOUNCED] || 0;

  const deliveredBase = delivered || sent; // use sent as fallback for rate calculation

  return {
    campaignId,
    campaignName: campaign.name,
    channel: campaign.channel,
    recipientCount: campaign.recipientCount || 0,
    queued: campaign.stats?.queued || 0,
    sent,
    delivered,
    failed,
    opened,
    clicked,
    unsubscribed,
    bounced,
    openRate: deliveredBase > 0 ? Math.round((opened / deliveredBase) * 10000) / 100 : 0,
    clickRate: deliveredBase > 0 ? Math.round((clicked / deliveredBase) * 10000) / 100 : 0,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 10000) / 100 : 0,
    failureRate: sent > 0 ? Math.round((failed / sent) * 10000) / 100 : 0,
  };
}

/**
 * Get analytics grouped by channel for an organization.
 */
export async function getChannelAnalytics(organizationId: string): Promise<ChannelAnalytics[]> {
  const results = await MessageEvent.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $lookup: {
        from: 'notification_messages',
        localField: 'messageId',
        foreignField: '_id',
        as: 'message',
      },
    },
    { $unwind: '$message' },
    {
      $group: {
        _id: { channel: '$message.channel', eventType: '$eventType' },
        count: { $sum: 1 },
      },
    },
  ]);

  const channelMap: Record<string, Record<string, number>> = {};
  for (const r of results) {
    const ch = r._id.channel;
    if (!channelMap[ch]) channelMap[ch] = {};
    channelMap[ch][r._id.eventType] = r.count;
  }

  return Object.entries(channelMap).map(([channel, counts]) => {
    const sent = counts[MessageEventType.SENT] || 0;
    const delivered = counts[MessageEventType.DELIVERED] || 0;
    const failed = counts[MessageEventType.FAILED] || 0;
    const opened = counts[MessageEventType.OPENED] || 0;
    const clicked = counts[MessageEventType.CLICKED] || 0;
    const base = delivered || sent;

    return {
      channel,
      totalSent: sent,
      totalDelivered: delivered,
      totalFailed: failed,
      totalOpened: opened,
      totalClicked: clicked,
      openRate: base > 0 ? Math.round((opened / base) * 10000) / 100 : 0,
      clickRate: base > 0 ? Math.round((clicked / base) * 10000) / 100 : 0,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 10000) / 100 : 0,
    };
  });
}

/**
 * Get overview analytics for an organization.
 */
export async function getOverviewAnalytics(organizationId: string): Promise<OverviewAnalytics> {
  const orgId = new mongoose.Types.ObjectId(organizationId);

  const [totalCampaigns, byChannel] = await Promise.all([
    Campaign.countDocuments({ organizationId: orgId }),
    getChannelAnalytics(organizationId),
  ]);

  const totalSent = byChannel.reduce((sum, c) => sum + c.totalSent, 0);
  const totalDelivered = byChannel.reduce((sum, c) => sum + c.totalDelivered, 0);
  const totalFailed = byChannel.reduce((sum, c) => sum + c.totalFailed, 0);
  const totalOpened = byChannel.reduce((sum, c) => sum + c.totalOpened, 0);
  const totalClicked = byChannel.reduce((sum, c) => sum + c.totalClicked, 0);
  const base = totalDelivered || totalSent;

  return {
    totalCampaigns,
    totalSent,
    totalDelivered,
    totalFailed,
    totalOpened,
    totalClicked,
    avgOpenRate: base > 0 ? Math.round((totalOpened / base) * 10000) / 100 : 0,
    avgClickRate: base > 0 ? Math.round((totalClicked / base) * 10000) / 100 : 0,
    avgDeliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) / 100 : 0,
    byChannel,
  };
}

/**
 * Refresh stats cache on a campaign document from actual event counts.
 */
export async function refreshCampaignStats(campaignId: string): Promise<void> {
  const analytics = await getCampaignAnalytics(campaignId);

  await Campaign.findByIdAndUpdate(campaignId, {
    'stats.sent': analytics.sent,
    'stats.delivered': analytics.delivered,
    'stats.failed': analytics.failed,
    'stats.opened': analytics.opened,
    'stats.clicked': analytics.clicked,
    'stats.unsubscribed': analytics.unsubscribed,
    'stats.openRate': analytics.openRate,
    'stats.clickRate': analytics.clickRate,
  });
}
