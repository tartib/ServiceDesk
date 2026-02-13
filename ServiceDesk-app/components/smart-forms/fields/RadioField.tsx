'use client';

/**
 * RadioField Component - مكون حقل الاختيار الفردي (Radio)
 * Smart Forms System
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField, FieldOption } from '@/types/smart-forms';

interface RadioFieldProps {
  field: RenderedField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  options?: FieldOption[];
}

export default function RadioField({
  field,
  value,
  onChange,
  error,
  disabled,
  locale = 'en',
  options: customOptions,
}: RadioFieldProps) {
  const label = locale === 'ar' ? field.label_ar : field.label;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const options = customOptions || field.options || [];

  const getOptionLabel = (option: FieldOption) => {
    return locale === 'ar' && option.label_ar ? option.label_ar : option.label;
  };

  return (
    <div className={cn('space-y-2', field.display?.css_class)}>
      <Label
        className={cn(
          'text-sm font-medium',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </Label>

      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              id={`${field.field_id}-${option.value}`}
              name={field.field_id}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={isDisabled || option.disabled}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
            />
            <Label
              htmlFor={`${field.field_id}-${option.value}`}
              className="text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {option.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {getOptionLabel(option)}
              </span>
            </Label>
          </div>
        ))}
      </div>

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
