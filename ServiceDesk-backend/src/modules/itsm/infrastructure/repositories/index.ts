/**
 * ITSM Infrastructure Repositories — Barrel Export
 */

// Mongo repos
export { ServiceRequestRepository } from './ServiceRequestRepository';
export { ConfigurationItemRepository } from './ConfigurationItemRepository';
export { ServiceCatalogRepository } from './ServiceCatalogRepository';
export { AutomationRuleRepository } from './AutomationRuleRepository';

// PG repos
export { PgServiceCatalogRepository } from './PgServiceCatalogRepository';
export { PgServiceRequestRepository } from './PgServiceRequestRepository';
export { PgConfigurationItemRepository } from './PgConfigurationItemRepository';
export { PgAutomationRuleRepository } from './PgAutomationRuleRepository';
export { PgCIRelationshipRepository } from './PgCIRelationshipRepository';
export { PgRuleExecutionLogRepository } from './PgRuleExecutionLogRepository';

// Factory
export { getItsmRepos, isItsmPostgres, resetItsmRepos } from './ItsmRepositoryFactory';
export type { ItsmRepositories } from './ItsmRepositoryFactory';
