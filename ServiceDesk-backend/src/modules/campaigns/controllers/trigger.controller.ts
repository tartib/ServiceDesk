/**
 * Trigger Definition Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TriggerDefinition from '../models/TriggerDefinition';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listTriggers(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', event, isEnabled } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (event) filter.event = event;
    if (isEnabled !== undefined) filter.isEnabled = isEnabled === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      TriggerDefinition.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      TriggerDefinition.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listTriggers error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTrigger(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const trigger = await TriggerDefinition.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!trigger) { res.status(404).json({ success: false, message: 'Trigger not found' }); return; }
    res.json({ success: true, data: trigger });
  } catch (err: any) {
    logger.error('getTrigger error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createTrigger(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const trigger = await TriggerDefinition.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    res.status(201).json({ success: true, data: trigger.toObject() });
  } catch (err: any) {
    logger.error('createTrigger error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateTrigger(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const trigger = await TriggerDefinition.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!trigger) { res.status(404).json({ success: false, message: 'Trigger not found' }); return; }
    res.json({ success: true, data: trigger });
  } catch (err: any) {
    logger.error('updateTrigger error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteTrigger(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const trigger = await TriggerDefinition.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!trigger) { res.status(404).json({ success: false, message: 'Trigger not found' }); return; }
    res.json({ success: true, message: 'Trigger deleted' });
  } catch (err: any) {
    logger.error('deleteTrigger error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function toggleTrigger(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const existing = await TriggerDefinition.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    if (!existing) { res.status(404).json({ success: false, message: 'Trigger not found' }); return; }

    existing.isEnabled = !existing.isEnabled;
    await existing.save();
    res.json({ success: true, data: existing.toObject() });
  } catch (err: any) {
    logger.error('toggleTrigger error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
