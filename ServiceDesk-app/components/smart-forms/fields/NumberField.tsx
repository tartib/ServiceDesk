'use client';

/**
 * NumberField Component - مكون حقل الأرقام
 * Smart Forms System
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField } from '@/types/smart-forms';

interface NumberFieldProps {
  field: RenderedField;
  value: number | string;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
}

export default function NumberField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  locale = 'en',
}: NumberFieldProps) {
  const label = locale === 'ar' ? field.label_ar : field.label;
  const placeholder = locale === 'ar' ? field.placeholder_ar : field.placeholder;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const isReadonly = field.state?.readonly || field.display?.readonly;
  const isDecimal = field.type === 'decimal';
  const step = isDecimal ? (field.settings?.decimal_places ? Math.pow(10, -(field.settings.decimal_places as number)) : 0.01) : 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
    } else {
      const num = isDecimal ? parseFloat(val) : parseInt(val, 10);
      onChange(isNaN(num) ? null : num);
    }
  };

  return (
    <div className={cn('space-y-2', field.display?.css_class)}>
      <Label
        htmlFor={field.field_id}
        className={cn(
          'text-sm font-medium',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </Label>

      <Input
        id={field.field_id}
        name={field.field_id}
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadonly}
        step={step}
        min={field.validation?.min}
        max={field.validation?.max}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          locale === 'ar' && 'text-right'
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      />

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
