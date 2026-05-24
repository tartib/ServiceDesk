import type { FieldVisibilityRule } from '../types/inventory-form.types';

/**
 * Evaluate a single visibility / requiredness rule against current form values.
 */
export function evaluateRule(rule: FieldVisibilityRule, values: Record<string, unknown>): boolean {
  const fieldValue = values[rule.field];

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value;
    case 'neq':
      return fieldValue !== rule.value;
    case 'in':
      return Array.isArray(rule.value) && (rule.value as unknown[]).includes(fieldValue);
    case 'notIn':
      return Array.isArray(rule.value) && !(rule.value as unknown[]).includes(fieldValue);
    case 'gt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue > rule.value;
    case 'lt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue < rule.value;
    case 'gte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue >= rule.value;
    case 'lte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue <= rule.value;
    case 'truthy':
      return !!fieldValue;
    case 'falsy':
      return !fieldValue;
    default:
      return true;
  }
}

/**
 * Evaluate ALL rules (AND logic). Returns true if every rule passes.
 */
export function evaluateRules(rules: FieldVisibilityRule[] | undefined, values: Record<string, unknown>): boolean {
  if (!rules || rules.length === 0) return true;
  return rules.every((rule) => evaluateRule(rule, values));
}
