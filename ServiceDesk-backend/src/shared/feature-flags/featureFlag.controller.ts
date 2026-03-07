/**
 * Feature Flag Admin Controller
 *
 * GET  /api/v2/admin/feature-flags          — list all flags
 * GET  /api/v2/admin/feature-flags/:name    — get single flag
 * PATCH /api/v2/admin/feature-flags/:name   — update flag
 * POST /api/v2/admin/feature-flags          — create flag (runtime)
 */

import { Request, Response } from 'express';
import FeatureFlagService from './FeatureFlagService';
import { FeatureFlagCategory } from './types';

export async function listFlags(req: Request, res: Response): Promise<void> {
  try {
    const service = FeatureFlagService.getInstance();
    const { category } = req.query;

    let flags;
    if (category && Object.values(FeatureFlagCategory).includes(category as FeatureFlagCategory)) {
      flags = await service.getFlagsByCategory(category as FeatureFlagCategory);
    } else {
      flags = await service.getFlags();
    }

    res.status(200).json({
      success: true,
      data: flags,
      count: flags.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feature flags',
    });
  }
}

export async function getFlag(req: Request, res: Response): Promise<void> {
  try {
    const service = FeatureFlagService.getInstance();
    const flag = await service.getFlag(req.params.name);

    if (!flag) {
      res.status(404).json({
        success: false,
        message: `Feature flag '${req.params.name}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: flag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feature flag',
    });
  }
}

export async function updateFlag(req: Request, res: Response): Promise<void> {
  try {
    const service = FeatureFlagService.getInstance();
    const userId = (req as any).user?._id?.toString();

    const { enabled, rolloutPercentage, allowedRoles, allowedOrgs, description, descriptionAr } = req.body;

    const update: Record<string, any> = {};
    if (typeof enabled === 'boolean') update.enabled = enabled;
    if (typeof rolloutPercentage === 'number') {
      if (rolloutPercentage < 0 || rolloutPercentage > 100) {
        res.status(400).json({
          success: false,
          message: 'rolloutPercentage must be between 0 and 100',
        });
        return;
      }
      update.rolloutPercentage = rolloutPercentage;
    }
    if (Array.isArray(allowedRoles)) update.allowedRoles = allowedRoles;
    if (Array.isArray(allowedOrgs)) update.allowedOrgs = allowedOrgs;
    if (typeof description === 'string') update.description = description;
    if (typeof descriptionAr === 'string') update.descriptionAr = descriptionAr;

    if (Object.keys(update).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
      return;
    }

    const flag = await service.updateFlag(req.params.name, update, userId);

    if (!flag) {
      res.status(404).json({
        success: false,
        message: `Feature flag '${req.params.name}' not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: flag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update feature flag',
    });
  }
}

export async function createFlag(req: Request, res: Response): Promise<void> {
  try {
    const service = FeatureFlagService.getInstance();

    const { name, enabled, description, descriptionAr, rolloutPercentage, allowedRoles, allowedOrgs, category } = req.body;

    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: 'name and description are required',
      });
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      res.status(400).json({
        success: false,
        message: 'name must be snake_case (lowercase letters, digits, underscores)',
      });
      return;
    }

    const existing = await service.getFlag(name);
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Feature flag '${name}' already exists`,
      });
      return;
    }

    const flag = await service.createFlag({
      name,
      enabled: enabled ?? false,
      description,
      descriptionAr,
      rolloutPercentage: rolloutPercentage ?? 100,
      allowedRoles,
      allowedOrgs,
      category: category || FeatureFlagCategory.CORE,
    });

    res.status(201).json({
      success: true,
      data: flag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create feature flag',
    });
  }
}
