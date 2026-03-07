/**
 * Legacy v1 Route Registry
 *
 * Consolidates all legacy route mounting into a single function
 * gated by feature flags. Each route group can be disabled independently.
 *
 * Sunset target: 2026-09-01
 */

import { Application, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { featureGate } from '../shared/feature-flags/featureGate';
import { globalDeprecationMiddleware } from '../shared/middleware/deprecation.middleware';
import env from '../config/env';
import logger from '../utils/logger';

// ── Sunset Header Middleware ───────────────────────────────────
function sunsetHeader(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Sunset', 'Mon, 01 Sep 2026 00:00:00 GMT');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/v2>; rel="successor-version"');
  next();
}

interface LegacyRouteGroup {
  name: string;
  featureFlag: string;
  mount: (app: Application, prefix: string) => void;
}

const legacyGroups: LegacyRouteGroup[] = [
  // ── Auth & Users ─────────────────────────────────────────
  {
    name: 'auth',
    featureFlag: 'legacy_auth_routes',
    mount: (app, prefix) => {
      const authRoutes = require('./authRoutes').default;
      const userRoutes = require('./userRoutes').default;
      const teamRoutes = require('./teamRoutes').default;
      const employeeRoutes = require('./employeeRoutes').default;
      app.use(`${prefix}/auth`, authRoutes);
      app.use(`${prefix}/users`, userRoutes);
      app.use(`${prefix}/teams`, teamRoutes);
      app.use(`${prefix}/employees`, employeeRoutes);
    },
  },

  // ── OPS (Tasks, Inventory, Assets, Categories) ───────────
  {
    name: 'ops',
    featureFlag: 'legacy_ops_routes',
    mount: (app, prefix) => {
      const prepTaskRoutes = require('./prepTaskRoutes').default;
      const categoryRoutes = require('./categoryRoutes').default;
      const inventoryRoutes = require('./inventoryRoutes').default;
      const assetRoutes = require('./assetRoutes').default;
      app.use(`${prefix}/tasks`, prepTaskRoutes);
      app.use(`${prefix}/categories`, categoryRoutes);
      app.use(`${prefix}/inventory`, inventoryRoutes);
      app.use(`${prefix}/assets`, assetRoutes);
    },
  },

  // ── ITSM v1 (Service Requests, Incidents, etc.) ──────────
  {
    name: 'itsm-v1',
    featureFlag: 'legacy_itsm_v1_routes',
    mount: (app, prefix) => {
      const serviceRequestRoutes = require('./serviceRequestRoutes').default;
      const incidentRoutes = require('../presentation/routes/v2/incidentRoutes').default;
      const problemRoutes = require('../presentation/routes/v2/problemRoutes').default;
      const changeRoutes = require('../presentation/routes/v2/changeRoutes').default;
      const slaRoutes = require('../presentation/routes/v2/slaRoutes').default;
      const releaseRoutes = require('../presentation/routes/v2/releaseRoutes').default;
      const serviceCatalogRoutes = require('../presentation/routes/v2/serviceCatalogRoutes').default;
      app.use(`${prefix}/service-requests`, serviceRequestRoutes);
      app.use(`${prefix}/incidents`, incidentRoutes);
      app.use(`${prefix}/problems`, problemRoutes);
      app.use(`${prefix}/changes`, changeRoutes);
      app.use(`${prefix}/slas`, slaRoutes);
      app.use(`${prefix}/releases`, releaseRoutes);
      app.use(`${prefix}/service-catalog`, serviceCatalogRoutes);
    },
  },

  // ── Forms ────────────────────────────────────────────────
  {
    name: 'forms',
    featureFlag: 'legacy_forms_routes',
    mount: (app, _prefix) => {
      const formTemplateRoutes = require('./formTemplateRoutes').default;
      const formSubmissionRoutes = require('./formSubmissionRoutes').default;
      app.use('/api/v2/forms/templates', authenticate, formTemplateRoutes);
      app.use('/api/v2/forms/submissions', authenticate, formSubmissionRoutes);
    },
  },

  // ── Files & Workflows ────────────────────────────────────
  {
    name: 'files',
    featureFlag: 'legacy_files_routes',
    mount: (app, prefix) => {
      const fileStorageRoutes = require('./fileStorage.routes').default;
      const fileFolderRoutes = require('./fileFolder.routes').default;
      const workflowRoutes = require('./workflow.routes').default;
      app.use(`${prefix}/files`, fileStorageRoutes);
      app.use(`${prefix}/folders`, fileFolderRoutes);
      app.use(`${prefix}/workflows`, workflowRoutes);
    },
  },

  // ── Misc (Knowledge, Reports, KPI, etc.) ─────────────────
  {
    name: 'misc',
    featureFlag: 'legacy_misc_routes',
    mount: (app, prefix) => {
      const knowledgeRoutes = require('./knowledgeRoutes').default;
      const reportRoutes = require('./reportRoutes').default;
      const kpiRoutes = require('./kpiRoutes').default;
      const alertRoutes = require('./alertRoutes').default;
      const performanceRoutes = require('./performanceRoutes').default;
      const leaderboardRoutes = require('./leaderboardRoutes').default;
      const ratingRoutes = require('./ratingRoutes').default;
      const leaveRequestRoutes = require('./leaveRequest.routes').default;
      app.use(`${prefix}/knowledge`, knowledgeRoutes);
      app.use(`${prefix}/reports`, reportRoutes);
      app.use(`${prefix}/kpi`, kpiRoutes);
      app.use(`${prefix}/alerts`, alertRoutes);
      app.use(`${prefix}/performance`, performanceRoutes);
      app.use(`${prefix}/leaderboard`, leaderboardRoutes);
      app.use(`${prefix}/ratings`, ratingRoutes);
      app.use(`${prefix}/leave-requests`, leaveRequestRoutes);
    },
  },
];

/**
 * Register all legacy v1 routes with feature flag gating.
 * Each group is independently toggleable via its feature flag.
 * The master flag `legacy_v1_routes_enabled` gates everything.
 */
export function registerLegacyRoutes(app: Application): void {
  const prefix = `/api/${env.API_VERSION}`;

  // Master gate + deprecation headers + sunset header
  app.use(prefix, featureGate('legacy_v1_routes_enabled'), globalDeprecationMiddleware, sunsetHeader);

  let mounted = 0;
  for (const group of legacyGroups) {
    try {
      // Per-group feature gate is applied inline within the mount
      // The featureGate middleware is checked per-request
      app.use(prefix, featureGate(group.featureFlag));
      group.mount(app, prefix);
      mounted++;
      logger.info(`[legacy] mounted ${group.name} routes (flag: ${group.featureFlag})`);
    } catch (e) {
      logger.warn(`[legacy] failed to mount ${group.name} routes`, { error: e });
    }
  }

  // Notifications — proxy v1 → v2 (frontend uses v1 baseURL)
  try {
    const notificationRoutes = require('../modules/notifications/routes').default;
    app.use(`${prefix}/notifications`, notificationRoutes);
    logger.info('[legacy] mounted v1→v2 notifications proxy');
  } catch (e) {
    logger.warn('[legacy] failed to mount notifications proxy', { error: e });
  }

  // v2 ITSM legacy routes
  try {
    const v2LegacyRoutes = require('../presentation/routes/v2').default;
    app.use('/api/v2/itsm', featureGate('legacy_itsm_v1_routes'), sunsetHeader, v2LegacyRoutes);
    logger.info('[legacy] mounted v2 ITSM legacy routes');
  } catch (e) {
    logger.warn('[legacy] failed to mount v2 ITSM legacy routes', { error: e });
  }

  // v2 Domain-based API routes
  try {
    const v2DomainRoutes = require('../api/v2').default;
    app.use('/api/v2', v2DomainRoutes);
    logger.info('[legacy] mounted v2 domain routes');
  } catch (e) {
    logger.warn('[legacy] failed to mount v2 domain routes', { error: e });
  }

  logger.info(`[legacy] ${mounted}/${legacyGroups.length} route groups mounted`);
}

export default registerLegacyRoutes;
