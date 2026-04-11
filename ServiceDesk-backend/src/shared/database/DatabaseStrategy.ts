/**
 * Database Strategy
 *
 * Config-driven strategy pattern that returns the correct repository
 * implementation for each module. Supports MongoDB (default) and PostgreSQL.
 * This is the single place where the database backend is selected.
 */

import { Model, Document } from 'mongoose';
import { IRepository } from './IRepository';
import { MongoRepository } from './MongoRepository';
import { PostgresRepository, PgTableConfig } from './PostgresRepository';

export type DatabaseType = 'mongodb' | 'postgresql';

export type ModuleName = 'itsm' | 'pm' | 'forms' | 'analytics' | 'storage' | 'workflow' | 'platform' | 'sla' | 'gamification' | 'campaigns';

interface DatabaseStrategyConfig {
  itsm: DatabaseType;
  pm: DatabaseType;
  forms: DatabaseType;
  analytics: DatabaseType;
  storage: DatabaseType;
  workflow: DatabaseType;
  platform: DatabaseType;
  sla: DatabaseType;
  gamification: DatabaseType;
  campaigns: DatabaseType;
  default: DatabaseType;
}

/**
 * Returns the configured database type for a module.
 * Reads from environment variables, falling back to 'mongodb'.
 */
function getConfig(): DatabaseStrategyConfig {
  return {
    itsm: (process.env.DB_STRATEGY_ITSM as DatabaseType) || 'mongodb',
    pm: (process.env.DB_STRATEGY_PM as DatabaseType) || 'mongodb',
    forms: (process.env.DB_STRATEGY_FORMS as DatabaseType) || 'mongodb',
    analytics: (process.env.DB_STRATEGY_ANALYTICS as DatabaseType) || 'mongodb',
    storage: (process.env.DB_STRATEGY_STORAGE as DatabaseType) || 'mongodb',
    workflow: (process.env.DB_STRATEGY_WORKFLOW as DatabaseType) || 'mongodb',
    platform: (process.env.DB_STRATEGY_PLATFORM as DatabaseType) || 'mongodb',
    sla: (process.env.DB_STRATEGY_SLA as DatabaseType) || 'mongodb',
    gamification: (process.env.DB_STRATEGY_GAMIFICATION as DatabaseType) || 'mongodb',
    campaigns: (process.env.DB_STRATEGY_CAMPAIGNS as DatabaseType) || 'mongodb',
    default: 'mongodb',
  };
}

/**
 * Get the database type configured for a given module.
 */
export function getDatabaseType(module: ModuleName): DatabaseType {
  const config = getConfig();
  return config[module] || config.default;
}

/**
 * Create a repository backed by the configured database for the module.
 *
 * - If the module uses 'mongodb', wraps the provided Mongoose model.
 * - If the module uses 'postgresql', creates a PostgresRepository for the table.
 *
 * @param model - Mongoose model (used for MongoDB path)
 * @param module - Module name (determines which DB strategy to use)
 * @param pgConfig - PostgreSQL table config (required when strategy = postgresql)
 */
export function createRepository<T extends Document>(
  model: Model<T>,
  module?: ModuleName,
  pgConfig?: PgTableConfig
): IRepository<T> {
  if (module && getDatabaseType(module) === 'postgresql') {
    if (!pgConfig) {
      throw new Error(
        `[DatabaseStrategy] Module "${module}" is set to postgresql but no pgConfig (tableName) provided.`
      );
    }
    return new PostgresRepository<T>(pgConfig);
  }

  return new MongoRepository<T>(model);
}
