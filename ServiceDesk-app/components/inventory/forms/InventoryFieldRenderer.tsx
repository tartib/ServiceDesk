'use client';

import { Controller, type Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { InventoryFormField } from './types/inventory-form.types';
import { Minus, Plus } from 'lucide-react';
import { InventoryItemPicker } from '../pickers/InventoryItemPicker';
import { InventoryWarehousePicker } from '../pickers/InventoryWarehousePicker';
import { InventoryUserPicker } from '../pickers/InventoryUserPicker';
import { InventoryCategoryPicker } from '../pickers/InventoryCategoryPicker';
import { InventoryConditionPicker } from '../pickers/InventoryConditionPicker';
import { InventoryAttachmentUpload } from '../pickers/InventoryAttachmentUpload';

interface FieldRendererProps {
  field: InventoryFormField;
  control: Control<Record<string, unknown>>;
  error?: string;
  visible?: boolean;
  conditionallyRequired?: boolean;
}

/**
 * Renders a single form field based on its type definition.
 * Wraps each field with a label, helper text, and error message.
 */
export function InventoryFieldRenderer({
  field,
  control,
  error,
  visible = true,
  conditionallyRequired,
}: FieldRendererProps) {
  if (!visible) return null;

  const isRequired = field.required || conditionallyRequired;
  const fieldId = `inv-field-${field.name}`;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div
      className={cn(
        field.fullWidth || field.colSpan === 2 ? 'sm:col-span-2' : '',
        'space-y-1.5',
      )}
    >
      <Label htmlFor={fieldId} className="text-sm">
        {field.label}
        {isRequired && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <Controller
        name={field.name}
        control={control}
        render={({ field: rhfField }) => (
          <>
            {renderWidget(field, rhfField, fieldId, errorId, helperId, !!error)}
          </>
        )}
      />

      {field.helperText && !error && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {field.helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Widget renderer ──────────────────────────────────────────────

function renderWidget(
  field: InventoryFormField,
  rhfField: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
  },
  fieldId: string,
  errorId: string,
  helperId: string,
  hasError: boolean,
) {
  const isArabicField = field.name.endsWith('Ar');
  const ariaProps = {
    id: fieldId,
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError ? errorId : field.helperText ? helperId : undefined,
    ...(isArabicField ? { dir: 'rtl' as const } : {}),
  };

  switch (field.type) {
    // ── Text ────────────────────────────────────────────────────
    case 'text':
      return (
        <Input
          {...ariaProps}
          value={(rhfField.value as string) ?? ''}
          onChange={(e) => rhfField.onChange(e.target.value)}
          onBlur={rhfField.onBlur}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          disabled={field.readOnly}
        />
      );

    // ── Textarea ────────────────────────────────────────────────
    case 'textarea':
      return (
        <Textarea
          {...ariaProps}
          value={(rhfField.value as string) ?? ''}
          onChange={(e) => rhfField.onChange(e.target.value)}
          onBlur={rhfField.onBlur}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          rows={3}
        />
      );

    // ── Number / Currency ───────────────────────────────────────
    case 'number':
    case 'currency':
      return (
        <Input
          {...ariaProps}
          type="number"
          value={rhfField.value !== undefined ? String(rhfField.value) : ''}
          onChange={(e) => {
            const v = e.target.value;
            rhfField.onChange(v === '' ? undefined : Number(v));
          }}
          onBlur={rhfField.onBlur}
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === 'currency' ? 0.01 : 1)}
          readOnly={field.readOnly}
          disabled={field.readOnly}
          placeholder={field.placeholder}
        />
      );

    // ── Quantity (stepper) ──────────────────────────────────────
    case 'quantity':
      return <QuantityStepper field={field} rhfField={rhfField} ariaProps={ariaProps} />;

    // ── Date ────────────────────────────────────────────────────
    case 'date':
      return (
        <Input
          {...ariaProps}
          type="date"
          value={(rhfField.value as string) ?? ''}
          onChange={(e) => rhfField.onChange(e.target.value)}
          onBlur={rhfField.onBlur}
          readOnly={field.readOnly}
          disabled={field.readOnly}
        />
      );

    // ── Select ──────────────────────────────────────────────────
    case 'select':
      return (
        <Select
          value={(rhfField.value as string) ?? ''}
          onValueChange={(v) => rhfField.onChange(v)}
        >
          <SelectTrigger {...ariaProps} className="w-full">
            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    // ── Radio ───────────────────────────────────────────────────
    case 'radio':
    case 'condition-picker':
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={fieldId}>
          {field.options?.map((opt) => {
            const isSelected = rhfField.value === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => rhfField.onChange(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition-all',
                  'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border/50',
                  isSelected
                    ? 'border-brand bg-brand/5 text-brand font-medium'
                    : 'border-input text-foreground',
                )}
              >
                <span>{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-muted-foreground font-normal">{opt.description}</span>
                )}
              </button>
            );
          })}
        </div>
      );

    // ── Checkbox ────────────────────────────────────────────────
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...ariaProps}
            type="checkbox"
            checked={!!rhfField.value}
            onChange={(e) => rhfField.onChange(e.target.checked)}
            className="rounded border-input h-4 w-4 text-brand focus:ring-brand-border/50"
          />
          <span className="text-sm text-foreground">{field.placeholder || field.label}</span>
        </label>
      );

    // ── Item picker ──────────────────────────────────────────────
    case 'item-picker':
    case 'asset-search':
      return (
        <InventoryItemPicker
          value={(rhfField.value as string) ?? ''}
          onChange={(val) => rhfField.onChange(val)}
          placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
          disabled={field.readOnly}
        />
      );

    // ── Warehouse picker ────────────────────────────────────────
    case 'warehouse-picker':
    case 'location-picker':
      return (
        <InventoryWarehousePicker
          value={(rhfField.value as string) ?? ''}
          onChange={(val) => rhfField.onChange(val)}
          placeholder={field.placeholder || 'Select warehouse...'}
          disabled={field.readOnly}
        />
      );

    // ── User picker ─────────────────────────────────────────────
    case 'user-picker':
      return (
        <InventoryUserPicker
          value={(rhfField.value as string) ?? ''}
          onChange={(val) => rhfField.onChange(val)}
          placeholder={field.placeholder || 'Select user...'}
          disabled={field.readOnly}
        />
      );

    // ── Category picker ─────────────────────────────────────────
    case 'category-picker':
      return (
        <InventoryCategoryPicker
          value={(rhfField.value as string) ?? ''}
          onChange={(val) => rhfField.onChange(val)}
          placeholder={field.placeholder || 'Select category...'}
          disabled={field.readOnly}
        />
      );

    // ── Attachment upload ────────────────────────────────────────
    case 'attachment-upload':
      return (
        <InventoryAttachmentUpload
          value={rhfField.value as string | string[]}
          onChange={(val) => rhfField.onChange(val)}
          accept={field.accept}
          maxFiles={field.maxFiles}
          disabled={field.readOnly}
          helperText={field.helperText}
        />
      );

    // ── Multi-select placeholder ────────────────────────────────
    case 'multi-select':
      return (
        <Select
          value={(rhfField.value as string) ?? ''}
          onValueChange={(v) => rhfField.onChange(v)}
        >
          <SelectTrigger {...ariaProps} className="w-full">
            <SelectValue placeholder={field.placeholder || `Select...`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return (
        <Input
          {...ariaProps}
          value={(rhfField.value as string) ?? ''}
          onChange={(e) => rhfField.onChange(e.target.value)}
          onBlur={rhfField.onBlur}
          placeholder={field.placeholder}
        />
      );
  }
}

// ── Quantity Stepper ──────────────────────────────────────────────

function QuantityStepper({
  field,
  rhfField,
  ariaProps,
}: {
  field: InventoryFormField;
  rhfField: { value: unknown; onChange: (v: unknown) => void; onBlur: () => void };
  ariaProps: Record<string, unknown>;
}) {
  const value = typeof rhfField.value === 'number' ? rhfField.value : 0;
  const minVal = field.min ?? 0;
  const maxVal = field.max ?? 99999;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => rhfField.onChange(Math.max(minVal, value - 1))}
        disabled={value <= minVal || field.readOnly}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-30"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>
      <Input
        {...ariaProps}
        type="number"
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value;
          const n = v === '' ? minVal : Math.min(maxVal, Math.max(minVal, Number(v)));
          rhfField.onChange(n);
        }}
        onBlur={rhfField.onBlur}
        className="w-20 text-center"
        min={minVal}
        max={maxVal}
        readOnly={field.readOnly}
      />
      <button
        type="button"
        onClick={() => rhfField.onChange(Math.min(maxVal, value + 1))}
        disabled={value >= maxVal || field.readOnly}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted disabled:opacity-30"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
