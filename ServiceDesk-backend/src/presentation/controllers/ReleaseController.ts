import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import Release from '../../core/entities/Release';

export class ReleaseController {
  /**
   * List releases
   * GET /api/v2/releases
   */
  getReleases = asyncHandler(async (req: Request, res: Response) => {
    const { status, type, priority, owner, page = 1, limit = 50 } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (owner) filter['owner.id'] = owner;

    const skip = (Number(page) - 1) * Number(limit);
    const [releases, total] = await Promise.all([
      Release.find(filter).sort({ 'deployment.planned_date': -1 }).skip(skip).limit(Number(limit)),
      Release.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: releases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /**
   * Get release by ID
   * GET /api/v2/releases/:id
   */
  getRelease = asyncHandler(async (req: Request, res: Response) => {
    const release = await Release.findOne({ release_id: req.params.id });
    if (!release) {
      res.status(404).json({ success: false, error: 'Release not found' });
      return;
    }
    res.json({ success: true, data: { release } });
  });

  /**
   * Get release stats
   * GET /api/v2/releases/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const [total, planning, building, testing, approved, deployed, cancelled] = await Promise.all([
      Release.countDocuments(),
      Release.countDocuments({ status: 'planning' }),
      Release.countDocuments({ status: 'building' }),
      Release.countDocuments({ status: 'testing' }),
      Release.countDocuments({ status: 'approved' }),
      Release.countDocuments({ status: 'deployed' }),
      Release.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      success: true,
      data: { total, planning, building, testing, approved, deployed, cancelled },
    });
  });

  /**
   * Create release
   * POST /api/v2/releases
   */
  createRelease = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const body = {
      ...req.body,
      owner: req.body.owner || {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
    };

    const release = await Release.create(body);
    res.status(201).json({
      success: true,
      data: { release },
      message: 'Release created successfully',
    });
  });

  /**
   * Update release
   * PATCH /api/v2/releases/:id
   */
  updateRelease = asyncHandler(async (req: Request, res: Response) => {
    const release = await Release.findOneAndUpdate(
      { release_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!release) {
      res.status(404).json({ success: false, error: 'Release not found' });
      return;
    }
    res.json({
      success: true,
      data: { release },
      message: 'Release updated successfully',
    });
  });

  /**
   * Delete release
   * DELETE /api/v2/releases/:id
   */
  deleteRelease = asyncHandler(async (req: Request, res: Response) => {
    const release = await Release.findOneAndDelete({ release_id: req.params.id });
    if (!release) {
      res.status(404).json({ success: false, error: 'Release not found' });
      return;
    }
    res.json({ success: true, message: 'Release deleted successfully' });
  });
}

export default new ReleaseController();
