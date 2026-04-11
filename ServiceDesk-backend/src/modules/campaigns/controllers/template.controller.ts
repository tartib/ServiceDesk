/**
 * Template Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import NotificationTemplate from '../models/NotificationTemplate';
import { previewTemplate } from '../services/TemplateRenderer';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listTemplates(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '20', channel, search, isActive } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (channel) filter.channel = channel;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      NotificationTemplate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      NotificationTemplate.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listTemplates error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const template = await NotificationTemplate.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, data: template });
  } catch (err: any) {
    logger.error('getTemplate error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const template = await NotificationTemplate.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    res.status(201).json({ success: true, data: template.toObject() });
  } catch (err: any) {
    logger.error('createTemplate error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const template = await NotificationTemplate.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, data: template });
  } catch (err: any) {
    logger.error('updateTemplate error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const template = await NotificationTemplate.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, message: 'Template deleted' });
  } catch (err: any) {
    logger.error('deleteTemplate error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewTemplateEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const result = await previewTemplate(req.params.id, req.body.sampleData);
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('previewTemplate error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
