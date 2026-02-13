'use client';

/**
 * FieldRenderer Component - مكون عرض الحقول الديناميكي
 * Smart Forms System
 * 
 * يقوم بعرض الحقل المناسب بناءً على نوعه
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { RenderedField, SmartFieldType, FieldOption, Attachment } from '@/types/smart-forms';
import TextField from './TextField';
import TextareaField from './TextareaField';
import NumberField from './NumberField';
import SelectField from './SelectField';
import MultiSelectField from './MultiSelectField';
import CheckboxField from './CheckboxField';
import RadioField from './RadioField';
import DateField from './DateField';
import FileField from './FileField';
import SignatureField from './SignatureField';

interface FieldRendererProps {
  field: RenderedField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  options?: FieldOption[];
  onFileUpload?: (files: File[]) => Promise<Attachment[]>;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  locale = 'en',
  options,
  onFileUpload,
}: FieldRendererProps) {
  // Don't render hidden fields
  if (!field.visible) {
    return null;
  }

  // Get width class based on field display settings
  const getWidthClass = () => {
    switch (field.display?.width) {
      case 'half':
        return 'md:col-span-1';
      case 'third':
        return 'md:col-span-1 lg:col-span-1';
      case 'quarter':
        return 'md:col-span-1 lg:col-span-1 xl:col-span-1';
      default:
        return 'md:col-span-2';
    }
  };

  const renderField = () => {
    switch (field.type) {
      // Text Fields
      case SmartFieldType.TEXT:
      case SmartFieldType.EMAIL:
      case SmartFieldType.PHONE:
      case SmartFieldType.URL:
      case SmartFieldType.PASSWORD:
        return (
          <TextField
            field={field}
            value={value as string}
            onChange={onChange as (v: string) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
          />
        );

      // Textarea
      case SmartFieldType.TEXTAREA:
      case SmartFieldType.RICH_TEXT:
      case SmartFieldType.MARKDOWN:
        return (
          <TextareaField
            field={field}
            value={value as string}
            onChange={onChange as (v: string) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
          />
        );

      // Number Fields
      case SmartFieldType.NUMBER:
      case SmartFieldType.DECIMAL:
        return (
          <NumberField
            field={field}
            value={value as number}
            onChange={onChange as (v: number | null) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
          />
        );

      // Select
      case SmartFieldType.SELECT:
      case SmartFieldType.USER_LOOKUP:
      case SmartFieldType.ENTITY_LOOKUP:
      case SmartFieldType.CASCADING_SELECT:
        return (
          <SelectField
            field={field}
            value={value as string}
            onChange={onChange as (v: string) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
            options={options}
          />
        );

      // Multi Select
      case SmartFieldType.MULTI_SELECT:
        return (
          <MultiSelectField
            field={field}
            value={value as string[]}
            onChange={onChange as (v: string[]) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
            options={options}
          />
        );

      // Checkbox
      case SmartFieldType.CHECKBOX:
      case SmartFieldType.TOGGLE:
        return (
          <CheckboxField
            field={field}
            value={value as string[] | boolean}
            onChange={onChange as (v: string[] | boolean) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
            options={options}
          />
        );

      // Radio
      case SmartFieldType.RADIO:
        return (
          <RadioField
            field={field}
            value={value as string}
            onChange={onChange as (v: string) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
            options={options}
          />
        );

      // Date Fields
      case SmartFieldType.DATE:
      case SmartFieldType.TIME:
      case SmartFieldType.DATETIME:
        return (
          <DateField
            field={field}
            value={value as string}
            onChange={onChange as (v: string) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
          />
        );

      // File Fields
      case SmartFieldType.FILE:
      case SmartFieldType.MULTI_FILE:
      case SmartFieldType.IMAGE:
        return (
          <FileField
            field={field}
            value={value as Attachment[]}
            onChange={onChange as (v: Attachment[]) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
            onUpload={onFileUpload}
          />
        );

      // Signature
      case SmartFieldType.SIGNATURE:
        return (
          <SignatureField
            field={field}
            value={value as string | null}
            onChange={onChange as (v: string | null) => void}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
            locale={locale}
          />
        );

      // Layout Fields
      case SmartFieldType.SECTION_HEADER:
        return (
          <div className="pt-4 pb-2">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? field.label_ar : field.label}
            </h3>
            {field.help_text && (
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? field.help_text_ar : field.help_text}
              </p>
            )}
          </div>
        );

      case SmartFieldType.DIVIDER:
        return <hr className="my-4 border-t" />;

      case SmartFieldType.INFO_BOX:
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {locale === 'ar' ? field.help_text_ar : field.help_text}
            </p>
          </div>
        );

      // Formula (read-only display)
      case SmartFieldType.FORMULA:
      case SmartFieldType.AGGREGATION:
        return (
          <div className={cn('space-y-2', field.display?.css_class)}>
            <label className="text-sm font-medium">
              {locale === 'ar' ? field.label_ar : field.label}
            </label>
            <div className="p-2 bg-muted rounded-md">
              <span className="text-lg font-semibold">
                {value !== null && value !== undefined ? String(value) : '-'}
              </span>
            </div>
          </div>
        );

      // Unsupported field type
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {locale === 'ar' 
                ? `نوع الحقل غير مدعوم: ${field.type}`
                : `Unsupported field type: ${field.type}`
              }
            </p>
          </div>
        );
    }
  };

  return (
    <div className={cn('col-span-2', getWidthClass())}>
      {renderField()}
    </div>
  );
}
