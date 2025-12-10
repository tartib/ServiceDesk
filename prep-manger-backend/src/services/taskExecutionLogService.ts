import TaskExecutionLog, { ITaskExecutionLog } from '../models/TaskExecutionLog';
import { TaskStatus } from '../types';
import logger from '../utils/logger';

/**
 * تسجيل حدث في سجل تنفيذ المهمة
 */
export const logTaskEvent = async (
  taskId: string,
  action: string,
  userId?: string,
  userName?: string,
  oldStatus?: TaskStatus,
  newStatus?: TaskStatus,
  details?: string,
  metadata?: Record<string, unknown>
): Promise<ITaskExecutionLog> => {
  const log = await TaskExecutionLog.create({
    taskId,
    userId,
    userName,
    action,
    oldStatus,
    newStatus,
    details,
    metadata,
  });

  logger.debug(`Task event logged: ${action} for task ${taskId}`);

  return log;
};

/**
 * جلب سجل تنفيذ مهمة معينة
 */
export const getTaskExecutionLog = async (
  taskId: string,
  limit: number = 50
): Promise<ITaskExecutionLog[]> => {
  const logs = await TaskExecutionLog.find({ taskId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);

  return logs;
};

/**
 * جلب سجل تنفيذ مستخدم معين
 */
export const getUserExecutionLog = async (
  userId: string,
  limit: number = 50
): Promise<ITaskExecutionLog[]> => {
  const logs = await TaskExecutionLog.find({ userId })
    .populate('taskId', 'productName status priority')
    .sort({ createdAt: -1 })
    .limit(limit);

  return logs;
};

/**
 * جلب آخر الأنشطة في النظام
 */
export const getRecentActivity = async (limit: number = 20): Promise<ITaskExecutionLog[]> => {
  const logs = await TaskExecutionLog.find()
    .populate('userId', 'name email')
    .populate('taskId', 'productName status priority')
    .sort({ createdAt: -1 })
    .limit(limit);

  return logs;
};

/**
 * جلب الأنشطة حسب نوع الحدث
 */
export const getActivityByAction = async (
  action: string,
  limit: number = 20
): Promise<ITaskExecutionLog[]> => {
  const logs = await TaskExecutionLog.find({ action })
    .populate('userId', 'name email')
    .populate('taskId', 'productName status priority')
    .sort({ createdAt: -1 })
    .limit(limit);

  return logs;
};

/**
 * حذف سجلات قديمة (للصيانة)
 */
export const cleanOldLogs = async (daysOld: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await TaskExecutionLog.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  logger.info(`Cleaned ${result.deletedCount} old execution logs`);

  return result.deletedCount;
};

logger.info('Task execution log service initialized');
