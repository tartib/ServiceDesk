/**
 * Journey Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Journey from '../models/Journey';
import JourneyInstance from '../models/JourneyInstance';
import { JourneyStatus } from '../domain/enums';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listJourneys(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', status, search } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Journey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Journey.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listJourneys error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found' }); return; }
    res.json({ success: true, data: journey });
  } catch (err: any) {
    logger.error('getJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createJourney(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: JourneyStatus.DRAFT,
    });

    res.status(201).json({ success: true, data: journey.toObject() });
  } catch (err: any) {
    logger.error('createJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: { $in: [JourneyStatus.DRAFT, JourneyStatus.PAUSED] } },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found or not editable' }); return; }
    res.json({ success: true, data: journey });
  } catch (err: any) {
    logger.error('updateJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: JourneyStatus.DRAFT,
    });

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found or not deletable' }); return; }
    res.json({ success: true, message: 'Journey deleted' });
  } catch (err: any) {
    logger.error('deleteJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function publishJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: JourneyStatus.DRAFT },
      { $set: { status: JourneyStatus.PUBLISHED, publishedAt: new Date() } },
      { new: true }
    ).lean();

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found or not in draft' }); return; }
    res.json({ success: true, data: journey });
  } catch (err: any) {
    logger.error('publishJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function pauseJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId), status: JourneyStatus.PUBLISHED },
      { $set: { status: JourneyStatus.PAUSED } },
      { new: true }
    ).lean();

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found or not active' }); return; }
    res.json({ success: true, data: journey });
  } catch (err: any) {
    logger.error('pauseJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function archiveJourney(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: { status: JourneyStatus.ARCHIVED } },
      { new: true }
    ).lean();

    if (!journey) { res.status(404).json({ success: false, message: 'Journey not found' }); return; }
    res.json({ success: true, data: journey });
  } catch (err: any) {
    logger.error('archiveJourney error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getJourneyInstances(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '50', status } = req.query;
    const filter: any = {
      journeyId: new mongoose.Types.ObjectId(req.params.id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      JourneyInstance.find(filter).sort({ enteredAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      JourneyInstance.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err: any) {
    logger.error('getJourneyInstances error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
