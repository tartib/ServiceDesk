/**
 * Workflow Instance Controller
 * تحكم نماذج سير العمل — Start, Transition, Query
 */

import { Request, Response } from 'express';
import { getWorkflowEngine } from '../services/workflowEngineFactory';
import workflowInstanceService from '../services/workflowInstance.service';
import workflowEventService from '../services/workflowEvent.service';
import { WorkflowEventPublisher } from '../../../shared/events/publishers/workflow.publisher';
import logger from '../../../utils/logger';
import { isWfPostgres, getWfRepos } from '../infrastructure/repositories';
import { PgWfInstanceRepository } from '../infrastructure/repositories/PgWfInstanceRepository';
import { PgWfEventRepository } from '../infrastructure/repositories/PgWfEventRepository';
import asyncHandler from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated, sendError } from '../../../utils/ApiResponse';

export const startWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const organizationId = req.body.organizationId || req.user?.organizationId;
  if (!organizationId) return void sendError(req, res, 400, 'organizationId is required');

  const engine = getWorkflowEngine();
  const instance = await engine.startWorkflow({
    definitionId: req.body.definitionId,
    organizationId,
    entityType: req.body.entityType,
    entityId: req.body.entityId,
    actorId: userId,
    actorName: req.user?.name,
    actorRoles: req.user?.role ? [req.user.role] : [],
    initialVariables: req.body.variables,
    metadata: req.body.metadata,
  });

  // Emit event
  WorkflowEventPublisher.instanceStarted(
    {
      instanceId: (instance as any)._id?.toString() || (instance as any).id,
      definitionId: req.body.definitionId,
      definitionName: req.body.definitionName || '',
      startedBy: userId,
      initialState: (instance as any).currentState || '',
    },
    { organizationId, userId }
  ).catch((err) => logger.error('Failed to emit wf.instance.started', { err }));

  sendSuccess(req, res, instance, 'Workflow started', 201);
});

export const executeTransition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const engine = getWorkflowEngine();
  const result = await engine.executeTransition({
    instanceId: req.params.id,
    transitionId: req.body.transitionId,
    actorId: userId,
    actorName: req.user?.name,
    actorRoles: req.user?.role ? [req.user.role] : [],
    data: req.body.data,
    comment: req.body.comment,
    signature: req.body.signature,
  });

  if (!result.success) {
    return void sendError(req, res, 400, result.error || 'Transition failed');
  }

  // Emit event
  WorkflowEventPublisher.instanceTransitioned(
    {
      instanceId: req.params.id,
      definitionId: (result as any).definitionId || '',
      fromState: (result as any).fromState || '',
      toState: (result as any).toState || (result as any).currentState || '',
      transitionedBy: userId,
      transitionName: req.body.transitionId,
    },
    { organizationId: req.user?.organizationId || '', userId }
  ).catch((err) => logger.error('Failed to emit wf.instance.transitioned', { err }));

  sendSuccess(req, res, result);
});

export const getAvailableTransitions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const engine = getWorkflowEngine();
  const transitions = await engine.getAvailableTransitions({
    instanceId: req.params.id,
    actorId: userId,
    actorRoles: req.user?.role ? [req.user.role] : [],
  });

  sendSuccess(req, res, transitions);
});

export const getInstance = asyncHandler(async (req: Request, res: Response) => {
  const engine = getWorkflowEngine();
  const result = await engine.getCurrentState(req.params.id);

  if (!result) return void sendError(req, res, 404, 'Instance not found');

  sendSuccess(req, res, {
    instance: result.instance,
    currentState: result.state,
    definitionName: result.definition.name,
  });
});

export const listInstances = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.query.organizationId as string || req.user?.organizationId;
  if (!organizationId) return void sendError(req, res, 400, 'organizationId is required');

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().instance as PgWfInstanceRepository;
    const result = await repo.searchInstances(
      {
        organizationId,
        entityType: req.query.entityType as string,
        status: req.query.status as string,
        assigneeId: req.query.assigneeId as string,
        definitionId: req.query.definitionId as string,
        currentState: req.query.currentState as string,
      },
      page,
      limit,
    );
    return void sendPaginated(req, res, result.data, page, limit, result.total);
  }

  // ── MongoDB path ──
  const result = await workflowInstanceService.list({
    organizationId,
    entityType: req.query.entityType as string,
    status: req.query.status as string,
    assigneeId: req.query.assigneeId as string,
    definitionId: req.query.definitionId as string,
    currentState: req.query.currentState as string,
    page,
    limit,
  });

  sendPaginated(req, res, result.instances, page, limit, result.total);
});

export const getInstanceEvents = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  // ── PostgreSQL path ──
  if (isWfPostgres()) {
    const repo = getWfRepos().event as PgWfEventRepository;
    const events = await repo.getByInstance(req.params.id, limit);
    return void sendSuccess(req, res, events);
  }

  // ── MongoDB path ──
  const events = await workflowEventService.getByInstance(req.params.id, limit);
  sendSuccess(req, res, events);
});

export const cancelWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const engine = getWorkflowEngine();
  const instance = await engine.cancelWorkflow({
    instanceId: req.params.id,
    actorId: userId,
    actorName: req.user?.name,
    reason: req.body.reason,
  });

  if (!instance) return void sendError(req, res, 404, 'Active instance not found');

  // Emit event
  WorkflowEventPublisher.instanceCancelled(
    {
      instanceId: req.params.id,
      definitionId: (instance as any).definitionId?.toString() || '',
      cancelledBy: userId,
      reason: req.body.reason,
    },
    { organizationId: req.user?.organizationId || '', userId }
  ).catch((err) => logger.error('Failed to emit wf.instance.cancelled', { err }));

  sendSuccess(req, res, instance);
});

export const suspendWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const engine = getWorkflowEngine();
  const instance = await engine.suspendWorkflow({
    instanceId: req.params.id,
    actorId: userId,
    actorName: req.user?.name,
    reason: req.body.reason,
  });

  if (!instance) return void sendError(req, res, 404, 'Active instance not found');
  sendSuccess(req, res, instance);
});

export const resumeWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return void sendError(req, res, 401, 'Unauthorized');

  const engine = getWorkflowEngine();
  const instance = await engine.resumeWorkflow({
    instanceId: req.params.id,
    actorId: userId,
    actorName: req.user?.name,
  });

  if (!instance) return void sendError(req, res, 404, 'Suspended instance not found');
  sendSuccess(req, res, instance);
});

export const migrateInstances = asyncHandler(async (req: Request, res: Response) => {
  const result = await workflowInstanceService.migrateInstances({
    fromDefinitionId: req.body.fromDefinitionId,
    toDefinitionId: req.body.toDefinitionId,
    toVersion: req.body.toVersion,
    stateMapping: req.body.stateMapping,
    strategy: req.body.strategy || 'keep_state',
    initialState: req.body.initialState,
  });

  sendSuccess(req, res, result);
});
