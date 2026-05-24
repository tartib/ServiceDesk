'use client';

import { useCallback, useMemo, useState } from 'react';
import type { InventoryFormSchema, ValidationError } from '@/components/inventory/forms/types/inventory-form.types';
import {
  validateStep,
  validateAllSteps,
  getStepValidationStatuses,
} from '@/components/inventory/forms/utils/inventoryFormValidation';

/**
 * Hook that manages step-level and form-level validation state.
 */
export function useInventoryFormValidation(schema: InventoryFormSchema) {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateCurrentStep = useCallback(
    (stepIndex: number, values: Record<string, unknown>): boolean => {
      const stepErrors = validateStep(schema, stepIndex, values);
      setErrors(stepErrors);
      return stepErrors.length === 0;
    },
    [schema],
  );

  const validateAll = useCallback(
    (values: Record<string, unknown>): boolean => {
      const allErrors = validateAllSteps(schema, values);
      setErrors(allErrors);
      return allErrors.length === 0;
    },
    [schema],
  );

  const stepStatuses = useCallback(
    (values: Record<string, unknown>) => getStepValidationStatuses(schema, values),
    [schema],
  );

  const clearErrors = useCallback(() => setErrors([]), []);

  const fieldErrors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of errors) {
      if (!map[err.field]) map[err.field] = err.message;
    }
    return map;
  }, [errors]);

  return {
    errors,
    fieldErrors,
    validateCurrentStep,
    validateAll,
    stepStatuses,
    clearErrors,
  };
}
