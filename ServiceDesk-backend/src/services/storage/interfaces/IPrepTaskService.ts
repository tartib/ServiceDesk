import { IPrepTask } from '../../../models/PrepTask';
import { TaskStatus, TaskType, TaskPriority, AssignmentType } from '../../../types';

export interface CreateTaskOptions {
  productId: string;
  scheduledAt: Date;
  taskType: TaskType;
  priority?: TaskPriority;
  assignedTo?: string;
  assignedToName?: string;
  assignmentType?: AssignmentType;
  notes?: string;
  tags?: string[];
}

export interface IPrepTaskService {
  /**
   * Create a new prep task
   */
  createTask(options: CreateTaskOptions): Promise<IPrepTask>;

  /**
   * Get all tasks
   */
  getAllTasks(): Promise<IPrepTask[]>;

  /**
   * Get today's tasks
   */
  getTodayTasks(): Promise<IPrepTask[]>;

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Promise<IPrepTask[]>;

  /**
   * Get task by ID
   */
  getTaskById(id: string): Promise<IPrepTask>;

  /**
   * Get tasks by product ID
   */
  getTasksByProductId(productId: string): Promise<IPrepTask[]>;

  /**
   * Assign task to user
   */
  assignTask(taskId: string, userId: string, userName: string): Promise<IPrepTask>;

  /**
   * Start a task
   */
  startTask(taskId: string, userId: string): Promise<IPrepTask>;

  /**
   * Complete a task
   */
  completeTask(
    taskId: string,
    preparedQuantity: number,
    unit: string,
    notes?: string
  ): Promise<IPrepTask>;

  /**
   * Mark task as late
   */
  markTaskAsLate(taskId: string): Promise<IPrepTask>;

  /**
   * Update task usage
   */
  updateTaskUsage(taskId: string, usedQuantity: number): Promise<IPrepTask>;

  /**
   * Get user's tasks
   */
  getUserTasks(userId: string, status?: TaskStatus): Promise<IPrepTask[]>;

  /**
   * Get weekly tasks
   */
  getWeeklyTasks(): Promise<IPrepTask[]>;

  /**
   * Get urgent tasks
   */
  getUrgentTasks(): Promise<IPrepTask[]>;

  /**
   * Get Kanban tasks
   */
  getKanbanTasks(): Promise<{
    pending: IPrepTask[];
    inProgress: IPrepTask[];
    done: IPrepTask[];
  }>;

  /**
   * Get tasks by type
   */
  getTasksByType(taskType: TaskType): Promise<IPrepTask[]>;

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: TaskPriority): Promise<IPrepTask[]>;

  /**
   * Get overdue tasks
   */
  getOverdueTasks(): Promise<IPrepTask[]>;

  /**
   * Get escalated tasks
   */
  getEscalatedTasks(): Promise<IPrepTask[]>;

  /**
   * Rate task completion
   */
  rateTaskCompletion(taskId: string, score: number, userId: string): Promise<IPrepTask>;

  /**
   * Update overdue tasks status
   */
  updateOverdueTasks(): Promise<number>;
}
