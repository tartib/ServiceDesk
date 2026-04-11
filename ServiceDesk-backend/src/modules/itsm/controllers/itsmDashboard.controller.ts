import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import dashboardService from '../../../core/services/ITSMDashboardService';

export class ITSMDashboardController {
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const data = await dashboardService.getDashboardSummary(site_id as string | undefined);
    res.json({ success: true, data });
  });

  getIncidentKPIs = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const data = await dashboardService.getIncidentKPIs(site_id as string | undefined);
    res.json({ success: true, data });
  });

  getProblemKPIs = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const data = await dashboardService.getProblemKPIs(site_id as string | undefined);
    res.json({ success: true, data });
  });

  getChangeKPIs = asyncHandler(async (req: Request, res: Response) => {
    const { site_id } = req.query;
    const data = await dashboardService.getChangeKPIs(site_id as string | undefined);
    res.json({ success: true, data });
  });

  getSLACompliance = asyncHandler(async (req: Request, res: Response) => {
    const { site_id, days } = req.query;
    const data = await dashboardService.getSLACompliance(days ? parseInt(days as string) : 30, site_id as string | undefined);
    res.json({ success: true, data, count: data.length });
  });

  getIncidentTrend = asyncHandler(async (req: Request, res: Response) => {
    const { site_id, days } = req.query;
    const data = await dashboardService.getIncidentTrend(days ? parseInt(days as string) : 14, site_id as string | undefined);
    res.json({ success: true, data, count: data.length });
  });
}

export default new ITSMDashboardController();
