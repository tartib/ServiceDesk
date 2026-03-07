import logger from '../../../utils/logger';
import { IDashboardKPIService, TaskKPIs } from './interfaces/IDashboardKPIService';
import InternalApiRegistry from '../../../shared/internal-api/InternalApiRegistry';
import { IPmApi } from '../../../shared/internal-api/types';
import DailyKPISnapshot from '../read-models/DailyKPISnapshot';
import TaskSnapshot from '../read-models/TaskSnapshot';
import { isAnalyticsPostgres, getAnalyticsRepos } from '../infrastructure/repositories';

function getTask() {
  return InternalApiRegistry.get<IPmApi>('pm').getTaskModel();
}

function getPMStatusCategory() {
  return InternalApiRegistry.get<IPmApi>('pm').getTaskEnums().PMStatusCategory;
}

/**
 * Dashboard KPI Service
 * Handles KPI calculations for task metrics and performance tracking
 */
export class DashboardKPIService implements IDashboardKPIService {
  /**
   * Calculate KPIs for a given date range.
   * CQRS: tries DailyKPISnapshot read model first, falls back to legacy PM queries.
   */
  async calculateKPIs(dateFrom?: Date, dateTo?: Date): Promise<TaskKPIs> {
    try {
      logger.debug('Calculating KPIs', { dateFrom, dateTo });

      // ── CQRS read-model path ────────────────────────────────
      const readModelKPIs = await this.calculateKPIsFromReadModel(dateFrom, dateTo);
      if (readModelKPIs) {
        logger.info('KPIs served from CQRS read model');
        return readModelKPIs;
      }

      // ── Fallback: legacy PM model queries ───────────────────
      logger.debug('CQRS read models empty, falling back to PM model queries');
      return this.calculateKPIsLegacy(dateFrom, dateTo);
    } catch (error) {
      logger.error('Error calculating KPIs:', error);
      throw error;
    }
  }

  /**
   * Query pre-aggregated DailyKPISnapshot read model.
   * Returns null if no snapshots exist (backfill not yet run).
   */
  private async calculateKPIsFromReadModel(dateFrom?: Date, dateTo?: Date): Promise<TaskKPIs | null> {
    const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateTo || new Date();
    const startKey = startDate.toISOString().slice(0, 10);
    const endKey = endDate.toISOString().slice(0, 10);

    // ── PostgreSQL path ──
    if (isAnalyticsPostgres()) {
      const kpiRepo = getAnalyticsRepos().dailyKPI;
      const snapshots = await kpiRepo.findByDateRange(startKey, endKey);
      if (snapshots.length === 0) return null;

      let totalTasks = 0, createdTasks = 0, completedTasks = 0, inProgressTasks = 0;
      let overdueTasks = 0, pendingTasks = 0, criticalTasks = 0, escalatedTasks = 0;
      let totalCompletionTime = 0, completedWithDuration = 0;

      for (const s of snapshots) {
        totalTasks += s.totalTasks || 0;
        createdTasks += s.createdTasks || 0;
        completedTasks += s.completedTasks || 0;
        inProgressTasks += s.inProgressTasks || 0;
        overdueTasks += s.overdueTasks || 0;
        pendingTasks += s.pendingTasks || 0;
        criticalTasks += s.criticalTasks || 0;
        escalatedTasks += s.escalatedTasks || 0;
        totalCompletionTime += s.totalCompletionTimeHours || 0;
        completedWithDuration += s.completedWithDurationCount || 0;
      }

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const averageCompletionTime = completedWithDuration > 0
        ? Math.round((totalCompletionTime / completedWithDuration) * 100) / 100
        : 0;
      const onTimeCompletionRate = await this.getOnTimeCompletionRateFromReadModel(startDate, endDate);

      return {
        totalTasks, completedTasks, inProgressTasks, overdueTasks, pendingTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        onTimeCompletionRate, averageCompletionTime, criticalTasks, escalatedTasks,
      };
    }

    // ── MongoDB path ──
    const snapshots = await DailyKPISnapshot.find({
      date: { $gte: startKey, $lte: endKey },
    }).lean();

    if (snapshots.length === 0) return null;

    // Aggregate across all days in range
    let totalTasks = 0, createdTasks = 0, completedTasks = 0, inProgressTasks = 0;
    let overdueTasks = 0, pendingTasks = 0, criticalTasks = 0, escalatedTasks = 0;
    let totalCompletionTime = 0, completedWithDuration = 0;

    for (const s of snapshots) {
      totalTasks += s.totalTasks;
      createdTasks += s.createdTasks;
      completedTasks += s.completedTasks;
      inProgressTasks += s.inProgressTasks;
      overdueTasks += s.overdueTasks;
      pendingTasks += s.pendingTasks;
      criticalTasks += s.criticalTasks;
      escalatedTasks += s.escalatedTasks;
      totalCompletionTime += s.totalCompletionTimeHours;
      completedWithDuration += s.completedWithDurationCount;
    }

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageCompletionTime = completedWithDuration > 0
      ? Math.round((totalCompletionTime / completedWithDuration) * 100) / 100
      : 0;

    // On-time rate from TaskSnapshot read model
    const onTimeCompletionRate = await this.getOnTimeCompletionRateFromReadModel(startDate, endDate);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      pendingTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      onTimeCompletionRate,
      averageCompletionTime,
      criticalTasks,
      escalatedTasks,
    };
  }

  private async getOnTimeCompletionRateFromReadModel(dateFrom: Date, dateTo: Date): Promise<number> {
    // ── PostgreSQL path ──
    if (isAnalyticsPostgres()) {
      const tsRepo = getAnalyticsRepos().taskSnapshot;
      const { completed, onTime } = await tsRepo.countOnTime(dateFrom, dateTo);
      if (completed === 0) return 0;
      return Math.round((onTime / completed) * 10000) / 100;
    }

    // ── MongoDB path ──
    const completed = await TaskSnapshot.countDocuments({
      statusCategory: 'done',
      completedAt: { $gte: dateFrom, $lte: dateTo },
      dueDate: { $exists: true },
    });
    if (completed === 0) return 0;

    const onTime = await TaskSnapshot.countDocuments({
      statusCategory: 'done',
      completedAt: { $gte: dateFrom, $lte: dateTo },
      isOnTime: true,
    });

    return Math.round((onTime / completed) * 10000) / 100;
  }

  /**
   * Legacy fallback: query PM Task model directly.
   */
  private async calculateKPIsLegacy(dateFrom?: Date, dateTo?: Date): Promise<TaskKPIs> {
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
      getTask().countDocuments(query),
      getTask().countDocuments({ ...query, 'status.category': getPMStatusCategory().DONE }),
      getTask().countDocuments({ ...query, 'status.category': getPMStatusCategory().IN_PROGRESS }),
      getTask().countDocuments({
        ...query,
        dueDate: { $lt: new Date() },
        'status.category': { $ne: getPMStatusCategory().DONE },
      }),
      getTask().countDocuments({ ...query, priority: 'critical' }),
    ]);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const onTimeCompletionRate = await this.getOnTimeCompletionRate(dateFrom, dateTo);
    const averageCompletionTime = await this.getAverageCompletionTime(dateFrom, dateTo);

    return {
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
        getTask().countDocuments(query),
        getTask().countDocuments({ ...query, 'status.category': getPMStatusCategory().DONE }),
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
        'status.category': { $ne: getPMStatusCategory().DONE },
      };

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = dateTo;
      }

      const overdueTasks = await getTask().countDocuments(query);
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

      const query: Record<string, unknown> = { 'status.category': getPMStatusCategory().DONE };
      if (dateFrom || dateTo) {
        query.completedAt = {};
        if (dateFrom) (query.completedAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.completedAt as Record<string, Date>).$lte = dateTo;
      }

      const completedTasks = await getTask().find(query).select('createdAt completedAt');

      if (completedTasks.length === 0) return 0;

      const totalTime = completedTasks.reduce((sum: number, task: any) => {
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

      const query: Record<string, unknown> = { 'status.category': getPMStatusCategory().DONE, dueDate: { $exists: true } };
      if (dateFrom || dateTo) {
        query.completedAt = {};
        if (dateFrom) (query.completedAt as Record<string, Date>).$gte = dateFrom;
        if (dateTo) (query.completedAt as Record<string, Date>).$lte = dateTo;
      }

      const completedTasks = await getTask().find(query).select('completedAt dueDate');

      if (completedTasks.length === 0) return 0;

      const onTimeTasks = completedTasks.filter(
        (task: any) => task.completedAt && task.dueDate && task.completedAt <= task.dueDate
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
