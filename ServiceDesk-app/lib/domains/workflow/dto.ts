/**
 * Workflow Engine Domain — Data Transfer Objects
 *
 * Backend response shapes before normalization.
 */

// ── Definition ─────────────────────────────────────────────────

export interface WfDefinitionDTO {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  version?: number;
  status?: string;
  states?: Record<string, unknown>[];
  transitions?: Record<string, unknown>[];
  organization_id?: string;
  created_by?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Instance ───────────────────────────────────────────────────

export interface WfInstanceDTO {
  _id?: string;
  id?: string;
  definition_id?: string;
  current_state?: string;
  status?: string;
  variables?: Record<string, unknown>;
  entity_id?: string;
  entity_type?: string;
  organization_id?: string;
  started_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Event ──────────────────────────────────────────────────────

export interface WfEventDTO {
  _id?: string;
  id?: string;
  instance_id?: string;
  type?: string;
  from_state?: string;
  to_state?: string;
  actor_id?: string;
  data?: Record<string, unknown>;
  created_at?: string;
}

// ── External Task ──────────────────────────────────────────────

export interface WfExternalTaskDTO {
  _id?: string;
  id?: string;
  instance_id?: string;
  topic?: string;
  worker_id?: string;
  status?: string;
  lock_expiry?: string;
  retries?: number;
  error_message?: string;
  variables?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}
