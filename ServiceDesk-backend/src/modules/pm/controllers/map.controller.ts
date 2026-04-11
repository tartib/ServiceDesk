import { Response } from 'express';
import Task from '../models/Task';
import { PMAuthRequest, ApiResponse } from '../../../types/pm';
import logger from '../../../utils/logger';

interface MapNode {
  id: string;
  data: {
    title: string;
    key: string;
    status: string;
    statusCategory: string;
    priority: string;
    type: string;
    assigneeId?: string;
    assigneeName?: string;
    assigneeAvatar?: string;
    labels: string[];
    storyPoints?: number;
  };
}

interface MapEdge {
  id: string;
  source: string;
  target: string;
  type: string; // 'parent' | 'depends_on' | 'blocked_by' | 'related_to' | ...
}

/**
 * GET /pm/projects/:projectId/map-view
 *
 * Returns a graph-ready projection of project tasks:
 *   { nodes: MapNode[], edges: MapEdge[] }
 *
 * Edges are derived from:
 *   1. task.parentId  → edge type "parent"
 *   2. task.links[]   → edge type = link.type (e.g. "depends_on", "blocked_by", "related_to")
 *
 * Supports query filters: status, priority, type, assignee, labels, sprintId
 */
export const getMapView = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status, priority, type, assignee, labels, sprintId } = req.query;

    // Build filter
    const filter: Record<string, unknown> = { projectId };

    if (status) filter['status.category'] = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (assignee) filter.assignee = assignee;
    if (sprintId) filter.sprintId = sprintId === 'none' ? null : sprintId;
    if (labels) {
      const labelArr = typeof labels === 'string' ? labels.split(',') : labels;
      filter.labels = { $in: labelArr };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'profile.firstName profile.lastName profile.avatar')
      .populate({
        path: 'links.targetTaskId',
        select: '_id projectId',
      })
      .select(
        '_id key title status priority type assignee labels storyPoints parentId links'
      )
      .lean();

    // Build a set of task IDs in this project (for filtering cross-project links)
    const taskIdSet = new Set(tasks.map((t) => t._id.toString()));

    const nodes: MapNode[] = [];
    const edges: MapEdge[] = [];

    for (const task of tasks) {
      const taskId = task._id.toString();

      // ── Node ──────────────────────────────────────────────
      const assigneeObj = task.assignee as Record<string, unknown> | undefined;
      const profile = assigneeObj?.profile as Record<string, unknown> | undefined;
      let assigneeName: string | undefined;
      let assigneeAvatar: string | undefined;

      if (profile) {
        const first = (profile.firstName as string) || '';
        const last = (profile.lastName as string) || '';
        assigneeName = `${first} ${last}`.trim() || undefined;
        assigneeAvatar = (profile.avatar as string) || undefined;
      }

      nodes.push({
        id: taskId,
        data: {
          title: task.title,
          key: task.key,
          status: task.status?.name || '',
          statusCategory: task.status?.category || '',
          priority: task.priority || '',
          type: task.type || '',
          assigneeId: assigneeObj ? (assigneeObj._id || assigneeObj.id || '').toString() : undefined,
          assigneeName,
          assigneeAvatar,
          labels: task.labels || [],
          storyPoints: task.storyPoints,
        },
      });

      // ── Parent edge ───────────────────────────────────────
      if (task.parentId) {
        const parentStr = task.parentId.toString();
        if (taskIdSet.has(parentStr)) {
          edges.push({
            id: `parent_${parentStr}_${taskId}`,
            source: parentStr,
            target: taskId,
            type: 'parent',
          });
        }
      }

      // ── Link edges ────────────────────────────────────────
      if (task.links && Array.isArray(task.links)) {
        for (const link of task.links) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const target = link.targetTaskId as any;
          if (!target) continue;

          const targetId = (target._id || target).toString();
          // Only include edges whose target is in the same project
          const targetProjectId = target.projectId?.toString();
          if (targetProjectId && targetProjectId !== projectId.toString()) continue;
          // Also ensure the target is in our filtered set
          if (!taskIdSet.has(targetId)) continue;

          edges.push({
            id: `link_${taskId}_${targetId}_${link.type || 'related'}`,
            source: taskId,
            target: targetId,
            type: link.type || 'related_to',
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { nodes, edges },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get map view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map view',
    } as ApiResponse);
  }
};
