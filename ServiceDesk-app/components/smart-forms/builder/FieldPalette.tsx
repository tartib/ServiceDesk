'use client';

/**
 * Field Palette - لوحة الحقول
 * Smart Forms Builder
 * 
 * عرض الحقول المتاحة للسحب والإفلات
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SmartFieldType } from '@/types/smart-forms';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  Clock,
  List,
  CheckSquare,
  Circle,
  ToggleLeft,
  Upload,
  Image,
  PenTool,
  MapPin,
  User,
  Database,
  Calculator,
  Minus,
  Info,
  Heading,
} from 'lucide-react';

interface FieldPaletteProps {
  onFieldSelect: (type: SmartFieldType) => void;
  locale?: 'en' | 'ar';
}

interface FieldCategory {
  name: string;
  name_ar: string;
  fields: {
    type: SmartFieldType;
    label: string;
    label_ar: string;
    icon: React.ReactNode;
  }[];
}

const fieldCategories: FieldCategory[] = [
  {
    name: 'Basic',
    name_ar: 'أساسي',
    fields: [
      { type: SmartFieldType.TEXT, label: 'Text', label_ar: 'نص', icon: <Type className="h-4 w-4" /> },
      { type: SmartFieldType.TEXTAREA, label: 'Textarea', label_ar: 'نص طويل', icon: <AlignLeft className="h-4 w-4" /> },
      { type: SmartFieldType.NUMBER, label: 'Number', label_ar: 'رقم', icon: <Hash className="h-4 w-4" /> },
      { type: SmartFieldType.DECIMAL, label: 'Decimal', label_ar: 'عشري', icon: <Hash className="h-4 w-4" /> },
      { type: SmartFieldType.EMAIL, label: 'Email', label_ar: 'بريد إلكتروني', icon: <Mail className="h-4 w-4" /> },
      { type: SmartFieldType.PHONE, label: 'Phone', label_ar: 'هاتف', icon: <Phone className="h-4 w-4" /> },
      { type: SmartFieldType.URL, label: 'URL', label_ar: 'رابط', icon: <Link className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Date & Time',
    name_ar: 'التاريخ والوقت',
    fields: [
      { type: SmartFieldType.DATE, label: 'Date', label_ar: 'تاريخ', icon: <Calendar className="h-4 w-4" /> },
      { type: SmartFieldType.TIME, label: 'Time', label_ar: 'وقت', icon: <Clock className="h-4 w-4" /> },
      { type: SmartFieldType.DATETIME, label: 'Date & Time', label_ar: 'تاريخ ووقت', icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Selection',
    name_ar: 'الاختيار',
    fields: [
      { type: SmartFieldType.SELECT, label: 'Dropdown', label_ar: 'قائمة منسدلة', icon: <List className="h-4 w-4" /> },
      { type: SmartFieldType.MULTI_SELECT, label: 'Multi Select', label_ar: 'اختيار متعدد', icon: <CheckSquare className="h-4 w-4" /> },
      { type: SmartFieldType.RADIO, label: 'Radio', label_ar: 'اختيار فردي', icon: <Circle className="h-4 w-4" /> },
      { type: SmartFieldType.CHECKBOX, label: 'Checkbox', label_ar: 'مربع اختيار', icon: <CheckSquare className="h-4 w-4" /> },
      { type: SmartFieldType.TOGGLE, label: 'Toggle', label_ar: 'تبديل', icon: <ToggleLeft className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Advanced',
    name_ar: 'متقدم',
    fields: [
      { type: SmartFieldType.FILE, label: 'File Upload', label_ar: 'رفع ملف', icon: <Upload className="h-4 w-4" /> },
      { type: SmartFieldType.MULTI_FILE, label: 'Multi File', label_ar: 'ملفات متعددة', icon: <Upload className="h-4 w-4" /> },
      { type: SmartFieldType.IMAGE, label: 'Image', label_ar: 'صورة', icon: <Image className="h-4 w-4" /> },
      { type: SmartFieldType.SIGNATURE, label: 'Signature', label_ar: 'توقيع', icon: <PenTool className="h-4 w-4" /> },
      { type: SmartFieldType.GEOLOCATION, label: 'Location', label_ar: 'موقع', icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Lookup',
    name_ar: 'البحث',
    fields: [
      { type: SmartFieldType.USER_LOOKUP, label: 'User Lookup', label_ar: 'بحث مستخدم', icon: <User className="h-4 w-4" /> },
      { type: SmartFieldType.ENTITY_LOOKUP, label: 'Entity Lookup', label_ar: 'بحث كيان', icon: <Database className="h-4 w-4" /> },
      { type: SmartFieldType.CASCADING_SELECT, label: 'Cascading', label_ar: 'متتالي', icon: <List className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Calculated',
    name_ar: 'محسوب',
    fields: [
      { type: SmartFieldType.FORMULA, label: 'Formula', label_ar: 'صيغة', icon: <Calculator className="h-4 w-4" /> },
      { type: SmartFieldType.AGGREGATION, label: 'Aggregation', label_ar: 'تجميع', icon: <Calculator className="h-4 w-4" /> },
    ],
  },
  {
    name: 'Layout',
    name_ar: 'التخطيط',
    fields: [
      { type: SmartFieldType.SECTION_HEADER, label: 'Section', label_ar: 'قسم', icon: <Heading className="h-4 w-4" /> },
      { type: SmartFieldType.DIVIDER, label: 'Divider', label_ar: 'فاصل', icon: <Minus className="h-4 w-4" /> },
      { type: SmartFieldType.INFO_BOX, label: 'Info Box', label_ar: 'مربع معلومات', icon: <Info className="h-4 w-4" /> },
    ],
  },
];

export default function FieldPalette({ onFieldSelect, locale = 'en' }: FieldPaletteProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {locale === 'ar' ? 'الحقول المتاحة' : 'Available Fields'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <div className="p-4 space-y-4">
            {fieldCategories.map((category) => (
              <div key={category.name}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                  {locale === 'ar' ? category.name_ar : category.name}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {category.fields.map((field) => (
                    <button
                      key={field.type}
                      onClick={() => onFieldSelect(field.type)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md text-sm',
                        'border border-transparent hover:border-primary',
                        'bg-muted/50 hover:bg-muted transition-colors',
                        'cursor-grab active:cursor-grabbing'
                      )}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('fieldType', field.type);
                      }}
                    >
                      {field.icon}
                      <span className="truncate text-xs">
                        {locale === 'ar' ? field.label_ar : field.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
