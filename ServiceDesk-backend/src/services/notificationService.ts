import Notification, { INotification } from '../models/Notification';
import PrepTask from '../models/PrepTask';
import User from '../models/User';
import { NotificationType, NotificationLevel, TaskPriority, UserRole } from '../types';
import logger from '../utils/logger';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  level?: NotificationLevel;
  priority?: TaskPriority;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedInventoryId?: string;
  isEscalation?: boolean;
  escalatedFrom?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export const createNotification = async (
  data: CreateNotificationData
): Promise<INotification> => {
  const notification = await Notification.create({
    ...data,
    sentAt: new Date(),
  });

  logger.info(`Notification created for user ${data.userId}: ${data.title}`);

  return notification;
};

export const getUserNotifications = async (
  userId: string,
  isRead?: boolean
): Promise<INotification[]> => {
  const query: any = { userId };
  
  if (isRead !== undefined) {
    query.isRead = isRead;
  }

  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50);
};

export const markAsRead = async (notificationId: string): Promise<INotification | null> => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (notification) {
    logger.info(`Notification marked as read: ${notificationId}`);
  }

  return notification;
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);

  return result.modifiedCount;
};

/**
 * إنشاء إشعار قبل موعد المهمة
 */
export const createBeforeDueNotification = async (
  taskId: string,
  minutesBefore: number
): Promise<INotification | null> => {
  const task = await PrepTask.findById(taskId).populate('assignedTo');

  if (!task || !task.assignedTo) {
    return null;
  }

  const message = `ستبدأ مهمة "${task.productName}" خلال ${minutesBefore} دقيقة`;

  return await createNotification({
    userId: task.assignedTo._id.toString(),
    type: NotificationType.BEFORE_DUE,
    level: NotificationLevel.INFO,
    priority: task.priority,
    title: 'تنبيه: مهمة قريبة',
    message,
    relatedTaskId: taskId,
    actionRequired: true,
    actionUrl: `/tasks/${taskId}`,
    metadata: { minutesBefore },
  });
};

/**
 * إنشاء إشعار تأخير
 */
export const createOverdueNotification = async (
  taskId: string
): Promise<INotification | null> => {
  const task = await PrepTask.findById(taskId).populate('assignedTo');

  if (!task || !task.assignedTo) {
    return null;
  }

  const message = `المهمة "${task.productName}" متأخرة عن الموعد المحدد`;

  return await createNotification({
    userId: task.assignedTo._id.toString(),
    type: NotificationType.OVERDUE,
    level: NotificationLevel.WARNING,
    priority: TaskPriority.HIGH,
    title: 'تحذير: مهمة متأخرة',
    message,
    relatedTaskId: taskId,
    actionRequired: true,
    actionUrl: `/tasks/${taskId}`,
  });
};

/**
 * إنشاء إشعار حرج للمهام الحرجة
 */
export const createCriticalNotification = async (
  taskId: string
): Promise<INotification | null> => {
  const task = await PrepTask.findById(taskId).populate('assignedTo');

  if (!task || !task.assignedTo) {
    return null;
  }

  const message = `مهمة حرجة "${task.productName}" تحتاج إلى اهتمام فوري`;

  return await createNotification({
    userId: task.assignedTo._id.toString(),
    type: NotificationType.CRITICAL,
    level: NotificationLevel.CRITICAL,
    priority: TaskPriority.CRITICAL,
    title: 'تنبيه حرج: مهمة عاجلة',
    message,
    relatedTaskId: taskId,
    actionRequired: true,
    actionUrl: `/tasks/${taskId}`,
  });
};

/**
 * تصعيد مهمة للمدير
 */
export const escalateTask = async (
  taskId: string,
  reason: string
): Promise<{ task: any; notification: INotification }> => {
  const task = await PrepTask.findById(taskId).populate('assignedTo');

  if (!task) {
    throw new Error('Task not found');
  }

  // البحث عن المدير
  const manager = await User.findOne({ role: UserRole.MANAGER, isActive: true });

  if (!manager) {
    throw new Error('No active manager found');
  }

  // تحديث المهمة
  task.isEscalated = true;
  task.escalatedAt = new Date();
  task.escalatedTo = manager._id as any;
  await task.save();

  // إنشاء إشعار للمدير
  const notification = await createNotification({
    userId: manager._id.toString(),
    type: NotificationType.ESCALATION,
    level: NotificationLevel.CRITICAL,
    priority: TaskPriority.CRITICAL,
    title: 'تصعيد: مهمة تحتاج إلى تدخل',
    message: `تم تصعيد المهمة "${task.productName}". السبب: ${reason}`,
    relatedTaskId: taskId,
    isEscalation: true,
    escalatedFrom: task.assignedTo?._id.toString(),
    actionRequired: true,
    actionUrl: `/tasks/${taskId}`,
    metadata: { reason, escalatedAt: new Date() },
  });

  // إشعار للموظف المعين
  if (task.assignedTo) {
    await createNotification({
      userId: task.assignedTo._id.toString(),
      type: NotificationType.ESCALATION,
      level: NotificationLevel.WARNING,
      priority: TaskPriority.HIGH,
      title: 'تم تصعيد المهمة',
      message: `تم تصعيد المهمة "${task.productName}" إلى المدير`,
      relatedTaskId: taskId,
      actionRequired: false,
      metadata: { reason },
    });
  }

  logger.info(`Task ${taskId} escalated to manager ${manager.name}. Reason: ${reason}`);

  return { task, notification };
};

/**
 * التحقق من المهام التي تحتاج إلى تصعيد تلقائي
 */
export const autoEscalateOverdueTasks = async (): Promise<number> => {
  const overdueThreshold = new Date();
  overdueThreshold.setHours(overdueThreshold.getHours() - 2); // مهام متأخرة لأكثر من ساعتين

  const tasks = await PrepTask.find({
    dueAt: { $lt: overdueThreshold },
    isOverdue: true,
    isEscalated: false,
    status: { $nin: ['completed', 'done'] },
    priority: { $in: [TaskPriority.CRITICAL, TaskPriority.HIGH] },
  });

  let escalatedCount = 0;

  for (const task of tasks) {
    try {
      await escalateTask(
        task._id.toString(),
        'تصعيد تلقائي: المهمة متأخرة لأكثر من ساعتين'
      );
      escalatedCount++;
    } catch (error) {
      logger.error(`Failed to auto-escalate task ${task._id}:`, error);
    }
  }

  logger.info(`Auto-escalated ${escalatedCount} overdue tasks`);

  return escalatedCount;
};

/**
 * إرسال تنبيهات دورية للمهام القريبة
 */
export const sendUpcomingTaskReminders = async (): Promise<number> => {
  const now = new Date();
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

  const tasks = await PrepTask.find({
    scheduledAt: { $gte: now, $lte: in30Minutes },
    status: 'scheduled',
    assignedTo: { $exists: true },
  });

  let notificationsSent = 0;

  for (const task of tasks) {
    try {
      await createBeforeDueNotification(task._id.toString(), 30);
      notificationsSent++;
    } catch (error) {
      logger.error(`Failed to send reminder for task ${task._id}:`, error);
    }
  }

  logger.info(`Sent ${notificationsSent} upcoming task reminders`);

  return notificationsSent;
};

/**
 * جلب الإشعارات الحرجة غير المقروءة
 */
export const getCriticalUnreadNotifications = async (
  userId: string
): Promise<INotification[]> => {
  return await Notification.find({
    userId,
    isRead: false,
    level: { $in: [NotificationLevel.CRITICAL, NotificationLevel.ERROR] },
  })
    .populate('relatedTaskId', 'productName status priority')
    .sort({ createdAt: -1 });
};

/**
 * حذف الإشعارات القديمة
 */
export const cleanOldNotifications = async (daysOld: number = 30): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });

  logger.info(`Cleaned ${result.deletedCount} old notifications`);

  return result.deletedCount;
};

logger.info('Enhanced notification service initialized');
