/**
 * Workflow Definition Controller
 * تحكم تعريفات سير العمل
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import workflowDefinitionService from '../services/workflowDefinition.service';
import { PMAuthRequest } from '../../../types/pm';

function resolveOrgId(req: PMAuthRequest): string | undefined {
  if (req.body?.organizationId) return req.body.organizationId;
  if (req.user?.organizationId) return req.user.organizationId;
  const orgs = req.user?.organizations;
  if (Array.isArray(orgs) && orgs.length > 0) return orgs[0].organizationId;
  return undefined;
}

export async function createDefinition(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const organizationId = resolveOrgId(req);
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

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

    return res.status(201).json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDefinition(req: PMAuthRequest, res: Response) {
  try {
    const definition = await workflowDefinitionService.findById(req.params.id);
    if (!definition) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }
    return res.json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function listDefinitions(req: PMAuthRequest, res: Response) {
  try {
    const organizationId = (req.query.organizationId as string) || resolveOrgId(req);
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

    const result = await workflowDefinitionService.list({
      organizationId,
      entityType: req.query.entityType as string,
      status: req.query.status as string,
      projectId: req.query.projectId as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    return res.json({
      success: true,
      data: result.definitions,
      pagination: {
        total: result.total,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateDefinition(req: PMAuthRequest, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const definition = await workflowDefinitionService.update(
      req.params.id,
      req.body,
      userId
    );

    if (!definition) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }

    return res.json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteDefinition(req: PMAuthRequest, res: Response) {
  try {
    const deleted = await workflowDefinitionService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }
    return res.json({ success: true, message: 'Definition deleted' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function publishDefinition(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const definition = await workflowDefinitionService.publish(req.params.id, userId);
    if (!definition) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }

    return res.json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function deprecateDefinition(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const definition = await workflowDefinitionService.deprecate(req.params.id, userId);
    if (!definition) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }

    return res.json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getVersions(req: PMAuthRequest, res: Response) {
  try {
    const organizationId = (req.query.organizationId as string) || resolveOrgId(req);
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

    const definition = await workflowDefinitionService.findById(req.params.id);
    if (!definition) {
      return res.status(404).json({ success: false, message: 'Definition not found' });
    }

    const versions = await workflowDefinitionService.getVersions(
      organizationId,
      definition.name
    );

    return res.json({ success: true, data: versions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createNewVersion(req: PMAuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const definition = await workflowDefinitionService.createNewVersion(
      req.params.id,
      req.body,
      userId
    );

    if (!definition) {
      return res.status(404).json({ success: false, message: 'Source definition not found' });
    }

    return res.status(201).json({ success: true, data: definition });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
