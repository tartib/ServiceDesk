/**
 * Campaign Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign';
import Message from '../models/Message';
import { CampaignStatus, CampaignMode } from '../domain/enums';
import { executeCampaign, sendTestMessage } from '../services/CampaignOrchestrator';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return {
    userId: user?.userId,
    organizationId: user?.organizationId,
  };
}

/**
 * GET / — list campaigns
 */
export async function listCampaigns(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', status, channel, mode, search } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (mode) filter.mode = mode;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Campaign.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listCampaigns error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /:id — get single campaign
 */
export async function getCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('getCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST / — create campaign
 */
export async function createCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: CampaignStatus.DRAFT,
    });

    res.status(201).json({ success: true, data: campaign.toObject() });
  } catch (err: any) {
    logger.error('createCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /:id — update campaign
 */
export async function updateCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: { $in: [CampaignStatus.DRAFT, CampaignStatus.PAUSED] } },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not editable' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('updateCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /:id — delete campaign (draft only)
 */
export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: CampaignStatus.DRAFT,
    });

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not deletable' }); return; }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err: any) {
    logger.error('deleteCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/schedule — schedule a campaign
 */
export async function scheduleCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { sendAt } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: CampaignStatus.DRAFT },
      { $set: { status: CampaignStatus.SCHEDULED, sendAt: sendAt ? new Date(sendAt) : new Date(), mode: CampaignMode.SCHEDULED } },
      { new: true }
    ).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not in draft' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('scheduleCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/send — execute a campaign immediately
 */
export async function sendCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    // Verify ownership
    const existing = await Campaign.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Campaign not found' }); return; }

    const result = await executeCampaign(req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('sendCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/pause — pause a running campaign
 */
export async function pauseCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: CampaignStatus.RUNNING },
      { $set: { status: CampaignStatus.PAUSED } },
      { new: true }
    ).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not running' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('pauseCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/resume — resume a paused campaign
 */
export async function resumeCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: CampaignStatus.PAUSED },
      { $set: { status: CampaignStatus.RUNNING } },
      { new: true }
    ).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not paused' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('resumeCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/cancel — cancel a campaign
 */
export async function cancelCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: { $in: [CampaignStatus.SCHEDULED, CampaignStatus.RUNNING, CampaignStatus.PAUSED] } },
      { $set: { status: CampaignStatus.CANCELLED } },
      { new: true }
    ).lean();

    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found or not cancellable' }); return; }
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    logger.error('cancelCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /:id/test — send a test message
 */
export async function testCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { recipientEmail } = req.body;
    if (!recipientEmail) { res.status(400).json({ success: false, message: 'recipientEmail required' }); return; }

    const result = await sendTestMessage(req.params.id, recipientEmail);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('testCampaign error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /:id/messages — list messages for a campaign
 */
export async function listCampaignMessages(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '50', status } = req.query;
    const filter: any = {
      campaignId: new mongoose.Types.ObjectId(req.params.id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Message.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err: any) {
    logger.error('listCampaignMessages error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
