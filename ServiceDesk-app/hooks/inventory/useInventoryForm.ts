'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { InventoryFormSchema } from '@/components/inventory/forms/types/inventory-form.types';
import { useInventoryFormDefaults, type AutoFillContext } from './useInventoryFormDefaults';
import { useInventoryFormValidation } from './useInventoryFormValidation';
import { useInventoryFormAutosave } from './useInventoryFormAutosave';

export interface UseInventoryFormOptions {
  schema: InventoryFormSchema;
  autoFill?: AutoFillContext;
  overrides?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
}

export interface UseInventoryFormReturn {
  form: UseFormReturn<Record<string, unknown>>;
  schema: InventoryFormSchema;

  // Step navigation
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isReviewStep: boolean;
  goNext: () => boolean;
  goPrev: () => void;
  goToStep: (step: number) => void;

  // Validation
  validation: ReturnType<typeof useInventoryFormValidation>;

  // Autosave
  autosave: ReturnType<typeof useInventoryFormAutosave>;

  // Submit
  handleSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Master hook that composes react-hook-form + zod + step navigation +
 * validation + autosave for any inventory form schema.
 */
export function useInventoryForm(options: UseInventoryFormOptions): UseInventoryFormReturn {
  const { schema, autoFill, overrides, onSubmit } = options;

  // ── Defaults ────────────────────────────────────────────────────
  const defaults = useInventoryFormDefaults(schema, autoFill, overrides);

  // ── React-hook-form ─────────────────────────────────────────────
  const form = useForm<Record<string, unknown>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: schema.zodSchema ? (zodResolver(schema.zodSchema as any) as any) : undefined,
    defaultValues: defaults,
    mode: 'onBlur',
  });

  // ── Reset on schema / overrides change ────────────────────────
  useEffect(() => {
    form.reset(defaults);
    setCurrentStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults]);

  // ── Step navigation ─────────────────────────────────────────────
  const hasSteps = !!schema.steps && schema.steps.length > 0;
  const reviewOffset = schema.reviewRequired ? 1 : 0;
  const totalSteps = hasSteps ? schema.steps!.length + reviewOffset : 1 + reviewOffset;

  const [currentStep, setCurrentStep] = useState(0);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isReviewStep = !!(schema.reviewRequired && currentStep === totalSteps - 1);

  // ── Validation ──────────────────────────────────────────────────
  const validation = useInventoryFormValidation(schema);

  // ── Autosave ────────────────────────────────────────────────────
  const autosave = useInventoryFormAutosave({
    formType: schema.id,
    enabled: !!schema.autosave,
  });

  // ── Navigation ──────────────────────────────────────────────────
  const goNext = useCallback((): boolean => {
    const values = form.getValues();

    // Validate current step
    if (!isReviewStep) {
      const valid = validation.validateCurrentStep(currentStep, values);
      if (!valid) return false;
    }

    if (!isLastStep) {
      const next = currentStep + 1;
      setCurrentStep(next);

      // Autosave on step change
      if (schema.autosave) {
        autosave.saveDraft(values, next);
      }
    }

    return true;
  }, [currentStep, isLastStep, isReviewStep, form, validation, schema.autosave, autosave]);

  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  }, [isFirstStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps],
  );

  // ── Submit ──────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    const values = form.getValues();
    const valid = validation.validateAll(values);
    if (!valid) return;

    setIsSubmitting(true);
    Promise.resolve(onSubmit(values))
      .then(() => {
        autosave.discardDraft();
      })
      .catch(() => {
        // error handling is done by the caller's onSubmit
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [form, validation, onSubmit, autosave]);

  return {
    form,
    schema,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    isReviewStep,
    goNext,
    goPrev,
    goToStep,
    validation,
    autosave,
    handleSubmit,
    isSubmitting,
  };
}
