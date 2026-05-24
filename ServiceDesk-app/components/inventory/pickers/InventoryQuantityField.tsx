'use client';

import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InventoryQuantityFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Stepper (–/+) for quantities ≤ 20, free input for larger.
 * Enforces min/max constraints.
 */
export function InventoryQuantityField({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  disabled,
  className,
}: InventoryQuantityFieldProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-30 transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>

      <Input
        type="number"
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onChange(min);
            return;
          }
          const n = Number(v);
          if (!isNaN(n)) {
            onChange(Math.min(max, Math.max(min, n)));
          }
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-20 text-center tabular-nums"
      />

      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-30 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
