import { Request, Response } from 'express';
import * as scheduleService from '../services/countScheduleService';
import { CountFrequency, ScheduleStatus } from '../types';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';
import ApiError from '../../../utils/ApiError';

export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'User not authenticated');

  const { name, frequency, warehouseId, itemIds, assignedTo, startDate, dueTime, weeklyDay, varianceThreshold, notes } = req.body;
  if (!name || !frequency || !warehouseId || !assignedTo || !startDate || !dueTime) {
    throw new ApiError(400, 'Missing required fields');
  }

  const schedule = await scheduleService.createSchedule({
    name, frequency, warehouseId, itemIds, assignedTo, startDate, dueTime, weeklyDay, varianceThreshold, notes, userId,
  });
  res.status(201).json(new ApiResponse(201, 'Schedule created', { schedule }));
});

export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const filters: scheduleService.ScheduleFilters = {
    warehouseId: req.query.warehouseId as string | undefined,
    status: req.query.status as ScheduleStatus | undefined,
    frequency: req.query.frequency as CountFrequency | undefined,
    assignedTo: req.query.assignedTo as string | undefined,
  };
  const schedules = await scheduleService.listSchedules(filters);
  res.json(new ApiResponse(200, 'Schedules retrieved', { schedules }));
});

export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const schedule = await scheduleService.getScheduleById(id);
  res.json(new ApiResponse(200, 'Schedule retrieved', { schedule }));
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const schedule = await scheduleService.updateSchedule(id, req.body);
  res.json(new ApiResponse(200, 'Schedule updated', { schedule }));
});

export const pauseSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const schedule = await scheduleService.pauseSchedule(id);
  res.json(new ApiResponse(200, 'Schedule paused', { schedule }));
});

export const resumeSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const schedule = await scheduleService.resumeSchedule(id);
  res.json(new ApiResponse(200, 'Schedule resumed', { schedule }));
});

export const archiveSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const schedule = await scheduleService.archiveSchedule(id);
  res.json(new ApiResponse(200, 'Schedule archived', { schedule }));
});
