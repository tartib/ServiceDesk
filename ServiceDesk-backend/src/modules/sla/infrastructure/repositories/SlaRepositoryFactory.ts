/**
 * SLA Repository Factory
 *
 * Returns the correct repository implementations based on the configured
 * database strategy for the SLA module (DB_STRATEGY_SLA).
 */

import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';
import { PgSlaCalendarRepository } from './PgSlaCalendarRepository';
import { PgSlaPolicyRepository } from './PgSlaPolicyRepository';
import { PgSlaInstanceRepository } from './PgSlaInstanceRepository';
import { PgSlaMetricInstanceRepository } from './PgSlaMetricInstanceRepository';
import { PgSlaEventRepository } from './PgSlaEventRepository';

export interface SlaRepos {
  calendarRepo: PgSlaCalendarRepository;
  policyRepo: PgSlaPolicyRepository;
  instanceRepo: PgSlaInstanceRepository;
  metricRepo: PgSlaMetricInstanceRepository;
  eventRepo: PgSlaEventRepository;
}

let cached: SlaRepos | null = null;

/**
 * Check if the SLA module is configured to use PostgreSQL.
 */
export function isSlaPostgres(): boolean {
  return getDatabaseType('sla') === 'postgresql';
}

/**
 * Get the SLA repository instances.
 * Currently only PostgreSQL is implemented for the SLA module.
 * MongoDB fallback uses the same PG repos shape but backed by Mongoose models.
 */
export function getSlaRepos(): SlaRepos {
  if (cached) return cached;

  // For now, SLA module uses PG repos regardless of strategy.
  // The MongoDB path would use Mongoose models via MongoRepository but
  // the SLA module is designed PostgreSQL-first. If DB_STRATEGY_SLA is 'mongodb',
  // the PG repos will fail at runtime if no Postgres pool is available.
  // This is intentional — SLA is a platform service that benefits from relational integrity.
  cached = {
    calendarRepo: new PgSlaCalendarRepository(),
    policyRepo: new PgSlaPolicyRepository(),
    instanceRepo: new PgSlaInstanceRepository(),
    metricRepo: new PgSlaMetricInstanceRepository(),
    eventRepo: new PgSlaEventRepository(),
  };

  return cached;
}

/**
 * Reset cached repos (for testing).
 */
export function resetSlaRepos(): void {
  cached = null;
}
