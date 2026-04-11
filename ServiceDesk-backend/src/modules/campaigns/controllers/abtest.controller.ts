/**
 * A/B Test Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ABTest from '../models/ABTest';
import { ABTestStatus } from '../domain/enums';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listABTests(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', status, campaignId } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = new mongoose.Types.ObjectId(campaignId as string);

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ABTest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      ABTest.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listABTests error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getABTest(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const test = await ABTest.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!test) { res.status(404).json({ success: false, message: 'A/B Test not found' }); return; }
    res.json({ success: true, data: test });
  } catch (err: any) {
    logger.error('getABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createABTest(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const test = await ABTest.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: ABTestStatus.DRAFT,
    });

    res.status(201).json({ success: true, data: test.toObject() });
  } catch (err: any) {
    logger.error('createABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateABTest(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: ABTestStatus.DRAFT },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!test) { res.status(404).json({ success: false, message: 'A/B Test not found or not editable' }); return; }
    res.json({ success: true, data: test });
  } catch (err: any) {
    logger.error('updateABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteABTest(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const test = await ABTest.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: ABTestStatus.DRAFT,
    });

    if (!test) { res.status(404).json({ success: false, message: 'A/B Test not found or not deletable' }); return; }
    res.json({ success: true, message: 'A/B Test deleted' });
  } catch (err: any) {
    logger.error('deleteABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function startABTest(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: ABTestStatus.DRAFT },
      { $set: { status: ABTestStatus.RUNNING, startedAt: new Date() } },
      { new: true }
    ).lean();

    if (!test) { res.status(404).json({ success: false, message: 'A/B Test not found or not in draft' }); return; }
    res.json({ success: true, data: test });
  } catch (err: any) {
    logger.error('startABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function completeABTest(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { winnerVariantId } = req.body;
    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: ABTestStatus.RUNNING },
      { $set: { status: ABTestStatus.COMPLETED, completedAt: new Date(), winnerVariantId } },
      { new: true }
    ).lean();

    if (!test) { res.status(404).json({ success: false, message: 'A/B Test not found or not running' }); return; }
    res.json({ success: true, data: test });
  } catch (err: any) {
    logger.error('completeABTest error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
