'use client';

/**
 * FormRenderer Component - مكون عرض النموذج
 * Smart Forms System
 * 
 * يقوم بعرض النموذج بالكامل مع إدارة الحالة والتحقق
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  FormTemplate,
  RenderedField,
  SmartFieldType,
  FieldOption,
  Attachment,
  FormSection,
} from '@/types/smart-forms';
import { FieldRenderer } from './fields';
import { Loader2, Save, Send, ChevronLeft, ChevronRight } from 'lucide-react';

interface FormRendererProps {
  template: FormTemplate;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onSaveDraft?: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  onFileUpload?: (files: File[]) => Promise<Attachment[]>;
}

export default function FormRenderer({
  template,
  initialData = {},
  onSubmit,
  onSaveDraft,
  onCancel,
  disabled = false,
  locale = 'en',
  onFileUpload,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isWizard = template.layout?.type === 'wizard';
  const sections = template.layout?.sections || [];

  // Generate rendered fields with visibility and state
  const renderedFields = useMemo((): RenderedField[] => {
    if (!template.fields || !Array.isArray(template.fields)) {
      return [];
    }
    return template.fields.map(field => {
      // Ensure display and validation objects exist
      const display = field.display || { order: 0, width: 'full', hidden: false, readonly: false };
      const validation = field.validation || { required: false };
      
      // Evaluate visibility
      let visible = !display.hidden;
      if (field.visibility_conditions && field.visibility_conditions.length > 0) {
        visible = evaluateVisibility(field.visibility_conditions, formData);
      }

      // Determine required state
      let required = validation.required || false;
      if (validation.required_condition) {
        required = evaluateCondition(validation.required_condition, formData);
      }

      return {
        ...field,
        display,
        validation,
        visible,
        value: formData[field.field_id] ?? field.default_value ?? null,
        errors: errors[field.field_id] ? [{ type: 'error', message: errors[field.field_id] }] : [],
        state: {
          disabled: disabled,
          readonly: display.readonly,
          required,
        },
      };
    }).sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));
  }, [template.fields, formData, errors, disabled]);

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, RenderedField[]> = { default: [] };
    
    sections.forEach(section => {
      grouped[section.section_id] = [];
    });

    renderedFields.forEach(field => {
      const sectionId = field.display.section_id || 'default';
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(field);
    });

    return grouped;
  }, [renderedFields, sections]);

  // Get current section fields for wizard
  const currentSectionFields = useMemo(() => {
    if (!isWizard || sections.length === 0) {
      return renderedFields;
    }
    const currentSection = sections[currentStep];
    return fieldsBySection[currentSection?.section_id] || [];
  }, [isWizard, sections, currentStep, fieldsBySection, renderedFields]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when field is changed
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    
    // Validate single field
    const field = renderedFields.find(f => f.field_id === fieldId);
    if (field) {
      const error = validateField(field, formData[fieldId], locale);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldId]: error }));
      }
    }
  }, [renderedFields, formData, locale]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    renderedFields.forEach(field => {
      if (!field.visible) return;
      
      const error = validateField(field, formData[field.field_id], locale);
      if (error) {
        newErrors[field.field_id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [renderedFields, formData, locale]);

  // Validate current step (for wizard)
  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    currentSectionFields.forEach(field => {
      if (!field.visible) return;
      
      const error = validateField(field, formData[field.field_id], locale);
      if (error) {
        newErrors[field.field_id] = error;
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [currentSectionFields, formData, locale]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    
    setIsSaving(true);
    try {
      await onSaveDraft(formData);
    } catch (error) {
      console.error('Save draft error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle next step (wizard)
  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep(prev => Math.min(prev + 1, sections.length - 1));
  };

  // Handle previous step (wizard)
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Render section
  const renderSection = (section: FormSection | null, fields: RenderedField[]) => {
    const visibleFields = fields.filter(f => f.visible);
    if (visibleFields.length === 0) return null;

    return (
      <div key={section?.section_id || 'default'} className="space-y-4">
        {section && (
          <div className="pb-2 border-b">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? section.title_ar : section.title}
            </h3>
            {section.description && (
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? section.description_ar : section.description}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {visibleFields.map(field => (
            <FieldRenderer
              key={field.field_id}
              field={field}
              value={formData[field.field_id]}
              onChange={(value: unknown) => handleFieldChange(field.field_id, value)}
              onBlur={() => handleFieldBlur(field.field_id)}
              error={touched[field.field_id] ? errors[field.field_id] : undefined}
              disabled={disabled || isSubmitting}
              locale={locale}
              options={field.options}
              onFileUpload={onFileUpload}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render wizard progress
  const renderWizardProgress = () => {
    if (!isWizard || sections.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {sections.map((section, index) => (
            <div
              key={section.section_id}
              className={cn(
                'flex items-center',
                index < sections.length - 1 && 'flex-1'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1}
              </div>
              {index < sections.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {locale === 'ar' ? sections[currentStep]?.title_ar : sections[currentStep]?.title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(locale === 'ar' && 'text-right')} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>
          {locale === 'ar' ? template.name_ar : template.name}
        </CardTitle>
        {template.description && (
          <CardDescription>
            {locale === 'ar' ? template.description_ar : template.description}
          </CardDescription>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {renderWizardProgress()}

          {renderedFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {locale === 'ar' ? 'لا توجد حقول في هذا النموذج' : 'No fields in this form'}
            </div>
          ) : isWizard ? (
            // Wizard mode - show current section only
            renderSection(sections[currentStep], currentSectionFields)
          ) : (
            // Normal mode - show all sections
            <>
              {sections.length > 0 ? (
                sections.map(section => 
                  renderSection(section, fieldsBySection[section.section_id] || [])
                )
              ) : (
                renderSection(null, renderedFields)
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isSaving}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            )}
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {locale === 'ar' ? 'حفظ كمسودة' : 'Save Draft'}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {isWizard && currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {locale === 'ar' ? 'السابق' : 'Previous'}
              </Button>
            )}

            {isWizard && currentStep < sections.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                {locale === 'ar' ? 'التالي' : 'Next'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || disabled}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                {locale === 'ar' ? 'إرسال' : 'Submit'}
              </Button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

// Helper functions
function evaluateVisibility(conditions: unknown[], formData: Record<string, unknown>): boolean {
  for (const condition of conditions) {
    const cond = condition as { field_id?: string; operator?: string; value?: unknown };
    if (!cond.field_id) continue;
    
    const fieldValue = formData[cond.field_id];
    
    switch (cond.operator) {
      case 'equals':
        if (fieldValue !== cond.value) return false;
        break;
      case 'not_equals':
        if (fieldValue === cond.value) return false;
        break;
      case 'is_empty':
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') return false;
        break;
      case 'is_not_empty':
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') return false;
        break;
    }
  }
  return true;
}

function evaluateCondition(condition: unknown, formData: Record<string, unknown>): boolean {
  const cond = condition as { field_id?: string; operator?: string; value?: unknown };
  if (!cond.field_id) return true;
  
  const fieldValue = formData[cond.field_id];
  
  switch (cond.operator) {
    case 'equals':
      return fieldValue === cond.value;
    case 'not_equals':
      return fieldValue !== cond.value;
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    default:
      return true;
  }
}

function validateField(field: RenderedField, value: unknown, locale: string): string | null {
  // Required validation
  if (field.state.required) {
    if (value === null || value === undefined || value === '') {
      return locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    }
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type-specific validation
  switch (field.type) {
    case SmartFieldType.EMAIL:
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return locale === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address';
      }
      break;

    case SmartFieldType.PHONE:
      if (!/^[\d\s\-+()]+$/.test(String(value))) {
        return locale === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number';
      }
      break;

    case SmartFieldType.URL:
      try {
        new URL(String(value));
      } catch {
        return locale === 'ar' ? 'الرابط غير صالح' : 'Invalid URL';
      }
      break;

    case SmartFieldType.NUMBER:
    case SmartFieldType.DECIMAL:
      if (isNaN(Number(value))) {
        return locale === 'ar' ? 'يجب أن تكون القيمة رقماً' : 'Value must be a number';
      }
      if (field.validation.min !== undefined && Number(value) < field.validation.min) {
        return locale === 'ar' 
          ? `القيمة يجب أن تكون ${field.validation.min} على الأقل`
          : `Value must be at least ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && Number(value) > field.validation.max) {
        return locale === 'ar'
          ? `القيمة يجب أن تكون ${field.validation.max} على الأكثر`
          : `Value must be at most ${field.validation.max}`;
      }
      break;
  }

  // Length validation
  if (field.validation.min_length !== undefined && String(value).length < field.validation.min_length) {
    return locale === 'ar'
      ? `يجب أن يكون ${field.validation.min_length} حرف على الأقل`
      : `Must be at least ${field.validation.min_length} characters`;
  }

  if (field.validation.max_length !== undefined && String(value).length > field.validation.max_length) {
    return locale === 'ar'
      ? `يجب أن يكون ${field.validation.max_length} حرف على الأكثر`
      : `Must be at most ${field.validation.max_length} characters`;
  }

  // Pattern validation
  if (field.validation.pattern) {
    try {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(String(value))) {
        return locale === 'ar'
          ? field.validation.pattern_message_ar || 'القيمة غير صالحة'
          : field.validation.pattern_message || 'Invalid value';
      }
    } catch {
      // Invalid regex, skip validation
    }
  }

  return null;
}
