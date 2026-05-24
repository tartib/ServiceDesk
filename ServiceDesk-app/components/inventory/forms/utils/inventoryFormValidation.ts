import type { InventoryFormSchema, InventoryFormStep, ValidationError } from '../types/inventory-form.types';
import { getAllFields } from './inventoryFormDefaults';
import { evaluateRules } from './inventoryFormVisibilityRules';

/**
 * Get the fields for a specific step index.
 * Falls back to all fields if the schema has no steps.
 */
export function getStepFields(schema: InventoryFormSchema, stepIndex: number) {
  if (schema.steps && schema.steps[stepIndex]) {
    return schema.steps[stepIndex].fields;
  }
  return getAllFields(schema);
}

/**
 * Check whether a specific step passes validation.
 * Uses the Zod schema to validate only the fields in that step.
 * Returns an array of validation errors (empty = valid).
 */
export function validateStep(
  schema: InventoryFormSchema,
  stepIndex: number,
  values: Record<string, unknown>,
): ValidationError[] {
  const fields = getStepFields(schema, stepIndex);
  const errors: ValidationError[] = [];

  for (const field of fields) {
    // Skip invisible fields
    if (!evaluateRules(field.visibleWhen, values)) continue;

    const value = values[field.name];
    const isConditionallyRequired =
      field.required || evaluateRules(field.requiredWhen, values);

    if (isConditionallyRequired) {
      if (value === undefined || value === null || value === '') {
        errors.push({
          field: field.name,
          message: `${field.label} is required.`,
          step: stepIndex,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate all steps. Returns combined error list.
 */
export function validateAllSteps(
  schema: InventoryFormSchema,
  values: Record<string, unknown>,
): ValidationError[] {
  if (!schema.steps) {
    return validateStep(schema, 0, values);
  }
  return schema.steps.flatMap((_, i) => validateStep(schema, i, values));
}

/**
 * Get the list of steps with their validation status.
 */
export function getStepValidationStatuses(
  schema: InventoryFormSchema,
  values: Record<string, unknown>,
): Array<{ step: InventoryFormStep; isValid: boolean; errorCount: number }> {
  if (!schema.steps) return [];
  return schema.steps.map((step, i) => {
    const errors = validateStep(schema, i, values);
    return { step, isValid: errors.length === 0, errorCount: errors.length };
  });
}
