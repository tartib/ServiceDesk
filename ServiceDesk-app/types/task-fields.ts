/**
 * Task Custom Field types — shared across hooks and components.
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
  id: string;
  name: string;
  type: TaskCustomFieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
  position?: number;
  appliesTo?: string[];
  archived?: boolean;
}
