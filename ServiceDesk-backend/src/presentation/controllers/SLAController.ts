import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import SLA from '../../core/entities/SLA';
import { Priority } from '../../core/types/itsm.types';

export class SLAController {
  /**
   * List all SLAs
   * GET /api/v2/slas
   */
  getSLAs = asyncHandler(async (req: Request, res: Response) => {
    const { priority, is_active, is_default, page = 1, limit = 50 } = req.query;

    const filter: Record<string, any> = {};
    if (priority) filter.priority = priority;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (is_default !== undefined) filter.is_default = is_default === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [slas, total] = await Promise.all([
      SLA.find(filter).sort({ priority: 1 }).skip(skip).limit(Number(limit)),
      SLA.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: slas,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /**
   * Get SLA by ID
   * GET /api/v2/slas/:id
   */
  getSLA = asyncHandler(async (req: Request, res: Response) => {
    const sla = await SLA.findOne({ sla_id: req.params.id });
    if (!sla) {
      res.status(404).json({ success: false, error: 'SLA not found' });
      return;
    }
    res.json({ success: true, data: { sla } });
  });

  /**
   * Get SLA stats
   * GET /api/v2/slas/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const [total, active, defaults] = await Promise.all([
      SLA.countDocuments(),
      SLA.countDocuments({ is_active: true }),
      SLA.countDocuments({ is_default: true }),
    ]);

    const byPriority: Record<string, number> = {};
    for (const p of Object.values(Priority)) {
      byPriority[p] = await SLA.countDocuments({ priority: p, is_active: true });
    }

    res.json({
      success: true,
      data: { total, active, defaults, byPriority },
    });
  });

  /**
   * Create SLA
   * POST /api/v2/slas
   */
  createSLA = asyncHandler(async (req: Request, res: Response) => {
    const sla = await SLA.create(req.body);
    res.status(201).json({
      success: true,
      data: { sla },
      message: 'SLA created successfully',
    });
  });

  /**
   * Update SLA
   * PATCH /api/v2/slas/:id
   */
  updateSLA = asyncHandler(async (req: Request, res: Response) => {
    const sla = await SLA.findOneAndUpdate(
      { sla_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!sla) {
      res.status(404).json({ success: false, error: 'SLA not found' });
      return;
    }
    res.json({
      success: true,
      data: { sla },
      message: 'SLA updated successfully',
    });
  });

  /**
   * Delete SLA
   * DELETE /api/v2/slas/:id
   */
  deleteSLA = asyncHandler(async (req: Request, res: Response) => {
    const sla = await SLA.findOneAndDelete({ sla_id: req.params.id });
    if (!sla) {
      res.status(404).json({ success: false, error: 'SLA not found' });
      return;
    }
    res.json({
      success: true,
      message: 'SLA deleted successfully',
    });
  });
}

export default new SLAController();
