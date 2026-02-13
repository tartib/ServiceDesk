import { Response } from 'express';
import container from '../../infrastructure/di/container';
import logger from '../../utils/logger';
import { PMAuthRequest, ApiResponse } from '../../types/pm';

export const getDashboardData = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardService = container.resolve('dashboardRefactoredService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const dashboardData = await dashboardService.getDashboardData(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: dashboardData,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' } as ApiResponse);
  }
};

export const getSprintBurndown = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardService = container.resolve('dashboardRefactoredService');
    const { sprintId } = req.params;

    const burndownData = await dashboardService.getSprintBurndown(sprintId);

    res.status(200).json({
      success: true,
      data: burndownData,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get burndown error:', error);
    res.status(500).json({ success: false, error: 'Failed to get burndown data' } as ApiResponse);
  }
};

export const getVelocityChart = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardService = container.resolve('dashboardRefactoredService');
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const velocityData = await dashboardService.getVelocityChart(projectId, limit);

    res.status(200).json({
      success: true,
      data: velocityData,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get velocity error:', error);
    res.status(500).json({ success: false, error: 'Failed to get velocity data' } as ApiResponse);
  }
};

export const getProjectStats = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardService = container.resolve('dashboardRefactoredService');
    const { projectId } = req.params;

    const projectStats = await dashboardService.getProjectStats(projectId);

    res.status(200).json({
      success: true,
      data: projectStats,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get project stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get project stats' } as ApiResponse);
  }
};

export const getCumulativeFlow = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardService = container.resolve('dashboardRefactoredService');
    const { projectId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const cumulativeFlow = await dashboardService.getCumulativeFlow(projectId, days);

    res.status(200).json({
      success: true,
      data: cumulativeFlow,
    } as ApiResponse);
  } catch (error) {
    logger.error('Get cumulative flow error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cumulative flow data' } as ApiResponse);
  }
};
