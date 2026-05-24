'use client';

import { useMemo } from 'react';
import type { InventoryFormField } from '@/components/inventory/forms/types/inventory-form.types';
import { evaluateRules } from '@/components/inventory/forms/utils/inventoryFormVisibilityRules';

interface ConditionalFieldState {
  visible: boolean;
  required: boolean;
}

/**
 * For a given list of field definitions and current form values,
 * returns a map of field name → { visible, required }.
 */
export function useInventoryConditionalFields(
  fields: InventoryFormField[],
  values: Record<string, unknown>,
): Record<string, ConditionalFieldState> {
  return useMemo(() => {
    const result: Record<string, ConditionalFieldState> = {};

    for (const field of fields) {
      const visible = evaluateRules(field.visibleWhen, values);
      const required =
        visible &&
        (!!field.required ||
          (!!field.requiredWhen && field.requiredWhen.length > 0 && evaluateRules(field.requiredWhen, values)));
      result[field.name] = { visible, required };
    }

    return result;
  }, [fields, values]);
}
