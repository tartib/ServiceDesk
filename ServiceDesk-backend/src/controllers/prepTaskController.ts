import { Request, Response } from 'express';
import container from '../infrastructure/di/container';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const { 
    productId, 
    scheduledAt, 
    taskType,
    priority,
    assignedTo, 
    assignedToName,
    assignmentType,
    notes,
    tags
  } = req.body;

  if (!productId || !scheduledAt || !taskType) {
    throw new ApiError(400, 'Product ID, scheduled time, and task type are required');
  }

  const task = await prepTaskService.createTask({
    productId,
    scheduledAt: new Date(scheduledAt),
    taskType,
    priority,
    assignedTo,
    assignedToName,
    assignmentType,
    notes,
    tags,
  });

  res.status(201).json(
    new ApiResponse(201, 'Task created successfully', { task })
  );
});

export const getAllTasks = asyncHandler(async (_req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const tasks = await prepTaskService.getAllTasks();

  res.status(200).json(
    new ApiResponse(200, 'All tasks retrieved successfully', {
      count: tasks.length,
      tasks,
    })
  );
});

export const getTodayTasks = asyncHandler(async (_req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const tasks = await prepTaskService.getTodayTasks();

  res.status(200).json(
    new ApiResponse(200, "Today's tasks retrieved successfully", {
      count: tasks.length,
      tasks,
    })
  );
});

export const getTasksByStatus = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const { status } = req.params;

  const tasks = await prepTaskService.getTasksByStatus(status);

  res.status(200).json(
    new ApiResponse(200, 'Tasks retrieved successfully', {
      count: tasks.length,
      tasks,
    })
  );
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const task = await prepTaskService.getTaskById(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Task retrieved successfully', { task }));
});

export const getTasksByProductId = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const tasks = await prepTaskService.getTasksByProductId(req.params.productId);

  res.status(200).json(
    new ApiResponse(200, 'Product tasks retrieved successfully', {
      count: tasks.length,
      tasks,
    })
  );
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const { userId, userName } = req.body;

  if (!userId || !userName) {
    throw new ApiError(400, 'User ID and name are required');
  }

  const task = await prepTaskService.assignTask(req.params.id, userId, userName);

  res.status(200).json(new ApiResponse(200, 'Task assigned successfully', { task }));
});

export const startTask = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const task = await prepTaskService.startTask(req.params.id, userId);

  res.status(200).json(new ApiResponse(200, 'Task started successfully', { task }));
});

export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const { preparedQuantity, unit, notes } = req.body;

  if (!preparedQuantity || !unit) {
    throw new ApiError(400, 'Prepared quantity and unit are required');
  }

  const task = await prepTaskService.completeTask(req.params.id, preparedQuantity, unit, notes);

  res.status(200).json(
    new ApiResponse(200, 'Task completed successfully', { task })
  );
});

export const markTaskAsLate = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const task = await prepTaskService.markTaskAsLate(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Task marked as late successfully', { task }));
});

export const updateTaskUsage = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const { usedQuantity } = req.body;

  if (!usedQuantity) {
    throw new ApiError(400, 'Used quantity is required');
  }

  const task = await prepTaskService.updateTaskUsage(req.params.id, usedQuantity);

  res.status(200).json(new ApiResponse(200, 'Task usage updated successfully', { task }));
});

export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const prepTaskService = container.resolve('prepTaskRefactoredService');
  const userId = req.user?.id;
  const { status } = req.query;

  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const tasks = await prepTaskService.getUserTasks(
    userId,
    status as string | undefined
  );

  res.status(200).json(
    new ApiResponse(200, 'User tasks retrieved successfully', {
      count: tasks.length,
      tasks,
    })
  );
});
