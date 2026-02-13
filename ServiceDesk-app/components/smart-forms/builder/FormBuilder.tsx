'use client';

/**
 * Form Builder - بناء النماذج
 * Smart Forms System
 * 
 * المكون الرئيسي لبناء النماذج
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SmartField, SmartFieldType, FormTemplate } from '@/types/smart-forms';
import FieldPalette from './FieldPalette';
import FieldEditor from './FieldEditor';
import FormCanvas from './FormCanvas';
import { Save, Eye, Settings, Undo, Redo, FileJson, X } from 'lucide-react';

interface FormBuilderProps {
  template?: FormTemplate;
  onSave: (template: Partial<FormTemplate>) => Promise<void>;
  onPreview?: (template: Partial<FormTemplate>) => void;
  onClose?: () => void;
  locale?: 'en' | 'ar';
}

export default function FormBuilder({
  template,
  onSave,
  onPreview,
  onClose,
  locale = 'en',
}: FormBuilderProps) {
  const [fields, setFields] = useState<SmartField[]>(template?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [formName, setFormName] = useState(template?.name || '');
  const [formNameAr, setFormNameAr] = useState(template?.name_ar || '');
  const [formDescription, setFormDescription] = useState(template?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<SmartField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const selectedField = fields.find(f => f.field_id === selectedFieldId) || null;

  // حفظ في السجل
  const saveToHistory = useCallback((newFields: SmartField[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFields);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // التراجع
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFields(history[historyIndex - 1]);
    }
  };

  // الإعادة
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFields(history[historyIndex + 1]);
    }
  };

  // إضافة حقل جديد
  const handleFieldAdd = (type: SmartFieldType, index?: number) => {
    const newField = createDefaultField(type, fields.length);
    
    let newFields: SmartField[];
    if (index !== undefined) {
      newFields = [...fields];
      newFields.splice(index, 0, newField);
      // تحديث الترتيب
      newFields.forEach((f, i) => {
        f.display.order = i;
      });
    } else {
      newFields = [...fields, newField];
    }
    
    setFields(newFields);
    saveToHistory(newFields);
    setSelectedFieldId(newField.field_id);
  };

  // تحديث الحقول
  const handleFieldsChange = (newFields: SmartField[]) => {
    setFields(newFields);
    saveToHistory(newFields);
  };

  // تحديث حقل واحد
  const handleFieldChange = (updatedField: SmartField) => {
    const newFields = fields.map(f =>
      f.field_id === updatedField.field_id ? updatedField : f
    );
    setFields(newFields);
    saveToHistory(newFields);
  };

  // حذف الحقل المحدد
  const handleFieldDelete = () => {
    if (!selectedFieldId) return;
    const newFields = fields.filter(f => f.field_id !== selectedFieldId);
    setFields(newFields);
    saveToHistory(newFields);
    setSelectedFieldId(null);
  };

  // حفظ النموذج
  const handleSave = async () => {
    // Validate form name
    if (!formName.trim()) {
      alert(locale === 'ar' ? 'يرجى إدخال اسم النموذج' : 'Please enter a form name');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({
        name: formName.trim(),
        name_ar: formNameAr.trim() || formName.trim(),
        description: formDescription,
        fields,
      });
    } catch (error) {
      console.error('Save error:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving form');
    } finally {
      setIsSaving(false);
    }
  };

  // تصدير JSON
  const handleExportJson = () => {
    const data = {
      name: formName,
      name_ar: formNameAr,
      description: formDescription,
      fields,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formName || 'form'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={locale === 'ar' ? 'اسم النموذج' : 'Form Name'}
            className="w-64"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <FileJson className="h-4 w-4 mr-1" />
            {locale === 'ar' ? 'تصدير' : 'Export'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-1" />
            {locale === 'ar' ? 'إعدادات' : 'Settings'}
          </Button>
          {onPreview && (
            <Button variant="outline" size="sm" onClick={() => onPreview({
              name: formName.trim() || 'Untitled Form',
              name_ar: formNameAr.trim() || formName.trim() || 'نموذج بدون عنوان',
              description: formDescription,
              fields,
            })}>
              <Eye className="h-4 w-4 mr-1" />
              {locale === 'ar' ? 'معاينة' : 'Preview'}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving
              ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : (locale === 'ar' ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Field Palette */}
        <div className="w-64 border-r overflow-hidden">
          <FieldPalette onFieldSelect={handleFieldAdd} locale={locale} />
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            onFieldsChange={handleFieldsChange}
            onFieldAdd={handleFieldAdd}
            locale={locale}
          />
        </div>

        {/* Right Panel - Field Editor */}
        <div className="w-80 border-l overflow-hidden">
          <FieldEditor
            field={selectedField}
            onChange={handleFieldChange}
            onDelete={handleFieldDelete}
            locale={locale}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'ar' ? 'إعدادات النموذج' : 'Form Settings'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'اسم النموذج (إنجليزي)' : 'Form Name (English)'}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'اسم النموذج (عربي)' : 'Form Name (Arabic)'}</Label>
              <Input
                value={formNameAr}
                onChange={(e) => setFormNameAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>
              {locale === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * إنشاء حقل افتراضي
 */
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
    validation: {
      required: false,
    },
    display: {
      order,
      width: 'full',
      hidden: false,
      readonly: false,
    },
    settings: {},
  };

  // إضافة خيارات افتراضية للحقول التي تحتاجها
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
    text: 'Text Field',
    textarea: 'Text Area',
    number: 'Number',
    decimal: 'Decimal',
    email: 'Email',
    phone: 'Phone',
    url: 'URL',
    date: 'Date',
    time: 'Time',
    datetime: 'Date & Time',
    select: 'Dropdown',
    multi_select: 'Multi Select',
    radio: 'Radio Buttons',
    checkbox: 'Checkboxes',
    toggle: 'Toggle',
    file: 'File Upload',
    multi_file: 'Multiple Files',
    image: 'Image',
    signature: 'Signature',
    section_header: 'Section',
    divider: 'Divider',
    info_box: 'Info Box',
  };
  return labels[type] || 'Field';
}

function getDefaultLabelAr(type: SmartFieldType): string {
  const labels: Record<string, string> = {
    text: 'حقل نص',
    textarea: 'نص طويل',
    number: 'رقم',
    decimal: 'عشري',
    email: 'بريد إلكتروني',
    phone: 'هاتف',
    url: 'رابط',
    date: 'تاريخ',
    time: 'وقت',
    datetime: 'تاريخ ووقت',
    select: 'قائمة منسدلة',
    multi_select: 'اختيار متعدد',
    radio: 'اختيار فردي',
    checkbox: 'مربعات اختيار',
    toggle: 'تبديل',
    file: 'رفع ملف',
    multi_file: 'ملفات متعددة',
    image: 'صورة',
    signature: 'توقيع',
    section_header: 'قسم',
    divider: 'فاصل',
    info_box: 'مربع معلومات',
  };
  return labels[type] || 'حقل';
}
