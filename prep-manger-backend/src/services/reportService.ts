import PrepTask from '../models/PrepTask';
import { TaskStatus, TaskType, TaskPriority } from '../types';
import logger from '../utils/logger';

export interface DailyReportData {
  date: Date;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  topPerformers: Array<{ userId: string; userName: string; tasksCompleted: number }>;
  delays: number;
  earlyCompletions: number;
}

export interface WeeklyReportData {
  weekStart: Date;
  weekEnd: Date;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  dailyBreakdown: Array<{
    date: Date;
    tasks: number;
    completed: number;
  }>;
  teamPerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
  }>;
  trends: {
    completionRateTrend: number;
    productivityTrend: number;
  };
}

export interface MonthlyReportData {
  month: number;
  year: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
  escalatedTasks: number;
  weeklyBreakdown: Array<{
    week: number;
    tasks: number;
    completed: number;
  }>;
  teamPerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    avgScore: number;
    hoursWorked: number;
  }>;
  insights: {
    bestDay: string;
    worstDay: string;
    peakHours: number[];
    improvementAreas: string[];
  };
}

/**
 * تقرير يومي
 */
export const generateDailyReport = async (date?: Date): Promise<DailyReportData> => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await PrepTask.find({
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  }).populate('assignedTo', 'name email');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const overdueTasks = tasks.filter((t) => t.isOverdue).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // حساب متوسط وقت الإنجاز
  const completedWithDuration = tasks.filter((t) => t.actualDuration);
  const averageCompletionTime =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
        completedWithDuration.length
      : 0;

  // توزيع المهام حسب النوع
  const tasksByType: Record<TaskType, number> = {
    [TaskType.RED_ALERT]: 0,
    [TaskType.MEDIUM]: 0,
    [TaskType.DAILY_RECURRING]: 0,
    [TaskType.WEEKLY_RECURRING]: 0,
    [TaskType.ON_DEMAND]: 0,
  };

  const tasksByPriority: Record<TaskPriority, number> = {
    [TaskPriority.CRITICAL]: 0,
    [TaskPriority.HIGH]: 0,
    [TaskPriority.MEDIUM]: 0,
    [TaskPriority.LOW]: 0,
  };

  tasks.forEach((task) => {
    tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
  });

  // أفضل المؤدين
  const userTasks: Record<string, { name: string; count: number }> = {};
  tasks.forEach((task) => {
    if (task.status === TaskStatus.COMPLETED && task.assignedTo) {
      const userId = task.assignedTo._id.toString();
      if (!userTasks[userId]) {
        userTasks[userId] = {
          name: task.assignedToName || 'Unknown',
          count: 0,
        };
      }
      userTasks[userId].count++;
    }
  });

  const topPerformers = Object.entries(userTasks)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      tasksCompleted: data.count,
    }))
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 5);

  // حساب التأخيرات والإنجازات المبكرة
  let delays = 0;
  let earlyCompletions = 0;

  tasks.forEach((task) => {
    if (task.status === TaskStatus.COMPLETED && task.completedAt && task.dueAt) {
      if (task.completedAt > task.dueAt) {
        delays++;
      } else {
        earlyCompletions++;
      }
    }
  });

  logger.info(`Daily report generated for ${targetDate.toDateString()}`);

  return {
    date: targetDate,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime),
    tasksByType,
    tasksByPriority,
    topPerformers,
    delays,
    earlyCompletions,
  };
};

/**
 * تقرير أسبوعي
 */
export const generateWeeklyReport = async (weekStart?: Date): Promise<WeeklyReportData> => {
  const start = weekStart || getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const tasks = await PrepTask.find({
    createdAt: { $gte: start, $lte: end },
  }).populate('assignedTo', 'name email');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const overdueTasks = tasks.filter((t) => t.isOverdue).length;
  const escalatedTasks = tasks.filter((t) => t.isEscalated).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const completedWithDuration = tasks.filter((t) => t.actualDuration);
  const averageCompletionTime =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
        completedWithDuration.length
      : 0;

  // تفصيل يومي
  const dailyBreakdown = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTasks = tasks.filter(
      (t) => t.scheduledAt >= dayStart && t.scheduledAt <= dayEnd
    );

    dailyBreakdown.push({
      date: day,
      tasks: dayTasks.length,
      completed: dayTasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    });
  }

  // أداء الفريق
  const userPerformance: Record<
    string,
    { name: string; completed: number; scores: number[] }
  > = {};

  tasks.forEach((task) => {
    if (task.assignedTo) {
      const userId = task.assignedTo._id.toString();
      if (!userPerformance[userId]) {
        userPerformance[userId] = {
          name: task.assignedToName || 'Unknown',
          completed: 0,
          scores: [],
        };
      }

      if (task.status === TaskStatus.COMPLETED) {
        userPerformance[userId].completed++;
      }

      if (task.completionScore) {
        userPerformance[userId].scores.push(task.completionScore);
      }
    }
  });

  const teamPerformance = Object.entries(userPerformance)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      tasksCompleted: data.completed,
      avgScore: data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0,
    }))
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  // حساب الاتجاهات
  const previousWeekStart = new Date(start);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

  const previousWeekTasks = await PrepTask.find({
    createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
  });

  const previousCompletionRate =
    previousWeekTasks.length > 0
      ? (previousWeekTasks.filter((t) => t.status === TaskStatus.COMPLETED).length /
          previousWeekTasks.length) *
        100
      : 0;

  const completionRateTrend =
    previousCompletionRate > 0
      ? ((completionRate - previousCompletionRate) / previousCompletionRate) * 100
      : 0;

  const productivityTrend =
    previousWeekTasks.length > 0
      ? ((totalTasks - previousWeekTasks.length) / previousWeekTasks.length) * 100
      : 0;

  logger.info(`Weekly report generated for week starting ${start.toDateString()}`);

  return {
    weekStart: start,
    weekEnd: end,
    totalTasks,
    completedTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime),
    overdueTasks,
    escalatedTasks,
    dailyBreakdown,
    teamPerformance,
    trends: {
      completionRateTrend: Math.round(completionRateTrend * 100) / 100,
      productivityTrend: Math.round(productivityTrend * 100) / 100,
    },
  };
};

/**
 * تقرير شهري
 */
export const generateMonthlyReport = async (
  month?: number,
  year?: number
): Promise<MonthlyReportData> => {
  const targetDate = new Date();
  const targetMonth = month || targetDate.getMonth();
  const targetYear = year || targetDate.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const tasks = await PrepTask.find({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  }).populate('assignedTo', 'name email');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const overdueTasks = tasks.filter((t) => t.isOverdue).length;
  const escalatedTasks = tasks.filter((t) => t.isEscalated).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const completedWithDuration = tasks.filter((t) => t.actualDuration);
  const averageCompletionTime =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
        completedWithDuration.length
      : 0;

  // تفصيل أسبوعي
  const weeklyBreakdown = [];
  const weeksInMonth = Math.ceil(
    (endOfMonth.getDate() - startOfMonth.getDate() + 1) / 7
  );

  for (let week = 0; week < weeksInMonth; week++) {
    const weekStart = new Date(startOfMonth);
    weekStart.setDate(weekStart.getDate() + week * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > endOfMonth) weekEnd.setTime(endOfMonth.getTime());

    const weekTasks = tasks.filter(
      (t) => t.scheduledAt >= weekStart && t.scheduledAt <= weekEnd
    );

    weeklyBreakdown.push({
      week: week + 1,
      tasks: weekTasks.length,
      completed: weekTasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    });
  }

  // أداء الفريق مع ساعات العمل
  const userPerformance: Record<
    string,
    { name: string; completed: number; scores: number[]; duration: number }
  > = {};

  tasks.forEach((task) => {
    if (task.assignedTo) {
      const userId = task.assignedTo._id.toString();
      if (!userPerformance[userId]) {
        userPerformance[userId] = {
          name: task.assignedToName || 'Unknown',
          completed: 0,
          scores: [],
          duration: 0,
        };
      }

      if (task.status === TaskStatus.COMPLETED) {
        userPerformance[userId].completed++;
        if (task.actualDuration) {
          userPerformance[userId].duration += task.actualDuration;
        }
      }

      if (task.completionScore) {
        userPerformance[userId].scores.push(task.completionScore);
      }
    }
  });

  const teamPerformance = Object.entries(userPerformance).map(([userId, data]) => ({
    userId,
    userName: data.name,
    tasksCompleted: data.completed,
    avgScore:
      data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
    hoursWorked: Math.round((data.duration / 60) * 100) / 100,
  }));

  // رؤى وتحليلات
  const dayTaskCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    const dayKey = task.scheduledAt.toDateString();
    dayTaskCounts[dayKey] = (dayTaskCounts[dayKey] || 0) + 1;
  });

  const sortedDays = Object.entries(dayTaskCounts).sort((a, b) => b[1] - a[1]);
  const bestDay = sortedDays[0]?.[0] || 'N/A';
  const worstDay = sortedDays[sortedDays.length - 1]?.[0] || 'N/A';

  // ساعات الذروة
  const hourCounts: Record<number, number> = {};
  tasks.forEach((task) => {
    const hour = task.scheduledAt.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // مجالات التحسين
  const improvementAreas: string[] = [];
  if (completionRate < 70) {
    improvementAreas.push('معدل إنجاز منخفض - يحتاج إلى تحسين');
  }
  if (overdueTasks > totalTasks * 0.2) {
    improvementAreas.push('نسبة عالية من المهام المتأخرة');
  }
  if (escalatedTasks > 5) {
    improvementAreas.push('عدد كبير من المهام المصعدة - يحتاج إلى مراجعة');
  }

  logger.info(`Monthly report generated for ${targetMonth + 1}/${targetYear}`);

  return {
    month: targetMonth,
    year: targetYear,
    totalTasks,
    completedTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime),
    overdueTasks,
    escalatedTasks,
    weeklyBreakdown,
    teamPerformance,
    insights: {
      bestDay,
      worstDay,
      peakHours,
      improvementAreas,
    },
  };
};

/**
 * الحصول على بداية الأسبوع (الأحد)
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Dashboard Analytics - Performance metrics and insights
 */
export interface DashboardAnalytics {
  totalTasks: {
    count: number;
    changePercent: number;
    changeLabel: string;
  };
  completionRate: {
    percent: number;
    changePercent: number;
    changeLabel: string;
  };
  avgPrepTime: {
    hours: number;
    changePercent: number;
    changeLabel: string;
  };
  onTimeTasks: {
    percent: number;
    changePercent: number;
    changeLabel: string;
  };
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const now = new Date();
  
  // Current week range
  const currentWeekStart = getStartOfWeek(now);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // Previous week range
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
  previousWeekEnd.setHours(23, 59, 59, 999);

  // Fetch current week tasks
  const currentWeekTasks = await PrepTask.find({
    createdAt: { $gte: currentWeekStart, $lte: currentWeekEnd },
  });

  // Fetch previous week tasks
  const previousWeekTasks = await PrepTask.find({
    createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd },
  });

  // Calculate Total Tasks
  const currentTotalTasks = currentWeekTasks.length;
  const previousTotalTasks = previousWeekTasks.length;
  const totalTasksChange = previousTotalTasks > 0
    ? ((currentTotalTasks - previousTotalTasks) / previousTotalTasks) * 100
    : 0;

  // Calculate Completion Rate
  const currentCompletedTasks = currentWeekTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE
  ).length;
  const currentCompletionRate = currentTotalTasks > 0
    ? (currentCompletedTasks / currentTotalTasks) * 100
    : 0;

  const previousCompletedTasks = previousWeekTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE
  ).length;
  const previousCompletionRate = previousTotalTasks > 0
    ? (previousCompletedTasks / previousTotalTasks) * 100
    : 0;

  const completionRateChange = previousCompletionRate > 0
    ? ((currentCompletionRate - previousCompletionRate) / previousCompletionRate) * 100
    : 0;

  // Calculate Average Prep Time (in hours)
  const currentTasksWithDuration = currentWeekTasks.filter((t) => t.actualDuration);
  const currentAvgPrepTimeMinutes = currentTasksWithDuration.length > 0
    ? currentTasksWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
      currentTasksWithDuration.length
    : 0;
  const currentAvgPrepTimeHours = currentAvgPrepTimeMinutes / 60;

  const previousTasksWithDuration = previousWeekTasks.filter((t) => t.actualDuration);
  const previousAvgPrepTimeMinutes = previousTasksWithDuration.length > 0
    ? previousTasksWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) /
      previousTasksWithDuration.length
    : 0;

  const avgPrepTimeChange = previousAvgPrepTimeMinutes > 0
    ? ((currentAvgPrepTimeMinutes - previousAvgPrepTimeMinutes) / previousAvgPrepTimeMinutes) * 100
    : 0;

  // Calculate On-Time Tasks (completed before or at due date)
  const currentOnTimeTasks = currentWeekTasks.filter(
    (t) =>
      (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE) &&
      t.completedAt &&
      t.dueAt &&
      t.completedAt <= t.dueAt
  ).length;
  const currentOnTimeRate = currentCompletedTasks > 0
    ? (currentOnTimeTasks / currentCompletedTasks) * 100
    : 0;

  const previousOnTimeTasks = previousWeekTasks.filter(
    (t) =>
      (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE) &&
      t.completedAt &&
      t.dueAt &&
      t.completedAt <= t.dueAt
  ).length;
  const previousOnTimeRate = previousCompletedTasks > 0
    ? (previousOnTimeTasks / previousCompletedTasks) * 100
    : 0;

  const onTimeRateChange = previousOnTimeRate > 0
    ? ((currentOnTimeRate - previousOnTimeRate) / previousOnTimeRate) * 100
    : 0;

  logger.info('Dashboard analytics generated');

  return {
    totalTasks: {
      count: currentTotalTasks,
      changePercent: Math.round(totalTasksChange),
      changeLabel: `${totalTasksChange >= 0 ? '+' : ''}${Math.round(totalTasksChange)}% from last week`,
    },
    completionRate: {
      percent: Math.round(currentCompletionRate),
      changePercent: Math.round(completionRateChange),
      changeLabel: `${completionRateChange >= 0 ? '+' : ''}${Math.round(completionRateChange)}% from last week`,
    },
    avgPrepTime: {
      hours: Math.round(currentAvgPrepTimeHours * 10) / 10,
      changePercent: Math.round(avgPrepTimeChange),
      changeLabel: `${avgPrepTimeChange >= 0 ? '+' : ''}${Math.round(avgPrepTimeChange)}% from last week`,
    },
    onTimeTasks: {
      percent: Math.round(currentOnTimeRate),
      changePercent: Math.round(onTimeRateChange),
      changeLabel: `${onTimeRateChange >= 0 ? '+' : ''}${Math.round(onTimeRateChange)}% from last week`,
    },
  };
};

logger.info('Report service initialized');
