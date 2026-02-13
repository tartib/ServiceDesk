import logger from '../../utils/logger';
import { IDashboardAnalyticsService, TaskDistribution, TimeAnalysis } from './interfaces/IDashboardAnalyticsService';
import Task from '../../models/pm/Task';

/**
 * Dashboard Analytics Service
 * Handles data distribution analysis and time-based analytics
 */
export class DashboardAnalyticsService implements IDashboardAnalyticsService {
  /**
   * توزيع المهام حسب النوع والأولوية والحالة
   */
  async getTaskDistribution(dateFrom?: Date, dateTo?: Date): Promise<TaskDistribution> {
    try {
      logger.debug('Fetching task distribution', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const [byType, byPriority, byStatus] = await Promise.all([
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$status.name', count: { $sum: 1 } } },
        ]),
      ]);

      const distribution: TaskDistribution = {
        byType: this.aggregateToRecord(byType),
        byPriority: this.aggregateToRecord(byPriority),
        byStatus: this.aggregateToRecord(byStatus),
      };

      logger.info('Task distribution calculated', distribution);
      return distribution;
    } catch (error) {
      logger.error('Error fetching task distribution:', error);
      throw error;
    }
  }

  /**
   * تحليل المهام حسب الوقت
   */
  async getTimeAnalysis(dateFrom?: Date, dateTo?: Date): Promise<TimeAnalysis> {
    try {
      logger.debug('Fetching time analysis', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const tasks = await Task.find(query).select('createdAt dueDate completedAt').lean();

      const tasksByHour: Record<number, number> = {};
      const tasksByDayOfWeek: Record<number, number> = {};

      for (let i = 0; i < 24; i++) tasksByHour[i] = 0;
      for (let i = 0; i < 7; i++) tasksByDayOfWeek[i] = 0;

      for (const task of tasks) {
        if (task.createdAt) {
          const hour = new Date(task.createdAt).getHours();
          const dayOfWeek = new Date(task.createdAt).getDay();
          tasksByHour[hour] = (tasksByHour[hour] || 0) + 1;
          tasksByDayOfWeek[dayOfWeek] = (tasksByDayOfWeek[dayOfWeek] || 0) + 1;
        }
      }

      const peakHours = Object.entries(tasksByHour)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      const avgDuration = await this.getAverageTaskDuration(dateFrom, dateTo);

      const estimatedVsActual = await this.calculateEstimatedVsActual(query);

      const analysis: TimeAnalysis = {
        tasksByHour,
        tasksByDayOfWeek,
        peakHours,
        averageTaskDuration: avgDuration,
        estimatedVsActual,
      };

      logger.info('Time analysis calculated', analysis);
      return analysis;
    } catch (error) {
      logger.error('Error fetching time analysis:', error);
      throw error;
    }
  }

  /**
   * الحصول على ساعات الذروة
   */
  async getPeakHours(dateFrom?: Date, dateTo?: Date): Promise<number[]> {
    try {
      logger.debug('Fetching peak hours', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const tasks = await Task.find(query).select('createdAt').lean();
      const tasksByHour: Record<number, number> = {};

      for (let i = 0; i < 24; i++) tasksByHour[i] = 0;

      for (const task of tasks) {
        if (task.createdAt) {
          const hour = new Date(task.createdAt).getHours();
          tasksByHour[hour] = (tasksByHour[hour] || 0) + 1;
        }
      }

      const peakHours = Object.entries(tasksByHour)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      return peakHours;
    } catch (error) {
      logger.error('Error fetching peak hours:', error);
      throw error;
    }
  }

  /**
   * حساب متوسط مدة المهمة
   */
  async getAverageTaskDuration(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Fetching average task duration', { dateFrom, dateTo });

      const query: Record<string, unknown> = { completedAt: { $exists: true } };
      if (dateFrom || dateTo) {
        query.completedAt = { $exists: true };
        if (dateFrom) (query.completedAt as Record<string, unknown>).$gte = dateFrom;
        if (dateTo) (query.completedAt as Record<string, unknown>).$lte = dateTo;
      }

      const tasks = await Task.find(query).select('createdAt completedAt').lean();

      if (tasks.length === 0) return 0;

      const totalHours = tasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          const diff = (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
          return sum + diff;
        }
        return sum;
      }, 0);

      const avgDuration = totalHours / tasks.length;
      return Math.round(avgDuration * 100) / 100;
    } catch (error) {
      logger.error('Error fetching average task duration:', error);
      throw error;
    }
  }

  /**
   * توزيع المهام حسب النوع
   */
  async getTasksByType(dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>> {
    try {
      logger.debug('Fetching tasks by type', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const result = await Task.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      return this.aggregateToRecord(result);
    } catch (error) {
      logger.error('Error fetching tasks by type:', error);
      throw error;
    }
  }

  /**
   * توزيع المهام حسب الأولوية
   */
  async getTasksByPriority(dateFrom?: Date, dateTo?: Date): Promise<Record<string, number>> {
    try {
      logger.debug('Fetching tasks by priority', { dateFrom, dateTo });

      const query: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const result = await Task.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]);

      return this.aggregateToRecord(result);
    } catch (error) {
      logger.error('Error fetching tasks by priority:', error);
      throw error;
    }
  }

  private aggregateToRecord(result: Array<{ _id: string; count: number }>): Record<string, number> {
    const record: Record<string, number> = {};
    for (const item of result) {
      if (item._id) {
        record[item._id] = item.count;
      }
    }
    return record;
  }

  private async calculateEstimatedVsActual(query: Record<string, unknown>): Promise<{ onTime: number; delayed: number; early: number }> {
    const tasks = await Task.find({ ...query, dueDate: { $exists: true }, completedAt: { $exists: true } })
      .select('dueDate completedAt')
      .lean();

    if (tasks.length === 0) {
      return { onTime: 0, delayed: 0, early: 0 };
    }

    let onTime = 0;
    let delayed = 0;

    for (const task of tasks) {
      if (task.completedAt && task.dueDate) {
        const completed = new Date(task.completedAt).getTime();
        const due = new Date(task.dueDate).getTime();

        if (completed <= due) {
          onTime += 1;
        } else if (completed > due) {
          delayed += 1;
        }
      }
    }

    const total = onTime + delayed;
    return {
      onTime: total > 0 ? Math.round((onTime / total) * 100) : 0,
      delayed: total > 0 ? Math.round((delayed / total) * 100) : 0,
      early: 0,
    };
  }
}

export default new DashboardAnalyticsService();
