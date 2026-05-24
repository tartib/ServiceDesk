'use client';

import { Pencil } from 'lucide-react';
import type { InventoryFormSchema, InventoryFormField } from './types/inventory-form.types';
import { getAllFields } from './utils/inventoryFormDefaults';
import { evaluateRules } from './utils/inventoryFormVisibilityRules';
import { cn } from '@/lib/utils';

interface InventoryFormReviewProps {
  schema: InventoryFormSchema;
  values: Record<string, unknown>;
  onEditStep?: (stepIndex: number) => void;
  className?: string;
}

/**
 * Human-readable, section-by-section review of all form data before submit.
 */
export function InventoryFormReview({
  schema,
  values,
  onEditStep,
  className,
}: InventoryFormReviewProps) {
  const renderFieldValue = (field: InventoryFormField, value: unknown): string => {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');

    // Resolve label from options
    if (field.options) {
      const option = field.options.find((o) => o.value === value);
      if (option) return option.label;
    }

    return String(value);
  };

  // Group by steps or render flat
  const sections = schema.steps
    ? schema.steps.map((step, index) => ({
        title: step.title,
        stepIndex: index,
        fields: step.fields,
      }))
    : [
        {
          title: schema.title,
          stepIndex: 0,
          fields: getAllFields(schema),
        },
      ];

  return (
    <div className={cn('space-y-5', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Review your submission</h3>
        <p className="text-sm text-muted-foreground">
          Please review the details below before submitting.
        </p>
      </div>

      {sections.map((section) => {
        const visibleFields = section.fields.filter((field) =>
          evaluateRules(field.visibleWhen, values),
        );

        if (visibleFields.length === 0) return null;

        return (
          <div
            key={section.title}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(section.stepIndex)}
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleFields.map((field) => {
                const value = values[field.name];
                const displayValue = renderFieldValue(field, value);

                // Skip empty optional fields
                if (!field.required && displayValue === '—') return null;

                return (
                  <div key={field.name} className={cn(field.fullWidth && 'sm:col-span-2')}>
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="text-sm text-foreground mt-0.5">{displayValue}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
