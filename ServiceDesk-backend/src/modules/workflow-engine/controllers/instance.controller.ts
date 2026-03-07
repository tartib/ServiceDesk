/**
 * Workflow Instance Controller
 * تحكم نماذج سير العمل — Start, Transition, Query
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PMAuthRequest } from '../../../types/pm';
import { getWorkflowEngine } from '../services/workflowEngineFactory';
import workflowInstanceService from '../services/workflowInstance.service';
import workflowEventService from '../services/workflowEvent.service';
import { WorkflowEventPublisher } from '../../../shared/events/publishers/workflow.publisher';
import logger from '../../../utils/logger';
import { isWfPostgres, getWfRepos } from '../infrastructure/repositories';
import { PgWfInstanceRepository } from '../infrastructure/repositories/PgWfInstanceRepository';
import { PgWfEventRepository } from '../infrastructure/repositories/PgWfEventRepository';

export async function startWorkflow(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const organizationId = req.body.organizationId || req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

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

    return res.status(201).json({ success: true, data: instance });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function executeTransition(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

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
      return res.status(400).json({ success: false, message: result.error, data: result });
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

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAvailableTransitions(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const engine = getWorkflowEngine();
    const transitions = await engine.getAvailableTransitions({
      instanceId: req.params.id,
      actorId: userId,
      actorRoles: req.user?.role ? [req.user.role] : [],
    });

    return res.json({ success: true, data: transitions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInstance(req: PMAuthRequest, res: Response) {
  try {
    const engine = getWorkflowEngine();
    const result = await engine.getCurrentState(req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Instance not found' });
    }

    return res.json({
      success: true,
      data: {
        instance: result.instance,
        currentState: result.state,
        definitionName: result.definition.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function listInstances(req: PMAuthRequest, res: Response) {
  try {
    const organizationId = req.query.organizationId as string || req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

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
      return res.json({
        success: true,
        data: result.data,
        pagination: { total: result.total, page, limit },
      });
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

    return res.json({
      success: true,
      data: result.instances,
      pagination: { total: result.total, page, limit },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInstanceEvents(req: PMAuthRequest, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    // ── PostgreSQL path ──
    if (isWfPostgres()) {
      const repo = getWfRepos().event as PgWfEventRepository;
      const events = await repo.getByInstance(req.params.id, limit);
      return res.json({ success: true, data: events });
    }

    // ── MongoDB path ──
    const events = await workflowEventService.getByInstance(req.params.id, limit);
    return res.json({ success: true, data: events });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function cancelWorkflow(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const engine = getWorkflowEngine();
    const instance = await engine.cancelWorkflow({
      instanceId: req.params.id,
      actorId: userId,
      actorName: req.user?.name,
      reason: req.body.reason,
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Active instance not found' });
    }

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

    return res.json({ success: true, data: instance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function suspendWorkflow(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const engine = getWorkflowEngine();
    const instance = await engine.suspendWorkflow({
      instanceId: req.params.id,
      actorId: userId,
      actorName: req.user?.name,
      reason: req.body.reason,
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Active instance not found' });
    }

    return res.json({ success: true, data: instance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function resumeWorkflow(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const engine = getWorkflowEngine();
    const instance = await engine.resumeWorkflow({
      instanceId: req.params.id,
      actorId: userId,
      actorName: req.user?.name,
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Suspended instance not found' });
    }

    return res.json({ success: true, data: instance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function migrateInstances(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await workflowInstanceService.migrateInstances({
      fromDefinitionId: req.body.fromDefinitionId,
      toDefinitionId: req.body.toDefinitionId,
      toVersion: req.body.toVersion,
      stateMapping: req.body.stateMapping,
      strategy: req.body.strategy || 'keep_state',
      initialState: req.body.initialState,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
