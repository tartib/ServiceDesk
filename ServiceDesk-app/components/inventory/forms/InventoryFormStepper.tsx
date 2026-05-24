'use client';

import { Check, AlertCircle } from 'lucide-react';
import type { InventoryFormStep } from './types/inventory-form.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface StepStatus {
  step: InventoryFormStep;
  isValid: boolean;
  errorCount: number;
}

interface InventoryFormStepperProps {
  steps: InventoryFormStep[];
  currentStep: number;
  stepStatuses?: StepStatus[];
  reviewRequired?: boolean;
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Step progress indicator with validation badges.
 * Shows step number, title, and validation state.
 */
export function InventoryFormStepper({
  steps,
  currentStep,
  stepStatuses,
  reviewRequired,
  onStepClick,
  className,
}: InventoryFormStepperProps) {
  const { t } = useLanguage();
  const allSteps = [
    ...steps.map((s) => ({ id: s.id, title: s.title })),
    ...(reviewRequired ? [{ id: 'review', title: t('inventory.forms.steps.review') }] : []),
  ];

  return (
    <nav aria-label="Form steps" className={cn('flex flex-wrap items-center gap-1', className)}>
      {allSteps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isCompleted = index < currentStep;
        const status = stepStatuses?.[index];
        const hasErrors = status && !status.isValid && status.errorCount > 0;
        const isReview = step.id === 'review';

        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 && (
              <div
                className={cn(
                  'hidden sm:block h-px w-4 mx-0.5',
                  isCompleted ? 'bg-brand' : 'bg-border',
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border/50',
                isCurrent && 'bg-brand/10 text-brand font-medium',
                isCompleted && !hasErrors && 'text-brand/70',
                isCompleted && hasErrors && 'text-destructive',
                !isCurrent && !isCompleted && 'text-muted-foreground',
                onStepClick && 'cursor-pointer hover:bg-accent',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0',
                  isCurrent && 'bg-brand text-brand-foreground',
                  isCompleted && !hasErrors && 'bg-brand/20 text-brand',
                  isCompleted && hasErrors && 'bg-destructive/20 text-destructive',
                  !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted && !hasErrors ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCompleted && hasErrors ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : isReview ? (
                  '✓'
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline truncate max-w-32">{step.title}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
