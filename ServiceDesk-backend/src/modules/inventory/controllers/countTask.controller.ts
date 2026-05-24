import { Request, Response } from 'express';
import * as taskService from '../services/countTaskService';
import { CountTaskStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const generateTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const date = req.body.date ? new Date(req.body.date) : new Date();
  const tasks = await taskService.generateTasksForDate(date, userId);
  res.status(201).json(new ApiResponse(201, `${tasks.length} task(s) generated`, { tasks, count: tasks.length }));
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const filters: taskService.TaskFilters = {
    scheduleId: req.query.scheduleId as string | undefined,
    warehouseId: req.query.warehouseId as string | undefined,
    assignedTo: req.query.assignedTo as string | undefined,
    status: req.query.status as CountTaskStatus | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
  };
  const tasks = await taskService.listTasks(filters);
  res.json(new ApiResponse(200, 'Tasks retrieved', { tasks }));
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const task = await taskService.getTaskById(id);
  res.json(new ApiResponse(200, 'Task retrieved', { task }));
});

export const startTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');
  const { id } = req.params as Record<string, string>;
  const task = await taskService.startTask(id, userId);
  res.json(new ApiResponse(200, 'Task started', { task }));
});

export const updateCountItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, index } = req.params as Record<string, string>;
  const { actualQuantity, notes } = req.body;
  if (actualQuantity === undefined || actualQuantity === null) {
    throw new ApiError(400, 'Actual quantity is required');
  }
  const task = await taskService.updateCountItem(id, parseInt(index, 10), { actualQuantity, notes });
  res.json(new ApiResponse(200, 'Item count updated', { task }));
});

export const updateVarianceReason = asyncHandler(async (req: Request, res: Response) => {
  const { id, index } = req.params as Record<string, string>;
  const varianceReason = typeof req.body.varianceReason === 'string' ? req.body.varianceReason.trim() : '';
  if (!varianceReason) throw new ApiError(400, 'Variance reason is required');
  const task = await taskService.updateVarianceReason(id, parseInt(index, 10), varianceReason);
  res.json(new ApiResponse(200, 'Variance reason updated', { task }));
});

export const submitTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');
  const { id } = req.params as Record<string, string>;
  const task = await taskService.submitTask(id, userId);
  res.json(new ApiResponse(200, 'Task submitted for review', { task }));
});

export const reviewTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');
  const { id } = req.params as Record<string, string>;
  const { action, rejectionReason } = req.body;
  if (!action || !['approve', 'reject'].includes(action)) {
    throw new ApiError(400, 'Action must be "approve" or "reject"');
  }
  const task = await taskService.reviewTask(id, userId, action, rejectionReason);
  res.json(new ApiResponse(200, `Task ${action}d`, { task }));
});
