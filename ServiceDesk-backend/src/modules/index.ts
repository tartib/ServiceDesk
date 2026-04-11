/**
 * Module Registry
 *
 * Central manifest of all domain modules.
 * Each entry declares the Express router and the path prefix it mounts on.
 *
 * Usage in app.ts:
 *   import { registerModules } from './modules';
 *   registerModules(app);
 */

import { Application } from 'express';
import { authenticate } from '../middleware/auth';
import { featureGate } from '../shared/feature-flags/featureGate';
import InternalApiRegistry from '../shared/internal-api/InternalApiRegistry';
import logger from '../utils/logger';

interface ModuleDescriptor {
  name: string;
  prefix: string;
  /** If false, auth is NOT applied at the registry level (module handles it internally).
   *  Defaults to true — all routes require authentication unless explicitly opted out. */
  requiresAuth?: boolean;
  /** Feature flag name — if set, module routes are gated behind this flag */
  featureFlag?: string;
  /** Lazy loader — keeps app.ts thin and avoids circular-import risk */
  router: () => import('express').Router;
}

const modules: ModuleDescriptor[] = [
  // ── Modules with public sub-routes (auth handled internally) ──
  {
    name: 'core',
    prefix: '/api/v2/core',
    requiresAuth: false, // has public auth routes (login, register, refresh)
    router: () => require('./core/routes').default,
  },
  {
    name: 'pm',
    prefix: '/api/v2',
    requiresAuth: false, // has public pm/auth routes
    featureFlag: 'pm_module_enabled',
    router: () => require('./pm/routes').default,
  },

  // ── Fully authenticated modules (requiresAuth defaults to true) ──
  {
    name: 'itsm',
    prefix: '/api/v2/itsm',
    featureFlag: 'itsm_module_enabled',
    router: () => require('./itsm/routes').default,
  },
  {
    name: 'workflow-engine',
    prefix: '/api/v2/workflow-engine',
    featureFlag: 'workflow_engine_enabled',
    router: () => require('./workflow-engine/routes').default,
  },
  {
    name: 'notifications',
    prefix: '/api/v2/notifications',
    router: () => require('./notifications/routes').default,
  },
  {
    name: 'sla',
    prefix: '/api/v2/sla',
    featureFlag: 'sla_module_enabled',
    router: () => require('./sla/routes').default,
  },
  {
    name: 'analytics',
    prefix: '/api/v2/analytics',
    router: () => require('./analytics/routes').default,
  },
  {
    name: 'forms',
    prefix: '/api/v2/forms',
    router: () => require('./forms/routes').default,
  },
  {
    name: 'storage',
    prefix: '/api/v2/storage',
    requiresAuth: false, // has public share-link routes, auth applied internally
    router: () => require('./storage/routes').default,
  },
  {
    name: 'ops',
    prefix: '/api/v2/ops',
    router: () => require('./ops/routes').default,
  },
  {
    name: 'gamification',
    prefix: '/api/v2/gamification',
    featureFlag: 'gamification_module_enabled',
    router: () => require('./gamification/routes').default,
  },
  {
    name: 'campaigns',
    prefix: '/api/v2/campaigns',
    featureFlag: 'campaigns_module_enabled',
    router: () => require('./campaigns/routes').default,
  },
];

/**
 * Mount every registered module on the Express app.
 */
export function registerModules(app: Application): void {
  for (const mod of modules) {
    const router = mod.router();
    const middleware: any[] = [];

    // Feature flag gate (checked per-request, not at boot time)
    if (mod.featureFlag) {
      middleware.push(featureGate(mod.featureFlag));
    }

    // Authentication — default to true (secure by default)
    if (mod.requiresAuth !== false) {
      middleware.push(authenticate);
    }

    app.use(mod.prefix, ...middleware, router);
    logger.info(`[modules] mounted ${mod.name} → ${mod.prefix}${mod.featureFlag ? ` (gated: ${mod.featureFlag})` : ''}`);
  }

  // ── Register Internal API facades ──────────────────────────
  registerInternalApis();
}

/**
 * Register each module's Internal API facade in the registry.
 * Uses lazy imports to avoid circular dependencies.
 */
function registerInternalApis(): void {
  try {
    const { ItsmApiImpl } = require('./itsm/contracts');
    InternalApiRegistry.register('itsm', new ItsmApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register ITSM internal API', { error: e });
  }

  try {
    const { PmApiImpl } = require('./pm/contracts');
    InternalApiRegistry.register('pm', new PmApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register PM internal API', { error: e });
  }

  try {
    const { WorkflowApiImpl } = require('./workflow-engine/contracts');
    InternalApiRegistry.register('workflow', new WorkflowApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register Workflow internal API', { error: e });
  }

  try {
    const { NotificationsApiImpl } = require('./notifications/contracts');
    InternalApiRegistry.register('notifications', new NotificationsApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register Notifications internal API', { error: e });
  }

  try {
    const { SlaApiImpl } = require('./sla/contracts');
    InternalApiRegistry.register('sla', new SlaApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register SLA internal API', { error: e });
  }

  try {
    const { GamificationApiImpl } = require('./gamification/contracts/GamificationApi');
    InternalApiRegistry.register('gamification', new GamificationApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register Gamification internal API', { error: e });
  }

  try {
    const { CampaignsApiImpl } = require('./campaigns/contracts');
    InternalApiRegistry.register('campaigns', new CampaignsApiImpl());
  } catch (e) {
    logger.warn('[modules] failed to register Campaigns internal API', { error: e });
  }

  logger.info(`[modules] internal APIs registered: [${InternalApiRegistry.keys().join(', ')}]`);
}
