/**
 * Task Custom Field Definitions
 *
 * Shared types for project-scoped custom fields on tasks.
 * Each project can define its own set of fields; each task stores
 * values in a flexible `customFields` map validated against these
 * definitions at write time.
 */

export type TaskCustomFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'boolean'
  | 'phone'
  | 'date';

export const ALLOWED_FIELD_TYPES: readonly TaskCustomFieldType[] = [
  'text',
  'number',
  'select',
  'boolean',
  'phone',
  'date',
] as const;

export interface TaskFieldDefinition {
  /** Stable, machine-safe identifier (unique within project). */
  id: string;
  /** Human-readable display label. */
  name: string;
  /** Field data type. */
  type: TaskCustomFieldType;
  /** Whether the field is mandatory when creating/updating a task. */
  required?: boolean;
  /** Allowed values (only used when type === 'select'). */
  options?: string[];
  /** Default value applied when the field is omitted. */
  defaultValue?: unknown;
  /** Display order (lower = first). */
  position?: number;
  /** Restrict field to certain issue types; empty/omitted = all types. */
  appliesTo?: string[];
  /** Soft-deleted — hidden from new forms but values preserved on old tasks. */
  archived?: boolean;
}
