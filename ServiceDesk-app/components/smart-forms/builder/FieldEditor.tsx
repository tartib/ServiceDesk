'use client';

/**
 * Field Editor - محرر الحقل
 * Smart Forms Builder
 * 
 * تحرير خصائص الحقل المحدد
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SmartField, SmartFieldType, FieldOption } from '@/types/smart-forms';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface FieldEditorProps {
  field: SmartField | null;
  onChange: (field: SmartField) => void;
  onDelete: () => void;
  locale?: 'en' | 'ar';
}

export default function FieldEditor({
  field,
  onChange,
  onDelete,
  locale = 'en',
}: FieldEditorProps) {
  const [activeTab, setActiveTab] = useState('general');

  if (!field) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          {locale === 'ar' ? 'اختر حقلاً للتحرير' : 'Select a field to edit'}
        </CardContent>
      </Card>
    );
  }

  const updateField = (updates: Partial<SmartField>) => {
    onChange({ ...field, ...updates });
  };

  const updateValidation = (updates: Partial<SmartField['validation']>) => {
    onChange({
      ...field,
      validation: { ...field.validation, ...updates },
    });
  };

  const updateDisplay = (updates: Partial<SmartField['display']>) => {
    onChange({
      ...field,
      display: { ...field.display, ...updates },
    });
  };

  const addOption = () => {
    const newOption: FieldOption = {
      value: `option_${Date.now()}`,
      label: locale === 'ar' ? 'خيار جديد' : 'New Option',
      label_ar: 'خيار جديد',
    };
    onChange({
      ...field,
      options: [...(field.options || []), newOption],
    });
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange({ ...field, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(field.options || [])];
    newOptions.splice(index, 1);
    onChange({ ...field, options: newOptions });
  };

  const hasOptions = [
    SmartFieldType.SELECT,
    SmartFieldType.MULTI_SELECT,
    SmartFieldType.RADIO,
    SmartFieldType.CHECKBOX,
  ].includes(field.type);

  const tabs = [
    { id: 'general', label: locale === 'ar' ? 'عام' : 'General' },
    { id: 'validation', label: locale === 'ar' ? 'التحقق' : 'Validation' },
    ...(hasOptions ? [{ id: 'options', label: locale === 'ar' ? 'الخيارات' : 'Options' }] : []),
    { id: 'display', label: locale === 'ar' ? 'العرض' : 'Display' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          {locale === 'ar' ? 'خصائص الحقل' : 'Field Properties'}
        </CardTitle>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex border-b px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm ${activeTab === tab.id ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'معرف الحقل' : 'Field ID'}</Label>
                <Input
                  value={field.field_id}
                  onChange={(e) => updateField({ field_id: e.target.value })}
                  placeholder="field_id"
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التسمية (إنجليزي)' : 'Label (English)'}</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التسمية (عربي)' : 'Label (Arabic)'}</Label>
                <Input
                  value={field.label_ar}
                  onChange={(e) => updateField({ label_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'نص المساعدة' : 'Help Text'}</Label>
                <Textarea
                  value={field.help_text || ''}
                  onChange={(e) => updateField({ help_text: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'النص التوضيحي' : 'Placeholder'}</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{locale === 'ar' ? 'مطلوب' : 'Required'}</Label>
                <input
                  type="checkbox"
                  checked={field.validation.required}
                  onChange={(e) => updateValidation({ required: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              {(field.type === SmartFieldType.TEXT || field.type === SmartFieldType.TEXTAREA) && (
                <>
                  <div className="space-y-2">
                    <Label>{locale === 'ar' ? 'الحد الأدنى للطول' : 'Min Length'}</Label>
                    <Input
                      type="number"
                      value={field.validation.min_length || ''}
                      onChange={(e) => updateValidation({ min_length: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === 'ar' ? 'الحد الأقصى للطول' : 'Max Length'}</Label>
                    <Input
                      type="number"
                      value={field.validation.max_length || ''}
                      onChange={(e) => updateValidation({ max_length: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'options' && hasOptions && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{locale === 'ar' ? 'الخيارات' : 'Options'}</Label>
                <Button size="sm" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  {locale === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={option.value} className="flex items-center gap-2 p-2 border rounded-md">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={option.value}
                      onChange={(e) => updateOption(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(index, { label: e.target.value })}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeOption(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'العرض' : 'Width'}</Label>
                <select
                  value={field.display.width || 'full'}
                  onChange={(e) => updateDisplay({ width: e.target.value as 'full' | 'half' | 'third' | 'quarter' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="full">{locale === 'ar' ? 'كامل' : 'Full'}</option>
                  <option value="half">{locale === 'ar' ? 'نصف' : 'Half'}</option>
                  <option value="third">{locale === 'ar' ? 'ثلث' : 'Third'}</option>
                  <option value="quarter">{locale === 'ar' ? 'ربع' : 'Quarter'}</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label>{locale === 'ar' ? 'مخفي' : 'Hidden'}</Label>
                <input
                  type="checkbox"
                  checked={field.display.hidden}
                  onChange={(e) => updateDisplay({ hidden: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{locale === 'ar' ? 'للقراءة فقط' : 'Read Only'}</Label>
                <input
                  type="checkbox"
                  checked={field.display.readonly}
                  onChange={(e) => updateDisplay({ readonly: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الترتيب' : 'Order'}</Label>
                <Input
                  type="number"
                  value={field.display.order}
                  onChange={(e) => updateDisplay({ order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
