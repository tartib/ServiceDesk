/**
 * ITSM Repository Factory
 *
 * Returns either Mongo-backed or PG-backed repositories depending on
 * the DB_STRATEGY_ITSM environment variable.
 *
 * Usage:
 *   const { serviceCatalog, serviceRequest, configurationItem, automationRule,
 *           ciRelationship, ruleExecutionLog } = getItsmRepos();
 */

import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';

// Mongo repos
import { ServiceCatalogRepository } from './ServiceCatalogRepository';
import { ServiceRequestRepository } from './ServiceRequestRepository';
import { ConfigurationItemRepository } from './ConfigurationItemRepository';
import { AutomationRuleRepository } from './AutomationRuleRepository';

// PG repos
import { PgServiceCatalogRepository } from './PgServiceCatalogRepository';
import { PgServiceRequestRepository } from './PgServiceRequestRepository';
import { PgConfigurationItemRepository } from './PgConfigurationItemRepository';
import { PgAutomationRuleRepository } from './PgAutomationRuleRepository';
import { PgCIRelationshipRepository } from './PgCIRelationshipRepository';
import { PgRuleExecutionLogRepository } from './PgRuleExecutionLogRepository';

export interface ItsmRepositories {
  serviceCatalog: ServiceCatalogRepository | PgServiceCatalogRepository;
  serviceRequest: ServiceRequestRepository | PgServiceRequestRepository;
  configurationItem: ConfigurationItemRepository | PgConfigurationItemRepository;
  automationRule: AutomationRuleRepository | PgAutomationRuleRepository;
  ciRelationship: PgCIRelationshipRepository | null;
  ruleExecutionLog: PgRuleExecutionLogRepository | null;
  dbType: 'mongodb' | 'postgresql';
}

let _cached: ItsmRepositories | null = null;

/**
 * Get ITSM repositories for the configured database strategy.
 * Singletons — instantiated once and reused.
 */
export function getItsmRepos(): ItsmRepositories {
  if (_cached) return _cached;

  const dbType = getDatabaseType('itsm');

  if (dbType === 'postgresql') {
    _cached = {
      serviceCatalog: new PgServiceCatalogRepository(),
      serviceRequest: new PgServiceRequestRepository(),
      configurationItem: new PgConfigurationItemRepository(),
      automationRule: new PgAutomationRuleRepository(),
      ciRelationship: new PgCIRelationshipRepository(),
      ruleExecutionLog: new PgRuleExecutionLogRepository(),
      dbType: 'postgresql',
    };
  } else {
    _cached = {
      serviceCatalog: new ServiceCatalogRepository(),
      serviceRequest: new ServiceRequestRepository(),
      configurationItem: new ConfigurationItemRepository(),
      automationRule: new AutomationRuleRepository(),
      ciRelationship: null,  // Mongo uses embedded arrays, no separate collection
      ruleExecutionLog: null, // Mongo repos use the model directly
      dbType: 'mongodb',
    };
  }

  return _cached;
}

/**
 * Check if ITSM is using PostgreSQL.
 */
export function isItsmPostgres(): boolean {
  return getDatabaseType('itsm') === 'postgresql';
}

/**
 * Reset cached repos (for testing).
 */
export function resetItsmRepos(): void {
  _cached = null;
}
