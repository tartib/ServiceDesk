/**
 * Workspace Controller — POST /api/v2/workspace/setup
 *
 * Sets up a workspace: assigns WorkspaceType to the organization
 * and seeds the default RequestTypes for that workspace type.
 */

import { Request, Response } from 'express';
import { WorkspaceType } from '../../../shared/types/workspace.types';
import { seedWorkspaceRequestTypes, getAvailableWorkspaceTypes } from '../seeds/workspace-templates';

export const workspaceController = {
  /**
   * POST /api/v2/workspace/setup
   * Body: { workspaceType: string, organizationName?: string }
   */
  async setupWorkspace(req: Request, res: Response) {
    try {
      const { workspaceType, organizationName } = req.body;

      if (!workspaceType || !Object.values(WorkspaceType).includes(workspaceType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid workspaceType. Must be one of: ${Object.values(WorkspaceType).join(', ')}`,
        });
      }

      const userId = (req as any).user?.id || (req as any).userId;
      const orgId = (req as any).organizationId || (req as any).user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      // 1. Update org workspaceType
      const Organization = (await import('../../pm/models/Organization')).default;
      const org = await Organization.findByIdAndUpdate(
        orgId,
        {
          $set: {
            workspaceType,
            ...(organizationName ? { name: organizationName } : {}),
          },
        },
        { new: true },
      );

      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      // 2. Seed default request types
      const seededCount = await seedWorkspaceRequestTypes(
        workspaceType as WorkspaceType,
        orgId,
        userId,
      );

      return res.json({
        success: true,
        data: {
          organizationId: orgId,
          workspaceType,
          organizationName: org.name,
          requestTypesSeeded: seededCount,
        },
      });
    } catch (error: unknown) {
      console.error('Workspace setup failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Workspace setup failed',
      });
    }
  },

  /** GET /api/v2/workspace/types — list available workspace types */
  async listWorkspaceTypes(_req: Request, res: Response) {
    try {
      const types = getAvailableWorkspaceTypes();
      return res.json({ success: true, data: types });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list workspace types',
      });
    }
  },

  /** GET /api/v2/workspace/current — get current org workspace info */
  async getCurrentWorkspace(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req as any).user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const Organization = (await import('../../pm/models/Organization')).default;
      const org = await Organization.findById(orgId).select('name workspaceType settings').lean();

      if (!org) {
        // Organization not yet created — return un-onboarded state instead of 404
        return res.json({
          success: true,
          data: {
            organizationId: orgId,
            name: null,
            workspaceType: null,
            isOnboarded: false,
          },
        });
      }

      return res.json({
        success: true,
        data: {
          organizationId: orgId,
          name: org.name,
          workspaceType: org.workspaceType || null,
          isOnboarded: !!org.workspaceType,
        },
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get workspace',
      });
    }
  },
};
