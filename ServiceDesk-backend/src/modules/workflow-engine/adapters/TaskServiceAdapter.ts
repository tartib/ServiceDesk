/**
 * TaskServiceAdapter
 *
 * Creates real PM tasks from workflow CREATE_TASK actions.
 * Used by ActionExecutor to replace the placeholder implementation.
 */

import mongoose from 'mongoose';
import logger from '../../../utils/logger';

export interface IWFTaskService {
  createTask(
    config: Record<string, any>,
    context: {
      organizationId: string;
      actorId: string;
      entityType?: string;
      entityId?: string;
      sourceRecordId?: string;
      sourceRecordType?: string;
    },
  ): Promise<string>;
}

export class TaskServiceAdapter implements IWFTaskService {
  async createTask(
    config: Record<string, any>,
    context: {
      organizationId: string;
      actorId: string;
      entityType?: string;
      entityId?: string;
      sourceRecordId?: string;
      sourceRecordType?: string;
    },
  ): Promise<string> {
    // Lazy model imports to avoid circular deps
    let Task: mongoose.Model<any>;
    let Project: mongoose.Model<any>;
    try {
      Task = mongoose.model('Task');
      Project = mongoose.model('Project');
    } catch {
      throw new Error('[TaskServiceAdapter] Task or Project model not registered');
    }

    const projectId = config.projectId;
    if (!projectId) {
      throw new Error('[TaskServiceAdapter] config.projectId is required to create a task');
    }

    const project = await Project.findById(projectId).lean() as any;
    if (!project) {
      throw new Error(`[TaskServiceAdapter] Project ${projectId} not found`);
    }

    // Determine next task number
    const lastTask = await Task.findOne({ projectId }).sort({ number: -1 }).lean() as any;
    const nextNumber = (lastTask?.number || 0) + 1;

    const task = await Task.create({
      projectId,
      organizationId: context.organizationId || project.organizationId,
      key: `${project.key}-${nextNumber}`,
      number: nextNumber,
      type: config.type || 'task',
      title: config.title || 'Auto-created task',
      description: config.description || `Created by workflow action (entity: ${context.entityType}:${context.entityId})`,
      status: { id: 'backlog', name: 'Backlog', category: 'todo' },
      priority: config.priority || 'medium',
      reporter: context.actorId,
      assignee: config.assignee || undefined,
      labels: config.labels || [],
      storyPoints: config.storyPoints,
      dueDate: config.dueDate,
      metadata: {
        sourceRecordId: context.sourceRecordId,
        sourceRecordType: context.sourceRecordType ?? context.entityType,
      },
    });

    const taskId = task._id.toString();
    logger.info(`[TaskServiceAdapter] Created task ${project.key}-${nextNumber} (${taskId}) for workflow`);
    return taskId;
  }
}
