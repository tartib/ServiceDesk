'use client';

import { AlertCircle } from 'lucide-react';
import type { ValidationError } from './types/inventory-form.types';
import { cn } from '@/lib/utils';

interface InventoryValidationSummaryProps {
  errors: ValidationError[];
  className?: string;
  onFieldClick?: (fieldName: string) => void;
}

/**
 * Grouped error list with click-to-focus support.
 */
export function InventoryValidationSummary({
  errors,
  className,
  onFieldClick,
}: InventoryValidationSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-destructive/30 bg-destructive/5 p-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {errors.length === 1
          ? 'Please fix 1 error before continuing.'
          : `Please fix ${errors.length} errors before continuing.`}
      </div>
      <ul className="space-y-1">
        {errors.map((err) => (
          <li key={`${err.field}-${err.step ?? 0}`}>
            <button
              type="button"
              onClick={() => onFieldClick?.(err.field)}
              className="text-xs text-destructive/80 hover:text-destructive hover:underline text-left w-full"
            >
              {err.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
