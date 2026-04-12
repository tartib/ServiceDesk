'use client';

import React, { useState, useCallback } from 'react';
import { SmartField, SmartFieldType } from '@/types/smart-forms';
import FieldPalette from '@/components/smart-forms/builder/FieldPalette';
import FieldEditor from '@/components/smart-forms/builder/FieldEditor';
import FormCanvas from '@/components/smart-forms/builder/FormCanvas';

interface ServiceFormBuilderProps {
 fields: SmartField[];
 onChange: (fields: SmartField[]) => void;
 locale?: 'en' | 'ar';
}

export default function ServiceFormBuilder({
 fields,
 onChange,
 locale = 'en',
}: ServiceFormBuilderProps) {
 const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

 const selectedField = fields.find(f => f.field_id === selectedFieldId) || null;

 const handleFieldAdd = useCallback((type: SmartFieldType, index?: number) => {
 const newField = createDefaultField(type, fields.length);

 let newFields: SmartField[];
 if (index !== undefined) {
 newFields = [...fields];
 newFields.splice(index, 0, newField);
 newFields.forEach((f, i) => {
 f.display.order = i;
 });
 } else {
 newFields = [...fields, newField];
 }

 onChange(newFields);
 setSelectedFieldId(newField.field_id);
 }, [fields, onChange]);

 const handleFieldsChange = useCallback((newFields: SmartField[]) => {
 onChange(newFields);
 }, [onChange]);

 const handleFieldChange = useCallback((updatedField: SmartField) => {
 const newFields = fields.map(f =>
 f.field_id === updatedField.field_id ? updatedField : f
 );
 onChange(newFields);
 }, [fields, onChange]);

 const handleFieldDelete = useCallback(() => {
 if (!selectedFieldId) return;
 const newFields = fields.filter(f => f.field_id !== selectedFieldId);
 onChange(newFields);
 setSelectedFieldId(null);
 }, [selectedFieldId, fields, onChange]);

 return (
 <div className="flex h-[500px] border rounded-lg overflow-hidden bg-background">
 {/* Left — Field Palette */}
 <div className="w-56 border-r overflow-hidden shrink-0">
 <FieldPalette onFieldSelect={handleFieldAdd} locale={locale} />
 </div>

 {/* Center — Form Canvas */}
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

 {/* Right — Field Editor */}
 <div className="w-72 border-l overflow-hidden shrink-0">
 <FieldEditor
 field={selectedField}
 onChange={handleFieldChange}
 onDelete={handleFieldDelete}
 locale={locale}
 />
 </div>
 </div>
 );
}

function createDefaultField(type: SmartFieldType, order: number): SmartField {
 const fieldId = `field_${Date.now()}`;

 const baseField: SmartField = {
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

 if ([SmartFieldType.SELECT, SmartFieldType.MULTI_SELECT, SmartFieldType.RADIO, SmartFieldType.CHECKBOX].includes(type)) {
 baseField.options = [
 { value: 'option1', label: 'Option 1', label_ar: 'خيار 1' },
 { value: 'option2', label: 'Option 2', label_ar: 'خيار 2' },
 { value: 'option3', label: 'Option 3', label_ar: 'خيار 3' },
 ];
 }

 return baseField;
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
 return labels[type] || 'Field';
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
 return labels[type] || 'حقل';
}
