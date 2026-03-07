/**
 * Analytics Repository Factory
 *
 * Returns either MongoDB or PostgreSQL repository implementations
 * based on the DB_STRATEGY_ANALYTICS environment variable.
 */

import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';
import { PgTaskSnapshotRepository } from './PgTaskSnapshotRepository';
import { PgDailyKPISnapshotRepository } from './PgDailyKPISnapshotRepository';
import { PgEventLogRepository } from './PgEventLogRepository';

export interface AnalyticsRepositories {
  taskSnapshot: PgTaskSnapshotRepository;
  dailyKPI: PgDailyKPISnapshotRepository;
  eventLog: PgEventLogRepository;
}

let _cached: AnalyticsRepositories | null = null;

export function isAnalyticsPostgres(): boolean {
  return getDatabaseType('analytics') === 'postgresql';
}

/**
 * Returns PG repo instances. Only call when isAnalyticsPostgres() is true.
 */
export function getAnalyticsRepos(): AnalyticsRepositories {
  if (_cached) return _cached;

  _cached = {
    taskSnapshot: new PgTaskSnapshotRepository(),
    dailyKPI: new PgDailyKPISnapshotRepository(),
    eventLog: new PgEventLogRepository(),
  };

  return _cached;
}

export function resetAnalyticsRepos(): void {
  _cached = null;
}
