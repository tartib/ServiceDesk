/**
 * Dynamic validator for task custom fields.
 *
 * Given a project's field definitions and a task's submitted custom field
 * values, this function validates every value, rejects unknown / archived
 * keys, enforces required fields, and normalises the output.
 */

import type { TaskFieldDefinition, TaskCustomFieldType } from '../domain/task-field-definition';
import { ALLOWED_FIELD_TYPES } from '../domain/task-field-definition';

export interface ValidateCustomFieldsInput {
  /** Project-level field definitions. */
  definitions: TaskFieldDefinition[];
  /** Submitted custom field values (key → value). */
  values: Record<string, unknown>;
  /** Task issue type — used for `appliesTo` filtering. */
  issueType?: string;
  /** If true, skip required-field enforcement (useful for partial updates). */
  isPartialUpdate?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidateCustomFieldsResult {
  valid: boolean;
  errors: ValidationError[];
  /** Cleaned values with defaults applied (only meaningful when valid). */
  sanitized: Record<string, unknown>;
}

// ── Helpers ─────────────────────────────────────────────────────

function isValidDate(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function validateValue(
  def: TaskFieldDefinition,
  value: unknown,
): string | null {
  // Allow null / undefined for optional fields (required check is separate)
  if (value === null || value === undefined || value === '') return null;

  switch (def.type) {
    case 'text':
      if (typeof value !== 'string') return `"${def.name}" must be a string`;
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return `"${def.name}" must be a number`;
      break;
    case 'boolean':
      if (typeof value !== 'boolean') return `"${def.name}" must be a boolean`;
      break;
    case 'phone':
      if (typeof value !== 'string') return `"${def.name}" must be a string (phone)`;
      break;
    case 'date':
      if (!isValidDate(value)) return `"${def.name}" must be a valid date string`;
      break;
    case 'select':
      if (typeof value !== 'string') return `"${def.name}" must be a string`;
      if (!def.options || !def.options.includes(value)) {
        return `"${def.name}" must be one of: ${(def.options || []).join(', ')}`;
      }
      break;
    default:
      return `"${def.name}" has unsupported type "${def.type}"`;
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────

export function validateTaskCustomFields(
  input: ValidateCustomFieldsInput,
): ValidateCustomFieldsResult {
  const { definitions, values, issueType, isPartialUpdate } = input;
  const errors: ValidationError[] = [];
  const sanitized: Record<string, unknown> = {};

  // Build lookup of active definitions applicable to this issue type
  const defMap = new Map<string, TaskFieldDefinition>();
  for (const def of definitions) {
    // Skip archived definitions for new writes
    if (def.archived) continue;
    // Filter by appliesTo
    if (
      def.appliesTo &&
      def.appliesTo.length > 0 &&
      issueType &&
      !def.appliesTo.includes(issueType)
    ) {
      continue;
    }
    defMap.set(def.id, def);
  }

  // 1. Reject unknown keys
  for (const key of Object.keys(values)) {
    if (!defMap.has(key)) {
      // Also check if it's an archived field (allow reading but not writing)
      const isArchived = definitions.some(d => d.id === key && d.archived);
      if (isArchived) {
        errors.push({ field: key, message: `Field "${key}" is archived and cannot be set` });
      } else {
        errors.push({ field: key, message: `Unknown custom field "${key}"` });
      }
    }
  }

  // 2. Validate each definition
  for (const [id, def] of defMap) {
    let value = values[id];

    // Apply default if value not provided
    if ((value === undefined || value === null || value === '') && def.defaultValue !== undefined) {
      value = def.defaultValue;
    }

    const isEmpty = value === undefined || value === null || value === '';

    // Required check
    if (def.required && isEmpty && !isPartialUpdate) {
      errors.push({ field: id, message: `"${def.name}" is required` });
      continue;
    }

    // Skip if truly empty (optional)
    if (isEmpty) {
      // Don't include empty optional fields in sanitized output
      continue;
    }

    // Type validation
    const typeError = validateValue(def, value);
    if (typeError) {
      errors.push({ field: id, message: typeError });
      continue;
    }

    sanitized[id] = value;
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
