'use client';

/**
 * TextField Component - مكون حقل النص
 * Smart Forms System
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField } from '@/types/smart-forms';

interface TextFieldProps {
  field: RenderedField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
}

export default function TextField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  locale = 'en',
}: TextFieldProps) {
  const label = locale === 'ar' ? field.label_ar : field.label;
  const placeholder = locale === 'ar' ? field.placeholder_ar : field.placeholder;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const isReadonly = field.state?.readonly || field.display?.readonly;

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
        type={field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadonly}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          locale === 'ar' && 'text-right'
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        maxLength={field.validation?.max_length}
        minLength={field.validation?.min_length}
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
