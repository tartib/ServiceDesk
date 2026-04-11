/**
 * User Preference Controller
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserPreference from '../models/UserPreference';
import logger from '../../../utils/logger';

function getAuth(req: Request) {
  const user = (req as any).user;
  return { userId: user?.userId, organizationId: user?.organizationId };
}

export async function getMyPreferences(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    let prefs: any = await UserPreference.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!prefs) {
      const created = await UserPreference.create({
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      });
      prefs = created.toObject();
    }

    res.json({ success: true, data: prefs });
  } catch (err: any) {
    logger.error('getMyPreferences error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMyPreferences(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = getAuth(req);
    if (!userId || !organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const prefs = await UserPreference.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      { $set: req.body },
      { new: true, upsert: true }
    ).lean();

    res.json({ success: true, data: prefs });
  } catch (err: any) {
    logger.error('updateMyPreferences error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getUserPreferences(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId } = getAuth(req);
    if (!organizationId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const prefs = await UserPreference.findOne({
      userId: new mongoose.Types.ObjectId(req.params.userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    if (!prefs) { res.status(404).json({ success: false, message: 'Preferences not found' }); return; }
    res.json({ success: true, data: prefs });
  } catch (err: any) {
    logger.error('getUserPreferences error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    // Token would be a JWT or signed token containing userId + orgId
    // For now, accept userId + organizationId in body
    const { userId, organizationId, channel } = req.body;

    if (!userId || !organizationId) {
      res.status(400).json({ success: false, message: 'userId and organizationId required' });
      return;
    }

    const update: any = {};
    if (channel === 'email') update.emailEnabled = false;
    else if (channel === 'sms') update.smsEnabled = false;
    else if (channel === 'push') update.pushEnabled = false;
    else update.marketingEnabled = false;

    await UserPreference.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      { $set: update },
      { upsert: true }
    );

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err: any) {
    logger.error('unsubscribe error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
}
