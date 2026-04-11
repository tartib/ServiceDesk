/**
 * Legacy v1 Route Registry — SUNSET 2026-04-10
 *
 * All legacy routes have been migrated to their respective v2 modules.
 * This file is kept as a no-op to avoid breaking app.ts imports.
 * Safe to delete once the registerLegacyRoutes call is removed from app.ts.
 */

import { Application } from 'express';
import logger from '../utils/logger';

export function registerLegacyRoutes(_app: Application): void {
  logger.info('[legacy] all legacy routes sunset — no-op');
}

export default registerLegacyRoutes;
