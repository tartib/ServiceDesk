import { Response } from 'express';
import Project from '../models/Project';
import { PMAuthRequest, ApiResponse } from '../../../types/pm';
import * as permissions from '../../../utils/pm/permissions';
import logger from '../../../utils/logger';
import { ALLOWED_FIELD_TYPES, TaskCustomFieldType } from '../domain/task-field-definition';

// ── List ────────────────────────────────────────────────────────

export const listTaskFields = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select('taskFieldDefinitions');
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }
    res.status(200).json({
      success: true,
      data: { fields: project.taskFieldDefinitions || [] },
    } as ApiResponse);
  } catch (error) {
    logger.error('List task fields error:', error);
    res.status(500).json({ success: false, error: 'Failed to list task fields' } as ApiResponse);
  }
};

// ── Create ──────────────────────────────────────────────────────

export const createTaskField = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canUpdateProject(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const { id, name, type, required, options, defaultValue, appliesTo } = req.body;

    if (!id || !name || !type) {
      res.status(400).json({ success: false, error: 'id, name, and type are required' } as ApiResponse);
      return;
    }

    if (!ALLOWED_FIELD_TYPES.includes(type as TaskCustomFieldType)) {
      res.status(400).json({ success: false, error: `Invalid type "${type}". Allowed: ${ALLOWED_FIELD_TYPES.join(', ')}` } as ApiResponse);
      return;
    }

    if (type === 'select' && (!options || !Array.isArray(options) || options.length === 0)) {
      res.status(400).json({ success: false, error: 'Select fields must have at least one option' } as ApiResponse);
      return;
    }

    // Check duplicate id
    const existing = (project.taskFieldDefinitions || []).find(f => f.id === id);
    if (existing) {
      res.status(400).json({ success: false, error: `Field with id "${id}" already exists` } as ApiResponse);
      return;
    }

    const maxPosition = (project.taskFieldDefinitions || []).reduce((max, f) => Math.max(max, f.position || 0), 0);

    const newField = {
      id,
      name,
      type,
      required: required || false,
      options: type === 'select' ? options : undefined,
      defaultValue,
      position: maxPosition + 1,
      appliesTo: appliesTo || [],
      archived: false,
    };

    project.taskFieldDefinitions.push(newField as any);
    await project.save();

    res.status(201).json({
      success: true,
      data: { field: newField },
      message: 'Task field created successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Create task field error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task field' } as ApiResponse);
  }
};

// ── Update ──────────────────────────────────────────────────────

export const updateTaskField = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, fieldId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canUpdateProject(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const fieldIndex = (project.taskFieldDefinitions || []).findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      res.status(404).json({ success: false, error: 'Field not found' } as ApiResponse);
      return;
    }

    const field = project.taskFieldDefinitions[fieldIndex] as any;
    const { name, type, required, options, defaultValue, appliesTo, archived } = req.body;

    if (name !== undefined) field.name = name;
    if (type !== undefined) {
      if (!ALLOWED_FIELD_TYPES.includes(type as TaskCustomFieldType)) {
        res.status(400).json({ success: false, error: `Invalid type "${type}"` } as ApiResponse);
        return;
      }
      field.type = type;
    }
    if (required !== undefined) field.required = required;
    if (options !== undefined) field.options = options;
    if (defaultValue !== undefined) field.defaultValue = defaultValue;
    if (appliesTo !== undefined) field.appliesTo = appliesTo;
    if (archived !== undefined) field.archived = archived;

    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      res.status(400).json({ success: false, error: 'Select fields must have at least one option' } as ApiResponse);
      return;
    }

    project.markModified('taskFieldDefinitions');
    await project.save();

    res.status(200).json({
      success: true,
      data: { field },
      message: 'Task field updated successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Update task field error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task field' } as ApiResponse);
  }
};

// ── Archive (soft delete) ───────────────────────────────────────

export const archiveTaskField = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, fieldId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canUpdateProject(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const field = (project.taskFieldDefinitions || []).find(f => f.id === fieldId) as any;
    if (!field) {
      res.status(404).json({ success: false, error: 'Field not found' } as ApiResponse);
      return;
    }

    field.archived = true;
    project.markModified('taskFieldDefinitions');
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Task field archived successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Archive task field error:', error);
    res.status(500).json({ success: false, error: 'Failed to archive task field' } as ApiResponse);
  }
};

// ── Reorder ─────────────────────────────────────────────────────

export const reorderTaskFields = async (req: PMAuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const { fieldIds } = req.body; // ordered array of field IDs

    if (!Array.isArray(fieldIds)) {
      res.status(400).json({ success: false, error: 'fieldIds array is required' } as ApiResponse);
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse);
      return;
    }

    if (!userId || !permissions.canUpdateProject(project.members, userId)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse);
      return;
    }

    const defs = project.taskFieldDefinitions || [];
    for (let i = 0; i < fieldIds.length; i++) {
      const def = defs.find(d => d.id === fieldIds[i]) as any;
      if (def) def.position = i;
    }

    project.markModified('taskFieldDefinitions');
    await project.save();

    res.status(200).json({
      success: true,
      data: { fields: project.taskFieldDefinitions },
      message: 'Task fields reordered successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Reorder task fields error:', error);
    res.status(500).json({ success: false, error: 'Failed to reorder task fields' } as ApiResponse);
  }
};
