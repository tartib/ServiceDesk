/**
 * ITSM Module — Public API
 *
 * Service Catalog, Service Requests, CMDB, Automation Rules
 */

export { default as routes } from './routes';

// Re-export models for cross-module consumption
export {
  ServiceCatalog,
  ServiceRequest,
  ConfigurationItem,
  AutomationRule,
} from './models';
