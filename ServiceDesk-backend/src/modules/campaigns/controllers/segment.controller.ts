/**
 * Segment Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Segment from '../models/Segment';
import { resolveSegment, previewSegmentCount, previewRulesCount } from '../services/SegmentResolver';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listSegments(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', search, isActive } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Segment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Segment.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listSegments error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSegment(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const segment = await Segment.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!segment) { res.status(404).json({ success: false, message: 'Segment not found' }); return; }
    res.json({ success: true, data: segment });
  } catch (err: any) {
    logger.error('getSegment error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createSegment(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const segment = await Segment.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    res.status(201).json({ success: true, data: segment.toObject() });
  } catch (err: any) {
    logger.error('createSegment error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateSegment(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const segment = await Segment.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!segment) { res.status(404).json({ success: false, message: 'Segment not found' }); return; }
    res.json({ success: true, data: segment });
  } catch (err: any) {
    logger.error('updateSegment error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteSegment(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const segment = await Segment.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!segment) { res.status(404).json({ success: false, message: 'Segment not found' }); return; }
    res.json({ success: true, message: 'Segment deleted' });
  } catch (err: any) {
    logger.error('deleteSegment error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewSegment(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const result = await previewSegmentCount(req.params.id, organizationId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('previewSegment error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewRules(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { rules } = req.body;
    if (!rules || !Array.isArray(rules)) { res.status(400).json({ success: false, message: 'rules array required' }); return; }

    const result = await previewRulesCount(rules);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('previewRules error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
