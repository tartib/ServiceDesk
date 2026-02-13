'use client';

/**
 * MultiSelectField Component - مكون حقل الاختيار المتعدد
 * Smart Forms System
 */

import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField, FieldOption } from '@/types/smart-forms';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectFieldProps {
  field: RenderedField;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  options?: FieldOption[];
}

export default function MultiSelectField({
  field,
  value = [],
  onChange,
  error,
  disabled,
  locale = 'en',
  options: customOptions,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const label = locale === 'ar' ? field.label_ar : field.label;
  const placeholder = locale === 'ar' ? field.placeholder_ar : field.placeholder;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const options = customOptions || field.options || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptionLabel = (option: FieldOption) => {
    return locale === 'ar' && option.label_ar ? option.label_ar : option.label;
  };

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(o => value.includes(o.value));

  return (
    <div className={cn('space-y-2', field.display?.css_class)} ref={containerRef}>
      <Label
        htmlFor={field.field_id}
        className={cn(
          'text-sm font-medium',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </Label>

      <div className="relative">
        <button
          type="button"
          id={field.field_id}
          onClick={() => !isDisabled && setOpen(!open)}
          disabled={isDisabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background text-sm',
            error && 'border-red-500',
            isDisabled && 'opacity-50 cursor-not-allowed',
            locale === 'ar' && 'text-right flex-row-reverse'
          )}
        >
          <span className="truncate">
            {selectedOptions.length > 0
              ? `${selectedOptions.length} ${locale === 'ar' ? 'محدد' : 'selected'}`
              : placeholder || (locale === 'ar' ? 'اختر...' : 'Select...')}
          </span>
          <ChevronDown className={cn('h-4 w-4 opacity-50', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  disabled={option.disabled}
                  readOnly
                  className="h-4 w-4"
                />
                {option.color && (
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }} />
                )}
                <span className={locale === 'ar' ? 'text-right flex-1' : ''}>{getOptionLabel(option)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1">
              {option.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />}
              {getOptionLabel(option)}
              <button type="button" onClick={() => handleRemove(option.value)} className="ml-1 hover:text-destructive" disabled={isDisabled}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {helpText && !error && <p className="text-sm text-muted-foreground">{helpText}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
