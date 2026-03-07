/**
 * Workflow Engine Domain Interfaces
 *
 * Pure domain entity interfaces — decoupled from Mongoose.
 * The engine/ directory IS the domain logic for this module.
 */

// Re-export engine interfaces (they are already database-agnostic)
export type {
  IWFEventStore,
  IWFInstanceStore,
  IWFDefinitionStore,
  IGenericWorkflowEngineOptions,
} from '../engine/GenericWorkflowEngine';

export type {
  IWFNotificationService,
  IWFWebhookService,
  IWFEntityService,
} from '../engine/ActionExecutor';

// ── Workflow Definition Domain Entity ────────────────────────

export interface IWorkflowDefinitionEntity {
  _id?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  version: number;
  status: 'draft' | 'published' | 'deprecated' | 'archived';
  entityType?: string;
  states: Record<string, any>;
  transitions: Record<string, any>;
  initialState: string;
  metadata?: Record<string, any>;
  createdBy: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Workflow Instance Domain Entity ──────────────────────────

export interface IWorkflowInstanceEntity {
  _id?: string;
  definitionId: string;
  definitionVersion: number;
  entityType?: string;
  entityId?: string;
  currentState: string;
  previousState?: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended' | 'error';
  variables: Record<string, any>;
  stateHistory: {
    state: string;
    enteredAt: Date;
    exitedAt?: Date;
    transition?: string;
    actorId?: string;
  }[];
  startedBy: string;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Workflow Event Domain Entity ─────────────────────────────

export interface IWorkflowEventEntity {
  _id?: string;
  instanceId: string;
  eventType: string;
  fromState?: string;
  toState?: string;
  transition?: string;
  actorId?: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// ── External Task Domain Entity ──────────────────────────────

export interface IExternalTaskEntity {
  _id?: string;
  instanceId: string;
  topic: string;
  status: 'available' | 'locked' | 'completed' | 'failed' | 'cancelled';
  workerId?: string;
  lockExpiresAt?: Date;
  variables?: Record<string, any>;
  resultVariables?: Record<string, any>;
  priority: number;
  retriesLeft: number;
  errorMessage?: string;
  createdAt?: Date;
}
