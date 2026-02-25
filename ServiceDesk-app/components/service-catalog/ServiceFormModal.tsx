'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Puzzle } from 'lucide-react';
import {
  useCreateServiceCatalogItem,
  useUpdateServiceCatalogItem,
  IServiceCatalogItem,
} from '@/hooks/useServiceCatalog';
import FormRenderer from '@/components/smart-forms/FormRenderer';
import ServiceFormBuilder from './ServiceFormBuilder';
import {
  FormTemplate,
  SmartField,
  SmartFieldType,
  FormSection,
  FormLayoutType,
  ConditionType,
  ConditionOperator,
} from '@/types/smart-forms';

// ─── Helper: build a SmartField quickly ───
function field(
  id: string,
  type: SmartFieldType,
  label: string,
  labelAr: string,
  opts: {
    placeholder?: string;
    placeholderAr?: string;
    helpText?: string;
    helpTextAr?: string;
    required?: boolean;
    width?: 'full' | 'half' | 'third';
    sectionId?: string;
    order?: number;
    defaultValue?: unknown;
    options?: { value: string; label: string }[];
    visibleWhen?: { fieldId: string; op: ConditionOperator; value?: unknown };
    min?: number;
  } = {},
): SmartField {
  return {
    field_id: id,
    type,
    label,
    label_ar: labelAr,
    placeholder: opts.placeholder,
    placeholder_ar: opts.placeholderAr,
    help_text: opts.helpText,
    help_text_ar: opts.helpTextAr,
    default_value: opts.defaultValue,
    options: opts.options?.map(o => ({ ...o, label_ar: o.label })),
    validation: {
      required: opts.required ?? false,
      ...(opts.min !== undefined ? { min: opts.min } : {}),
    },
    display: {
      order: opts.order ?? 0,
      width: opts.width ?? 'half',
      hidden: false,
      readonly: false,
      section_id: opts.sectionId,
    },
    visibility_conditions: opts.visibleWhen
      ? [
          {
            type: ConditionType.FIELD_VALUE,
            field_id: opts.visibleWhen.fieldId,
            operator: opts.visibleWhen.op,
            value: opts.visibleWhen.value,
          },
        ]
      : undefined,
    settings: {},
  };
}

// ─── Sections ───
const SECTIONS: FormSection[] = [
  { section_id: 'basic', title: 'Basic Information', title_ar: 'المعلومات الأساسية', order: 0, collapsible: false, collapsed_by_default: false },
  { section_id: 'availability', title: 'Availability', title_ar: 'التوفر', order: 1, collapsible: true, collapsed_by_default: false },
  { section_id: 'fulfillment', title: 'Fulfillment', title_ar: 'التنفيذ', order: 2, collapsible: true, collapsed_by_default: false },
  { section_id: 'pricing', title: 'Pricing', title_ar: 'التسعير', order: 3, collapsible: true, collapsed_by_default: false },
  { section_id: 'workflow', title: 'Workflow', title_ar: 'سير العمل', order: 4, collapsible: true, collapsed_by_default: true },
  { section_id: 'display', title: 'Display & Meta', title_ar: 'العرض والبيانات', order: 5, collapsible: true, collapsed_by_default: true },
];

// ─── Fields ───
const FIELDS: SmartField[] = [
  // ── Basic ──
  field('name', SmartFieldType.TEXT, 'Service Name', 'اسم الخدمة', { required: true, placeholder: 'e.g. VPN Access Request', placeholderAr: 'مثال: طلب وصول VPN', sectionId: 'basic', order: 0 }),
  field('name_ar', SmartFieldType.TEXT, 'Service Name (Arabic)', 'اسم الخدمة (عربي)', { placeholder: 'اسم الخدمة', sectionId: 'basic', order: 1 }),
  field('description', SmartFieldType.TEXTAREA, 'Description', 'الوصف', { required: true, placeholder: 'Describe what this service provides...', placeholderAr: 'وصف الخدمة...', sectionId: 'basic', order: 2 }),
  field('description_ar', SmartFieldType.TEXTAREA, 'Description (Arabic)', 'الوصف (عربي)', { placeholder: 'وصف الخدمة...', sectionId: 'basic', order: 3 }),
  field('category', SmartFieldType.SELECT, 'Category', 'الفئة', {
    required: true, sectionId: 'basic', order: 4, width: 'third', defaultValue: 'general_request',
    options: [
      { value: 'access_management', label: 'Access Management' },
      { value: 'hardware', label: 'Hardware' },
      { value: 'software', label: 'Software' },
      { value: 'network', label: 'Network' },
      { value: 'accounts', label: 'Accounts' },
      { value: 'general_request', label: 'General Request' },
    ],
  }),
  field('icon', SmartFieldType.TEXT, 'Icon', 'الأيقونة', { placeholder: 'e.g. Shield, Wifi, Monitor', sectionId: 'basic', order: 5, width: 'third' }),
  field('image', SmartFieldType.URL, 'Image URL', 'رابط الصورة', { placeholder: 'https://...', sectionId: 'basic', order: 6, width: 'third' }),

  // ── Availability ──
  field('is_active', SmartFieldType.TOGGLE, 'Active', 'مفعل', { defaultValue: true, helpText: 'Service is visible and requestable', helpTextAr: 'الخدمة مرئية ويمكن طلبها', sectionId: 'availability', order: 0 }),
  field('requires_approval', SmartFieldType.TOGGLE, 'Requires Approval', 'يتطلب موافقة', { defaultValue: true, helpText: 'Requests need manager approval', helpTextAr: 'الطلبات تحتاج موافقة المدير', sectionId: 'availability', order: 1 }),
  field('available_to', SmartFieldType.TEXT, 'Available To', 'متاح لـ', { defaultValue: 'all', placeholder: 'all (or: end_user, technician, manager)', helpText: 'Who can see and request this service', helpTextAr: 'من يمكنه رؤية وطلب هذه الخدمة', sectionId: 'availability', order: 2, width: 'full' }),

  // ── Fulfillment ──
  field('fulfillment_type', SmartFieldType.SELECT, 'Fulfillment Type', 'نوع التنفيذ', {
    defaultValue: 'manual', sectionId: 'fulfillment', order: 0,
    options: [
      { value: 'manual', label: 'Manual' },
      { value: 'automated', label: 'Automated' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  }),
  field('estimated_hours', SmartFieldType.NUMBER, 'Estimated Hours', 'الساعات المقدرة', { defaultValue: 24, min: 0, sectionId: 'fulfillment', order: 1 }),
  field('automation_script', SmartFieldType.TEXTAREA, 'Automation Script', 'سكربت الأتمتة', {
    placeholder: 'Script or command to run for automated fulfillment...', sectionId: 'fulfillment', order: 2, width: 'full',
    visibleWhen: { fieldId: 'fulfillment_type', op: ConditionOperator.NOT_EQUALS, value: 'manual' },
  }),

  // ── Pricing ──
  field('billing_type', SmartFieldType.SELECT, 'Billing Type', 'نوع الفوترة', {
    defaultValue: 'free', sectionId: 'pricing', order: 0, width: 'third',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'one_time', label: 'One Time' },
      { value: 'recurring', label: 'Recurring' },
    ],
  }),
  field('cost', SmartFieldType.NUMBER, 'Cost', 'التكلفة', {
    defaultValue: 0, min: 0, sectionId: 'pricing', order: 1, width: 'third',
    visibleWhen: { fieldId: 'billing_type', op: ConditionOperator.NOT_EQUALS, value: 'free' },
  }),
  field('currency', SmartFieldType.SELECT, 'Currency', 'العملة', {
    defaultValue: 'SAR', sectionId: 'pricing', order: 2, width: 'third',
    options: [
      { value: 'SAR', label: 'SAR' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'AED', label: 'AED' },
    ],
    visibleWhen: { fieldId: 'billing_type', op: ConditionOperator.NOT_EQUALS, value: 'free' },
  }),

  // ── Workflow ──
  field('sla_id', SmartFieldType.TEXT, 'SLA ID', 'معرف SLA', { required: true, defaultValue: 'default-sla', placeholder: 'e.g. default-sla', sectionId: 'workflow', order: 0 }),
  field('notification_template', SmartFieldType.TEXT, 'Notification Template', 'قالب الإشعار', { placeholder: 'Template name or ID', sectionId: 'workflow', order: 1 }),
  field('auto_assign_group', SmartFieldType.TEXT, 'Auto-Assign Group', 'مجموعة التعيين التلقائي', { placeholder: 'Group ID', sectionId: 'workflow', order: 2 }),
  field('auto_assign_user', SmartFieldType.TEXT, 'Auto-Assign User', 'مستخدم التعيين التلقائي', { placeholder: 'User ID', sectionId: 'workflow', order: 3 }),

  // ── Display & Meta ──
  field('order', SmartFieldType.NUMBER, 'Display Order', 'ترتيب العرض', { defaultValue: 0, min: 0, helpText: 'Lower number = shown first', helpTextAr: 'رقم أقل = يظهر أولاً', sectionId: 'display', order: 0 }),
  field('tags', SmartFieldType.TEXT, 'Tags', 'الوسوم', { placeholder: 'vpn, access, security (comma separated)', placeholderAr: 'vpn, access, security (مفصولة بفواصل)', sectionId: 'display', order: 1 }),
];

// ─── Build the FormTemplate object ───
const SERVICE_FORM_TEMPLATE: FormTemplate = {
  _id: 'service-catalog-form',
  form_id: 'service-catalog-form',
  name: 'Service Catalog Form',
  name_ar: 'نموذج كتالوج الخدمات',
  description: '',
  description_ar: '',
  category: 'service_catalog',
  version: 1,
  is_published: true,
  fields: FIELDS,
  layout: { type: FormLayoutType.SINGLE_COLUMN, sections: SECTIONS },
  conditional_rules: [],
  settings: { allow_draft: false, allow_attachments: false, max_attachments: 0, allowed_file_types: [], max_file_size_mb: 0, require_signature: false, enable_geolocation: false },
  access: { available_to: ['all'], requires_authentication: true },
  created_by: 'system',
  created_at: '',
  updated_at: '',
};

// ─── Flatten service to form data ───
function serviceToFormData(service: IServiceCatalogItem): Record<string, unknown> {
  const wf = service.workflow as Record<string, unknown> | undefined;
  const ff = service.fulfillment as Record<string, unknown> | undefined;
  return {
    name: service.name || '',
    name_ar: service.name_ar || '',
    description: service.description || '',
    description_ar: service.description_ar || '',
    category: service.category || 'general_request',
    icon: service.icon || '',
    image: service.image || '',
    is_active: service.availability?.is_active ?? true,
    requires_approval: service.availability?.requires_approval ?? true,
    available_to: service.availability?.available_to?.join(', ') || 'all',
    fulfillment_type: service.fulfillment?.type || 'manual',
    estimated_hours: service.fulfillment?.estimated_hours ?? 24,
    automation_script: (ff?.automation_script as string) || '',
    billing_type: service.pricing?.billing_type || 'free',
    cost: service.pricing?.cost ?? 0,
    currency: service.pricing?.currency || 'SAR',
    sla_id: (wf?.sla_id as string) || 'default-sla',
    notification_template: (wf?.notification_template as string) || '',
    auto_assign_group: (wf?.auto_assign_group as string) || '',
    auto_assign_user: (wf?.auto_assign_user as string) || '',
    order: service.order ?? 0,
    tags: service.tags?.join(', ') || '',
  };
}

// ─── Transform flat form data back to nested API payload ───
function formDataToPayload(
  data: Record<string, unknown>,
  existingService?: IServiceCatalogItem | null,
): Partial<IServiceCatalogItem> {
  const ft = String(data.fulfillment_type || 'manual');
  const bt = String(data.billing_type || 'free');
  const tagsStr = String(data.tags || '');
  const availStr = String(data.available_to || 'all');

  return {
    name: String(data.name || '').trim(),
    name_ar: String(data.name_ar || '').trim() || undefined,
    description: String(data.description || '').trim(),
    description_ar: String(data.description_ar || '').trim() || undefined,
    category: String(data.category || 'general_request') as IServiceCatalogItem['category'],
    icon: String(data.icon || '').trim() || undefined,
    image: String(data.image || '').trim() || undefined,
    availability: {
      is_active: !!data.is_active,
      available_to: availStr.split(',').map(v => v.trim()).filter(Boolean),
      requires_approval: !!data.requires_approval,
    },
    fulfillment: {
      type: ft as 'manual' | 'automated' | 'hybrid',
      estimated_hours: Number(data.estimated_hours) || 24,
      ...(ft !== 'manual' && String(data.automation_script || '').trim()
        ? { automation_script: String(data.automation_script).trim() }
        : {}),
    },
    pricing: {
      cost: bt === 'free' ? 0 : Number(data.cost) || 0,
      currency: String(data.currency || 'SAR'),
      billing_type: bt as 'free' | 'one_time' | 'recurring',
    },
    workflow: {
      approval_chain: (existingService?.workflow as Record<string, unknown>)?.approval_chain as IServiceCatalogItem['workflow']['approval_chain'] || [],
      sla_id: String(data.sla_id || 'default-sla').trim(),
      ...(String(data.auto_assign_group || '').trim() ? { auto_assign_group: String(data.auto_assign_group).trim() } : {}),
      ...(String(data.auto_assign_user || '').trim() ? { auto_assign_user: String(data.auto_assign_user).trim() } : {}),
      ...(String(data.notification_template || '').trim() ? { notification_template: String(data.notification_template).trim() } : {}),
    } as IServiceCatalogItem['workflow'],
    tags: tagsStr.trim() ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
    order: Number(data.order) || 0,
  };
}

// ─── Convert backend IDynamicFormField[] → SmartField[] for the builder ───
type DynamicFormField = IServiceCatalogItem['form'][number];

function dynamicFieldsToSmartFields(fields: DynamicFormField[]): SmartField[] {
  return fields.map((f) => ({
    field_id: f.field_id,
    type: f.type as unknown as SmartFieldType,
    label: f.label,
    label_ar: f.label_ar || f.label,
    placeholder: f.placeholder,
    placeholder_ar: '',
    help_text: '',
    help_text_ar: '',
    default_value: f.default_value ?? null,
    options: f.options?.map(o => ({ value: o.value, label: o.label, label_ar: o.label_ar })),
    validation: {
      required: f.required ?? false,
      ...(f.validation?.min !== undefined ? { min: f.validation.min } : {}),
      ...(f.validation?.max !== undefined ? { max: f.validation.max } : {}),
      ...(f.validation?.pattern ? { pattern: f.validation.pattern, pattern_message: f.validation.message } : {}),
    },
    display: {
      order: f.order ?? 0,
      width: 'full' as const,
      hidden: false,
      readonly: false,
    },
    settings: {},
  }));
}

// ─── Map SmartFieldType → backend FormFieldType ───
// Backend only supports: text, textarea, number, email, phone, date, datetime, select, multiselect, checkbox, radio, file
const SMART_TO_BACKEND_TYPE: Record<string, string> = {
  text: 'text',
  textarea: 'textarea',
  rich_text: 'textarea',
  markdown: 'textarea',
  number: 'number',
  decimal: 'number',
  email: 'email',
  phone: 'phone',
  url: 'text',
  password: 'text',
  date: 'date',
  time: 'text',
  datetime: 'datetime',
  date_range: 'date',
  select: 'select',
  multi_select: 'multiselect',
  radio: 'radio',
  checkbox: 'checkbox',
  toggle: 'checkbox',
  file: 'file',
  multi_file: 'file',
  image: 'file',
  signature: 'text',
  geolocation: 'text',
  address: 'text',
  user_lookup: 'select',
  entity_lookup: 'select',
  cascading_select: 'select',
  formula: 'text',
  aggregation: 'text',
  section_header: 'text',
  divider: 'text',
  info_box: 'text',
  custom: 'text',
};

// ─── Convert SmartField[] → backend IDynamicFormField[] for the payload ───
function smartFieldsToDynamicFields(fields: SmartField[]): DynamicFormField[] {
  return fields.map((f, idx) => ({
    field_id: f.field_id,
    label: f.label,
    label_ar: f.label_ar || undefined,
    type: (SMART_TO_BACKEND_TYPE[f.type] || 'text') as DynamicFormField['type'],
    required: f.validation?.required ?? false,
    placeholder: f.placeholder || undefined,
    default_value: f.default_value ?? undefined,
    options: f.options?.map(o => ({ value: o.value, label: o.label, label_ar: o.label_ar })),
    validation: f.validation?.pattern || f.validation?.min !== undefined || f.validation?.max !== undefined
      ? {
          ...(f.validation?.min !== undefined ? { min: f.validation.min } : {}),
          ...(f.validation?.max !== undefined ? { max: f.validation.max } : {}),
          ...(f.validation?.pattern ? { pattern: f.validation.pattern, message: f.validation?.pattern_message } : {}),
        }
      : undefined,
    order: f.display?.order ?? idx,
  }));
}

// ─── Component ───
interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: IServiceCatalogItem | null;
  onSuccess?: () => void;
}

export default function ServiceFormModal({ open, onOpenChange, service, onSuccess }: ServiceFormModalProps) {
  const isEdit = !!service;
  const createMutation = useCreateServiceCatalogItem();
  const updateMutation = useUpdateServiceCatalogItem();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Form builder fields state
  const [formFields, setFormFields] = useState<SmartField[]>([]);

  // Service details initial data
  const initialData = useMemo(() => {
    if (service) return serviceToFormData(service);
    return {};
  }, [service]);

  // Pre-fill form builder fields when editing
  const initFormFields = useCallback(() => {
    if (service?.form && service.form.length > 0) {
      setFormFields(dynamicFieldsToSmartFields(service.form));
    } else {
      setFormFields([]);
    }
  }, [service]);

  // Reset state when dialog opens/closes
  useMemo(() => {
    if (open) {
      setActiveTab('details');
      setError(null);
      initFormFields();
    }
  }, [open, initFormFields]);

  // Stored data from Service Details tab (captured before switching to builder tab)
  const [detailsData, setDetailsData] = useState<Record<string, unknown> | null>(null);

  const handleDetailsSubmit = async (data: Record<string, unknown>) => {
    setError(null);
    setDetailsData(data);
    const payload = formDataToPayload(data, service);

    // Include the form fields from the builder
    payload.form = smartFieldsToDynamicFields(formFields);

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: service!.service_id, data: payload });
      } else {
        const name = String(data.name || '').trim();
        const serviceId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
        await createMutation.mutateAsync({ ...payload, service_id: serviceId });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} service:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{isEdit ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the service details' : 'Add a new service to the catalog'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Service Details
            </TabsTrigger>
            <TabsTrigger value="form-builder" className="gap-2">
              <Puzzle className="h-4 w-4" />
              Request Form
              {formFields.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {formFields.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <FormRenderer
              template={SERVICE_FORM_TEMPLATE}
              initialData={detailsData || initialData}
              onSubmit={handleDetailsSubmit}
              onCancel={() => onOpenChange(false)}
              disabled={isPending}
            />
          </TabsContent>

          <TabsContent value="form-builder" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Request Form Builder</h3>
                  <p className="text-xs text-gray-500">
                    Drag and drop fields to build the form users will fill when requesting this service
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {formFields.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formFields.length} field{formFields.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('details')}
                  >
                    Back to Details
                  </Button>
                </div>
              </div>

              <ServiceFormBuilder
                fields={formFields}
                onChange={setFormFields}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setActiveTab('details')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Continue to Submit
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
