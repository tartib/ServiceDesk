'use client';

/**
 * TextareaField Component - مكون حقل النص الطويل
 * Smart Forms System
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField } from '@/types/smart-forms';

interface TextareaFieldProps {
  field: RenderedField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
}

export default function TextareaField({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  locale = 'en',
}: TextareaFieldProps) {
  const label = locale === 'ar' ? field.label_ar : field.label;
  const placeholder = locale === 'ar' ? field.placeholder_ar : field.placeholder;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const isReadonly = field.state?.readonly || field.display?.readonly;
  const rows = (field.settings?.rows as number) || 4;

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

      <Textarea
        id={field.field_id}
        name={field.field_id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={isReadonly}
        rows={rows}
        className={cn(
          'resize-y',
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

      {field.validation?.max_length && (
        <p className="text-xs text-muted-foreground text-left">
          {value?.length || 0} / {field.validation.max_length}
        </p>
      )}
    </div>
  );
}
