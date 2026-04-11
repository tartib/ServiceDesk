/**
 * PM Report Controller
 *
 * Exposes project management analytics endpoints for the unified reports page.
 */

import { Request, Response } from 'express';
import pmReportService from '../services/PmReportService';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/ApiResponse';

export const getPmSummary = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || (req.query.organization_id as string | undefined);
  const summary = await pmReportService.getSummary(organizationId);
  sendSuccess(req, res, summary, 'PM analytics summary retrieved');
});

export const getVelocityTrend = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || (req.query.organization_id as string | undefined);
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const trend = await pmReportService.getVelocityTrend(limit, organizationId);
  sendSuccess(req, res, { trend }, 'Velocity trend retrieved');
});
