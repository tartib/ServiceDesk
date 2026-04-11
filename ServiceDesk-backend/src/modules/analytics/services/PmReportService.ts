/**
 * PM Report Service
 *
 * Aggregates project management KPIs for the unified reports page.
 * Queries the PM models directly for cross-project analytics.
 */

import logger from '../../../utils/logger';
import PMProject from '../../pm/models/Project';
import PMTask from '../../pm/models/Task';
import PMSprint from '../../pm/models/Sprint';

export interface PmAnalyticsSummary {
  projects: {
    total: number;
    active: number;
    archived: number;
  };
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completion_rate_percent: number;
  };
  sprints: {
    total: number;
    active: number;
    completed: number;
    avg_velocity: number;
  };
  story_points: {
    total: number;
    completed: number;
    completion_percent: number;
  };
  generated_at: string;
}

export interface VelocityPoint {
  sprint_name: string;
  committed: number;
  completed: number;
}

class PmReportService {
  /**
   * Unified PM analytics summary.
   */
  async getSummary(organizationId?: string): Promise<PmAnalyticsSummary> {
    logger.debug('Generating PM analytics summary', { organizationId });

    const orgFilter: Record<string, unknown> = {};
    if (organizationId) orgFilter.organizationId = organizationId;

    const [projects, taskStats, sprintStats] = await Promise.all([
      PMProject.find({ ...orgFilter, status: { $ne: 'deleted' } })
        .select('status')
        .lean(),
      PMTask.aggregate([
        { $match: orgFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ['$status.category', 'todo'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status.category', 'in_progress'] }, 1, 0] } },
            done: { $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, 1, 0] } },
            totalPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
            completedPoints: {
              $sum: {
                $cond: [
                  { $eq: ['$status.category', 'done'] },
                  { $ifNull: ['$storyPoints', 0] },
                  0,
                ],
              },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status.category', 'done'] },
                      { $ne: ['$dueDate', null] },
                      { $lt: ['$dueDate', new Date()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      PMSprint.aggregate([
        { $match: orgFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalVelocity: { $sum: { $ifNull: ['$velocity', 0] } },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const ts = taskStats[0] || { total: 0, todo: 0, inProgress: 0, done: 0, totalPoints: 0, completedPoints: 0, overdue: 0 };
    const ss = sprintStats[0] || { total: 0, active: 0, completed: 0, totalVelocity: 0, completedCount: 0 };

    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const archivedProjects = projects.filter((p: any) => p.status === 'archived').length;
    const completionRate = ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0;
    const pointsPercent = ts.totalPoints > 0 ? Math.round((ts.completedPoints / ts.totalPoints) * 100) : 0;
    const avgVelocity = ss.completedCount > 0 ? Math.round(ss.totalVelocity / ss.completedCount) : 0;

    return {
      projects: {
        total: projects.length,
        active: activeProjects,
        archived: archivedProjects,
      },
      tasks: {
        total: ts.total,
        todo: ts.todo,
        in_progress: ts.inProgress,
        done: ts.done,
        overdue: ts.overdue,
        completion_rate_percent: completionRate,
      },
      sprints: {
        total: ss.total,
        active: ss.active,
        completed: ss.completed,
        avg_velocity: avgVelocity,
      },
      story_points: {
        total: ts.totalPoints,
        completed: ts.completedPoints,
        completion_percent: pointsPercent,
      },
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Velocity trend: story points committed vs completed per sprint.
   * Returns the last N completed sprints across all projects.
   */
  async getVelocityTrend(limit: number = 10, organizationId?: string): Promise<VelocityPoint[]> {
    const orgFilter: Record<string, unknown> = {};
    if (organizationId) orgFilter.organizationId = organizationId;

    const sprints = await PMSprint.find({
      ...orgFilter,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select('name velocity stats')
      .lean();

    return sprints.reverse().map((s: any) => ({
      sprint_name: s.name || 'Sprint',
      committed: s.stats?.totalPoints || 0,
      completed: s.velocity || s.stats?.completedPoints || 0,
    }));
  }
}

export default new PmReportService();
