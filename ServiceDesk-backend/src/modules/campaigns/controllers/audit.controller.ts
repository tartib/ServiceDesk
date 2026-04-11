/**
 * Audit Log Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AuditEntry from '../models/AuditEntry';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listAuditEntries(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { page = '1', limit = '50', entityType, entityId, action, performedBy } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = new mongoose.Types.ObjectId(entityId as string);
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = new mongoose.Types.ObjectId(performedBy as string);

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditEntry.find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)).lean(),
      AuditEntry.countDocuments(filter),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err: any) {
    logger.error('listAuditEntries error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEntityAuditTrail(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const items = await AuditEntry.find({
      entityId: new mongoose.Types.ObjectId(req.params.entityId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: items });
  } catch (err: any) {
    logger.error('getEntityAuditTrail error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
