/**
 * Analytics Module — Dashboard Controller
 *
 * Presentation layer for KPI, performance, and analytics endpoints.
 * Delegates to module-owned services.
 */

import { Request, Response } from 'express';
import { DashboardKPIService } from '../services/DashboardKPIService';
import { DashboardPerformanceService } from '../services/DashboardPerformanceService';
import { DashboardAnalyticsService } from '../services/DashboardAnalyticsService';

const kpiService = new DashboardKPIService();
const performanceService = new DashboardPerformanceService();
const analyticsService = new DashboardAnalyticsService();

export async function getKPIs(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;
    const from = dateFrom ? new Date(dateFrom as string) : undefined;
    const to = dateTo ? new Date(dateTo as string) : undefined;
    const kpis = await kpiService.calculateKPIs(from, to);
    return res.json({ success: true, data: kpis });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTeamPerformance(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;
    const from = dateFrom ? new Date(dateFrom as string) : undefined;
    const to = dateTo ? new Date(dateTo as string) : undefined;
    const performance = await performanceService.getTeamPerformance(from, to);
    return res.json({ success: true, data: performance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTopPerformers(req: Request, res: Response) {
  try {
    const { limit, dateFrom, dateTo } = req.query;
    const from = dateFrom ? new Date(dateFrom as string) : undefined;
    const to = dateTo ? new Date(dateTo as string) : undefined;
    const performers = await performanceService.getTopPerformers(
      limit ? parseInt(limit as string, 10) : undefined,
      from,
      to,
    );
    return res.json({ success: true, data: performers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTaskDistribution(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;
    const from = dateFrom ? new Date(dateFrom as string) : undefined;
    const to = dateTo ? new Date(dateTo as string) : undefined;
    const distribution = await analyticsService.getTaskDistribution(from, to);
    return res.json({ success: true, data: distribution });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTimeAnalysis(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;
    const from = dateFrom ? new Date(dateFrom as string) : undefined;
    const to = dateTo ? new Date(dateTo as string) : undefined;
    const analysis = await analyticsService.getTimeAnalysis(from, to);
    return res.json({ success: true, data: analysis });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
