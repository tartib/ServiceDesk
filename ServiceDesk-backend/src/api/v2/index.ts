/**
 * API v2 - Domain-Based Architecture
 * 
 * Domains:
 * - /core    : Identity, Authentication, Users, Organizations, Teams
 * - /ops     : Operational Work Orders (real-time execution)
 * - /pm      : Project Management (projects, sprints, boards)
 * - /sd      : Service Desk / ITSM (tickets, assets, catalog)
 * - /analytics: Dashboards, Reports, KPIs, Exports
 */

import { Router } from 'express';
import coreRoutes from './core';
import opsRoutes from './ops';
import pmRoutes from './pm';
import sdRoutes from './sd';
import analyticsRoutes from './analytics';

const router = Router();

// Domain routes
router.use('/core', coreRoutes);
router.use('/ops', opsRoutes);
router.use('/pm', pmRoutes);
router.use('/sd', sdRoutes);
router.use('/analytics', analyticsRoutes);

// Health check for v2 API
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    version: 'v2',
    timestamp: new Date().toISOString(),
    domains: ['core', 'ops', 'pm', 'sd', 'analytics'],
  });
});

export default router;
