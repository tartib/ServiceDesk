'use client';

/**
 * Form Canvas - لوحة النموذج
 * Smart Forms Builder
 * 
 * منطقة السحب والإفلات لبناء النموذج
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SmartField, SmartFieldType } from '@/types/smart-forms';
import { GripVertical, Trash2, Copy, Settings } from 'lucide-react';

interface FormCanvasProps {
  fields: SmartField[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldsChange: (fields: SmartField[]) => void;
  onFieldAdd: (type: SmartFieldType, index?: number) => void;
  locale?: 'en' | 'ar';
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldsChange,
  onFieldAdd,
  locale = 'en',
}: FormCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    const fieldType = e.dataTransfer.getData('fieldType') as SmartFieldType;
    const draggedFieldId = e.dataTransfer.getData('fieldId');

    if (fieldType) {
      // إضافة حقل جديد
      onFieldAdd(fieldType, index);
    } else if (draggedFieldId) {
      // إعادة ترتيب الحقول
      const draggedIndex = fields.findIndex(f => f.field_id === draggedFieldId);
      if (draggedIndex === -1) return;
      
      // Calculate the target position
      let targetIndex = index;
      if (draggedIndex < targetIndex) {
        targetIndex -= 1;
      }
      if (draggedIndex === targetIndex) return;

      const newFields = [...fields];
      const [removed] = newFields.splice(draggedIndex, 1);
      newFields.splice(targetIndex, 0, removed);
      
      // تحديث الترتيب
      newFields.forEach((f, i) => {
        f.display = { ...f.display, order: i };
      });
      
      onFieldsChange(newFields);
    }
  };

  const handleFieldDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData('fieldId', fieldId);
  };

  const handleDuplicateField = (field: SmartField) => {
    const newField: SmartField = {
      ...JSON.parse(JSON.stringify(field)),
      field_id: `${field.field_id}_copy_${Date.now()}`,
      display: {
        ...field.display,
        order: fields.length,
      },
    };
    onFieldsChange([...fields, newField]);
  };

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.field_id !== fieldId));
  };

  const getFieldTypeLabel = (type: SmartFieldType): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      text: { en: 'Text', ar: 'نص' },
      textarea: { en: 'Textarea', ar: 'نص طويل' },
      number: { en: 'Number', ar: 'رقم' },
      email: { en: 'Email', ar: 'بريد' },
      phone: { en: 'Phone', ar: 'هاتف' },
      date: { en: 'Date', ar: 'تاريخ' },
      select: { en: 'Dropdown', ar: 'قائمة' },
      multi_select: { en: 'Multi Select', ar: 'متعدد' },
      checkbox: { en: 'Checkbox', ar: 'اختيار' },
      radio: { en: 'Radio', ar: 'فردي' },
      file: { en: 'File', ar: 'ملف' },
      signature: { en: 'Signature', ar: 'توقيع' },
      section_header: { en: 'Section', ar: 'قسم' },
      divider: { en: 'Divider', ar: 'فاصل' },
    };
    return labels[type]?.[locale] || type;
  };

  const renderFieldPreview = (field: SmartField) => {
    const label = locale === 'ar' ? field.label_ar : field.label;

    switch (field.type) {
      case SmartFieldType.SECTION_HEADER:
        return (
          <div className="py-2">
            <h3 className="text-lg font-semibold">{label}</h3>
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case SmartFieldType.DIVIDER:
        return <hr className="my-2" />;

      case SmartFieldType.INFO_BOX:
        return (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{field.help_text || label}</p>
          </div>
        );

      default:
        return (
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="h-9 bg-muted/50 rounded-md border border-dashed flex items-center px-3 text-sm text-muted-foreground">
              {getFieldTypeLabel(field.type)}
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div
          className={cn(
            'min-h-[calc(100vh-200px)] rounded-lg border-2 border-dashed p-4',
            fields.length === 0 && 'flex items-center justify-center'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            if (fields.length === 0) setDragOverIndex(0);
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            if (fields.length === 0) handleDrop(e, 0);
          }}
        >
          {fields.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">
                {locale === 'ar' ? 'اسحب الحقول هنا' : 'Drag fields here'}
              </p>
              <p className="text-sm">
                {locale === 'ar'
                  ? 'ابدأ ببناء النموذج بسحب الحقول من اللوحة اليسرى'
                  : 'Start building your form by dragging fields from the left panel'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <React.Fragment key={field.field_id}>
                  {/* Drop zone before field */}
                  <div
                    className={cn(
                      'h-2 transition-all rounded -my-0.5 relative z-10',
                      dragOverIndex === index && 'h-10 bg-primary/20 border-2 border-primary border-dashed my-1'
                    )}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  />

                  {/* Field card */}
                  <div
                    className={cn(
                      'group relative p-3 rounded-lg border bg-card transition-all cursor-pointer',
                      selectedFieldId === field.field_id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => onFieldSelect(field.field_id)}
                    draggable
                    onDragStart={(e) => handleFieldDragStart(e, field.field_id)}
                  >
                    {/* Drag handle and actions */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateField(field);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.field_id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Drag handle */}
                    <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Field preview */}
                    <div className="ml-4">
                      {renderFieldPreview(field)}
                    </div>

                    {/* Field type badge */}
                    <div className="absolute bottom-1 left-1">
                      <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                        {field.field_id}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* Drop zone after last field */}
              <div
                className={cn(
                  'h-2 transition-all rounded -my-0.5 relative z-10',
                  dragOverIndex === fields.length && 'h-10 bg-primary/20 border-2 border-primary border-dashed my-1'
                )}
                onDragOver={(e) => handleDragOver(e, fields.length)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, fields.length)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
