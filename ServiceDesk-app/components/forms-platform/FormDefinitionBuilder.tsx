'use client';

/**
 * FormDefinitionBuilder — Public Platform Shell
 *
 * The single canonical entry point for form building across the platform.
 * Service catalog, ITSM, HR, and other solution modules must use this
 * component instead of importing smart-forms builder internals directly.
 *
 * Architecture rule (ADR 001, Phase 1):
 *   ALLOWED:   import FormDefinitionBuilder from '@/components/forms-platform/FormDefinitionBuilder'
 *   FORBIDDEN: import FieldPalette from '@/components/smart-forms/builder/FieldPalette'
 */

import React, { useState, useCallback } from 'react';
import type { SmartField, SmartFieldType } from '@/lib/domains/forms';
import FieldPalette from '@/components/smart-forms/builder/FieldPalette';
import FieldEditor from '@/components/smart-forms/builder/FieldEditor';
import FormCanvas from '@/components/smart-forms/builder/FormCanvas';
import WorkflowBindingPanel from '@/components/forms-platform/WorkflowBindingPanel';

export interface FormDefinitionBuilderProps {
  /** Current field list — controlled */
  fields: SmartField[];
  /** Called whenever the field list changes */
  onChange: (fields: SmartField[]) => void;
  /** UI locale for labels */
  locale?: 'en' | 'ar';
  /** Optional CSS class for the outer container */
  className?: string;
  /** Height of the builder area (default: 500px) */
  height?: string | number;
  /**
   * When provided, a "Workflow" tab is shown alongside the "Fields" tab,
   * allowing the form's workflow binding to be configured inline.
   * Uses WorkflowBindingPanel (ADR 001, Phase 3).
   */
  formId?: string;
}

type BuilderTab = 'fields' | 'workflow';

/**
 * Canonical form definition builder shell.
 * Wraps the internal smart-forms builder primitives behind a stable public API.
 */

export default function FormDefinitionBuilder({
  fields,
  onChange,
  locale = 'en',
  className,
  height = 500,
  formId,
}: FormDefinitionBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BuilderTab>('fields');

  const selectedField = fields.find((f) => f.field_id === selectedFieldId) ?? null;

  const handleFieldAdd = useCallback(
    (type: SmartFieldType, index?: number) => {
      const newField = createDefaultField(type, fields.length);
      let updated: SmartField[];
      if (index !== undefined) {
        updated = [...fields];
        updated.splice(index, 0, newField);
        updated.forEach((f, i) => { f.display.order = i; });
      } else {
        updated = [...fields, newField];
      }
      onChange(updated);
      setSelectedFieldId(newField.field_id);
    },
    [fields, onChange],
  );

  const handleFieldsChange = useCallback(
    (updated: SmartField[]) => onChange(updated),
    [onChange],
  );

  const handleFieldChange = useCallback(
    (updated: SmartField) => {
      onChange(fields.map((f) => (f.field_id === updated.field_id ? updated : f)));
    },
    [fields, onChange],
  );

  const handleFieldDelete = useCallback(() => {
    if (!selectedFieldId) return;
    onChange(fields.filter((f) => f.field_id !== selectedFieldId));
    setSelectedFieldId(null);
  }, [selectedFieldId, fields, onChange]);

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`flex flex-col border rounded-lg overflow-hidden bg-background ${className ?? ''}`}
      style={containerStyle}
    >
      {/* Tab bar — only shown when formId is provided */}
      {formId && (
        <div className="flex items-center gap-1 border-b px-3 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'fields'
                ? 'text-brand border-b-2 border-brand'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fields
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'workflow'
                ? 'text-brand border-b-2 border-brand'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Workflow
          </button>
        </div>
      )}

      {/* Fields tab (always rendered when no formId, or when activeTab === 'fields') */}
      {(!formId || activeTab === 'fields') && (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 border-r overflow-hidden shrink-0">
            <FieldPalette onFieldSelect={handleFieldAdd} locale={locale} />
          </div>

          <div className="flex-1 overflow-auto p-3 bg-muted/30">
            <FormCanvas
              fields={fields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onFieldsChange={handleFieldsChange}
              onFieldAdd={handleFieldAdd}
              locale={locale}
            />
          </div>

          <div className="w-72 border-l overflow-hidden shrink-0">
            <FieldEditor
              field={selectedField}
              onChange={handleFieldChange}
              onDelete={handleFieldDelete}
              locale={locale}
            />
          </div>
        </div>
      )}

      {/* Workflow tab — only when formId is provided and tab is active */}
      {formId && activeTab === 'workflow' && (
        <div className="flex-1 overflow-auto">
          <WorkflowBindingPanel formId={formId} />
        </div>
      )}
    </div>
  );
}

function createDefaultField(type: SmartFieldType, order: number): SmartField {
  const fieldId = `field_${Date.now()}`;
  const OPTION_TYPES = ['select', 'multi_select', 'radio', 'checkbox'];

  const field: SmartField = {
    field_id: fieldId,
    type,
    label: getDefaultLabel(type),
    label_ar: getDefaultLabelAr(type),
    placeholder: '',
    placeholder_ar: '',
    help_text: '',
    help_text_ar: '',
    default_value: null,
    validation: { required: false },
    display: { order, width: 'full', hidden: false, readonly: false },
    settings: {},
  };

  if (OPTION_TYPES.includes(type)) {
    field.options = [
      { value: 'option1', label: 'Option 1', label_ar: 'خيار 1' },
      { value: 'option2', label: 'Option 2', label_ar: 'خيار 2' },
      { value: 'option3', label: 'Option 3', label_ar: 'خيار 3' },
    ];
  }

  return field;
}

function getDefaultLabel(type: SmartFieldType): string {
  const labels: Record<string, string> = {
    text: 'Text Field', textarea: 'Text Area', number: 'Number', decimal: 'Decimal',
    email: 'Email', phone: 'Phone', url: 'URL', date: 'Date', time: 'Time',
    datetime: 'Date & Time', select: 'Dropdown', multi_select: 'Multi Select',
    radio: 'Radio Buttons', checkbox: 'Checkboxes', toggle: 'Toggle',
    file: 'File Upload', multi_file: 'Multiple Files', image: 'Image',
    signature: 'Signature', section_header: 'Section', divider: 'Divider', info_box: 'Info Box',
  };
  return labels[type] ?? 'Field';
}

function getDefaultLabelAr(type: SmartFieldType): string {
  const labels: Record<string, string> = {
    text: 'حقل نص', textarea: 'نص طويل', number: 'رقم', decimal: 'عشري',
    email: 'بريد إلكتروني', phone: 'هاتف', url: 'رابط', date: 'تاريخ', time: 'وقت',
    datetime: 'تاريخ ووقت', select: 'قائمة منسدلة', multi_select: 'اختيار متعدد',
    radio: 'اختيار فردي', checkbox: 'مربعات اختيار', toggle: 'تبديل',
    file: 'رفع ملف', multi_file: 'ملفات متعددة', image: 'صورة',
    signature: 'توقيع', section_header: 'قسم', divider: 'فاصل', info_box: 'مربع معلومات',
  };
  return labels[type] ?? 'حقل';
}
