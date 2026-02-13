import { Response } from 'express';
import { validationResult } from 'express-validator';
import Workflow from '../../models/pm/Workflow';
import Project from '../../models/pm/Project';
import Task from '../../models/pm/Task';
import PMBoard, { IBoardColumn } from '../../models/pm/Board';
import { PMStatusCategory } from '../../models/pm/Task';
import { PMAuthRequest, ApiResponse } from '../../types/pm';
import * as permissions from '../../utils/pm/permissions';
import logger from '../../utils/logger';

export const getWorkflowByProject = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization context required',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    let workflow = await Workflow.findOne({ projectId });

    if (!workflow) {
      workflow = await Workflow.findOne({
        organizationId,
        methodology: project.methodology.code,
        isDefault: true,
      });
    }

    if (!workflow) {
      res.status(404).json({
        success: false,
        error: 'Workflow not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
    } as ApiResponse);
  }
};

export const addStatus = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string; path?: string }) => ({ 
          field: e.path || e.type, 
          message: e.msg 
        })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const { id, name, color, isInitial, isFinal } = req.body;
    const userId = req.user?.id;
    
    // Map uppercase category values to lowercase for database
    const categoryMap: Record<string, PMStatusCategory> = {
      'TODO': PMStatusCategory.TODO,
      'IN_PROGRESS': PMStatusCategory.IN_PROGRESS,
      'DONE': PMStatusCategory.DONE,
      'todo': PMStatusCategory.TODO,
      'in_progress': PMStatusCategory.IN_PROGRESS,
      'done': PMStatusCategory.DONE,
    };
    const category = req.body.category ? categoryMap[req.body.category] : undefined;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId ||!permissions.canManageMembers(project.members , userId)) {
      res.status(403).json({
        success: false,
        error: 'Only project leads can modify workflow statuses',
      } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId;

    let workflow = await Workflow.findOne({ projectId });

    if (!workflow) {
      const defaultWorkflow = await Workflow.findOne({
        organizationId,
        methodology: project.methodology.code,
        isDefault: true,
      });

      if (!defaultWorkflow) {
        res.status(404).json({
          success: false,
          error: 'Default workflow not found',
        } as ApiResponse);
        return;
      }

      workflow = new Workflow({
        organizationId,
        projectId,
        name: `${project.name} Workflow`,
        description: `Custom workflow for ${project.name}`,
        methodology: project.methodology.code,
        isDefault: false,
        statuses: [...defaultWorkflow.statuses],
        transitions: [...defaultWorkflow.transitions],
        createdBy: userId,
      });
    }

    const statusExists = workflow.statuses.some(s => s.id === id);
    if (statusExists) {
      res.status(400).json({
        success: false,
        error: `Status with ID '${id}' already exists`,
      } as ApiResponse);
      return;
    }

    const maxOrder = workflow.statuses.reduce((max, s) => Math.max(max, s.order), -1);

    workflow.statuses.push({
      id,
      name,
      category: category || PMStatusCategory.TODO,
      color: color || '#6B7280',
      order: maxOrder + 1,
      isInitial: isInitial ?? false,
      isFinal: isFinal ?? false,
    });

    await workflow.save();

    // Sync board columns - add new column for this status
    const board = await PMBoard.findOne({ projectId, isDefault: true });
    if (board) {
      const columnExists = board.columns.some(col => col.statusId === id);
      if (!columnExists) {
        const maxColOrder = board.columns.reduce((max, col) => Math.max(max, col.order), -1);
        board.columns.push({
          id: `col-${id}`,
          name,
          statusId: id,
          order: maxColOrder + 1,
        });
        await board.save();
      }
    }

    res.status(201).json({
      success: true,
      data: { workflow },
      message: 'Status added successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Add status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add status',
    } as ApiResponse);
  }
};

export const updateStatus = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string; path?: string }) => ({ 
          field: e.path || e.type, 
          message: e.msg 
        })),
      } as ApiResponse);
      return;
    }

    const { projectId, statusId } = req.params;
    const { name, category, color, isInitial, isFinal } = req.body;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canManageMembers(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'Only project leads can modify workflow statuses',
      } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId;

    let workflow = await Workflow.findOne({ projectId });

    if (!workflow) {
      workflow = await Workflow.findOne({
        organizationId,
        methodology: project.methodology.code,
        isDefault: true,
      });
    }

    if (!workflow) {
      res.status(404).json({
        success: false,
        error: 'Workflow not found',
      } as ApiResponse);
      return;
    }

    const status = workflow.statuses.find(s => s.id === statusId);
    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Status not found',
      } as ApiResponse);
      return;
    }

    if (name) status.name = name;
    if (category) status.category = category;
    if (color) status.color = color;
    if (isInitial !== undefined) status.isInitial = isInitial;
    if (isFinal !== undefined) status.isFinal = isFinal;

    await workflow.save();

    await Task.updateMany(
      { projectId, 'status.id': statusId },
      { 
        $set: { 
          'status.name': status.name,
          'status.category': status.category,
        } 
      }
    );

    // Sync board columns - update column name if status name changed
    if (name) {
      const board = await PMBoard.findOne({ projectId, isDefault: true });
      if (board) {
        const column = board.columns.find(col => col.statusId === statusId);
        if (column) {
          column.name = name;
          await board.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { workflow },
      message: 'Status updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
    } as ApiResponse);
  }
};

export const deleteStatus = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, statusId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canManageMembers(project.members, userId)) {
      res.status(403).json({
        success: false,
        error: 'Only project leads can modify workflow statuses',
      } as ApiResponse);
      return;
    }

    const workflow = await Workflow.findOne({ projectId });

    if (!workflow) {
      res.status(404).json({
        success: false,
        error: 'Custom workflow not found. Cannot delete statuses from default workflow.',
      } as ApiResponse);
      return;
    }

    const statusIndex = workflow.statuses.findIndex(s => s.id === statusId);
    if (statusIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Status not found',
      } as ApiResponse);
      return;
    }

    const tasksWithStatus = await Task.countDocuments({ 
      projectId, 
      'status.id': statusId 
    });

    if (tasksWithStatus > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete status. ${tasksWithStatus} task(s) are currently using this status. Please move them to another status first.`,
      } as ApiResponse);
      return;
    }

    workflow.statuses.splice(statusIndex, 1);

    workflow.statuses.forEach((s, index) => {
      s.order = index;
    });

    await workflow.save();

    // Sync board columns - remove column for deleted status
    const board = await PMBoard.findOne({ projectId, isDefault: true });
    if (board) {
      const columnIndex = board.columns.findIndex(col => col.statusId === statusId);
      if (columnIndex !== -1) {
        board.columns.splice(columnIndex, 1);
        // Re-order remaining columns
        board.columns.forEach((col, index) => {
          col.order = index;
        });
        await board.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { workflow },
      message: 'Status deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete status',
    } as ApiResponse);
  }
};

export const reorderStatuses = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map((e: { type?: string; msg: string; path?: string }) => ({ 
          field: e.path || e.type, 
          message: e.msg 
        })),
      } as ApiResponse);
      return;
    }

    const { projectId } = req.params;
    const { statusOrder } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(statusOrder)) {
      res.status(400).json({
        success: false,
        error: 'statusOrder must be an array of status IDs',
      } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canManageMembers(project.members , userId)) {
      res.status(403).json({
        success: false,
        error: 'Only project leads can modify workflow statuses',
      } as ApiResponse);
      return;
    }

    const organizationId = project.organizationId;

    let workflow = await Workflow.findOne({ projectId });

    if (!workflow) {
      const defaultWorkflow = await Workflow.findOne({
        organizationId,
        methodology: project.methodology.code,
        isDefault: true,
      });

      if (!defaultWorkflow) {
        res.status(404).json({
          success: false,
          error: 'Default workflow not found',
        } as ApiResponse);
        return;
      }

      workflow = new Workflow({
        organizationId,
        projectId,
        name: `${project.name} Workflow`,
        description: `Custom workflow for ${project.name}`,
        methodology: project.methodology.code,
        isDefault: false,
        statuses: [...defaultWorkflow.statuses],
        transitions: [...defaultWorkflow.transitions],
        createdBy: userId,
      });
    }

    const reorderedStatuses = statusOrder.map((statusId, index) => {
      const status = workflow!.statuses.find(s => s.id === statusId);
      if (!status) {
        throw new Error(`Status ${statusId} not found`);
      }
      return { ...status, order: index };
    });

    workflow.statuses = reorderedStatuses;
    await workflow.save();

    // Sync board columns - reorder columns to match status order
    const board = await PMBoard.findOne({ projectId, isDefault: true });
    if (board) {
      const reorderedColumns = statusOrder.map((statusId, index) => {
        const column = board.columns.find(col => col.statusId === statusId);
        if (column) {
          return { ...column, order: index };
        }
        return null;
      }).filter((col): col is IBoardColumn => col !== null);

      if (reorderedColumns.length > 0) {
        board.columns = reorderedColumns;
        await board.save();
      }
    }

    res.status(200).json({
      success: true,
      data: { workflow },
      message: 'Statuses reordered successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Reorder statuses error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder statuses',
    } as ApiResponse);
  }
};
