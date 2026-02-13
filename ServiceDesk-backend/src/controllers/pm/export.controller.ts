import { Response } from 'express';
import logger from '../../utils/logger';
import Task from '../../models/pm/Task';
import Sprint from '../../models/pm/Sprint';
import Project from '../../models/pm/Project';
import { PMAuthRequest, ApiResponse, StatusCategory } from '../../types/pm';

export const exportProjectTasks = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { format = 'json' } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'profile.firstName profile.lastName email')
      .populate('reporter', 'profile.firstName profile.lastName email')
      .lean();

    if (format === 'csv') {
      const csvHeader = 'Key,Title,Type,Status,Priority,Assignee,Story Points,Created,Updated\n';
      const csvRows = tasks.map((t) => {
        const assignee = t.assignee as { profile?: { firstName?: string; lastName?: string } } | undefined;
        const assigneeName = assignee?.profile ? `${assignee.profile.firstName} ${assignee.profile.lastName}` : '';
        return `"${t.key}","${t.title.replace(/"/g, '""')}","${t.type}","${t.status.name}","${t.priority}","${assigneeName}","${t.storyPoints || ''}","${t.createdAt}","${t.updatedAt}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${project.key}-tasks.csv"`);
      res.send(csvHeader + csvRows);
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        project: { key: project.key, name: project.name },
        tasks,
        exportedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Export tasks error:', error);
    res.status(500).json({ success: false, error: 'Export failed' } as ApiResponse);
  }
};

export const exportSprintReport = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      res.status(404).json({ success: false, error: 'Sprint not found' } as ApiResponse);
      return;
    }

    const tasks = await Task.find({ sprintId })
      .populate('assignee', 'profile.firstName profile.lastName')
      .lean();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status.category === StatusCategory.DONE).length;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter((t) => t.status.category === StatusCategory.DONE)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const tasksByStatus: Record<string, number> = {};
    const tasksByAssignee: Record<string, { total: number; completed: number; points: number }> = {};

    for (const task of tasks) {
      tasksByStatus[task.status.name] = (tasksByStatus[task.status.name] || 0) + 1;

      const assignee = task.assignee as { profile?: { firstName?: string; lastName?: string } } | undefined;
      const assigneeName = assignee?.profile ? `${assignee.profile.firstName} ${assignee.profile.lastName}` : 'Unassigned';
      if (!tasksByAssignee[assigneeName]) {
        tasksByAssignee[assigneeName] = { total: 0, completed: 0, points: 0 };
      }
      tasksByAssignee[assigneeName].total++;
      tasksByAssignee[assigneeName].points += task.storyPoints || 0;
      if (task.status.category === StatusCategory.DONE) {
        tasksByAssignee[assigneeName].completed++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        sprint: {
          name: sprint.name,
          number: sprint.number,
          status: sprint.status,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal,
        },
        summary: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalPoints,
          completedPoints,
          velocity: completedPoints,
        },
        tasksByStatus,
        tasksByAssignee,
        tasks,
        exportedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Export sprint report error:', error);
    res.status(500).json({ success: false, error: 'Export failed' } as ApiResponse);
  }
};

export const exportProjectSummary = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('members.userId', 'profile.firstName profile.lastName email')
      .lean();

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const [tasks, sprints] = await Promise.all([
      Task.find({ projectId }).lean(),
      Sprint.find({ projectId }).lean(),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status.category === StatusCategory.DONE).length;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter((t) => t.status.category === StatusCategory.DONE)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const completedSprints = sprints.filter((s) => s.status === 'completed');
    const avgVelocity = completedSprints.length > 0
      ? completedSprints.reduce((sum, s) => sum + (s.velocity?.completed || 0), 0) / completedSprints.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          key: project.key,
          name: project.name,
          methodology: project.methodology,
          status: project.status,
          startDate: project.startDate,
          targetEndDate: project.targetEndDate,
          memberCount: project.members?.length || 0,
        },
        summary: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalPoints,
          completedPoints,
          totalSprints: sprints.length,
          completedSprints: completedSprints.length,
          averageVelocity: Math.round(avgVelocity * 10) / 10,
        },
        exportedAt: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Export project summary error:', error);
    res.status(500).json({ success: false, error: 'Export failed' } as ApiResponse);
  }
};
