/**
 * Workflow Definition Controller
 * تحكم تعريفات سير العمل
 */

import { Request, Response } from 'express';
import workflowDefinitionService from '../services/workflowDefinition.service';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

function resolveOrgId(req: Request): string | undefined {
  if (req.body?.organizationId) return req.body.organizationId;
  if (req.user?.organizationId) return req.user.organizationId;
  const orgs = req.user?.organizations;
  if (Array.isArray(orgs) && orgs.length > 0) return orgs[0].organizationId;
  return undefined;
}

export const createDefinition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const organizationId = resolveOrgId(req);
  if (!organizationId) return void sendError(req, res, 400, 'organizationId is required');

  const definition = await workflowDefinitionService.create({
    organizationId,
    projectId: req.body.projectId,
    name: req.body.name,
    nameAr: req.body.nameAr,
    description: req.body.description,
    descriptionAr: req.body.descriptionAr,
    entityType: req.body.entityType,
    states: req.body.states,
    transitions: req.body.transitions,
    initialState: req.body.initialState,
    finalStates: req.body.finalStates,
    settings: req.body.settings,
    tags: req.body.tags,
    createdBy: userId,
  });

  sendSuccess(req, res, definition, 'Definition created', 201);
});

export const getDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await workflowDefinitionService.findById(req.params.id);
  if (!definition) return void sendError(req, res, 404, 'Definition not found');
  sendSuccess(req, res, definition);
});

export const listDefinitions = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req.query.organizationId as string) || resolveOrgId(req);
  if (!organizationId) return void sendError(req, res, 400, 'organizationId is required');

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const result = await workflowDefinitionService.list({
    organizationId,
    entityType: req.query.entityType as string,
    status: req.query.status as string,
    projectId: req.query.projectId as string,
    search: req.query.search as string,
    page,
    limit,
  });

  sendPaginated(req, res, result.definitions, page, limit, result.total);
});

export const updateDefinition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const definition = await workflowDefinitionService.update(
    req.params.id,
    req.body,
    userId
  );

  if (!definition) return void sendError(req, res, 404, 'Definition not found');
  sendSuccess(req, res, definition);
});

export const deleteDefinition = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await workflowDefinitionService.delete(req.params.id);
  if (!deleted) return void sendError(req, res, 404, 'Definition not found');
  sendSuccess(req, res, null, 'Definition deleted');
});

export const publishDefinition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const definition = await workflowDefinitionService.publish(req.params.id, userId);
  if (!definition) return void sendError(req, res, 404, 'Definition not found');
  sendSuccess(req, res, definition);
});

export const deprecateDefinition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const definition = await workflowDefinitionService.deprecate(req.params.id, userId);
  if (!definition) return void sendError(req, res, 404, 'Definition not found');
  sendSuccess(req, res, definition);
});

export const getVersions = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req.query.organizationId as string) || resolveOrgId(req);
  if (!organizationId) return void sendError(req, res, 400, 'organizationId is required');

  const definition = await workflowDefinitionService.findById(req.params.id);
  if (!definition) return void sendError(req, res, 404, 'Definition not found');

  const versions = await workflowDefinitionService.getVersions(
    organizationId,
    definition.name
  );

  sendSuccess(req, res, versions);
});

export const createNewVersion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const definition = await workflowDefinitionService.createNewVersion(
    req.params.id,
    req.body,
    userId
  );

  if (!definition) return void sendError(req, res, 404, 'Source definition not found');
  sendSuccess(req, res, definition, 'New version created', 201);
});
