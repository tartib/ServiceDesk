/**
 * RequestType Controller — CRUD endpoints for request types.
 */

import { Request, Response, NextFunction } from 'express';
import { requestTypeService } from '../services/requestTypeService';
import type { WorkspaceType } from '../../../shared/types/workspace.types';
import type { RequestTypePriority } from '../models/RequestType';

export async function listRequestTypes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.user!.organizationId ?? (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID required', code: 'MISSING_ORG_ID' });
      return;
    }

    const { workspaceType, isActive, isClientVisible, category, search, page, limit } =
      req.query as Record<string, string>;

    const result = await requestTypeService.list({
      organizationId: orgId,
      workspaceType: workspaceType as WorkspaceType | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isClientVisible: isClientVisible !== undefined ? isClientVisible === 'true' : undefined,
      category,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRequestType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const item = await requestTypeService.getById(id);
    if (!item) {
      res.status(404).json({ error: 'Request type not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function createRequestType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.user!.organizationId ?? (req.headers['x-organization-id'] as string);
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID required', code: 'MISSING_ORG_ID' });
      return;
    }

    const {
      name,
      nameAr,
      description,
      descriptionAr,
      icon,
      workspaceType,
      formSchemaId,
      workflowTemplateId,
      defaultPriority,
      isClientVisible,
      category,
      categoryAr,
      sortOrder,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const item = await requestTypeService.create({
      name: name.trim(),
      nameAr: nameAr?.trim(),
      description: description?.trim(),
      descriptionAr: descriptionAr?.trim(),
      icon,
      workspaceType: workspaceType as WorkspaceType | undefined,
      formSchemaId,
      workflowTemplateId,
      defaultPriority: defaultPriority as RequestTypePriority | undefined,
      isClientVisible,
      category: category?.trim(),
      categoryAr: categoryAr?.trim(),
      sortOrder,
      organizationId: orgId,
      createdBy: req.user!.id,
    });

    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({
        error: 'A request type with this name already exists',
        code: 'DUPLICATE_NAME',
      });
      return;
    }
    next(err);
  }
}

export async function updateRequestType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;

    const item = await requestTypeService.update(id, {
      ...req.body,
      updatedBy: req.user!.id,
    });

    if (!item) {
      res.status(404).json({ error: 'Request type not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(item);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({
        error: 'A request type with this name already exists',
        code: 'DUPLICATE_NAME',
      });
      return;
    }
    next(err);
  }
}

export async function deleteRequestType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;
    const deleted = await requestTypeService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Request type not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
