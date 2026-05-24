'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UseInventoryFormReturn } from '@/hooks/inventory/useInventoryForm';
import { useInventoryConditionalFields } from '@/hooks/inventory/useInventoryConditionalFields';
import { InventoryFormStepper } from './InventoryFormStepper';
import { InventoryFormLayout } from './InventoryFormLayout';
import { InventoryFormReview } from './InventoryFormReview';
import { InventoryFieldRenderer } from './InventoryFieldRenderer';
import { InventoryAdvancedSection } from './InventoryAdvancedSection';
import { InventoryAutosaveIndicator } from './InventoryAutosaveIndicator';
import { InventoryValidationSummary } from './InventoryValidationSummary';
import type { InventoryFormField } from './types/inventory-form.types';

interface DynamicInventoryFormProps {
  formState: UseInventoryFormReturn;
  className?: string;
}

/**
 * Master form renderer: takes a UseInventoryFormReturn from the `useInventoryForm`
 * hook and renders steps, fields, validation, review, and navigation.
 */
export function DynamicInventoryForm({ formState, className }: DynamicInventoryFormProps) {
  const { t } = useLanguage();
  const {
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
  } = formState;

  const values = form.watch();

  // Autosave on value change
  useEffect(() => {
    if (schema.autosave) {
      autosave.saveDraft(values as Record<string, unknown>, currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, currentStep]);

  // Get current step's fields
  const hasSteps = !!schema.steps && schema.steps.length > 0;
  const currentStepDef = hasSteps ? schema.steps![currentStep] : null;
  const currentFields: InventoryFormField[] = isReviewStep
    ? []
    : currentStepDef
      ? currentStepDef.fields
      : schema.fields ?? [];

  // Split into normal and advanced fields
  const normalFields = currentFields.filter((f) => !f.advanced);
  const advancedFields = currentFields.filter((f) => f.advanced);

  // Conditional field states
  const fieldStates = useInventoryConditionalFields(
    currentFields,
    values as Record<string, unknown>,
  );

  // Step validation statuses for stepper
  const stepStatuses = hasSteps
    ? validation.stepStatuses(values as Record<string, unknown>)
    : [];

  const focusField = (fieldName: string) => {
    const el = document.getElementById(`inv-field-${fieldName}`);
    el?.focus();
  };

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{schema.title}</h2>
          {schema.autosave && <InventoryAutosaveIndicator status={autosave.status} />}
        </div>
        {schema.description && (
          <p className="text-sm text-muted-foreground">{schema.description}</p>
        )}
      </div>

      {/* ── Stepper ───────────────────────────────────────────────── */}
      {hasSteps && totalSteps > 1 && (
        <InventoryFormStepper
          steps={schema.steps!}
          currentStep={currentStep}
          stepStatuses={stepStatuses}
          reviewRequired={schema.reviewRequired}
          onStepClick={goToStep}
        />
      )}

      {/* ── Step title ────────────────────────────────────────────── */}
      {currentStepDef && !isReviewStep && (
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-foreground">
            {currentStepDef.title}
          </h3>
          {currentStepDef.description && (
            <p className="text-xs text-muted-foreground">{currentStepDef.description}</p>
          )}
        </div>
      )}

      {/* ── Validation errors ─────────────────────────────────────── */}
      <InventoryValidationSummary
        errors={validation.errors}
        onFieldClick={focusField}
      />

      {/* ── Review step ───────────────────────────────────────────── */}
      {isReviewStep && (
        <InventoryFormReview
          schema={schema}
          values={values as Record<string, unknown>}
          onEditStep={goToStep}
        />
      )}

      {/* ── Fields ────────────────────────────────────────────────── */}
      {!isReviewStep && (
        <InventoryFormLayout>
          {normalFields.map((field) => (
            <InventoryFieldRenderer
              key={field.name}
              field={field}
              control={form.control}
              error={validation.fieldErrors[field.name]}
              visible={fieldStates[field.name]?.visible ?? true}
              conditionallyRequired={fieldStates[field.name]?.required}
            />
          ))}

          {advancedFields.length > 0 && (
            <InventoryAdvancedSection>
              {advancedFields.map((field) => (
                <InventoryFieldRenderer
                  key={field.name}
                  field={field}
                  control={form.control}
                  error={validation.fieldErrors[field.name]}
                  visible={fieldStates[field.name]?.visible ?? true}
                  conditionallyRequired={fieldStates[field.name]?.required}
                />
              ))}
            </InventoryAdvancedSection>
          )}
        </InventoryFormLayout>
      )}

      {/* ── Navigation ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div>
          {!isFirstStep && (
            <Button type="button" variant="outline" size="sm" onClick={goPrev}>
              <ArrowLeft className="w-4 h-4" />
              {t('inventory.actions.back')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Step counter */}
          {totalSteps > 1 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentStep + 1} / {totalSteps}
            </span>
          )}

          {isReviewStep || (totalSteps === 1 && !schema.reviewRequired) ? (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {schema.submitLabel || t('inventory.actions.submit')}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => goNext()}>
              {t('inventory.actions.next')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
