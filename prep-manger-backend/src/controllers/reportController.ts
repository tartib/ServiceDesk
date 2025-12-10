import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getDashboardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await reportService.getDashboardAnalytics();

  res.status(200).json(
    new ApiResponse(200, 'Dashboard analytics retrieved successfully', { analytics })
  );
});

export const getDailyReport = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : undefined;

  const report = await reportService.generateDailyReport(targetDate);

  res.status(200).json(
    new ApiResponse(200, 'Daily report retrieved successfully', { report })
  );
});

export const getWeeklyReport = asyncHandler(async (req: Request, res: Response) => {
  const { weekStart } = req.query;
  const targetWeekStart = weekStart ? new Date(weekStart as string) : undefined;

  const report = await reportService.generateWeeklyReport(targetWeekStart);

  res.status(200).json(
    new ApiResponse(200, 'Weekly report retrieved successfully', { report })
  );
});

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query;
  const targetMonth = month ? parseInt(month as string, 10) : undefined;
  const targetYear = year ? parseInt(year as string, 10) : undefined;

  const report = await reportService.generateMonthlyReport(targetMonth, targetYear);

  res.status(200).json(
    new ApiResponse(200, 'Monthly report retrieved successfully', { report })
  );
});
