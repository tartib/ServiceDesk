import { Response } from 'express';
import { PMAuthRequest, ApiResponse } from '../../../types/pm';
import logger from '../../../utils/logger';
import PMProject from '../models/Project';
import PMTask from '../models/Task';
import PMSprint from '../models/Sprint';
import PMActivity from '../models/Activity';
import Organization from '../models/Organization';
import User from '../../../models/User';

// Helper: resolve organizationId with fallback
async function resolveOrganizationId(userId?: string, orgId?: string): Promise<string | null> {
  if (orgId) return orgId;
  if (!userId) return null;
  const org = await Organization.findOne({ createdBy: userId });
  return org ? org._id.toString() : null;
}

/**
 * GET /portfolio/overview
 * Aggregated cross-project KPIs
 */
export const getPortfolioOverview = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);
    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Organization is required' } as ApiResponse);
      return;
    }

    const orgFilter = { organizationId };

    const [projects, taskStats, sprintStats] = await Promise.all([
      PMProject.find({ ...orgFilter, status: { $ne: 'deleted' } }).lean(),
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
              $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, { $ifNull: ['$storyPoints', 0] }, 0] },
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
          },
        },
      ]),
    ]);

    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const archivedProjects = projects.filter((p) => p.status === 'archived').length;

    // Timeline health: count projects with targetEndDate
    const now = new Date();
    let onTime = 0;
    let overdue = 0;
    let noDeadline = 0;
    projects.forEach((p) => {
      if (!p.targetEndDate) {
        noDeadline++;
      } else if (new Date(p.targetEndDate) >= now || p.status === 'archived') {
        onTime++;
      } else {
        overdue++;
      }
    });

    // Unique members across all projects
    const memberSet = new Set<string>();
    projects.forEach((p) => {
      (p.members || []).forEach((m: { userId: unknown }) => {
        if (m.userId) memberSet.add(m.userId.toString());
      });
    });

    const ts = taskStats[0] || { total: 0, todo: 0, inProgress: 0, done: 0, totalPoints: 0, completedPoints: 0, overdue: 0 };
    const ss = sprintStats[0] || { total: 0, active: 0, completed: 0 };
    const completionRate = ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: projects.length,
          active: activeProjects,
          archived: archivedProjects,
        },
        tasks: {
          total: ts.total,
          todo: ts.todo,
          inProgress: ts.inProgress,
          done: ts.done,
          overdue: ts.overdue,
          completionRate,
        },
        storyPoints: {
          total: ts.totalPoints,
          completed: ts.completedPoints,
        },
        sprints: {
          total: ss.total,
          active: ss.active,
          completed: ss.completed,
        },
        timeline: { onTime, overdue, noDeadline },
        teamMembers: memberSet.size,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Portfolio overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio overview' } as ApiResponse);
  }
};

/**
 * GET /portfolio/projects
 * Per-project summary array
 */
export const getPortfolioProjects = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);
    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Organization is required' } as ApiResponse);
      return;
    }

    const projects = await PMProject.find({ organizationId, status: { $ne: 'deleted' } }).lean();
    const projectIds = projects.map((p) => p._id);

    // Task stats per project
    const taskStatsByProject = await PMTask.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status.category', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status.category', 'in_progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, 1, 0] } },
          totalPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
          completedPoints: {
            $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, { $ifNull: ['$storyPoints', 0] }, 0] },
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
    ]);
    const taskMap = new Map(taskStatsByProject.map((t) => [t._id.toString(), t]));

    // Active sprints per project
    const activeSprints = await PMSprint.find({
      projectId: { $in: projectIds },
      status: 'active',
    }).lean();
    const activeSprintMap = new Map(activeSprints.map((s) => [s.projectId.toString(), s]));

    // Last completed sprint per project (for velocity)
    const lastCompletedSprints = await PMSprint.aggregate([
      { $match: { projectId: { $in: projectIds }, status: 'completed' } },
      { $sort: { endDate: -1 } },
      { $group: { _id: '$projectId', sprint: { $first: '$$ROOT' } } },
    ]);
    const velocityMap = new Map(
      lastCompletedSprints.map((s) => [s._id.toString(), s.sprint?.velocity?.completed || 0])
    );

    // Resolve owners (lead members) for all projects
    const ownerUserIds = new Set<string>();
    projects.forEach((p) => {
      const lead = (p.members || []).find((m: { role: string }) => m.role === 'lead');
      if (lead?.userId) ownerUserIds.add(lead.userId.toString());
    });
    const ownerUsers = await User.find({ _id: { $in: Array.from(ownerUserIds) } })
      .select('name email profile')
      .lean();
    const ownerMap = new Map(
      ownerUsers.map((u) => [
        u._id.toString(),
        {
          _id: u._id.toString(),
          name: ((u.profile?.firstName || '') + ' ' + (u.profile?.lastName || '')).trim() || u.name || u.email || 'Unknown',
          email: u.email,
          avatar: u.profile?.avatar || null,
        },
      ])
    );

    const now = new Date();
    const projectSummaries = projects.map((p) => {
      const pid = p._id.toString();
      const ts = taskMap.get(pid) || { total: 0, todo: 0, inProgress: 0, done: 0, totalPoints: 0, completedPoints: 0, overdue: 0 };
      const completionPct = ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0;
      const activeSprint = activeSprintMap.get(pid);
      const velocity = velocityMap.get(pid) || 0;

      // Timeline status
      let timelineStatus: 'on_track' | 'at_risk' | 'overdue' | 'no_deadline' = 'no_deadline';
      let daysRemaining: number | null = null;
      if (p.targetEndDate) {
        const diff = Math.ceil((new Date(p.targetEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = diff;
        if (diff < 0) timelineStatus = 'overdue';
        else if (diff <= 7) timelineStatus = 'at_risk';
        else timelineStatus = 'on_track';
      }

      // Resolve owner
      const lead = (p.members || []).find((m: { role: string }) => m.role === 'lead');
      const owner = lead?.userId ? ownerMap.get(lead.userId.toString()) || null : null;

      return {
        _id: pid,
        name: p.name,
        key: p.key,
        methodology: p.methodology?.code || 'scrum',
        status: p.status,
        health: p.health || 'green',
        priority: p.priority || 'medium',
        escalated: p.escalated || false,
        escalationReason: p.escalationReason || '',
        startDate: p.startDate || null,
        targetEndDate: p.targetEndDate || null,
        owner,
        memberCount: (p.members || []).length,
        tasks: {
          total: ts.total,
          todo: ts.todo,
          inProgress: ts.inProgress,
          done: ts.done,
          overdue: ts.overdue,
        },
        completionPct,
        storyPoints: { total: ts.totalPoints, completed: ts.completedPoints },
        velocity,
        activeSprint: activeSprint
          ? {
              name: activeSprint.name,
              daysLeft: Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
              progress: activeSprint.capacity?.committed
                ? Math.round(((activeSprint.velocity?.completed || 0) / activeSprint.capacity.committed) * 100)
                : 0,
            }
          : null,
        timeline: { status: timelineStatus, daysRemaining },
      };
    });

    res.status(200).json({ success: true, data: { projects: projectSummaries } } as ApiResponse);
  } catch (error) {
    logger.error('Portfolio projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio projects' } as ApiResponse);
  }
};

/**
 * GET /portfolio/trends
 * Time-series data (last 12 weeks)
 */
export const getPortfolioTrends = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);
    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Organization is required' } as ApiResponse);
      return;
    }

    const weeks = parseInt(req.query.weeks as string) || 12;
    const now = new Date();
    const startDate = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    // Tasks created per week
    const createdByWeek = await PMTask.aggregate([
      { $match: { organizationId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Tasks completed per week
    const completedByWeek = await PMTask.aggregate([
      {
        $match: {
          organizationId,
          'status.category': 'done',
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$completedAt' },
            week: { $isoWeek: '$completedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Build weekly series
    const createdMap = new Map(createdByWeek.map((w) => [`${w._id.year}-W${w._id.week}`, w.count]));
    const completedMap = new Map(completedByWeek.map((w) => [`${w._id.year}-W${w._id.week}`, w.count]));

    const series: { week: string; created: number; completed: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const yearNum = getISOWeekYear(d);
      const weekNum = getISOWeek(d);
      const key = `${yearNum}-W${weekNum}`;
      series.push({
        week: key,
        created: createdMap.get(key) || 0,
        completed: completedMap.get(key) || 0,
      });
    }

    res.status(200).json({ success: true, data: { series } } as ApiResponse);
  } catch (error) {
    logger.error('Portfolio trends error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio trends' } as ApiResponse);
  }
};

/**
 * GET /portfolio/team-workload
 * Cross-project team workload
 */
export const getPortfolioTeamWorkload = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = await resolveOrganizationId(req.user?.id, req.user?.organizationId);
    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Organization is required' } as ApiResponse);
      return;
    }

    const workload = await PMTask.aggregate([
      { $match: { organizationId, assignee: { $ne: null } } },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status.category', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status.category', 'in_progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, 1, 0] } },
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
          totalPoints: { $sum: { $ifNull: ['$storyPoints', 0] } },
          completedPoints: {
            $sum: { $cond: [{ $eq: ['$status.category', 'done'] }, { $ifNull: ['$storyPoints', 0] }, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          total: 1,
          todo: 1,
          inProgress: 1,
          done: 1,
          overdue: 1,
          totalPoints: 1,
          completedPoints: 1,
          name: {
            $cond: [
              { $and: ['$user.profile.firstName'] },
              { $concat: ['$user.profile.firstName', ' ', { $ifNull: ['$user.profile.lastName', ''] }] },
              { $ifNull: ['$user.name', '$user.email'] },
            ],
          },
          avatar: '$user.profile.avatar',
          email: '$user.email',
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({ success: true, data: { members: workload } } as ApiResponse);
  } catch (error) {
    logger.error('Portfolio team workload error:', error);
    res.status(500).json({ success: false, error: 'Failed to get team workload' } as ApiResponse);
  }
};

/**
 * GET /portfolio/projects/:projectId/performance
 * Per-project drill-down
 */
export const getProjectPerformance = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const [project, tasks, sprints, activities] = await Promise.all([
      PMProject.findById(projectId).lean(),
      PMTask.find({ projectId }).lean(),
      PMSprint.find({ projectId }).sort({ number: -1 }).limit(10).lean(),
      PMActivity.find({ projectId }).sort({ createdAt: -1 }).limit(20).populate('actor', 'name email profile').lean(),
    ]);

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    // Task breakdown by status category
    const byStatus = { todo: 0, inProgress: 0, done: 0 };
    const byPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};
    let overdue = 0;
    const now = new Date();

    tasks.forEach((t) => {
      if (t.status.category === 'todo') byStatus.todo++;
      else if (t.status.category === 'in_progress') byStatus.inProgress++;
      else if (t.status.category === 'done') byStatus.done++;

      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
      byType[t.type] = (byType[t.type] || 0) + 1;

      if (t.dueDate && new Date(t.dueDate) < now && t.status.category !== 'done') overdue++;
    });

    const total = tasks.length;
    const completionPct = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

    // Sprint velocity history
    const velocityHistory = sprints
      .filter((s) => s.status === 'completed')
      .reverse()
      .map((s) => ({
        name: s.name,
        number: s.number,
        planned: s.velocity?.planned || 0,
        completed: s.velocity?.completed || 0,
      }));

    // Member performance within this project
    const memberMap: Record<string, { name: string; total: number; done: number; inProgress: number; points: number }> = {};
    tasks.forEach((t) => {
      if (!t.assignee) return;
      const aid = t.assignee.toString();
      if (!memberMap[aid]) {
        memberMap[aid] = { name: aid, total: 0, done: 0, inProgress: 0, points: 0 };
      }
      memberMap[aid].total++;
      if (t.status.category === 'done') {
        memberMap[aid].done++;
        memberMap[aid].points += t.storyPoints || 0;
      }
      if (t.status.category === 'in_progress') memberMap[aid].inProgress++;
    });

    // Resolve member names from project.members
    const memberNames = new Map<string, string>();
    if (project.members) {
      const userIds = project.members.map((m: { userId: unknown }) => m.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('name email profile').lean();
      users.forEach((u) => {
        const first = u.profile?.firstName || '';
        const last = u.profile?.lastName || '';
        const name = (first + ' ' + last).trim() || u.name || u.email || 'Unknown';
        memberNames.set(u._id.toString(), name);
      });
    }

    const memberPerformance = Object.entries(memberMap)
      .map(([id, m]) => ({
        userId: id,
        name: memberNames.get(id) || m.name,
        total: m.total,
        done: m.done,
        inProgress: m.inProgress,
        points: m.points,
        completionRate: m.total > 0 ? Math.round((m.done / m.total) * 100) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);

    // Recent activity
    const recentActivity = activities.map((a) => ({
      _id: a._id,
      type: a.type,
      description: a.description,
      actor: a.actor,
      createdAt: a.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        project: { _id: project._id, name: project.name, key: project.key, methodology: project.methodology?.code },
        tasks: { total, ...byStatus, overdue, completionPct },
        byPriority,
        byType,
        velocityHistory,
        memberPerformance,
        recentActivity,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Project performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get project performance' } as ApiResponse);
  }
};

/**
 * GET /portfolio/projects/:projectId/report
 * Generate a structured project report
 */
export const generateProjectReport = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const [project, tasks, sprints, activities] = await Promise.all([
      PMProject.findById(projectId).lean(),
      PMTask.find({ projectId }).lean(),
      PMSprint.find({ projectId }).sort({ number: -1 }).limit(10).lean(),
      PMActivity.find({ projectId }).sort({ createdAt: -1 }).limit(30).populate('actor', 'name email profile').lean(),
    ]);

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    // Resolve owner
    const lead = (project.members || []).find((m: { role: string }) => m.role === 'lead');
    let owner = null;
    if (lead?.userId) {
      const u = await User.findById(lead.userId).select('name email profile').lean();
      if (u) {
        owner = {
          name: ((u.profile?.firstName || '') + ' ' + (u.profile?.lastName || '')).trim() || u.name || u.email,
          email: u.email,
          avatar: u.profile?.avatar || null,
        };
      }
    }

    // Task breakdown
    const byStatus = { todo: 0, inProgress: 0, done: 0 };
    const byPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};
    let overdue = 0;
    const now = new Date();

    tasks.forEach((t) => {
      if (t.status.category === 'todo') byStatus.todo++;
      else if (t.status.category === 'in_progress') byStatus.inProgress++;
      else if (t.status.category === 'done') byStatus.done++;
      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
      byType[t.type] = (byType[t.type] || 0) + 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status.category !== 'done') overdue++;
    });

    const total = tasks.length;
    const completionPct = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

    // Sprint velocity
    const velocityHistory = sprints
      .filter((s) => s.status === 'completed')
      .reverse()
      .map((s) => ({
        name: s.name,
        number: s.number,
        planned: s.velocity?.planned || 0,
        completed: s.velocity?.completed || 0,
      }));

    // Timeline
    let timelineStatus = 'no_deadline';
    let daysRemaining: number | null = null;
    if (project.targetEndDate) {
      const diff = Math.ceil((new Date(project.targetEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = diff;
      if (diff < 0) timelineStatus = 'overdue';
      else if (diff <= 7) timelineStatus = 'at_risk';
      else timelineStatus = 'on_track';
    }

    const report = {
      generatedAt: now.toISOString(),
      project: {
        _id: project._id,
        name: project.name,
        key: project.key,
        methodology: project.methodology?.code,
        status: project.status,
        health: (project as any).health || 'green',
        priority: (project as any).priority || 'medium',
        escalated: (project as any).escalated || false,
        escalationReason: (project as any).escalationReason || '',
        startDate: project.startDate || null,
        targetEndDate: project.targetEndDate || null,
        owner,
        memberCount: (project.members || []).length,
      },
      performance: {
        tasks: { total, ...byStatus, overdue, completionPct },
        byPriority,
        byType,
      },
      timeline: { status: timelineStatus, daysRemaining },
      velocityHistory,
      recentActivity: activities.slice(0, 15).map((a) => ({
        type: a.type,
        description: a.description,
        actor: a.actor,
        createdAt: a.createdAt,
      })),
    };

    res.status(200).json({ success: true, data: report } as ApiResponse);
  } catch (error) {
    logger.error('Generate project report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' } as ApiResponse);
  }
};

// ─── ISO Week helpers ────────────────────────────────────────────────
function getISOWeek(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7);
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}
