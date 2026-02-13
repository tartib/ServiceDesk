import logger from '../../utils/logger';
import { IDashboardPerformanceService, TeamPerformance } from './interfaces/IDashboardPerformanceService';
import Task from '../../models/pm/Task';
import { PMStatusCategory } from '../../models/pm/Task';

/**
 * Dashboard Performance Service
 * Handles team and individual performance metrics
 */
export class DashboardPerformanceService implements IDashboardPerformanceService {
  /**
   * Get team performance metrics
   */
  async getTeamPerformance(dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance> {
    try {
      logger.debug('Fetching team performance metrics', { dateFrom, dateTo });

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

      const tasksPerMember: Record<string, number> = {};
      const completionRatePerMember: Record<string, number> = {};

      const assignedTasks = await Task.find({ ...query, assignee: { $exists: true } })
        .select('assignee status.category')
        .lean();

      for (const task of assignedTasks) {
        const userId = task.assignee?.toString() || '';
        tasksPerMember[userId] = (tasksPerMember[userId] || 0) + 1;
        if (task.status?.category === PMStatusCategory.DONE) {
          completionRatePerMember[userId] = (completionRatePerMember[userId] || 0) + 1;
        }
      }

      Object.keys(completionRatePerMember).forEach((userId) => {
        const rate = (completionRatePerMember[userId] / tasksPerMember[userId]) * 100;
        completionRatePerMember[userId] = Math.round(rate * 100) / 100;
      });

      const topPerformers = await this.getTopPerformers(5, dateFrom, dateTo);

      const performance: TeamPerformance = {
        totalMembers: Object.keys(tasksPerMember).length,
        activeMembers: Object.keys(tasksPerMember).length,
        tasksPerMember,
        completionRatePerMember,
        averagePerformanceScore: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        topPerformers,
      };

      logger.info('Team performance calculated', performance);
      return performance;
    } catch (error) {
      logger.error('Error fetching team performance:', error);
      throw error;
    }
  }

  /**
   * Get top performers
   */
  async getTopPerformers(
    limit: number = 5,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Array<{ userId: string; userName: string; tasksCompleted: number; avgScore: number }>> {
    try {
      logger.debug('Fetching top performers', { limit, dateFrom, dateTo });

      const query: Record<string, unknown> = { assignee: { $exists: true } };
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const tasks = await Task.find(query)
        .select('assignee status.category')
        .populate('assignee', 'name email')
        .lean();

      const performerMap: Record<string, { tasksCompleted: number; totalTasks: number; name: string }> = {};

      for (const task of tasks) {
        const assigneeObj = task.assignee as unknown as Record<string, unknown> | null;
        const userId = (assigneeObj?._id as unknown as { toString(): string })?.toString() || '';
        const userName = (assigneeObj?.name as string) || 'Unknown';

        if (!performerMap[userId]) {
          performerMap[userId] = { tasksCompleted: 0, totalTasks: 0, name: userName };
        }

        performerMap[userId].totalTasks += 1;
        if (task.status?.category === PMStatusCategory.DONE) {
          performerMap[userId].tasksCompleted += 1;
        }
      }

      const performers = Object.entries(performerMap)
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          tasksCompleted: data.tasksCompleted,
          avgScore: data.totalTasks > 0 ? (data.tasksCompleted / data.totalTasks) * 100 : 0,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, limit);

      return performers;
    } catch (error) {
      logger.error('Error fetching top performers:', error);
      throw error;
    }
  }

  /**
   * Get individual performance metrics
   */
  async getMemberPerformance(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{ tasksCompleted: number; completionRate: number; avgScore: number }> {
    try {
      logger.debug('Fetching member performance metrics', { userId, dateFrom, dateTo });

      const query: Record<string, unknown> = { assignee: userId };
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

      return {
        tasksCompleted: completedTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        avgScore: Math.round(completionRate * 100) / 100,
      };
    } catch (error) {
      logger.error(`Error fetching member performance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get active members count
   */
  async getActiveMembers(dateFrom?: Date, dateTo?: Date): Promise<number> {
    try {
      logger.debug('Fetching active members count', { dateFrom, dateTo });

      const query: Record<string, unknown> = { assignee: { $exists: true } };
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const activeMembers = await Task.distinct('assignee', query);
      return activeMembers.length;
    } catch (error) {
      logger.error('Error fetching active members:', error);
      throw error;
    }
  }
}

export default new DashboardPerformanceService();
