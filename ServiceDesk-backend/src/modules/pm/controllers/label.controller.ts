import { Response } from 'express';
import PMLabel from '../models/Label';
import Project from '../models/Project';
import logger from '../../../utils/logger';
import { PMAuthRequest as Request, ApiResponse } from '../../../types/pm';

export const getLabels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    const isPublic = project.settings.visibility === 'public';
    if (!isMember && !isPublic) {
      res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
      return;
    }

    const labels = await PMLabel.find({ projectId }).sort({ name: 1 }).lean();
    res.json({ success: true, data: { labels } } as ApiResponse);
  } catch (error) {
    logger.error('Get labels error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch labels' } as ApiResponse);
  }
};

export const createLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;
    const userId = req.user?.id;

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'Label name is required' } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    if (!isMember) {
      res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
      return;
    }

    const existing = await PMLabel.findOne({ projectId, name: name.trim() });
    if (existing) {
      res.status(409).json({ success: false, error: 'Label with this name already exists' } as ApiResponse);
      return;
    }

    const label = await PMLabel.create({
      projectId,
      organizationId: project.organizationId,
      name: name.trim(),
      color: color || '#6366f1',
      createdBy: userId,
    });

    res.status(201).json({ success: true, data: { label } } as ApiResponse);
  } catch (error) {
    logger.error('Create label error:', error);
    res.status(500).json({ success: false, error: 'Failed to create label' } as ApiResponse);
  }
};

export const updateLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;
    const userId = req.user?.id;

    const label = await PMLabel.findById(labelId);
    if (!label) {
      res.status(404).json({ success: false, error: 'Label not found' } as ApiResponse);
      return;
    }

    const project = await Project.findById(label.projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    if (!isMember) {
      res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
      return;
    }

    if (name !== undefined) label.name = name.trim();
    if (color !== undefined) label.color = color;
    await label.save();

    res.json({ success: true, data: { label } } as ApiResponse);
  } catch (error) {
    logger.error('Update label error:', error);
    res.status(500).json({ success: false, error: 'Failed to update label' } as ApiResponse);
  }
};

export const deleteLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { labelId } = req.params;
    const userId = req.user?.id;

    const label = await PMLabel.findById(labelId);
    if (!label) {
      res.status(404).json({ success: false, error: 'Label not found' } as ApiResponse);
      return;
    }

    const project = await Project.findById(label.projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    const isMember = project.members.some((m) => m.userId?.toString() === userId);
    if (!isMember) {
      res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse);
      return;
    }

    await PMLabel.findByIdAndDelete(labelId);
    res.json({ success: true, data: {} } as ApiResponse);
  } catch (error) {
    logger.error('Delete label error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete label' } as ApiResponse);
  }
};
