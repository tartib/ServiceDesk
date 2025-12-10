import DailyReport from '../models/DailyReport';
import PrepTask from '../models/PrepTask';
import { TaskStatus } from '../types';
import logger from '../utils/logger';

export const generateDailyReport = async (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all tasks for the day
  const tasks = await PrepTask.find({
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
  }).populate('assignedTo', 'name');

  const taskSummary = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    lateTasks: tasks.filter((t) => t.status === TaskStatus.LATE).length,
    inProgressTasks: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    stockIssueTasks: tasks.filter((t) => t.status === TaskStatus.STOCK_ISSUE).length,
  };

  // Calculate employee performance
  const employeeMap = new Map();
  
  for (const task of tasks) {
    if (task.assignedTo && task.status === TaskStatus.COMPLETED) {
      const userId = (task.assignedTo as any)._id.toString();
      const userName = (task.assignedTo as any).name;

      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          userId,
          userName,
          tasksCompleted: 0,
          totalTime: 0,
          onTimeCompletions: 0,
          lateCompletions: 0,
        });
      }

      const emp = employeeMap.get(userId);
      emp.tasksCompleted++;

      if (task.startedAt && task.completedAt) {
        const timeTaken = task.completedAt.getTime() - task.startedAt.getTime();
        emp.totalTime += timeTaken;

        const expectedTime = task.prepTimeMinutes * 60 * 1000;
        if (timeTaken <= expectedTime) {
          emp.onTimeCompletions++;
        } else {
          emp.lateCompletions++;
        }
      }
    }
  }

  const employeePerformance = Array.from(employeeMap.values()).map((emp) => ({
    userId: emp.userId,
    userName: emp.userName,
    tasksCompleted: emp.tasksCompleted,
    averageCompletionTime: emp.totalTime / emp.tasksCompleted / (1000 * 60), // in minutes
    onTimeCompletions: emp.onTimeCompletions,
    lateCompletions: emp.lateCompletions,
  }));

  // Calculate waste
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  let totalPrepared = 0;
  let totalUsed = 0;

  for (const task of completedTasks) {
    if (task.preparedQuantity) totalPrepared += task.preparedQuantity;
    if (task.usedQuantity) totalUsed += task.usedQuantity;
  }

  const totalWaste = totalPrepared - totalUsed;
  const wastePercentage = totalPrepared > 0 ? (totalWaste / totalPrepared) * 100 : 0;

  // Create report
  const report = await DailyReport.create({
    date: startOfDay,
    taskSummary,
    employeePerformance,
    totalPrepared,
    totalUsed,
    totalWaste,
    wastePercentage,
    generatedAt: new Date(),
  });

  logger.info(`Daily report generated for ${date.toDateString()}`);

  return report;
};

export const getDailyReport = async (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  return await DailyReport.findOne({ date: startOfDay });
};
