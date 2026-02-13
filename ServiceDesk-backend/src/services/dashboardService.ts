import PrepTask from '../models/PrepTask';
import User from '../models/User';
import Notification from '../models/Notification';
import { TaskStatus, TaskType, TaskPriority, UserRole } from '../types';
import logger from '../utils/logger';

// KPI Interfaces
export interface TaskKPIs {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  completionRate: number;
  onTimeCompletionRate: number;
  averageCompletionTime: number;
  criticalTasks: number;
  escalatedTasks: number;
}

export interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  tasksPerMember: Record<string, number>;
  completionRatePerMember: Record<string, number>;
  averagePerformanceScore: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
  }>;
}

export interface TaskDistribution {
  byType: Record<TaskType, number>;
  byPriority: Record<TaskPriority, number>;
  byStatus: Record<TaskStatus, number>;
}

export interface TimeAnalysis {
  tasksByHour: Record<number, number>;
  tasksByDayOfWeek: Record<number, number>;
  peakHours: number[];
  averageTaskDuration: number;
  estimatedVsActual: {
    onTime: number;
    delayed: number;
    early: number;
  };
}

export interface DashboardData {
  kpis: TaskKPIs;
  teamPerformance: TeamPerformance;
  taskDistribution: TaskDistribution;
  timeAnalysis: TimeAnalysis;
  recentActivity: any[];
  criticalAlerts: any[];
  trends: {
    completionRateTrend: number;
    overdueRateTrend: number;
  };
}

/**
 * جلب جميع مؤشرات الأداء الرئيسية للوحة التحكم
 */
export const getDashboardData = async (
  dateFrom?: Date,
  dateTo?: Date
): Promise<DashboardData> => {
  const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateTo || new Date();

  const [kpis, teamPerformance, taskDistribution, timeAnalysis, recentActivity, criticalAlerts] =
    await Promise.all([
      getTaskKPIs(startDate, endDate),
      getTeamPerformance(startDate, endDate),
      getTaskDistribution(startDate, endDate),
      getTimeAnalysis(startDate, endDate),
      getRecentActivity(10),
      getCriticalAlerts(),
    ]);

  const trends = await getTrends(startDate, endDate);

  return {
    kpis,
    teamPerformance,
    taskDistribution,
    timeAnalysis,
    recentActivity,
    criticalAlerts,
    trends,
  };
};

/**
 * حساب مؤشرات أداء المهام
 */
export const getTaskKPIs = async (dateFrom: Date, dateTo: Date): Promise<TaskKPIs> => {
  const tasks = await PrepTask.find({
    createdAt: { $gte: dateFrom, $lte: dateTo },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const overdueTasks = tasks.filter((t) => t.isOverdue).length;
  const pendingTasks = tasks.filter(
    (t) => t.status === TaskStatus.SCHEDULED || t.status === TaskStatus.PENDING
  ).length;
  const criticalTasks = tasks.filter((t) => t.priority === TaskPriority.CRITICAL).length;
  const escalatedTasks = tasks.filter((t) => t.isEscalated).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // حساب معدل الإنجاز في الوقت المحدد
  const completedOnTime = tasks.filter(
    (t) =>
      t.status === TaskStatus.COMPLETED &&
      t.completedAt &&
      t.dueAt &&
      t.completedAt <= t.dueAt
  ).length;
  const onTimeCompletionRate = completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 0;

  // متوسط وقت الإنجاز
  const completedWithDuration = tasks.filter((t) => t.actualDuration);
  const averageCompletionTime =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
        completedWithDuration.length
      : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    pendingTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    onTimeCompletionRate: Math.round(onTimeCompletionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime),
    criticalTasks,
    escalatedTasks,
  };
};

/**
 * حساب أداء الفريق
 */
export const getTeamPerformance = async (
  dateFrom: Date,
  dateTo: Date
): Promise<TeamPerformance> => {
  const [tasks, users] = await Promise.all([
    PrepTask.find({
      createdAt: { $gte: dateFrom, $lte: dateTo },
      assignedTo: { $exists: true },
    }).populate('assignedTo', 'name email'),
    User.find({ role: { $in: [UserRole.PREP, UserRole.SUPERVISOR] }, isActive: true }),
  ]);

  const totalMembers = users.length;
  const activeMembers = new Set(tasks.map((t) => t.assignedTo?.toString())).size;

  const tasksPerMember: Record<string, number> = {};
  const completionRatePerMember: Record<string, number> = {};
  const performanceScores: Record<string, number[]> = {};

  tasks.forEach((task) => {
    const userId = task.assignedTo?.toString();
    if (!userId) return;

    tasksPerMember[userId] = (tasksPerMember[userId] || 0) + 1;

    if (task.status === TaskStatus.COMPLETED) {
      completionRatePerMember[userId] = (completionRatePerMember[userId] || 0) + 1;
    }

    if (task.completionScore) {
      if (!performanceScores[userId]) performanceScores[userId] = [];
      performanceScores[userId].push(task.completionScore);
    }
  });

  // حساب معدل الإنجاز لكل عضو
  Object.keys(completionRatePerMember).forEach((userId) => {
    const completed = completionRatePerMember[userId];
    const total = tasksPerMember[userId];
    completionRatePerMember[userId] = (completed / total) * 100;
  });

  // حساب متوسط الأداء
  const allScores = Object.values(performanceScores).flat();
  const averagePerformanceScore =
    allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  // أفضل المؤدين
  const topPerformers = Object.entries(performanceScores)
    .map(([userId, scores]) => {
      const user = users.find((u) => u._id.toString() === userId);
      return {
        userId,
        userName: user?.name || 'Unknown',
        tasksCompleted: completionRatePerMember[userId] || 0,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return {
    totalMembers,
    activeMembers,
    tasksPerMember,
    completionRatePerMember,
    averagePerformanceScore: Math.round(averagePerformanceScore * 100) / 100,
    topPerformers,
  };
};

/**
 * توزيع المهام حسب النوع والأولوية والحالة
 */
export const getTaskDistribution = async (
  dateFrom: Date,
  dateTo: Date
): Promise<TaskDistribution> => {
  const tasks = await PrepTask.find({
    createdAt: { $gte: dateFrom, $lte: dateTo },
  });

  const byType: Record<TaskType, number> = {
    [TaskType.RED_ALERT]: 0,
    [TaskType.MEDIUM]: 0,
    [TaskType.DAILY_RECURRING]: 0,
    [TaskType.WEEKLY_RECURRING]: 0,
    [TaskType.ON_DEMAND]: 0,
  };

  const byPriority: Record<TaskPriority, number> = {
    [TaskPriority.CRITICAL]: 0,
    [TaskPriority.HIGH]: 0,
    [TaskPriority.MEDIUM]: 0,
    [TaskPriority.LOW]: 0,
  };

  const byStatus: Record<TaskStatus, number> = {
    [TaskStatus.SCHEDULED]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.COMPLETED]: 0,
    [TaskStatus.LATE]: 0,
    [TaskStatus.OVERDUE]: 0,
    [TaskStatus.STOCK_ISSUE]: 0,
    [TaskStatus.PENDING]: 0,
    [TaskStatus.DONE]: 0,
  };

  tasks.forEach((task) => {
    byType[task.taskType] = (byType[task.taskType] || 0) + 1;
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
  });

  return { byType, byPriority, byStatus };
};

/**
 * تحليل الوقت والأنماط
 */
export const getTimeAnalysis = async (dateFrom: Date, dateTo: Date): Promise<TimeAnalysis> => {
  const tasks = await PrepTask.find({
    createdAt: { $gte: dateFrom, $lte: dateTo },
  });

  const tasksByHour: Record<number, number> = {};
  const tasksByDayOfWeek: Record<number, number> = {};

  tasks.forEach((task) => {
    const hour = task.scheduledAt.getHours();
    const dayOfWeek = task.scheduledAt.getDay();

    tasksByHour[hour] = (tasksByHour[hour] || 0) + 1;
    tasksByDayOfWeek[dayOfWeek] = (tasksByDayOfWeek[dayOfWeek] || 0) + 1;
  });

  // أوقات الذروة
  const peakHours = Object.entries(tasksByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // متوسط مدة المهمة
  const completedTasks = tasks.filter((t) => t.actualDuration);
  const averageTaskDuration =
    completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
        completedTasks.length
      : 0;

  // مقارنة التقدير مع الفعلي
  const estimatedVsActual = {
    onTime: 0,
    delayed: 0,
    early: 0,
  };

  completedTasks.forEach((task) => {
    if (!task.actualDuration || !task.estimatedDuration) return;

    if (task.actualDuration <= task.estimatedDuration) {
      estimatedVsActual.early++;
    } else if (task.actualDuration <= task.estimatedDuration * 1.1) {
      estimatedVsActual.onTime++;
    } else {
      estimatedVsActual.delayed++;
    }
  });

  return {
    tasksByHour,
    tasksByDayOfWeek,
    peakHours,
    averageTaskDuration: Math.round(averageTaskDuration),
    estimatedVsActual,
  };
};

/**
 * جلب النشاط الأخير
 */
export const getRecentActivity = async (limit: number = 10): Promise<any[]> => {
  const tasks = await PrepTask.find()
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('assignedTo', 'name email')
    .lean();

  return tasks.map((task) => ({
    id: task._id,
    type: 'task',
    action: task.status,
    taskName: task.productName,
    assignedTo: task.assignedToName,
    timestamp: task.updatedAt,
    priority: task.priority,
  }));
};

/**
 * جلب التنبيهات الحرجة
 */
export const getCriticalAlerts = async (): Promise<any[]> => {
  const [overdueTasks, escalatedTasks, criticalNotifications] = await Promise.all([
    PrepTask.find({
      isOverdue: true,
      status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
    })
      .populate('assignedTo', 'name email')
      .limit(10)
      .lean(),
    PrepTask.find({
      isEscalated: true,
      status: { $nin: [TaskStatus.COMPLETED, TaskStatus.DONE] },
    })
      .populate('assignedTo', 'name email')
      .populate('escalatedTo', 'name email')
      .limit(10)
      .lean(),
    Notification.find({
      level: 'critical',
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const alerts = [
    ...overdueTasks.map((task) => ({
      id: task._id,
      type: 'overdue',
      severity: 'high',
      message: `المهمة "${task.productName}" متأخرة`,
      taskId: task._id,
      assignedTo: task.assignedToName,
      timestamp: task.updatedAt,
    })),
    ...escalatedTasks.map((task) => ({
      id: task._id,
      type: 'escalated',
      severity: 'critical',
      message: `المهمة "${task.productName}" تم تصعيدها`,
      taskId: task._id,
      assignedTo: task.assignedToName,
      timestamp: task.escalatedAt,
    })),
    ...criticalNotifications.map((notif) => ({
      id: notif._id,
      type: 'notification',
      severity: 'critical',
      message: notif.message,
      timestamp: notif.createdAt,
    })),
  ];

  return alerts.sort((a, b) => {
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
    return timeB - timeA;
  }).slice(0, 20);
};

/**
 * حساب الاتجاهات
 */
export const getTrends = async (
  dateFrom: Date,
  dateTo: Date
): Promise<{ completionRateTrend: number; overdueRateTrend: number }> => {
  const periodLength = dateTo.getTime() - dateFrom.getTime();
  const previousPeriodStart = new Date(dateFrom.getTime() - periodLength);

  const [currentKPIs, previousKPIs] = await Promise.all([
    getTaskKPIs(dateFrom, dateTo),
    getTaskKPIs(previousPeriodStart, dateFrom),
  ]);

  const completionRateTrend =
    previousKPIs.completionRate > 0
      ? ((currentKPIs.completionRate - previousKPIs.completionRate) / previousKPIs.completionRate) *
        100
      : 0;

  const currentOverdueRate =
    currentKPIs.totalTasks > 0 ? (currentKPIs.overdueTasks / currentKPIs.totalTasks) * 100 : 0;
  const previousOverdueRate =
    previousKPIs.totalTasks > 0 ? (previousKPIs.overdueTasks / previousKPIs.totalTasks) * 100 : 0;

  const overdueRateTrend =
    previousOverdueRate > 0
      ? ((currentOverdueRate - previousOverdueRate) / previousOverdueRate) * 100
      : 0;

  return {
    completionRateTrend: Math.round(completionRateTrend * 100) / 100,
    overdueRateTrend: Math.round(overdueRateTrend * 100) / 100,
  };
};

logger.info('Dashboard service initialized');
