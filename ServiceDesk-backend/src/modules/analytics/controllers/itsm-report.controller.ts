/**
 * ITSM Report Controller
 *
 * Exposes ITSM analytics endpoints for the unified reports page.
 */

import { Request, Response } from 'express';
import itsmReportService from '../services/ItsmReportService';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/ApiResponse';

export const getItsmSummary = asyncHandler(async (req: Request, res: Response) => {
  const { site_id } = req.query;
  const summary = await itsmReportService.getSummary(site_id as string | undefined);
  sendSuccess(req, res, summary, 'ITSM analytics summary retrieved');
});

export const getIncidentTrend = asyncHandler(async (req: Request, res: Response) => {
  const { site_id, days } = req.query;
  const trend = await itsmReportService.getIncidentTrend(
    days ? parseInt(days as string, 10) : 14,
    site_id as string | undefined,
  );
  sendSuccess(req, res, { trend }, 'Incident trend retrieved');
});

export const getSlaComplianceTrend = asyncHandler(async (req: Request, res: Response) => {
  const { site_id, days } = req.query;
  const trend = await itsmReportService.getSlaComplianceTrend(
    days ? parseInt(days as string, 10) : 30,
    site_id as string | undefined,
  );
  sendSuccess(req, res, { trend }, 'SLA compliance trend retrieved');
});
