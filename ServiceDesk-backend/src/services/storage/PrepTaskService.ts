import logger from '../../utils/logger';
import ApiError from '../../utils/ApiError';
import PrepTask, { IPrepTask } from '../../models/PrepTask';
import Inventory from '../../models/Inventory';
import { TaskStatus, TaskType, TaskPriority, AssignmentType } from '../../types';
import { logTaskEvent } from '../taskExecutionLogService';
import { IPrepTaskService, CreateTaskOptions } from './interfaces/IPrepTaskService';

/**
 * Prep Task Service
 * Handles task creation, assignment, and lifecycle management
 */
export class PrepTaskService implements IPrepTaskService {
  async createTask(options: CreateTaskOptions): Promise<IPrepTask> {
    const {
      productId,
      scheduledAt,
      taskType,
      priority = TaskPriority.MEDIUM,
      assignedTo,
      assignedToName,
      assignmentType = AssignmentType.SPECIFIC_USER,
      notes,
      tags,
    } = options;

    try {
      logger.debug('Creating prep task', { productId, taskType });

      const inventoryItem = await Inventory.findById(productId);
      if (!inventoryItem) {
        throw new ApiError(404, 'Inventory item not found');
      }

      const prepTimeMinutes = 30;
      const dueAt = this.calculateDueDate(scheduledAt, taskType, prepTimeMinutes);
      const estimatedDuration = this.calculateEstimatedDuration(taskType, prepTimeMinutes);

      const task = await PrepTask.create({
        productId: inventoryItem._id,
        productName: inventoryItem.name,
        scheduledAt,
        dueAt,
        taskType,
        priority,
        prepTimeMinutes,
        estimatedDuration,
        status: TaskStatus.SCHEDULED,
        assignedTo,
        assignedToName,
        assignmentType,
        notes,
        tags: tags || [],
        isRecurring: taskType === TaskType.DAILY_RECURRING || taskType === TaskType.WEEKLY_RECURRING,
      });

      await logTaskEvent(
        task._id.toString(),
        'created',
        assignedTo,
        assignedToName,
        undefined,
        TaskStatus.SCHEDULED,
        `تم إنشاء مهمة جديدة: ${inventoryItem.name}`,
        { taskType, priority }
      );

      logger.info(`Task created: ${inventoryItem.name} scheduled for ${scheduledAt}`);
      return task;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  async getAllTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching all tasks');

      const tasks = await PrepTask.find({})
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email role')
        .populate('escalatedTo', 'name email role')
        .sort({ scheduledAt: -1 })
        .limit(100);

      return tasks;
    } catch (error) {
      logger.error('Error fetching all tasks:', error);
      throw error;
    }
  }

  async getTodayTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching today tasks');

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const tasks = await PrepTask.find({
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ scheduledAt: 1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching today tasks:', error);
      throw error;
    }
  }

  async getTasksByStatus(status: TaskStatus): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching tasks by status', { status });

      const tasks = await PrepTask.find({ status })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ scheduledAt: 1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching tasks by status:', error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<IPrepTask> {
    try {
      logger.debug('Fetching task by ID', { id });

      const task = await PrepTask.findById(id)
        .populate('productId')
        .populate('assignedTo', 'name email role')
        .populate('escalatedTo', 'name email role');

      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      return task;
    } catch (error) {
      logger.error('Error fetching task by ID:', error);
      throw error;
    }
  }

  async getTasksByProductId(productId: string): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching tasks by product ID', { productId });

      const tasks = await PrepTask.find({ productId })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ scheduledAt: -1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching tasks by product ID:', error);
      throw error;
    }
  }

  async assignTask(taskId: string, userId: string, userName: string): Promise<IPrepTask> {
    try {
      logger.debug('Assigning task', { taskId, userId });

      const task = await PrepTask.findById(taskId);
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      const assignableStatuses = [TaskStatus.SCHEDULED, TaskStatus.LATE, TaskStatus.PENDING, TaskStatus.OVERDUE];
      if (!assignableStatuses.includes(task.status)) {
        throw new ApiError(400, 'Only scheduled, late, pending, or overdue tasks can be assigned');
      }

      const updatedTask = await PrepTask.findByIdAndUpdate(
        taskId,
        {
          assignedTo: userId,
          assignedToName: userName,
          assignmentType: AssignmentType.SPECIFIC_USER,
        },
        { new: true, runValidators: false }
      )
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email role');

      if (!updatedTask) {
        throw new ApiError(404, 'Task not found after update');
      }

      logger.info(`Task ${taskId} assigned to user ${userName}`);
      return updatedTask;
    } catch (error) {
      logger.error('Error assigning task:', error);
      throw error;
    }
  }

  async startTask(taskId: string, userId: string): Promise<IPrepTask> {
    try {
      logger.debug('Starting task', { taskId, userId });

      const task = await PrepTask.findById(taskId);
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (task.status !== TaskStatus.SCHEDULED) {
        throw new ApiError(400, 'Only scheduled tasks can be started');
      }

      if (task.assignedTo && task.assignedTo.toString() !== userId) {
        throw new ApiError(403, 'This task is assigned to another user');
      }

      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = new Date();
      await task.save();

      logger.info(`Task ${taskId} started by user ${userId}`);
      return task;
    } catch (error) {
      logger.error('Error starting task:', error);
      throw error;
    }
  }

  async completeTask(
    taskId: string,
    preparedQuantity: number,
    unit: string,
    notes?: string
  ): Promise<IPrepTask> {
    try {
      logger.debug('Completing task', { taskId });

      const task = await PrepTask.findById(taskId).populate('productId');
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (task.status !== TaskStatus.IN_PROGRESS) {
        throw new ApiError(400, 'Only in-progress tasks can be completed');
      }

      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.preparedQuantity = preparedQuantity;
      task.unit = unit;
      task.notes = notes;
      await task.save();

      await this.createNextPrepTask(task.productId.toString());

      logger.info(`Task ${taskId} completed. Prepared: ${preparedQuantity}${unit}`);
      return task;
    } catch (error) {
      logger.error('Error completing task:', error);
      throw error;
    }
  }

  async markTaskAsLate(taskId: string): Promise<IPrepTask> {
    try {
      logger.debug('Marking task as late', { taskId });

      const task = await PrepTask.findById(taskId);
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (task.status === TaskStatus.SCHEDULED) {
        task.status = TaskStatus.LATE;
        await task.save();
        logger.info(`Task ${taskId} marked as late`);
      }

      return task;
    } catch (error) {
      logger.error('Error marking task as late:', error);
      throw error;
    }
  }

  async updateTaskUsage(taskId: string, usedQuantity: number): Promise<IPrepTask> {
    try {
      logger.debug('Updating task usage', { taskId, usedQuantity });

      const task = await PrepTask.findById(taskId);
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (task.status !== TaskStatus.COMPLETED) {
        throw new ApiError(400, 'Only completed tasks can have usage updated');
      }

      task.usedQuantity = usedQuantity;
      await task.save();

      logger.info(`Task ${taskId} usage updated: ${usedQuantity}${task.unit}`);
      return task;
    } catch (error) {
      logger.error('Error updating task usage:', error);
      throw error;
    }
  }

  async getUserTasks(userId: string, status?: TaskStatus): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching user tasks', { userId, status });

      const query: Record<string, unknown> = { assignedTo: userId };
      if (status) {
        query.status = status;
      }

      const tasks = await PrepTask.find(query)
        .populate('productId', 'name category')
        .sort({ scheduledAt: -1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching user tasks:', error);
      throw error;
    }
  }

  async getWeeklyTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching weekly tasks');

      const startOfWeek = this.getStartOfWeek(new Date());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const tasks = await PrepTask.find({
        scheduledAt: { $gte: startOfWeek, $lte: endOfWeek },
      })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ scheduledAt: 1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching weekly tasks:', error);
      throw error;
    }
  }

  async getUrgentTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching urgent tasks');

      const tasks = await PrepTask.find({
        $or: [
          { taskType: TaskType.RED_ALERT },
          { taskType: TaskType.ON_DEMAND },
          { priority: TaskPriority.CRITICAL },
          { isOverdue: true },
        ],
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
      })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ priority: -1, dueAt: 1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching urgent tasks:', error);
      throw error;
    }
  }

  async getKanbanTasks(): Promise<{
    pending: IPrepTask[];
    inProgress: IPrepTask[];
    done: IPrepTask[];
  }> {
    try {
      logger.debug('Fetching Kanban tasks');

      const [pending, inProgress, done] = await Promise.all([
        PrepTask.find({
          status: { $in: [TaskStatus.SCHEDULED, TaskStatus.PENDING] },
        })
          .populate('productId', 'name category')
          .populate('assignedTo', 'name email')
          .sort({ priority: -1, scheduledAt: 1 })
          .limit(50),
        PrepTask.find({
          status: TaskStatus.IN_PROGRESS,
        })
          .populate('productId', 'name category')
          .populate('assignedTo', 'name email')
          .sort({ startedAt: 1 })
          .limit(50),
        PrepTask.find({
          status: { $in: [TaskStatus.COMPLETED, TaskStatus.DONE] },
        })
          .populate('productId', 'name category')
          .populate('assignedTo', 'name email')
          .sort({ completedAt: -1 })
          .limit(50),
      ]);

      return { pending, inProgress, done };
    } catch (error) {
      logger.error('Error fetching Kanban tasks:', error);
      throw error;
    }
  }

  async getTasksByType(taskType: TaskType): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching tasks by type', { taskType });

      const tasks = await PrepTask.find({ taskType })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ scheduledAt: -1 })
        .limit(100);

      return tasks;
    } catch (error) {
      logger.error('Error fetching tasks by type:', error);
      throw error;
    }
  }

  async getTasksByPriority(priority: TaskPriority): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching tasks by priority', { priority });

      const tasks = await PrepTask.find({ priority })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ dueAt: 1 })
        .limit(100);

      return tasks;
    } catch (error) {
      logger.error('Error fetching tasks by priority:', error);
      throw error;
    }
  }

  async getOverdueTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching overdue tasks');

      const tasks = await PrepTask.find({
        isOverdue: true,
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
      })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .sort({ dueAt: 1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching overdue tasks:', error);
      throw error;
    }
  }

  async getEscalatedTasks(): Promise<IPrepTask[]> {
    try {
      logger.debug('Fetching escalated tasks');

      const tasks = await PrepTask.find({
        isEscalated: true,
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
      })
        .populate('productId', 'name category')
        .populate('assignedTo', 'name email')
        .populate('escalatedTo', 'name email')
        .sort({ escalatedAt: -1 });

      return tasks;
    } catch (error) {
      logger.error('Error fetching escalated tasks:', error);
      throw error;
    }
  }

  async rateTaskCompletion(taskId: string, score: number, userId: string): Promise<IPrepTask> {
    try {
      logger.debug('Rating task completion', { taskId, score });

      if (score < 1 || score > 5) {
        throw new ApiError(400, 'Score must be between 1 and 5');
      }

      const task = await PrepTask.findById(taskId);
      if (!task) {
        throw new ApiError(404, 'Task not found');
      }

      if (task.status !== TaskStatus.COMPLETED) {
        throw new ApiError(400, 'Only completed tasks can be rated');
      }

      task.completionScore = score;
      await task.save();

      await logTaskEvent(
        taskId,
        'updated',
        userId,
        undefined,
        undefined,
        undefined,
        `تم تقييم المهمة: ${score}/5`,
        { score }
      );

      logger.info(`Task ${taskId} rated with score ${score}`);
      return task;
    } catch (error) {
      logger.error('Error rating task:', error);
      throw error;
    }
  }

  async updateOverdueTasks(): Promise<number> {
    try {
      logger.debug('Updating overdue tasks');

      const now = new Date();

      const result = await PrepTask.updateMany(
        {
          dueAt: { $lt: now },
          isOverdue: false,
          status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
        },
        {
          $set: { isOverdue: true, status: TaskStatus.OVERDUE },
        }
      );

      logger.info(`Updated ${result.modifiedCount} tasks to overdue status`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error updating overdue tasks:', error);
      throw error;
    }
  }

  private calculateDueDate(scheduledAt: Date, taskType: TaskType, prepTimeMinutes: number): Date {
    const dueAt = new Date(scheduledAt);

    switch (taskType) {
      case TaskType.RED_ALERT:
        dueAt.setMinutes(dueAt.getMinutes() + 10);
        break;
      case TaskType.MEDIUM:
        dueAt.setHours(dueAt.getHours() + 4);
        break;
      case TaskType.ON_DEMAND:
        dueAt.setMinutes(dueAt.getMinutes() + prepTimeMinutes);
        break;
      case TaskType.DAILY_RECURRING:
      case TaskType.WEEKLY_RECURRING:
        dueAt.setMinutes(dueAt.getMinutes() + prepTimeMinutes + 30);
        break;
      default:
        dueAt.setMinutes(dueAt.getMinutes() + prepTimeMinutes);
    }

    return dueAt;
  }

  private calculateEstimatedDuration(taskType: TaskType, prepTimeMinutes: number): number {
    switch (taskType) {
      case TaskType.RED_ALERT:
        return Math.min(10, prepTimeMinutes);
      case TaskType.MEDIUM:
        return Math.min(240, prepTimeMinutes);
      default:
        return prepTimeMinutes;
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private async createNextPrepTask(inventoryItemId: string): Promise<void> {
    try {
      const inventoryItem = await Inventory.findById(inventoryItemId);
      if (!inventoryItem) {
        throw new ApiError(404, 'Inventory item not found');
      }

      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 24);

      await PrepTask.create({
        productId: inventoryItem._id,
        productName: inventoryItem.name,
        status: TaskStatus.SCHEDULED,
        scheduledAt,
        prepTimeMinutes: 30,
      });

      logger.info(`Next prep task created for item: ${inventoryItem.name}`);
    } catch (error) {
      logger.error('Error creating next prep task:', error);
    }
  }
}

export default new PrepTaskService();
