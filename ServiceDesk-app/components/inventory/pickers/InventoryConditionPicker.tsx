'use client';

import { cn } from '@/lib/utils';

interface ConditionOption {
  label: string;
  value: string;
  description?: string;
}

const DEFAULT_CONDITIONS: ConditionOption[] = [
  { label: 'Good', value: 'good', description: 'Item is in working condition' },
  { label: 'Damaged', value: 'damaged', description: 'Item has visible damage' },
];

interface InventoryConditionPickerProps {
  value?: string;
  onChange: (value: string) => void;
  options?: ConditionOption[];
  disabled?: boolean;
  className?: string;
}

/**
 * Radio card group for item condition selection.
 */
export function InventoryConditionPicker({
  value,
  onChange,
  options = DEFAULT_CONDITIONS,
  disabled,
  className,
}: InventoryConditionPickerProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="radiogroup"
      aria-label="Item condition"
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-start gap-0.5 rounded-lg border px-4 py-2.5 text-left transition-all min-w-[120px]',
              'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border/50',
              isSelected
                ? 'border-brand bg-brand/5 text-brand font-medium'
                : 'border-input text-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span className="text-sm">{opt.label}</span>
            {opt.description && (
              <span className="text-xs text-muted-foreground font-normal">{opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
