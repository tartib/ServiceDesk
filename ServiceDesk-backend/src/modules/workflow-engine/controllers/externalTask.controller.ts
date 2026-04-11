/**
 * External Task Controller
 * تحكم المهام الخارجية — Fetch-and-Lock, Complete, Fail, Extend Lock, List
 */

import { Request, Response } from 'express';
import ExternalTask, { ExternalTaskStatus } from '../models/ExternalTask';
import { getWorkflowEngine } from '../services/workflowEngineFactory';
import { isWfPostgres, getWfRepos } from '../infrastructure/repositories';
import { PgWfExternalTaskRepository } from '../infrastructure/repositories/PgWfExternalTaskRepository';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

/**
 * POST /external-tasks/fetch-and-lock
 * Workers poll this endpoint to fetch and lock available tasks by topic
 */
export const fetchAndLock = asyncHandler(async (req: Request, res: Response) => {
  const { topic, workerId, lockDuration = 300000, maxTasks = 1 } = req.body;

  if (!topic || !workerId) {
    return void sendError(req, res, 400, 'topic and workerId are required');
  }

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().externalTask as PgWfExternalTaskRepository;
    const lockedTasks = await repo.fetchAndLock(topic, workerId, lockDuration, maxTasks);
    return void sendSuccess(req, res, lockedTasks);
  }

  // ── MongoDB path ──
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + lockDuration);
  const lockedTasks: any[] = [];

  // Atomically find and lock tasks one by one
  for (let i = 0; i < maxTasks; i++) {
    const task = await ExternalTask.findOneAndUpdate(
      {
        topic,
        status: ExternalTaskStatus.AVAILABLE,
      },
      {
        $set: {
          status: ExternalTaskStatus.LOCKED,
          workerId,
          lockExpiresAt,
          lockedAt: now,
        },
      },
      {
        new: true,
        sort: { priority: -1, createdAt: 1 },
      }
    );

    if (!task) break;
    lockedTasks.push(task);
  }

  sendSuccess(req, res, lockedTasks);
});

/**
 * POST /external-tasks/:id/complete
 * Worker completes a locked task, optionally passing result variables
 */
export const complete = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workerId, variables } = req.body;

  if (!workerId) {
    return void sendError(req, res, 400, 'workerId is required');
  }

  const engine = getWorkflowEngine();
  const result = await engine.completeExternalTask({
    externalTaskId: id,
    workerId,
    variables,
  });

  sendSuccess(req, res, result);
});

/**
 * POST /external-tasks/:id/failure
 * Worker reports a failure for a locked task
 */
export const handleFailure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workerId, errorMessage, errorDetails, retries } = req.body;

  if (!workerId || !errorMessage) {
    return void sendError(req, res, 400, 'workerId and errorMessage are required');
  }

  const engine = getWorkflowEngine();
  await engine.failExternalTask({
    externalTaskId: id,
    workerId,
    errorMessage,
    errorDetails,
    retries,
  });

  sendSuccess(req, res, null, 'Failure recorded');
});

/**
 * POST /external-tasks/:id/extend-lock
 * Worker extends the lock on a task
 */
export const extendLock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workerId, lockDuration } = req.body;

  if (!workerId || !lockDuration) {
    return void sendError(req, res, 400, 'workerId and lockDuration are required');
  }

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().externalTask as PgWfExternalTaskRepository;
    const task = await repo.findById(id);
    if (!task) return void sendError(req, res, 404, 'External task not found');
    if (task.status !== 'locked') return void sendError(req, res, 409, `Task is not locked (status: ${task.status})`);
    if (task.workerId !== workerId) return void sendError(req, res, 409, 'Task is locked by a different worker');
    const updated = await repo.updateById(id, { lockExpiresAt: new Date(Date.now() + lockDuration) });
    return void sendSuccess(req, res, updated);
  }

  // ── MongoDB path ──
  const task = await ExternalTask.findById(id);
  if (!task) return void sendError(req, res, 404, 'External task not found');
  if (task.status !== ExternalTaskStatus.LOCKED) return void sendError(req, res, 409, `Task is not locked (status: ${task.status})`);
  if (task.workerId !== workerId) return void sendError(req, res, 409, 'Task is locked by a different worker');

  task.lockExpiresAt = new Date(Date.now() + lockDuration);
  await task.save();

  sendSuccess(req, res, task);
});

/**
 * GET /external-tasks
 * List external tasks with optional filters (for monitoring)
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { topic, status, instanceId, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().externalTask as PgWfExternalTaskRepository;
    const result = await repo.searchTasks({ topic, status, instanceId }, pageNum, limitNum);
    return void sendPaginated(req, res, result.data, pageNum, limitNum, result.total);
  }

  // ── MongoDB path ──
  const filter: Record<string, any> = {};
  if (topic) filter.topic = topic;
  if (status) filter.status = status;
  if (instanceId) filter.instanceId = instanceId;

  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    ExternalTask.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ExternalTask.countDocuments(filter),
  ]);

  sendPaginated(req, res, tasks, pageNum, limitNum, total);
});

/**
 * GET /external-tasks/:id
 * Get a single external task by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().externalTask as PgWfExternalTaskRepository;
    const task = await repo.findById(id);
    if (!task) return void sendError(req, res, 404, 'External task not found');
    return void sendSuccess(req, res, task);
  }

  // ── MongoDB path ──
  const task = await ExternalTask.findById(id).lean();
  if (!task) return void sendError(req, res, 404, 'External task not found');
  sendSuccess(req, res, task);
});
