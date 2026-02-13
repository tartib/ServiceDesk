import { Request, Response } from 'express';
import container from '../infrastructure/di/container';
import logger from '../utils/logger';

export const getAllKPIs = async (req: Request, res: Response) => {
  try {
    const dashboardKPIService = container.resolve('dashboardKPIService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const kpis = await dashboardKPIService.calculateKPIs(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    logger.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getCompletionRate = async (req: Request, res: Response) => {
  try {
    const dashboardKPIService = container.resolve('dashboardKPIService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const completionRate = await dashboardKPIService.calculateCompletionRate(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: { completionRate },
    });
  } catch (error) {
    logger.error('Error fetching completion rate:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getOverdueTasks = async (req: Request, res: Response) => {
  try {
    const dashboardKPIService = container.resolve('dashboardKPIService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const overdueTasks = await dashboardKPIService.getOverdueTasks(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: overdueTasks,
    });
  } catch (error) {
    logger.error('Error fetching overdue tasks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getAverageCompletionTime = async (req: Request, res: Response) => {
  try {
    const dashboardKPIService = container.resolve('dashboardKPIService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const averageTime = await dashboardKPIService.getAverageCompletionTime(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: { averageCompletionTime: averageTime },
    });
  } catch (error) {
    logger.error('Error fetching average completion time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getOnTimeCompletionRate = async (req: Request, res: Response) => {
  try {
    const dashboardKPIService = container.resolve('dashboardKPIService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const onTimeRate = await dashboardKPIService.getOnTimeCompletionRate(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: { onTimeCompletionRate: onTimeRate },
    });
  } catch (error) {
    logger.error('Error fetching on-time completion rate:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};
