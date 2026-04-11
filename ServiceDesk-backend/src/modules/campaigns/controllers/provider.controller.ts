/**
 * Provider Config Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ProviderConfig from '../models/ProviderConfig';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function listProviders(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { type, isActive } = req.query;
    const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const items = await ProviderConfig.find(filter).sort({ priority: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err: any) {
    logger.error('listProviders error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProvider(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!provider) { res.status(404).json({ success: false, message: 'Provider not found' }); return; }
    // Mask credentials
    const masked = { ...provider, credentials: Object.fromEntries(
      Object.entries(provider.credentials || {}).map(([k]) => [k, '••••••'])
    )};
    res.json({ success: true, data: masked });
  } catch (err: any) {
    logger.error('getProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createProvider(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.create({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    res.status(201).json({ success: true, data: provider.toObject() });
  } catch (err: any) {
    logger.error('createProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProvider(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.findOneAndUpdate(
      { _id: req.params.id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!provider) { res.status(404).json({ success: false, message: 'Provider not found' }); return; }
    res.json({ success: true, data: provider });
  } catch (err: any) {
    logger.error('updateProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteProvider(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.findOneAndDelete({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!provider) { res.status(404).json({ success: false, message: 'Provider not found' }); return; }
    res.json({ success: true, message: 'Provider deleted' });
  } catch (err: any) {
    logger.error('deleteProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function testProvider(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!provider) { res.status(404).json({ success: false, message: 'Provider not found' }); return; }

    // Stub test — will wire to actual provider connectivity test
    provider.lastTestedAt = new Date();
    provider.lastTestSuccess = true;
    await provider.save();

    res.json({ success: true, data: { tested: true, success: true } });
  } catch (err: any) {
    logger.error('testProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function setDefaultProvider(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const provider = await ProviderConfig.findOne({
      _id: req.params.id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!provider) { res.status(404).json({ success: false, message: 'Provider not found' }); return; }

    // Unset other defaults of same type
    await ProviderConfig.updateMany(
      { organizationId: provider.organizationId, type: provider.type, _id: { $ne: provider._id } },
      { $set: { isDefault: false } }
    );

    provider.isDefault = true;
    await provider.save();

    res.json({ success: true, data: provider.toObject() });
  } catch (err: any) {
    logger.error('setDefaultProvider error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
