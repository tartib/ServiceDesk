import logger from '../../utils/logger';
import { IDashboardKPIService, TaskKPIs } from './interfaces/IDashboardKPIService';
import Task from '../../models/pm/Task';
import { PMStatusCategory } from '../../models/pm/Task';

/**
 * Dashboard KPI Service
 * Handles KPI calculations for task metrics and performance tracking
 */
export class DashboardKPIService implements IDashboardKPIService {
  /**
   * Calculate KPIs for a given date range
   */
  async calculateKPIs(dateFrom?: Date, dateTo?: Date): Promise<TaskKPIs> {
    try {
      logger.debug('Calculating KPIs', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        criticalTasks,
      ] = await Promise.all([
        Task.countDocuments(query),
        Task.countDocuments({ ...query, 'status.category': PMStatusCategory.DONE }),
        Task.countDocuments({ ...query, 'status.category': PMStatusCategory.IN_PROGRESS }),
        Task.countDocuments({
          ...query,
          dueDate: { $lt: new Date() },
          'status.category': { $ne: PMStatusCategory.DONE },
        }),
        Task.countDocuments({ ...query, priority: 'critical' }),
      ]);

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const onTimeCompletionRate = await this.getOnTimeCompletionRate(dateFrom, dateTo);
      const averageCompletionTime = await this.getAverageCompletionTime(dateFrom, dateTo);

      const kpis: TaskKPIs = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        pendingTasks: totalTasks - completedTasks - inProgressTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        onTimeCompletionRate,
        averageCompletionTime,
        criticalTasks,
        escalatedTasks: 0,
      };

      logger.info('KPIs calculated successfully', kpis);
      return kpis;
    } catch (error) {
      logger.error('Error calculating KPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate completion rate for a date range
   */
  async calculateCompletionRate(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Calculating completion rate', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments(query),
        Task.countDocuments({ ...query, 'status.category': PMStatusCategory.DONE }),
      ]);

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      return Math.round(completionRate * 100) / 100;
    } catch (error) {
      logger.error('Error calculating completion rate:', error);
      throw error;
    }
  }

  /**
   * Get count of overdue tasks for a date range
   */
  async getOverdueTasks(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Fetching overdue tasks count', { dateFrom, dateTo });

      const query: Record<string, unknown> = {
        dueDate: { $lt: new Date() },
        'status.category': { $ne: PMStatusCategory.DONE },
      };

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const overdueTasks = await Task.countDocuments(query);
      return overdueTasks;
    } catch (error) {
      logger.error('Error fetching overdue tasks:', error);
      throw error;
    }
  }

  /**
   * Get average completion time for a date range
   */
  async getAverageCompletionTime(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Calculating average completion time', { dateFrom, dateTo });

      const query: Record<string, unknown> = { 'status.category': PMStatusCategory.DONE };
      if (dateFrom || dateTo) {
        query.completedAt = {};
        if (dateFrom) (query.completedAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.completedAt as Record<string, Date>).$lte = dateTo;
      }

      const completedTasks = await Task.find(query).select('createdAt completedAt');

      if (completedTasks.length === 0) return 0;

      const totalTime = completedTasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          const timeDiff = (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + timeDiff;
        }
        return sum;
      }, 0);

      const avgTime = totalTime / completedTasks.length;
      return Math.round(avgTime * 100) / 100;
    } catch (error) {
      logger.error('Error calculating average completion time:', error);
      throw error;
    }
  }

  /**
   * Get on-time completion rate for a date range
   */
  async getOnTimeCompletionRate(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Calculating on-time completion rate', { dateFrom, dateTo });

      const query: Record<string, unknown> = { 'status.category': PMStatusCategory.DONE, dueDate: { $exists: true } };
      if (dateFrom || dateTo) {
        query.completedAt = {};
        if (dateFrom) (query.completedAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.completedAt as Record<string, Date>).$lte = dateTo;
      }

      const completedTasks = await Task.find(query).select('completedAt dueDate');

      if (completedTasks.length === 0) return 0;

      const onTimeTasks = completedTasks.filter(
        (task) => task.completedAt && task.dueDate && task.completedAt <= task.dueDate
      ).length;

      const onTimeRate = (onTimeTasks / completedTasks.length) * 100;
      return Math.round(onTimeRate * 100) / 100;
    } catch (error) {
      logger.error('Error calculating on-time completion rate:', error);
      throw error;
    }
  }
}

export default new DashboardKPIService();
