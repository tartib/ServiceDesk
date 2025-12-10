import PrepTask, { IPrepTask } from '../models/PrepTask';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import { TaskStatus } from '../types';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

import { TaskType, TaskPriority, AssignmentType } from '../types';
import { logTaskEvent } from './taskExecutionLogService';

export const createTask = async (
  productId: string,
  scheduledAt: Date,
  taskType: TaskType,
  priority: TaskPriority = TaskPriority.MEDIUM,
  assignedTo?: string,
  assignedToName?: string,
  assignmentType: AssignmentType = AssignmentType.SPECIFIC_USER,
  notes?: string,
  tags?: string[]
): Promise<IPrepTask> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (!product.isActive) {
    throw new ApiError(400, 'Cannot create task for inactive product');
  }

  // حساب موعد الانتهاء بناءً على نوع المهمة
  const dueAt = calculateDueDate(scheduledAt, taskType, product.prepTimeMinutes);
  const estimatedDuration = calculateEstimatedDuration(taskType, product.prepTimeMinutes);

  const task = await PrepTask.create({
    productId: product._id,
    productName: product.name,
    scheduledAt,
    dueAt,
    taskType,
    priority,
    prepTimeMinutes: product.prepTimeMinutes,
    estimatedDuration,
    status: TaskStatus.SCHEDULED,
    assignedTo,
    assignedToName,
    assignmentType,
    notes,
    tags: tags || [],
    isRecurring: taskType === TaskType.DAILY_RECURRING || taskType === TaskType.WEEKLY_RECURRING,
  });

  // تسجيل في سجل التنفيذ
  await logTaskEvent(
    task._id.toString(),
    'created',
    assignedTo,
    assignedToName,
    undefined,
    TaskStatus.SCHEDULED,
    `تم إنشاء مهمة جديدة: ${product.name}`,
    { taskType, priority }
  );

  logger.info(`Task created: ${product.name} scheduled for ${scheduledAt}, type: ${taskType}`);

  return task;
};

/**
 * حساب موعد الانتهاء بناءً على نوع المهمة
 */
function calculateDueDate(scheduledAt: Date, taskType: TaskType, prepTimeMinutes: number): Date {
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

/**
 * حساب المدة التقديرية بناءً على نوع المهمة
 */
function calculateEstimatedDuration(taskType: TaskType, prepTimeMinutes: number): number {
  switch (taskType) {
    case TaskType.RED_ALERT:
      return Math.min(10, prepTimeMinutes);
    case TaskType.MEDIUM:
      return Math.min(240, prepTimeMinutes); // 4 ساعات كحد أقصى
    default:
      return prepTimeMinutes;
  }
}

export const getAllTasks = async (): Promise<IPrepTask[]> => {
  const tasks = await PrepTask.find({})
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email role')
    .populate('escalatedTo', 'name email role')
    .sort({ scheduledAt: -1 })
    .limit(100);
  
  return tasks as IPrepTask[];
};

export const getTodayTasks = async (): Promise<IPrepTask[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await PrepTask.find({
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ scheduledAt: 1 });
};

export const getTasksByStatus = async (status: TaskStatus): Promise<IPrepTask[]> => {
  return await PrepTask.find({ status })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ scheduledAt: 1 });
};

export const getTaskById = async (id: string): Promise<IPrepTask> => {
  const task = await PrepTask.findById(id)
    .populate('productId')
    .populate('assignedTo', 'name email role')
    .populate('escalatedTo', 'name email role');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return task;
};

export const getTasksByProductId = async (productId: string): Promise<IPrepTask[]> => {
  return await PrepTask.find({ productId })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ scheduledAt: -1 });
};

export const assignTask = async (
  taskId: string,
  userId: string,
  userName: string
): Promise<IPrepTask> => {
  const task = await PrepTask.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Allow assignment for scheduled, late, and pending tasks
  const assignableStatuses = [TaskStatus.SCHEDULED, TaskStatus.LATE, TaskStatus.PENDING, TaskStatus.OVERDUE];
  if (!assignableStatuses.includes(task.status)) {
    throw new ApiError(400, 'Only scheduled, late, pending, or overdue tasks can be assigned');
  }

  // Update task using findByIdAndUpdate to avoid validation errors on old tasks
  const updatedTask = await PrepTask.findByIdAndUpdate(
    taskId,
    {
      assignedTo: userId,
      assignedToName: userName,
      assignmentType: AssignmentType.SPECIFIC_USER,
    },
    { new: true, runValidators: false }
  ).populate('productId', 'name category')
   .populate('assignedTo', 'name email role');

  if (!updatedTask) {
    throw new ApiError(404, 'Task not found after update');
  }

  logger.info(`Task ${taskId} assigned to user ${userName}`);

  return updatedTask;
};

export const startTask = async (taskId: string, userId: string): Promise<IPrepTask> => {
  const task = await PrepTask.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.status !== TaskStatus.SCHEDULED) {
    throw new ApiError(400, 'Only scheduled tasks can be started');
  }

  // Check if assigned to correct user
  if (task.assignedTo && task.assignedTo.toString() !== userId) {
    throw new ApiError(403, 'This task is assigned to another user');
  }

  task.status = TaskStatus.IN_PROGRESS;
  task.startedAt = new Date();
  await task.save();

  logger.info(`Task ${taskId} started by user ${userId}`);

  return task;
};

export const completeTask = async (
  taskId: string,
  preparedQuantity: number,
  unit: string,
  notes?: string
): Promise<IPrepTask> => {
  const task = await PrepTask.findById(taskId).populate('productId');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    throw new ApiError(400, 'Only in-progress tasks can be completed');
  }

  // Check for ingredient availability
  const product = await Product.findById(task.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Deduct ingredients from inventory
  for (const ingredient of product.ingredients) {
    const requiredQty = ingredient.quantity * preparedQuantity;
    
    const inventoryItem = await Inventory.findById(ingredient.ingredientId);
    
    if (!inventoryItem) {
      logger.warn(`Ingredient ${ingredient.name} not found in inventory`);
      continue;
    }

    if (inventoryItem.currentQuantity < requiredQty) {
      task.status = TaskStatus.STOCK_ISSUE;
      await task.save();
      throw new ApiError(400, `Insufficient stock for ${ingredient.name}. Required: ${requiredQty}${ingredient.unit}, Available: ${inventoryItem.currentQuantity}${inventoryItem.unit}`);
    }

    // Deduct quantity
    inventoryItem.currentQuantity -= requiredQty;
    await inventoryItem.save();

    logger.info(
      `Deducted ${requiredQty}${ingredient.unit} of ${ingredient.name} from inventory`
    );
  }

  // Mark task as completed
  task.status = TaskStatus.COMPLETED;
  task.completedAt = new Date();
  task.preparedQuantity = preparedQuantity;
  task.unit = unit;
  task.notes = notes;
  await task.save();

  // Create next prep task
  await createNextPrepTask(product);

  logger.info(`Task ${taskId} completed. Prepared: ${preparedQuantity}${unit}`);

  return task;
};

export const createNextPrepTask = async (product: any): Promise<void> => {
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + product.prepIntervalHours);

  await PrepTask.create({
    productId: product._id,
    productName: product.name,
    status: TaskStatus.SCHEDULED,
    scheduledAt,
    prepTimeMinutes: product.prepTimeMinutes,
  });

  logger.info(`Next prep task created for product: ${product.name} at ${scheduledAt}`);
};

export const markTaskAsLate = async (taskId: string): Promise<IPrepTask> => {
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
};

export const updateTaskUsage = async (
  taskId: string,
  usedQuantity: number
): Promise<IPrepTask> => {
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
};

export const getUserTasks = async (userId: string, status?: TaskStatus): Promise<IPrepTask[]> => {
  const query: any = { assignedTo: userId };
  
  if (status) {
    query.status = status;
  }

  return await PrepTask.find(query)
    .populate('productId', 'name category')
    .sort({ scheduledAt: -1 });
};

/**
 * جلب المهام الأسبوعية
 */
export const getWeeklyTasks = async (): Promise<IPrepTask[]> => {
  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return await PrepTask.find({
    scheduledAt: { $gte: startOfWeek, $lte: endOfWeek },
  })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ scheduledAt: 1 });
};

/**
 * جلب المهام الفورية والعاجلة
 */
export const getUrgentTasks = async (): Promise<IPrepTask[]> => {
  return await PrepTask.find({
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
};

/**
 * جلب المهام لشاشة Kanban
 */
export const getKanbanTasks = async (): Promise<{
  pending: IPrepTask[];
  inProgress: IPrepTask[];
  done: IPrepTask[];
}> => {
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
};

/**
 * جلب المهام حسب النوع
 */
export const getTasksByType = async (taskType: TaskType): Promise<IPrepTask[]> => {
  return await PrepTask.find({ taskType })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ scheduledAt: -1 })
    .limit(100);
};

/**
 * جلب المهام حسب الأولوية
 */
export const getTasksByPriority = async (priority: TaskPriority): Promise<IPrepTask[]> => {
  return await PrepTask.find({ priority })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ dueAt: 1 })
    .limit(100);
};

/**
 * جلب المهام المتأخرة
 */
export const getOverdueTasks = async (): Promise<IPrepTask[]> => {
  return await PrepTask.find({
    isOverdue: true,
    status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
  })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ dueAt: 1 });
};

/**
 * جلب المهام المصعدة
 */
export const getEscalatedTasks = async (): Promise<IPrepTask[]> => {
  return await PrepTask.find({
    isEscalated: true,
    status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
  })
    .populate('productId', 'name category')
    .populate('assignedTo', 'name email')
    .populate('escalatedTo', 'name email')
    .sort({ escalatedAt: -1 });
};

/**
 * تقييم إنجاز المهمة
 */
export const rateTaskCompletion = async (
  taskId: string,
  score: number,
  userId: string
): Promise<IPrepTask> => {
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

  // تسجيل في سجل التنفيذ
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
};

/**
 * تحديث حالة التأخر للمهام
 */
export const updateOverdueTasks = async (): Promise<number> => {
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
};

/**
 * بداية الأسبوع
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}
