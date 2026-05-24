import InventoryCountSchedule, { IInventoryCountSchedule } from '../models/InventoryCountSchedule';
import { CountFrequency, ScheduleStatus, WeeklyDay } from '../types';
import ApiError from '../../../utils/ApiError';
import logger from '../../../utils/logger';

// ── Create Schedule ──────────────────────────────────────────────
export interface CreateScheduleInput {
  name: string;
  frequency: CountFrequency;
  warehouseId: string;
  itemIds: string[];
  assignedTo: string;
  startDate: string | Date;
  dueTime: string;
  weeklyDay?: WeeklyDay;
  varianceThreshold?: number;
  notes?: string;
  userId: string;
}

export const createSchedule = async (data: CreateScheduleInput): Promise<IInventoryCountSchedule> => {
  if (!data.name?.trim()) throw new ApiError(400, 'Schedule name is required');
  if (!data.itemIds || data.itemIds.length === 0) throw new ApiError(400, 'At least one item is required');
  if (!data.assignedTo) throw new ApiError(400, 'Assigned user is required');
  if (data.frequency === CountFrequency.WEEKLY && !data.weeklyDay) {
    throw new ApiError(400, 'Weekly day is required for weekly schedules');
  }

  const schedule = await InventoryCountSchedule.create({
    name: data.name.trim(),
    frequency: data.frequency,
    warehouse: data.warehouseId,
    items: data.itemIds,
    assignedTo: data.assignedTo,
    startDate: new Date(data.startDate),
    dueTime: data.dueTime,
    weeklyDay: data.weeklyDay,
    varianceThreshold: data.varianceThreshold ?? 5,
    notes: data.notes,
    status: ScheduleStatus.ACTIVE,
    createdBy: data.userId,
  });

  logger.info(`Count schedule created: ${schedule._id} (${data.frequency})`);
  return schedule;
};

// ── Update Schedule ──────────────────────────────────────────────
export interface UpdateScheduleInput {
  name?: string;
  frequency?: CountFrequency;
  warehouseId?: string;
  itemIds?: string[];
  assignedTo?: string;
  startDate?: string | Date;
  dueTime?: string;
  weeklyDay?: WeeklyDay;
  varianceThreshold?: number;
  notes?: string;
}

export const updateSchedule = async (
  id: string,
  data: UpdateScheduleInput,
): Promise<IInventoryCountSchedule> => {
  const schedule = await InventoryCountSchedule.findById(id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  if (schedule.status === ScheduleStatus.ARCHIVED) {
    throw new ApiError(400, 'Cannot update an archived schedule');
  }

  if (data.itemIds !== undefined && data.itemIds.length === 0) {
    throw new ApiError(400, 'At least one item is required');
  }

  const freq = data.frequency ?? schedule.frequency;
  if (freq === CountFrequency.WEEKLY && !data.weeklyDay && !schedule.weeklyDay) {
    throw new ApiError(400, 'Weekly day is required for weekly schedules');
  }

  if (data.name) schedule.name = data.name.trim();
  if (data.frequency) schedule.frequency = data.frequency;
  if (data.warehouseId) schedule.warehouse = data.warehouseId as unknown as typeof schedule.warehouse;
  if (data.itemIds) schedule.items = data.itemIds as unknown as typeof schedule.items;
  if (data.assignedTo) schedule.assignedTo = data.assignedTo as unknown as typeof schedule.assignedTo;
  if (data.startDate) schedule.startDate = new Date(data.startDate);
  if (data.dueTime) schedule.dueTime = data.dueTime;
  if (data.weeklyDay !== undefined) schedule.weeklyDay = data.weeklyDay;
  if (data.varianceThreshold !== undefined) schedule.varianceThreshold = data.varianceThreshold;
  if (data.notes !== undefined) schedule.notes = data.notes;

  await schedule.save();
  logger.info(`Count schedule updated: ${id}`);
  return schedule;
};

// ── List Schedules ───────────────────────────────────────────────
export interface ScheduleFilters {
  warehouseId?: string;
  status?: ScheduleStatus;
  frequency?: CountFrequency;
  assignedTo?: string;
}

export const listSchedules = async (filters: ScheduleFilters = {}): Promise<IInventoryCountSchedule[]> => {
  const query: Record<string, unknown> = {};
  if (filters.warehouseId) query.warehouse = filters.warehouseId;
  if (filters.status) query.status = filters.status;
  if (filters.frequency) query.frequency = filters.frequency;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;

  return InventoryCountSchedule.find(query)
    .populate('warehouse', 'warehouseName code')
    .populate('assignedTo', 'name email')
    .populate('items', 'partNo partDescription')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// ── Get by ID ────────────────────────────────────────────────────
export const getScheduleById = async (id: string): Promise<IInventoryCountSchedule> => {
  const schedule = await InventoryCountSchedule.findById(id)
    .populate('warehouse', 'warehouseName code')
    .populate('assignedTo', 'name email')
    .populate('items', 'partNo partDescription uom')
    .populate('createdBy', 'name email');
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  return schedule;
};

// ── Status transitions ───────────────────────────────────────────
export const pauseSchedule = async (id: string): Promise<IInventoryCountSchedule> => {
  const schedule = await InventoryCountSchedule.findById(id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  if (schedule.status !== ScheduleStatus.ACTIVE) {
    throw new ApiError(400, 'Only active schedules can be paused');
  }
  schedule.status = ScheduleStatus.PAUSED;
  await schedule.save();
  logger.info(`Count schedule paused: ${id}`);
  return schedule;
};

export const resumeSchedule = async (id: string): Promise<IInventoryCountSchedule> => {
  const schedule = await InventoryCountSchedule.findById(id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  if (schedule.status !== ScheduleStatus.PAUSED) {
    throw new ApiError(400, 'Only paused schedules can be resumed');
  }
  schedule.status = ScheduleStatus.ACTIVE;
  await schedule.save();
  logger.info(`Count schedule resumed: ${id}`);
  return schedule;
};

export const archiveSchedule = async (id: string): Promise<IInventoryCountSchedule> => {
  const schedule = await InventoryCountSchedule.findById(id);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  if (schedule.status === ScheduleStatus.ARCHIVED) {
    throw new ApiError(400, 'Schedule is already archived');
  }
  schedule.status = ScheduleStatus.ARCHIVED;
  await schedule.save();
  logger.info(`Count schedule archived: ${id}`);
  return schedule;
};
