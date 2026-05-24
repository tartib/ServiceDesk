/**
 * Analytics Controller — Record aggregation endpoints
 * Section 2, Batch 7
 *
 * GET /api/v2/forms/analytics/records-by-status
 * GET /api/v2/forms/analytics/records-by-type
 * GET /api/v2/forms/analytics/sla-compliance
 * GET /api/v2/forms/analytics/avg-resolution
 * GET /api/v2/forms/analytics/summary
 */

import { Request, Response } from 'express';

export const analyticsController = {
  /** GET /api/v2/forms/analytics/summary — all KPIs in one call */
  async getSummary(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req as any).user?.organizationId;
      if (!orgId) return res.status(400).json({ success: false, error: 'Organization ID required' });

      const RecordItemModel = (await import('../models/RecordItem')).default;
      const { RecordItemStatus } = await import('../models/RecordItem');

      const openStatuses = [
        RecordItemStatus.SUBMITTED,
        RecordItemStatus.UNDER_REVIEW,
        RecordItemStatus.IN_PROGRESS,
        RecordItemStatus.WAITING_CLIENT,
      ];

      const [
        totalOpen,
        totalCompleted,
        totalRecords,
        slaBreached,
        byStatus,
        byWorkspace,
      ] = await Promise.all([
        RecordItemModel.countDocuments({ organizationId: orgId, status: { $in: openStatuses } }),
        RecordItemModel.countDocuments({ organizationId: orgId, status: RecordItemStatus.COMPLETED }),
        RecordItemModel.countDocuments({ organizationId: orgId }),
        RecordItemModel.countDocuments({ organizationId: orgId, 'sla.status': 'breached' }),
        RecordItemModel.aggregate([
          { $match: { organizationId: orgId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        RecordItemModel.aggregate([
          { $match: { organizationId: orgId } },
          { $group: { _id: '$workspaceType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      const slaTotal = totalOpen + totalCompleted;
      const slaCompliance = slaTotal > 0 ? Math.round(((slaTotal - slaBreached) / slaTotal) * 100) : 100;

      // Avg resolution time (completed records only)
      const avgResolutionResult = await RecordItemModel.aggregate([
        {
          $match: {
            organizationId: orgId,
            status: RecordItemStatus.COMPLETED,
            createdAt: { $exists: true },
            updatedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionMs: { $subtract: ['$updatedAt', '$createdAt'] },
          },
        },
        {
          $group: {
            _id: null,
            avgMs: { $avg: '$resolutionMs' },
          },
        },
      ]);
      const avgResolutionHours = avgResolutionResult[0]
        ? Math.round((avgResolutionResult[0].avgMs / (1000 * 60 * 60)) * 10) / 10
        : 0;

      return res.json({
        success: true,
        data: {
          totalOpen,
          totalCompleted,
          totalRecords,
          slaCompliance,
          slaBreached,
          avgResolutionHours,
          byStatus: byStatus.map((s: any) => ({ status: s._id, count: s.count })),
          byWorkspace: byWorkspace
            .filter((w: any) => w._id)
            .map((w: any) => ({ workspaceType: w._id, count: w.count })),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Analytics query failed',
      });
    }
  },

  /** GET /api/v2/forms/analytics/records-by-status */
  async recordsByStatus(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req as any).user?.organizationId;
      if (!orgId) return res.status(400).json({ success: false, error: 'Organization ID required' });

      const RecordItemModel = (await import('../models/RecordItem')).default;
      const result = await RecordItemModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return res.json({
        success: true,
        data: result.map((r: any) => ({ status: r._id, count: r.count })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to aggregate by status' });
    }
  },

  /** GET /api/v2/forms/analytics/records-by-type */
  async recordsByType(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req as any).user?.organizationId;
      if (!orgId) return res.status(400).json({ success: false, error: 'Organization ID required' });

      const RecordItemModel = (await import('../models/RecordItem')).default;
      const result = await RecordItemModel.aggregate([
        { $match: { organizationId: orgId, requestTypeId: { $exists: true } } },
        { $group: { _id: '$requestTypeId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]);

      // Resolve request type names
      const RequestTypeModel = (await import('../models/RequestType')).default;
      const rtIds = result.map((r: any) => r._id);
      const rtDocs = await RequestTypeModel.find({ _id: { $in: rtIds } }).select('name nameAr').lean();
      const rtMap = new Map(rtDocs.map((d: any) => [d._id.toString(), d]));

      return res.json({
        success: true,
        data: result.map((r: any) => {
          const rt = rtMap.get(r._id);
          return {
            requestTypeId: r._id,
            name: rt?.name ?? 'Unknown',
            nameAr: rt?.nameAr ?? '',
            count: r.count,
          };
        }),
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to aggregate by type' });
    }
  },
};
