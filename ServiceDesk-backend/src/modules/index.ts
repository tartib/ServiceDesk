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
  /** If true, authenticate middleware is applied before the router */
  requiresAuth?: boolean;
  /** Feature flag name — if set, module routes are gated behind this flag */
  featureFlag?: string;
  /** Lazy loader — keeps app.ts thin and avoids circular-import risk */
  router: () => import('express').Router;
}

const modules: ModuleDescriptor[] = [
  // ── Domain Modules ──────────────────────────────────────
  {
    name: 'itsm',
    prefix: '/api/v2/itsm',
    requiresAuth: false, // routes handle auth internally
    featureFlag: 'itsm_module_enabled',
    router: () => require('./itsm/routes').default,
  },
  {
    name: 'pm',
    prefix: '/api/v1',
    requiresAuth: false,
    featureFlag: 'pm_module_enabled',
    router: () => require('./pm/routes').default,
  },
  {
    name: 'workflow-engine',
    prefix: '/api/v2/workflow-engine',
    requiresAuth: false,
    featureFlag: 'workflow_engine_enabled',
    router: () => require('./workflow-engine/routes').default,
  },
  {
    name: 'notifications',
    prefix: '/api/v2/notifications',
    requiresAuth: false, // routes apply authenticate internally
    router: () => require('./notifications/routes').default,
  },
  {
    name: 'sla',
    prefix: '/api/v2/sla',
    requiresAuth: false, // routes apply authenticate internally
    featureFlag: 'sla_module_enabled',
    router: () => require('./sla/routes').default,
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

    // Authentication
    if (mod.requiresAuth) {
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

  logger.info(`[modules] internal APIs registered: [${InternalApiRegistry.keys().join(', ')}]`);
}
