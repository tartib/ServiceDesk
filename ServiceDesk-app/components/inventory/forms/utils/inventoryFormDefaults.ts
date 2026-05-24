import type { InventoryFormField, InventoryFormSchema } from '../types/inventory-form.types';

/**
 * Collect all fields from a schema (flattened from steps or top-level fields).
 */
export function getAllFields(schema: InventoryFormSchema): InventoryFormField[] {
  if (schema.steps) {
    return schema.steps.flatMap((step) => step.fields);
  }
  return schema.fields ?? [];
}

/**
 * Build a default-values object from a schema's field definitions.
 * Field-level `defaultValue` takes precedence over type-level defaults.
 */
export function buildDefaults(schema: InventoryFormSchema): Record<string, unknown> {
  const fields = getAllFields(schema);
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
      continue;
    }

    // Type-based fallback defaults
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'date':
      case 'select':
      case 'asset-search':
      case 'item-picker':
      case 'user-picker':
      case 'location-picker':
      case 'warehouse-picker':
      case 'category-picker':
      case 'attachment-upload':
        defaults[field.name] = '';
        break;
      case 'number':
      case 'quantity':
      case 'currency':
        defaults[field.name] = field.min ?? 0;
        break;
      case 'checkbox':
        defaults[field.name] = false;
        break;
      case 'multi-select':
        defaults[field.name] = [];
        break;
      case 'radio':
      case 'condition-picker':
        defaults[field.name] = field.options?.[0]?.value ?? '';
        break;
      default:
        defaults[field.name] = '';
    }
  }

  return defaults;
}

/**
 * Merge user-provided context (e.g. from auth store) into defaults.
 * Only sets values for keys that already exist as empty strings.
 */
export function applyAutoFill(
  defaults: Record<string, unknown>,
  autoFillValues: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(autoFillValues)) {
    if (key in result && (result[key] === '' || result[key] === undefined)) {
      result[key] = value;
    }
  }
  return result;
}
