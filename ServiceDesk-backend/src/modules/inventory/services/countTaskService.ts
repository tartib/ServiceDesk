import InventoryCountTask, { IInventoryCountTask, ICountTaskItem } from '../models/InventoryCountTask';
import InventoryCountSchedule from '../models/InventoryCountSchedule';
import StockBalance from '../models/StockBalance';
import InventoryItem from '../models/InventoryItem';
import { CountFrequency, CountTaskStatus, ScheduleStatus, WeeklyDay, AdjustmentType } from '../types';
import { createAdjustment } from './adjustmentService';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Day mapping ──────────────────────────────────────────────────
const dayIndexMap: Record<number, WeeklyDay> = {
  0: WeeklyDay.SUN,
  1: WeeklyDay.MON,
  2: WeeklyDay.TUE,
  3: WeeklyDay.WED,
  4: WeeklyDay.THU,
  5: WeeklyDay.FRI,
  6: WeeklyDay.SAT,
};

// ── Generate tasks for a given date ──────────────────────────────
export const generateTasksForDate = async (
  date: Date,
  userId: string,
): Promise<IInventoryCountTask[]> => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const dayOfWeek = dayIndexMap[targetDate.getDay()];

  // Find all active schedules that match this date
  const schedules = await InventoryCountSchedule.find({
    status: ScheduleStatus.ACTIVE,
    startDate: { $lte: targetDate },
  }).populate('items', 'partNo partDescription');

  const createdTasks: IInventoryCountTask[] = [];

  for (const schedule of schedules) {
    // Skip weekly schedules if today is not their weeklyDay
    if (schedule.frequency === CountFrequency.WEEKLY && schedule.weeklyDay !== dayOfWeek) {
      continue;
    }

    // Check if task already exists for this schedule + date
    const existingTask = await InventoryCountTask.findOne({
      schedule: schedule._id,
      countDate: targetDate,
    });
    if (existingTask) continue;

    // Snapshot system quantities from StockBalance
    const taskItems: ICountTaskItem[] = [];
    for (const itemRef of schedule.items) {
      const itemId = typeof itemRef === 'object' && '_id' in itemRef ? String((itemRef as unknown as { _id: unknown })._id) : String(itemRef);
      const item = await InventoryItem.findById(itemId).lean();
      if (!item) continue;

      const balance = await StockBalance.findOne({
        part: itemId,
        warehouse: schedule.warehouse,
      }).lean();

      taskItems.push({
        item: itemId as unknown as ICountTaskItem['item'],
        itemName: item.partDescription || item.partNo,
        sku: item.partNo,
        systemQuantity: balance ? balance.inStock : 0,
      });
    }

    if (taskItems.length === 0) continue;

    const task = await InventoryCountTask.create({
      schedule: schedule._id,
      warehouse: schedule.warehouse,
      countDate: targetDate,
      assignedTo: schedule.assignedTo,
      status: CountTaskStatus.PENDING,
      items: taskItems,
      createdBy: userId,
    });

    createdTasks.push(task);
    logger.info(`Count task generated: ${task._id} for schedule ${schedule._id}`);
  }

  return createdTasks;
};

// ── List Tasks ───────────────────────────────────────────────────
export interface TaskFilters {
  scheduleId?: string;
  warehouseId?: string;
  assignedTo?: string;
  status?: CountTaskStatus;
  dateFrom?: string | Date;
  dateTo?: string | Date;
}

export const listTasks = async (filters: TaskFilters = {}): Promise<IInventoryCountTask[]> => {
  const query: Record<string, unknown> = {};
  if (filters.scheduleId) query.schedule = filters.scheduleId;
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.$lte = new Date(filters.dateTo);
    query.countDate = dateFilter;
  }

  return InventoryCountTask.find(query)
    .populate('schedule', 'name frequency')
    .populate('warehouse', 'warehouseName code')
    .populate('assignedTo', 'name email')
    .populate('submittedBy', 'name email')
    .populate('reviewedBy', 'name email')
    .sort({ countDate: -1 });
};

// ── Get Task by ID ───────────────────────────────────────────────
export const getTaskById = async (id: string): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(id)
    .populate('schedule', 'name frequency varianceThreshold')
    .populate('warehouse', 'warehouseName code')
    .populate('assignedTo', 'name email')
    .populate('submittedBy', 'name email')
    .populate('reviewedBy', 'name email');
  if (!task) throw new ApiError(404, 'Count task not found');
  return task;
};

// ── Start Task ───────────────────────────────────────────────────
export const startTask = async (id: string, userId: string): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(id);
  if (!task) throw new ApiError(404, 'Count task not found');
  if (task.status !== CountTaskStatus.PENDING && task.status !== CountTaskStatus.REJECTED) {
    throw new ApiError(400, 'Task can only be started from pending or rejected status');
  }
  task.status = CountTaskStatus.IN_PROGRESS;
  await task.save();
  logger.info(`Count task started: ${id} by ${userId}`);
  return task;
};

// ── Update Count Item ────────────────────────────────────────────
export const updateCountItem = async (
  taskId: string,
  itemIndex: number,
  data: { actualQuantity: number; notes?: string },
): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(taskId);
  if (!task) throw new ApiError(404, 'Count task not found');
  if (task.status !== CountTaskStatus.IN_PROGRESS) {
    throw new ApiError(400, 'Items can only be updated when task is in progress');
  }
  if (itemIndex < 0 || itemIndex >= task.items.length) {
    throw new ApiError(400, 'Invalid item index');
  }

  const item = task.items[itemIndex];
  item.actualQuantity = data.actualQuantity;
  item.variance = data.actualQuantity - item.systemQuantity;
  if (data.notes !== undefined) item.notes = data.notes;

  await task.save();
  return task;
};

// ── Submit Task ──────────────────────────────────────────────────
export const submitTask = async (taskId: string, userId: string): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(taskId).populate('schedule', 'varianceThreshold');
  if (!task) throw new ApiError(404, 'Count task not found');
  if (task.status !== CountTaskStatus.IN_PROGRESS) {
    throw new ApiError(400, 'Task can only be submitted from in-progress status');
  }

  // Validate all items have actual quantity
  for (let i = 0; i < task.items.length; i++) {
    const item = task.items[i];
    if (item.actualQuantity === undefined || item.actualQuantity === null) {
      throw new ApiError(400, `Actual quantity is required for item: ${item.itemName}`);
    }
    // Calculate variance
    item.variance = item.actualQuantity - item.systemQuantity;

    // Require variance reason when exceeds threshold
    const schedule = task.schedule as unknown as { varianceThreshold: number };
    const threshold = schedule?.varianceThreshold ?? 5;
    const variancePercent = item.systemQuantity > 0
      ? Math.abs(item.variance / item.systemQuantity) * 100
      : (item.variance !== 0 ? 100 : 0);

    if (variancePercent > threshold && !item.varianceReason?.trim()) {
      throw new ApiError(400, `Variance reason is required for item: ${item.itemName} (variance: ${variancePercent.toFixed(1)}%)`);
    }
  }

  task.status = CountTaskStatus.SUBMITTED;
  task.submittedBy = userId as unknown as typeof task.submittedBy;
  task.submittedAt = new Date();
  await task.save();
  logger.info(`Count task submitted: ${taskId} by ${userId}`);
  return task;
};

// ── Review Task (Approve / Reject) ──────────────────────────────
export const reviewTask = async (
  taskId: string,
  userId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(taskId);
  if (!task) throw new ApiError(404, 'Count task not found');
  if (task.status !== CountTaskStatus.SUBMITTED && task.status !== CountTaskStatus.UNDER_REVIEW) {
    throw new ApiError(400, 'Task can only be reviewed from submitted or under-review status');
  }

  task.reviewedBy = userId as unknown as typeof task.reviewedBy;
  task.reviewedAt = new Date();

  if (action === 'reject') {
    if (!rejectionReason?.trim()) {
      throw new ApiError(400, 'Rejection reason is required');
    }
    task.status = CountTaskStatus.REJECTED;
    task.rejectionReason = rejectionReason;
    await task.save();
    logger.info(`Count task rejected: ${taskId} by ${userId}`);
    return task;
  }

  // Approve — apply stock adjustments for items with variance
  task.status = CountTaskStatus.APPROVED;
  await task.save();

  for (const item of task.items) {
    if (item.variance && item.variance !== 0) {
      try {
        await createAdjustment({
          partId: String(item.item),
          warehouseId: String(task.warehouse),
          adjustmentType: AdjustmentType.SET_BALANCE,
          quantity: item.actualQuantity!,
          reason: `Count adjustment (task: ${taskId}): variance ${item.variance > 0 ? '+' : ''}${item.variance}`,
          notes: item.varianceReason || undefined,
          userId,
        });
      } catch (err) {
        logger.error(`Failed to adjust stock for item ${item.item} in task ${taskId}: ${err}`);
      }
    }
  }

  task.status = CountTaskStatus.COMPLETED;
  await task.save();
  logger.info(`Count task approved and completed: ${taskId} by ${userId}`);
  return task;
};

// ── Update variance reason ───────────────────────────────────────
export const updateVarianceReason = async (
  taskId: string,
  itemIndex: number,
  varianceReason: string,
): Promise<IInventoryCountTask> => {
  const task = await InventoryCountTask.findById(taskId);
  if (!task) throw new ApiError(404, 'Count task not found');
  if (task.status !== CountTaskStatus.IN_PROGRESS) {
    throw new ApiError(400, 'Variance reason can only be updated when task is in progress');
  }
  if (itemIndex < 0 || itemIndex >= task.items.length) {
    throw new ApiError(400, 'Invalid item index');
  }

  task.items[itemIndex].varianceReason = varianceReason;
  await task.save();
  return task;
};
