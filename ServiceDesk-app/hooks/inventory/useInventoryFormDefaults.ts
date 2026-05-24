'use client';

import { useMemo } from 'react';
import type { InventoryFormSchema } from '@/components/inventory/forms/types/inventory-form.types';
import { buildDefaults, applyAutoFill } from '@/components/inventory/forms/utils/inventoryFormDefaults';

/**
 * Auto-fill context that can be derived from the auth store or other sources.
 */
export interface AutoFillContext {
  userId?: string;
  userName?: string;
  department?: string;
  email?: string;
  defaultWarehouseId?: string;
  defaultLocationId?: string;
}

/**
 * Build default form values for a given schema, with optional auto-fill
 * from user context and explicit overrides.
 */
export function useInventoryFormDefaults(
  schema: InventoryFormSchema,
  autoFill?: AutoFillContext,
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return useMemo(() => {
    let defaults = buildDefaults(schema);

    if (autoFill) {
      const fillMap: Record<string, unknown> = {};
      if (autoFill.defaultWarehouseId) fillMap.warehouseId = autoFill.defaultWarehouseId;
      if (autoFill.defaultWarehouseId) fillMap.sourceWarehouseId = autoFill.defaultWarehouseId;
      if (autoFill.defaultLocationId) fillMap.deliveryLocationId = autoFill.defaultLocationId;
      defaults = applyAutoFill(defaults, fillMap);
    }

    if (overrides) {
      defaults = { ...defaults, ...overrides };
    }

    return defaults;
  }, [schema, autoFill, overrides]);
}
