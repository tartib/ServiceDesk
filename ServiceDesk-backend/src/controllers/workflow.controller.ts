import { Request, Response } from 'express';
import WorkflowDiagram from '../models/WorkflowDiagram';

// List workflows (paginated, filterable)
export const getWorkflows = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { search, status, page = '1', limit = '12' } = req.query;

    const query: Record<string, unknown> = { createdBy: userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [workflows, total] = await Promise.all([
      WorkflowDiagram.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
        .lean(),
      WorkflowDiagram.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        workflows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch workflows',
    });
  }
};

// Get single workflow
export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowDiagram.findById(id)
      .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch workflow',
    });
  }
};

// Create workflow
export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, description, nodes, edges, tags } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required',
      });
    }

    const workflow = new WorkflowDiagram({
      name,
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      tags: tags || [],
      status: 'draft',
      createdBy: userId,
    });

    await workflow.save();

    const populated = await WorkflowDiagram.findById(workflow._id)
      .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    res.status(201).json({
      success: true,
      data: { workflow: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create workflow',
    });
  }
};

// Update workflow
export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, nodes, edges, tags, thumbnail } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (tags !== undefined) updateData.tags = tags;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

    const workflow = await WorkflowDiagram.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update workflow',
    });
  }
};

// Delete workflow
export const deleteWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowDiagram.findByIdAndDelete(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete workflow',
    });
  }
};

// Publish workflow
export const publishWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowDiagram.findByIdAndUpdate(
      id,
      { $set: { status: 'published' } },
      { new: true }
    )
      .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish workflow',
    });
  }
};

// Archive workflow
export const archiveWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowDiagram.findByIdAndUpdate(
      id,
      { $set: { status: 'archived' } },
      { new: true }
    )
      .populate('createdBy', 'name email profile.firstName profile.lastName profile.avatar')
      .lean();

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to archive workflow',
    });
  }
};
