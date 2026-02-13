import { Request, Response } from 'express';
import container from '../infrastructure/di/container';
import logger from '../utils/logger';

const generateErrorId = () => `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getTeamPerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const teamPerformance = await dashboardPerformanceService.getTeamPerformance(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: teamPerformance,
    });
  } catch (error) {
    logger.error('Error fetching team performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getTopPerformers = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 5;
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const topPerformers = await dashboardPerformanceService.getTopPerformers(limit, dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: topPerformers,
    });
  } catch (error) {
    logger.error('Error fetching top performers', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getMemberPerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { memberId } = req.params;
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const memberPerformance = await dashboardPerformanceService.getMemberPerformance(memberId, dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: memberPerformance,
    });
  } catch (error) {
    logger.error('Error fetching member performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getActiveMembers = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const activeMembers = await dashboardPerformanceService.getActiveMembers(dateFrom, dateTo);

    res.status(200).json({
      success: true,
      data: activeMembers,
    });
  } catch (error) {
    logger.error('Error fetching active members', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const recordPerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { employeeId, rating, comments } = req.body;

    const performance = await dashboardPerformanceService.recordPerformance({
      employeeId,
      rating,
      comments,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'تم تسجيل الأداء بنجاح',
      data: performance,
    });
  } catch (error) {
    logger.error('Error recording performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getPerformanceHistory = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { employeeId } = req.params;

    const history = await dashboardPerformanceService.getPerformanceHistory(employeeId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'تم جلب سجل الأداء بنجاح',
      data: history,
    });
  } catch (error) {
    logger.error('Error fetching performance history', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getMonthlyPerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { employeeId, month, year } = req.params;

    const performance = await dashboardPerformanceService.getMonthlyPerformance(
      employeeId,
      parseInt(month),
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'تم جلب بيانات الأداء بنجاح',
      data: performance,
    });
  } catch (error) {
    logger.error('Error fetching monthly performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const updatePerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { id } = req.params;
    const { rating, comments } = req.body;

    const performance = await dashboardPerformanceService.updatePerformance(id, {
      rating,
      comments,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'تم تحديث الأداء بنجاح',
      data: performance,
    });
  } catch (error) {
    logger.error('Error updating performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const deletePerformance = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const dashboardPerformanceService = container.resolve('dashboardPerformanceService');
    const { id } = req.params;

    await dashboardPerformanceService.deletePerformance(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'تم حذف الأداء بنجاح',
    });
  } catch (error) {
    logger.error('Error deleting performance', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};
