'use client';

/**
 * SelectField Component - مكون حقل الاختيار
 * Smart Forms System
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField, FieldOption } from '@/types/smart-forms';

interface SelectFieldProps {
  field: RenderedField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  options?: FieldOption[];
}

export default function SelectField({
  field,
  value,
  onChange,
  error,
  disabled,
  locale = 'en',
  options: customOptions,
}: SelectFieldProps) {
  const label = locale === 'ar' ? field.label_ar : field.label;
  const placeholder = locale === 'ar' ? field.placeholder_ar : field.placeholder;
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
        htmlFor={field.field_id}
        className={cn(
          'text-sm font-medium',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </Label>

      <Select
        value={value || ''}
        onValueChange={onChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          id={field.field_id}
          className={cn(
            error && 'border-red-500 focus:ring-red-500',
            locale === 'ar' && 'text-right'
          )}
        >
          <SelectValue placeholder={placeholder || (locale === 'ar' ? 'اختر...' : 'Select...')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={locale === 'ar' ? 'text-right' : ''}
            >
              <div className="flex items-center gap-2">
                {option.icon && <span>{option.icon}</span>}
                {option.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{getOptionLabel(option)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
