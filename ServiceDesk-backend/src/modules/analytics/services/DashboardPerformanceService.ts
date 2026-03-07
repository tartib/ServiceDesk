import logger from '../../../utils/logger';
import { IDashboardPerformanceService, TeamPerformance } from './interfaces/IDashboardPerformanceService';
import InternalApiRegistry from '../../../shared/internal-api/InternalApiRegistry';
import { IPmApi } from '../../../shared/internal-api/types';
import TaskSnapshot from '../read-models/TaskSnapshot';
import { isAnalyticsPostgres, getAnalyticsRepos } from '../infrastructure/repositories';

function getTask() {
  return InternalApiRegistry.get<IPmApi>('pm').getTaskModel();
}

function getPMStatusCategory() {
  return InternalApiRegistry.get<IPmApi>('pm').getTaskEnums().PMStatusCategory;
}

/**
 * Dashboard Performance Service
 * Handles team and individual performance metrics
 */
export class DashboardPerformanceService implements IDashboardPerformanceService {
  /**
   * Get team performance metrics
   */
  /**
   * CQRS: tries TaskSnapshot read model first, falls back to PM model.
   */
  async getTeamPerformance(dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance> {
    try {
      logger.debug('Fetching team performance metrics', { dateFrom, dateTo });

      // ── CQRS read-model path ────────────────────────────────
      const rmResult = await this.getTeamPerformanceFromReadModel(dateFrom, dateTo);
      if (rmResult) {
        logger.info('Team performance served from CQRS read model');
        return rmResult;
      }

      // ── Fallback: legacy PM queries ─────────────────────────
      logger.debug('CQRS read models empty, falling back to PM model');
      return this.getTeamPerformanceLegacy(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error fetching team performance:', error);
      throw error;
    }
  }

  private async getTeamPerformanceFromReadModel(dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance | null> {
    // ── PostgreSQL path ──
    if (isAnalyticsPostgres()) {
      const tsRepo = getAnalyticsRepos().taskSnapshot;
      const totalTasks = await tsRepo.countByFilter({});
      if (totalTasks === 0) return null;

      const completedTasks = await tsRepo.countByFilter({ statusCategory: 'done' });
      const assignedSnapshots = await tsRepo.getAssigneeSnapshots(dateFrom, dateTo);

      const tasksPerMember: Record<string, number> = {};
      const completionRatePerMember: Record<string, number> = {};

      for (const snap of assignedSnapshots) {
        const uid = snap.assigneeId || '';
        tasksPerMember[uid] = (tasksPerMember[uid] || 0) + 1;
        if (snap.statusCategory === 'done') {
          completionRatePerMember[uid] = (completionRatePerMember[uid] || 0) + 1;
        }
      }

      Object.keys(completionRatePerMember).forEach((uid) => {
        const rate = (completionRatePerMember[uid] / tasksPerMember[uid]) * 100;
        completionRatePerMember[uid] = Math.round(rate * 100) / 100;
      });

      const topPerformers = Object.entries(tasksPerMember)
        .map(([userId, total]) => ({
          userId,
          userName: userId,
          tasksCompleted: completionRatePerMember[userId] || 0,
          avgScore: total > 0 ? ((completionRatePerMember[userId] || 0) / total) * 100 : 0,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      return {
        totalMembers: Object.keys(tasksPerMember).length,
        activeMembers: Object.keys(tasksPerMember).length,
        tasksPerMember,
        completionRatePerMember,
        averagePerformanceScore: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        topPerformers,
      };
    }

    // ── MongoDB path ──
    const query: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
    }

    const count = await TaskSnapshot.countDocuments(query);
    if (count === 0) return null;

    const totalTasks = count;
    const completedTasks = await TaskSnapshot.countDocuments({ ...query, statusCategory: 'done' });

    const assignedSnapshots = await TaskSnapshot.find({ ...query, assigneeId: { $exists: true } })
      .select('assigneeId statusCategory')
      .lean();

    const tasksPerMember: Record<string, number> = {};
    const completionRatePerMember: Record<string, number> = {};

    for (const snap of assignedSnapshots) {
      const uid = snap.assigneeId?.toString() || '';
      tasksPerMember[uid] = (tasksPerMember[uid] || 0) + 1;
      if (snap.statusCategory === 'done') {
        completionRatePerMember[uid] = (completionRatePerMember[uid] || 0) + 1;
      }
    }

    Object.keys(completionRatePerMember).forEach((uid) => {
      const rate = (completionRatePerMember[uid] / tasksPerMember[uid]) * 100;
      completionRatePerMember[uid] = Math.round(rate * 100) / 100;
    });

    const topPerformers = Object.entries(tasksPerMember)
      .map(([userId, total]) => ({
        userId,
        userName: userId,
        tasksCompleted: completionRatePerMember[userId] || 0,
        avgScore: total > 0 ? ((completionRatePerMember[userId] || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    return {
      totalMembers: Object.keys(tasksPerMember).length,
      activeMembers: Object.keys(tasksPerMember).length,
      tasksPerMember,
      completionRatePerMember,
      averagePerformanceScore: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      topPerformers,
    };
  }

  private async getTeamPerformanceLegacy(dateFrom?: Date, dateTo?: Date): Promise<TeamPerformance> {
    const query: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
    }

    const [totalTasks, completedTasks] = await Promise.all([
      getTask().countDocuments(query),
      getTask().countDocuments({ ...query, 'status.category': getPMStatusCategory().DONE }),
    ]);

    const tasksPerMember: Record<string, number> = {};
    const completionRatePerMember: Record<string, number> = {};

    const assignedTasks = await getTask().find({ ...query, assignee: { $exists: true } })
      .select('assignee status.category')
      .lean();

    for (const task of assignedTasks) {
      const userId = task.assignee?.toString() || '';
      tasksPerMember[userId] = (tasksPerMember[userId] || 0) + 1;
      if (task.status?.category === getPMStatusCategory().DONE) {
        completionRatePerMember[userId] = (completionRatePerMember[userId] || 0) + 1;
      }
    }

    Object.keys(completionRatePerMember).forEach((userId) => {
      const rate = (completionRatePerMember[userId] / tasksPerMember[userId]) * 100;
      completionRatePerMember[userId] = Math.round(rate * 100) / 100;
    });

    const topPerformers = await this.getTopPerformers(5, dateFrom, dateTo);

    return {
      totalMembers: Object.keys(tasksPerMember).length,
      activeMembers: Object.keys(tasksPerMember).length,
      tasksPerMember,
      completionRatePerMember,
      averagePerformanceScore: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      topPerformers,
    };
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

      const tasks = await getTask().find(query)
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
        if (task.status?.category === getPMStatusCategory().DONE) {
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
        getTask().countDocuments(query),
        getTask().countDocuments({ ...query, 'status.category': getPMStatusCategory().DONE }),
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

      const activeMembers = await getTask().distinct('assignee', query);
      return activeMembers.length;
    } catch (error) {
      logger.error('Error fetching active members:', error);
      throw error;
    }
  }
}

export default new DashboardPerformanceService();
