/**
 * External Task Controller
 * تحكم المهام الخارجية — Fetch-and-Lock, Complete, Fail, Extend Lock, List
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PMAuthRequest } from '../../types/pm';
import ExternalTask, { ExternalTaskStatus } from '../../models/workflow/ExternalTask';
import { getWorkflowEngine } from '../../services/workflow-engine/workflowEngineFactory';

/**
 * POST /external-tasks/fetch-and-lock
 * Workers poll this endpoint to fetch and lock available tasks by topic
 */
export async function fetchAndLock(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { topic, workerId, lockDuration = 300000, maxTasks = 1 } = req.body;

    if (!topic || !workerId) {
      return res.status(400).json({
        success: false,
        message: 'topic and workerId are required',
      });
    }

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

    return res.json({
      success: true,
      data: lockedTasks,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /external-tasks/:id/complete
 * Worker completes a locked task, optionally passing result variables
 */
export async function complete(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { workerId, variables } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'workerId is required',
      });
    }

    const engine = getWorkflowEngine();
    const result = await engine.completeExternalTask({
      externalTaskId: id,
      workerId,
      variables,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('not locked') || error.message.includes('different worker') ? 409
      : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
}

/**
 * POST /external-tasks/:id/failure
 * Worker reports a failure for a locked task
 */
export async function handleFailure(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { workerId, errorMessage, errorDetails, retries } = req.body;

    if (!workerId || !errorMessage) {
      return res.status(400).json({
        success: false,
        message: 'workerId and errorMessage are required',
      });
    }

    const engine = getWorkflowEngine();
    await engine.failExternalTask({
      externalTaskId: id,
      workerId,
      errorMessage,
      errorDetails,
      retries,
    });

    return res.json({ success: true, message: 'Failure recorded' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('not locked') || error.message.includes('different worker') ? 409
      : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
}

/**
 * POST /external-tasks/:id/extend-lock
 * Worker extends the lock on a task
 */
export async function extendLock(req: PMAuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { workerId, lockDuration } = req.body;

    if (!workerId || !lockDuration) {
      return res.status(400).json({
        success: false,
        message: 'workerId and lockDuration are required',
      });
    }

    const task = await ExternalTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'External task not found' });
    }
    if (task.status !== ExternalTaskStatus.LOCKED) {
      return res.status(409).json({ success: false, message: `Task is not locked (status: ${task.status})` });
    }
    if (task.workerId !== workerId) {
      return res.status(409).json({ success: false, message: 'Task is locked by a different worker' });
    }

    task.lockExpiresAt = new Date(Date.now() + lockDuration);
    await task.save();

    return res.json({ success: true, data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /external-tasks
 * List external tasks with optional filters (for monitoring)
 */
export async function list(req: PMAuthRequest, res: Response) {
  try {
    const { topic, status, instanceId, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
    if (instanceId) filter.instanceId = instanceId;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      ExternalTask.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ExternalTask.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /external-tasks/:id
 * Get a single external task by ID
 */
export async function getById(req: PMAuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const task = await ExternalTask.findById(id).lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'External task not found' });
    }

    return res.json({ success: true, data: task });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
