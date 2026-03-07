/**
 * Database Abstraction Layer — Barrel Export
 */

export { IRepository, IQueryOptions, IQueryFilter, IPaginatedResult } from './IRepository';
export { MongoRepository } from './MongoRepository';
export { PostgresRepository, PgTableConfig } from './PostgresRepository';
export { DatabaseType, ModuleName, getDatabaseType, createRepository } from './DatabaseStrategy';
export {
  connectPostgres,
  disconnectPostgres,
  getPool,
  isPostgresRequired,
  ensureTable,
} from './PostgresConnectionManager';
export {
  PgUserRepository,
  PgTeamRepository,
  PgOrganizationRepository,
} from './repositories';
