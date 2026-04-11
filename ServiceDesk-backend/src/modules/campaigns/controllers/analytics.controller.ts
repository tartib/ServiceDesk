/**
 * Analytics Controller
 */

import { Request, Response } from 'express';
import {
  getCampaignAnalytics,
  getOverviewAnalytics,
  getChannelAnalytics,
  refreshCampaignStats,
} from '../services/AnalyticsAggregator';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const data = await getOverviewAnalytics(organizationId);
    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('getOverview error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCampaignStats(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const data = await getCampaignAnalytics(req.params.campaignId);
    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('getCampaignStats error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getByChannel(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const data = await getChannelAnalytics(organizationId);
    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('getByChannel error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function refreshStats(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    await refreshCampaignStats(req.params.campaignId);
    res.json({ success: true, message: 'Stats refreshed' });
  } catch (err: any) {
    logger.error('refreshStats error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
