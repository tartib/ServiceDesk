/**
 * PM Repository Factory
 *
 * Returns either Mongo-backed or PG-backed repositories depending on
 * the DB_STRATEGY_PM environment variable.
 *
 * Usage:
 *   const { project, task, sprint } = getPmRepos();
 */

import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';

// Mongo repos
import { ProjectRepository } from './ProjectRepository';
import { TaskRepository } from './TaskRepository';

// PG repos
import { PgProjectRepository } from './PgProjectRepository';
import { PgTaskRepository } from './PgTaskRepository';
import { PgSprintRepository } from './PgSprintRepository';

export interface PmRepositories {
  project: ProjectRepository | PgProjectRepository;
  task: TaskRepository | PgTaskRepository;
  sprint: PgSprintRepository | null; // Mongo path uses Sprint model directly
  dbType: 'mongodb' | 'postgresql';
}

let _cached: PmRepositories | null = null;

/**
 * Get PM repositories for the configured database strategy.
 * Singletons — instantiated once and reused.
 */
export function getPmRepos(): PmRepositories {
  if (_cached) return _cached;

  const dbType = getDatabaseType('pm');

  if (dbType === 'postgresql') {
    _cached = {
      project: new PgProjectRepository(),
      task: new PgTaskRepository(),
      sprint: new PgSprintRepository(),
      dbType: 'postgresql',
    };
  } else {
    _cached = {
      project: new ProjectRepository(),
      task: new TaskRepository(),
      sprint: null, // Mongo path uses Sprint model directly
      dbType: 'mongodb',
    };
  }

  return _cached;
}

/**
 * Check if PM is using PostgreSQL.
 */
export function isPmPostgres(): boolean {
  return getDatabaseType('pm') === 'postgresql';
}

/**
 * Reset cached repos (for testing).
 */
export function resetPmRepos(): void {
  _cached = null;
}
