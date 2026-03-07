/**
 * Workflow Engine Repository Factory
 *
 * Returns either MongoDB or PostgreSQL repository implementations
 * based on the DB_STRATEGY_WORKFLOW environment variable.
 */

import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';
import type { IWFInstanceStore, IWFEventStore, IWFExternalTaskStore } from '../../engine/GenericWorkflowEngine';

// Lazy-loaded Mongo services (singletons already)
import workflowInstanceService from '../../services/workflowInstance.service';
import workflowEventService from '../../services/workflowEvent.service';

// PG repos
import { PgWfInstanceRepository } from './PgWfInstanceRepository';
import { PgWfEventRepository } from './PgWfEventRepository';
import { PgWfExternalTaskRepository } from './PgWfExternalTaskRepository';

export interface WfRepositories {
  instance: IWFInstanceStore & { [key: string]: any };
  event: IWFEventStore & { [key: string]: any };
  externalTask: IWFExternalTaskStore & { [key: string]: any };
}

let _cached: WfRepositories | null = null;

export function isWfPostgres(): boolean {
  return getDatabaseType('workflow') === 'postgresql';
}

export function getWfRepos(): WfRepositories {
  if (_cached) return _cached;

  if (isWfPostgres()) {
    _cached = {
      instance: new PgWfInstanceRepository(),
      event: new PgWfEventRepository(),
      externalTask: new PgWfExternalTaskRepository(),
    };
  } else {
    // For Mongo path, the existing singleton services already implement the store interfaces
    // We wrap them so the factory always returns consistent shapes
    _cached = {
      instance: workflowInstanceService as any,
      event: workflowEventService as any,
      externalTask: null as any, // external task store is built separately in engine factory
    };
  }

  return _cached;
}

export function resetWfRepos(): void {
  _cached = null;
}
