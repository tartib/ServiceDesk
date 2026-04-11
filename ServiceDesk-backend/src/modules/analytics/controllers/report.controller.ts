/**
 * Analytics Module — Report Controller
 *
 * Delegates to reportService for dashboard analytics and periodic reports.
 */

import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/ApiResponse';

export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await reportService.getDashboardAnalytics();
  sendSuccess(req, res, { analytics }, 'Dashboard analytics retrieved successfully');
});

export const getDailyReport = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : undefined;
  const report = await reportService.generateDailyReport(targetDate);
  sendSuccess(req, res, { report }, 'Daily report retrieved successfully');
});

export const getWeeklyReport = asyncHandler(async (req: Request, res: Response) => {
  const { weekStart } = req.query;
  const targetWeekStart = weekStart ? new Date(weekStart as string) : undefined;
  const report = await reportService.generateWeeklyReport(targetWeekStart);
  sendSuccess(req, res, { report }, 'Weekly report retrieved successfully');
});

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query;
  const targetMonth = month ? parseInt(month as string, 10) : undefined;
  const targetYear = year ? parseInt(year as string, 10) : undefined;
  const report = await reportService.generateMonthlyReport(targetMonth, targetYear);
  sendSuccess(req, res, { report }, 'Monthly report retrieved successfully');
});
