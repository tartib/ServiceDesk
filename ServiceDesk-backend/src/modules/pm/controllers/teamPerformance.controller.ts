import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PMTask, PMGoal, PMPointTransaction, PMProject } from '../models';
import User from '../../../models/User';
import Team from '../../../models/Team';
import logger from '../../../utils/logger';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

function resolveOrganizationId(user?: Request['user']): string | null {
  if (!user) return null;
  if (user.organizationId) return user.organizationId;
  if (user.organizations && user.organizations.length > 0) {
    return user.organizations[0].organizationId;
  }
  return null;
}

// ─── GET /pm/team-performance/users ─────────────────────────────────────────

export const getTeamPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = resolveOrganizationId(req.user);

    const {
      from,
      to,
      teamId,
      projectId,
      q,
      sort = 'score',
      sortDir = 'desc',
      page = '1',
      limit = '25',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));
    const skip = (pageNum - 1) * limitNum;

    const dateFrom = from ? new Date(from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dateTo = to ? new Date(to as string) : new Date();

    // Resolve user scope
    let scopedUserIds: mongoose.Types.ObjectId[] | null = null;

    if (teamId) {
      const team = await Team.findById(teamId).select('members').lean();
      if (team?.members) {
        scopedUserIds = team.members.map((m) => m.user_id as mongoose.Types.ObjectId);
      }
    }

    // If projectId provided, scope to project members
    let projectMemberFilter: mongoose.Types.ObjectId[] | null = null;
    if (projectId) {
      const project = await PMProject.findById(projectId).select('members').lean();
      if (project?.members) {
        projectMemberFilter = project.members
          .filter((m: any) => m.status === 'active' || !m.status)
          .map((m: any) => m.userId as mongoose.Types.ObjectId);
      }
    }

    // Build user query
    const userQuery: Record<string, unknown> = { isActive: true };
    if (q) {
      userQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (scopedUserIds) {
      userQuery._id = { $in: scopedUserIds };
    }
    if (projectMemberFilter) {
      userQuery._id = { $in: projectMemberFilter };
    }

    const totalUsers = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select('name email role profile')
      .skip(skip)
      .limit(limitNum)
      .lean();

    const userIds = users.map((u) => u._id);

    // Aggregate tasks per user in period
    const taskMatch: Record<string, unknown> = { assignee: { $in: userIds } };
    if (organizationId) taskMatch.organizationId = new mongoose.Types.ObjectId(organizationId);
    if (projectId) taskMatch.projectId = new mongoose.Types.ObjectId(projectId as string);

    const taskAgg = await PMTask.aggregate([
      { $match: taskMatch },
      {
        $group: {
          _id: '$assignee',
          done: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status.category', 'done'] },
                    { $gte: ['$completedAt', dateFrom] },
                    { $lte: ['$completedAt', dateTo] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          open: { $sum: { $cond: [{ $eq: ['$status.category', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status.category', 'in_progress'] }, 1, 0] } },
          late: {
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
    const taskMap = new Map(taskAgg.map((t) => [t._id.toString(), t]));

    // Aggregate points per user in period
    const pointMatch: Record<string, unknown> = {
      userId: { $in: userIds },
      approved: true,
      createdAt: { $gte: dateFrom, $lte: dateTo },
    };
    if (organizationId) pointMatch.organizationId = new mongoose.Types.ObjectId(organizationId);
    if (projectId) pointMatch.projectId = new mongoose.Types.ObjectId(projectId as string);

    const pointAgg = await PMPointTransaction.aggregate([
      { $match: pointMatch },
      {
        $group: {
          _id: '$userId',
          totalPoints: {
            $sum: {
              $cond: [
                { $in: ['$type', ['earned', 'bonus']] },
                '$amount',
                { $multiply: ['$amount', -1] },
              ],
            },
          },
        },
      },
    ]);
    const pointMap = new Map(pointAgg.map((p) => [p._id.toString(), p.totalPoints]));

    // Aggregate goals per user
    const goalMatch: Record<string, unknown> = { ownerId: { $in: userIds } };
    if (organizationId) goalMatch.organizationId = new mongoose.Types.ObjectId(organizationId);
    if (projectId) goalMatch.projectId = new mongoose.Types.ObjectId(projectId as string);

    const goalAgg = await PMGoal.aggregate([
      { $match: goalMatch },
      {
        $group: {
          _id: '$ownerId',
          assigned: { $sum: 1 },
          achieved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'achieved'] },
                    ...(from ? [{ $gte: ['$completedAt', dateFrom] }] : []),
                    ...(to ? [{ $lte: ['$completedAt', dateTo] }] : []),
                  ],
                },
                1,
                0,
              ],
            },
          },
          atRisk: { $sum: { $cond: [{ $eq: ['$status', 'at_risk'] }, 1, 0] } },
        },
      },
    ]);
    const goalMap = new Map(goalAgg.map((g) => [g._id.toString(), g]));

    // Find max values for normalization
    let maxPoints = 0;
    let maxDone = 0;
    let maxGoalsAchieved = 0;

    users.forEach((u) => {
      const uid = u._id.toString();
      const pts = pointMap.get(uid) || 0;
      const done = taskMap.get(uid)?.done || 0;
      const achieved = goalMap.get(uid)?.achieved || 0;
      if (pts > maxPoints) maxPoints = pts;
      if (done > maxDone) maxDone = done;
      if (achieved > maxGoalsAchieved) maxGoalsAchieved = achieved;
    });

    // Build results
    const results = users.map((u) => {
      const uid = u._id.toString();
      const tasks = taskMap.get(uid) || { done: 0, open: 0, inProgress: 0, late: 0 };
      const points = pointMap.get(uid) || 0;
      const goals = goalMap.get(uid) || { assigned: 0, achieved: 0, atRisk: 0 };

      const normPoints = maxPoints > 0 ? points / maxPoints : 0;
      const normDone = maxDone > 0 ? tasks.done / maxDone : 0;
      const normGoals = maxGoalsAchieved > 0 ? goals.achieved / maxGoalsAchieved : 0;
      const score = Math.round((0.4 * normPoints + 0.4 * normDone + 0.2 * normGoals) * 100);

      return {
        _id: uid,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.profile?.avatar || null,
        points,
        tasks: { done: tasks.done, open: tasks.open, inProgress: tasks.inProgress, late: tasks.late },
        goals: { assigned: goals.assigned, achieved: goals.achieved, atRisk: goals.atRisk },
        score,
      };
    });

    // Sort
    const sortKey = sort as string;
    const dir = sortDir === 'asc' ? 1 : -1;
    results.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'points':
          va = a.points; vb = b.points; break;
        case 'tasksDone':
          va = a.tasks.done; vb = b.tasks.done; break;
        case 'goalsAchieved':
          va = a.goals.achieved; vb = b.goals.achieved; break;
        case 'name':
          return dir * a.name.localeCompare(b.name);
        default: // score
          va = a.score; vb = b.score; break;
      }
      return dir * (va - vb);
    });

    // Summary stats
    const summary = {
      totalUsers: totalUsers,
      avgScore: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0,
      totalPoints: results.reduce((s, r) => s + r.points, 0),
      totalTasksDone: results.reduce((s, r) => s + r.tasks.done, 0),
      totalGoalsAchieved: results.reduce((s, r) => s + r.goals.achieved, 0),
    };

    res.status(200).json({
      success: true,
      data: { summary, users: results },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Team performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get team performance' } as ApiResponse);
  }
};

// ─── GET /pm/team-performance/users/:userId ─────────────────────────────────

export const getUserPerformanceDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const organizationId = resolveOrganizationId(req.user);

    const { from, to } = req.query;
    const dateFrom = from ? new Date(from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dateTo = to ? new Date(to as string) : new Date();

    const user = await User.findById(userId).select('name email role profile').lean();
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
      return;
    }

    const orgFilter: Record<string, unknown> = {};
    if (organizationId) orgFilter.organizationId = new mongoose.Types.ObjectId(organizationId);
    const uid = new mongoose.Types.ObjectId(userId);

    // Points breakdown by category
    const pointsByCategory = await PMPointTransaction.aggregate([
      {
        $match: {
          ...orgFilter,
          userId: uid,
          approved: true,
          createdAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const pointsBreakdown = {
      earned: 0,
      spent: 0,
      bonus: 0,
      penalty: 0,
      byCategory: {} as Record<string, number>,
    };
    pointsByCategory.forEach((p) => {
      const key = p._id.type as keyof typeof pointsBreakdown;
      if (typeof pointsBreakdown[key] === 'number') {
        (pointsBreakdown[key] as number) += p.total;
      }
      if (p._id.category) {
        pointsBreakdown.byCategory[p._id.category] = (pointsBreakdown.byCategory[p._id.category] || 0) + p.total;
      }
    });

    // Tasks summary
    const tasksSummary = await PMTask.aggregate([
      { $match: { ...orgFilter, assignee: uid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          done: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status.category', 'done'] },
                    { $gte: ['$completedAt', dateFrom] },
                    { $lte: ['$completedAt', dateTo] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          late: {
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
          open: { $sum: { $cond: [{ $eq: ['$status.category', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status.category', 'in_progress'] }, 1, 0] } },
        },
      },
    ]);

    const tasksByPriority = await PMTask.aggregate([
      { $match: { ...orgFilter, assignee: uid, 'status.category': 'done', completedAt: { $gte: dateFrom, $lte: dateTo } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Goals list
    const goals = await PMGoal.find({ ...orgFilter, ownerId: uid })
      .sort({ dueDate: 1 })
      .lean();

    const goalsFormatted = goals.map((g) => ({
      _id: g._id,
      title: g.title,
      targetValue: g.targetValue,
      currentValue: g.currentValue,
      progressPct: g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0,
      status: g.status,
      dueDate: g.dueDate,
      unit: g.unit,
    }));

    // Recent point transactions
    const recentPoints = await PMPointTransaction.find({
      ...orgFilter,
      userId: uid,
      createdAt: { $gte: dateFrom, $lte: dateTo },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Projects breakdown - find projects where user is a member
    const projects = await PMProject.find({
      ...orgFilter,
      'members.userId': uid,
    })
      .select('name key members')
      .lean();

    const projectsBreakdown = await Promise.all(
      projects.map(async (project) => {
        const memberInfo = project.members?.find((m: any) => m.userId?.toString() === userId);
        const projectId = project._id;

        // Tasks in this project for this user
        const projectTasks = await PMTask.countDocuments({
          projectId,
          assignee: uid,
        });

        const projectTasksDone = await PMTask.countDocuments({
          projectId,
          assignee: uid,
          'status.category': 'done',
          completedAt: { $gte: dateFrom, $lte: dateTo },
        });

        // Points from this project
        const projectPointsAgg = await PMPointTransaction.aggregate([
          {
            $match: {
              projectId,
              userId: uid,
              approved: true,
              createdAt: { $gte: dateFrom, $lte: dateTo },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $cond: [
                    { $in: ['$type', ['earned', 'bonus']] },
                    '$amount',
                    { $multiply: ['$amount', -1] },
                  ],
                },
              },
            },
          },
        ]);
        const projectPoints = projectPointsAgg[0]?.total || 0;

        // Goals in this project for this user
        const projectGoals = await PMGoal.countDocuments({
          projectId,
          ownerId: uid,
        });

        const projectGoalsAchieved = await PMGoal.countDocuments({
          projectId,
          ownerId: uid,
          status: 'achieved',
        });

        return {
          _id: projectId,
          name: project.name,
          key: project.key,
          role: memberInfo?.role || 'member',
          joinDate: memberInfo?.addedAt || null,
          tasks: { total: projectTasks, done: projectTasksDone },
          points: projectPoints,
          goals: { total: projectGoals, achieved: projectGoalsAchieved },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.profile?.avatar || null,
        },
        points: pointsBreakdown,
        tasks: {
          ...(tasksSummary[0] || { total: 0, done: 0, late: 0, open: 0, inProgress: 0 }),
          byPriority: Object.fromEntries(tasksByPriority.map((p) => [p._id, p.count])),
        },
        goals: goalsFormatted,
        projects: projectsBreakdown,
        recentPoints: recentPoints.map((p) => ({
          _id: p._id,
          amount: p.amount,
          type: p.type,
          category: p.category,
          description: p.description,
          createdAt: p.createdAt,
        })),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('User performance detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user performance' } as ApiResponse);
  }
};

// ─── Goal CRUD ──────────────────────────────────────────────────────────────

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = resolveOrganizationId(req.user);

    const { ownerId, title, description, targetValue, unit, dueDate, projectId } = req.body as Record<string, unknown>;

    const goal = await PMGoal.create({
      ...(organizationId ? { organizationId } : {}),
      ownerId,
      title,
      description,
      targetValue,
      currentValue: 0,
      unit,
      dueDate,
      projectId,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: goal, message: 'Goal created' } as ApiResponse);
  } catch (error) {
    logger.error('Create goal error:', error);
    res.status(500).json({ success: false, error: 'Failed to create goal' } as ApiResponse);
  }
};

export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = resolveOrganizationId(req.user);

    const { ownerId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (organizationId) filter.organizationId = organizationId;
    if (ownerId) filter.ownerId = ownerId;
    if (status) filter.status = status;

    const goals = await PMGoal.find(filter).sort({ createdAt: -1 }).populate('ownerId', 'name email profile').lean();
    res.status(200).json({ success: true, data: goals } as ApiResponse);
  } catch (error) {
    logger.error('Get goals error:', error);
    res.status(500).json({ success: false, error: 'Failed to get goals' } as ApiResponse);
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { goalId } = req.params;
    const updates = req.body as Record<string, unknown>;

    const goal = await PMGoal.findByIdAndUpdate(goalId, { $set: updates }, { new: true });
    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' } as ApiResponse);
      return;
    }
    res.status(200).json({ success: true, data: goal, message: 'Goal updated' } as ApiResponse);
  } catch (error) {
    logger.error('Update goal error:', error);
    res.status(500).json({ success: false, error: 'Failed to update goal' } as ApiResponse);
  }
};

// ─── Point CRUD ─────────────────────────────────────────────────────────────

export const createPointTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = resolveOrganizationId(req.user);

    const { userId: targetUserId, amount, type, category, description, relatedTaskId, relatedGoalId } = req.body as Record<string, unknown>;

    const pt = await PMPointTransaction.create({
      ...(organizationId ? { organizationId } : {}),
      userId: targetUserId,
      amount,
      type,
      category,
      description,
      relatedTaskId,
      relatedGoalId,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: pt, message: 'Point transaction created' } as ApiResponse);
  } catch (error) {
    logger.error('Create point transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to create point transaction' } as ApiResponse);
  }
};

export const getPointTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = resolveOrganizationId(req.user);

    const { userId: targetUserId, from, to } = req.query;
    const filter: Record<string, unknown> = {};
    if (organizationId) filter.organizationId = organizationId;
    if (targetUserId) filter.userId = targetUserId;
    if (from || to) {
      filter.createdAt = {};
      if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from as string);
      if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to as string);
    }

    const pts = await PMPointTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email profile')
      .lean();

    res.status(200).json({ success: true, data: pts } as ApiResponse);
  } catch (error) {
    logger.error('Get point transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get point transactions' } as ApiResponse);
  }
};
