'use client';

/**
 * CreateRequestFlow — Unified Request Creation Component
 *
 * Multi-step flow:
 *   1. Select Request Type (optional if requestTypeId provided)
 *   2. Fill form fields (title, description, priority + dynamic form data)
 *   3. Review & Submit
 *
 * Features:
 *   - Autosave as draft with debounced updates
 *   - Request type filtering by workspace type
 *   - Minimal required fields for fast submission
 *   - Feature-flagged under `new_request_flow`
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { useRequestTypes } from '@/hooks/useRequestTypes';
import { useCreateRecordItem, useUpdateDraft } from '@/hooks/useRecordItems';
import type {
  RequestType,
  RecordPriority,
  WorkspaceType,
  CreateRecordPayload,
} from '@/types';
import { RecordPriority as RecordPriorityEnum } from '@/types';
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Send,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

interface CreateRequestFlowProps {
  requestTypeId?: string;
  workspaceType?: WorkspaceType;
  onSuccess?: (recordId: string) => void;
  onCancel?: () => void;
}

type FlowStep = 'select-type' | 'fill-form' | 'review';

export function CreateRequestFlow({
  requestTypeId: initialRequestTypeId,
  workspaceType,
  onSuccess,
  onCancel,
}: CreateRequestFlowProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { user } = useAuthStore();

  // Step management
  const [step, setStep] = useState<FlowStep>(
    initialRequestTypeId ? 'fill-form' : 'select-type',
  );

  // Form state
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RecordPriority>(RecordPriorityEnum.MEDIUM);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [draftId, setDraftId] = useState<string | null>(null);

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { data: requestTypesData, isLoading: loadingTypes } = useRequestTypes({
    workspaceType,
    isActive: true,
  });
  const createRecord = useCreateRecordItem();
  const updateDraft = useUpdateDraft();

  const requestTypes = requestTypesData?.items ?? [];

  // Auto-select request type if provided
  useEffect(() => {
    if (initialRequestTypeId && requestTypes.length > 0) {
      const found = requestTypes.find(
        (rt) => rt._id === initialRequestTypeId,
      );
      if (found) setSelectedRequestType(found);
    }
  }, [initialRequestTypeId, requestTypes]);

  // Autosave debounce
  const scheduleDraftSave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      if (!title.trim() || !selectedRequestType?.formSchemaId) return;
      try {
        setAutosaveStatus('saving');
        if (draftId) {
          await updateDraft.mutateAsync({
            id: draftId,
            payload: { title, description, formData, priority },
          });
        } else {
          const result = await createRecord.mutateAsync({
            title,
            description,
            requestTypeId: selectedRequestType?._id,
            workspaceType,
            priority,
            formTemplateId: selectedRequestType.formSchemaId,
            formData,
            isDraft: true,
          });
          setDraftId(result.recordItem._id);
        }
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('error');
      }
    }, 2000);
  }, [title, description, formData, priority, draftId, selectedRequestType, workspaceType]);

  useEffect(() => {
    if (step === 'fill-form' && title.trim()) {
      scheduleDraftSave();
    }
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, description, formData, priority, step]);

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedRequestType?.formSchemaId) return;

    try {
      const payload: CreateRecordPayload = {
        title,
        description,
        requestTypeId: selectedRequestType._id,
        workspaceType,
        priority,
        formTemplateId: selectedRequestType.formSchemaId,
        formData,
        isDraft: false,
      };

      const result = await createRecord.mutateAsync(payload);
      const recordId = result.recordItem._id;

      if (onSuccess) {
        onSuccess(recordId);
      } else {
        router.push(`/records/${recordId}`);
      }
    } catch {
      // Error will be shown via mutation state
    }
  };

  // Step navigation
  const canProceedToForm = !!selectedRequestType;
  const canProceedToReview = title.trim().length > 0;
  const canSubmit = canProceedToReview;

  const priorityOptions: { value: RecordPriority; label: string; color: string }[] = [
    { value: RecordPriorityEnum.LOW, label: locale === 'ar' ? 'منخفض' : 'Low', color: 'bg-info-soft text-info' },
    { value: RecordPriorityEnum.MEDIUM, label: locale === 'ar' ? 'متوسط' : 'Medium', color: 'bg-warning-soft text-warning' },
    { value: RecordPriorityEnum.HIGH, label: locale === 'ar' ? 'عالي' : 'High', color: 'bg-destructive-soft text-destructive' },
    { value: RecordPriorityEnum.CRITICAL, label: locale === 'ar' ? 'حرج' : 'Critical', color: 'bg-destructive text-destructive-foreground' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        <StepIndicator
          steps={[
            { key: 'select-type', label: locale === 'ar' ? 'نوع الطلب' : 'Request Type' },
            { key: 'fill-form', label: locale === 'ar' ? 'التفاصيل' : 'Details' },
            { key: 'review', label: locale === 'ar' ? 'مراجعة' : 'Review' },
          ]}
          currentStep={step}
        />
        {onCancel && (
          <button onClick={onCancel} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Step 1: Select request type */}
      {step === 'select-type' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === 'ar' ? 'اختر نوع الطلب' : 'Choose a Request Type'}
          </h2>
          <p className="text-muted-foreground">
            {locale === 'ar'
              ? 'حدد نوع الطلب الذي تريد إنشاءه'
              : 'Select the type of request you want to create'}
          </p>

          {loadingTypes ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse bg-muted rounded-xl" />
              ))}
            </div>
          ) : requestTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{locale === 'ar' ? 'لا توجد أنواع طلبات متاحة' : 'No request types available'}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {requestTypes.map((rt) => (
                <button
                  key={rt._id}
                  onClick={() => {
                    setSelectedRequestType(rt);
                    setPriority(rt.defaultPriority);
                    setStep('fill-form');
                  }}
                  className={`p-4 border rounded-xl text-start hover:shadow-md transition-all group ${
                    selectedRequestType?._id === rt._id
                      ? 'border-brand bg-brand-soft'
                      : 'border-border bg-card hover:border-brand/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-brand">
                        {locale === 'ar' ? (rt.nameAr || rt.name) : rt.name}
                      </h3>
                      {rt.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {locale === 'ar' ? (rt.descriptionAr || rt.description) : rt.description}
                        </p>
                      )}
                      {rt.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                          {locale === 'ar' ? (rt.categoryAr || rt.category) : rt.category}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-brand" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Fill form */}
      {step === 'fill-form' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {locale === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}
            </h2>
            <AutosaveBadge status={autosaveStatus} locale={locale} />
          </div>

          {selectedRequestType && (
            <div className="px-4 py-3 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  {locale === 'ar' ? (selectedRequestType.nameAr || selectedRequestType.name) : selectedRequestType.name}
                </p>
              </div>
              {!initialRequestTypeId && (
                <button
                  onClick={() => setStep('select-type')}
                  className="ms-auto text-sm text-brand hover:underline"
                >
                  {locale === 'ar' ? 'تغيير' : 'Change'}
                </button>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {locale === 'ar' ? 'العنوان' : 'Title'} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'أدخل عنوان الطلب' : 'Enter request title'}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {locale === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === 'ar' ? 'وصف تفصيلي للطلب (اختياري)' : 'Detailed description (optional)'}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {locale === 'ar' ? 'الأولوية' : 'Priority'}
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    priority === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-brand'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {!initialRequestTypeId && (
              <button
                onClick={() => setStep('select-type')}
                className="px-4 py-2.5 border border-input rounded-lg text-muted-foreground hover:bg-accent flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {locale === 'ar' ? 'السابق' : 'Back'}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => setStep('review')}
              disabled={!canProceedToReview}
              className="px-6 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-50 flex items-center gap-2"
            >
              {locale === 'ar' ? 'مراجعة' : 'Review'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {locale === 'ar' ? 'مراجعة الطلب' : 'Review Your Request'}
          </h2>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {/* Request type */}
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'نوع الطلب' : 'Request Type'}
              </span>
              <span className="font-medium text-foreground">
                {locale === 'ar'
                  ? (selectedRequestType?.nameAr || selectedRequestType?.name)
                  : selectedRequestType?.name}
              </span>
            </div>

            {/* Title */}
            <div className="p-4 flex justify-between items-start">
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'العنوان' : 'Title'}
              </span>
              <span className="font-medium text-foreground text-end max-w-[60%]">{title}</span>
            </div>

            {/* Description */}
            {description && (
              <div className="p-4">
                <span className="text-sm text-muted-foreground block mb-1">
                  {locale === 'ar' ? 'الوصف' : 'Description'}
                </span>
                <p className="text-foreground text-sm whitespace-pre-wrap">{description}</p>
              </div>
            )}

            {/* Priority */}
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'الأولوية' : 'Priority'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                priorityOptions.find((o) => o.value === priority)?.color ?? ''
              }`}>
                {priorityOptions.find((o) => o.value === priority)?.label}
              </span>
            </div>

            {/* Requester */}
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'مقدم الطلب' : 'Requester'}
              </span>
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
          </div>

          {/* Error */}
          {createRecord.isError && (
            <div className="p-4 bg-destructive-soft rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">
                {locale === 'ar' ? 'فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى.' : 'Failed to create request. Please try again.'}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setStep('fill-form')}
              className="px-4 py-2.5 border border-input rounded-lg text-muted-foreground hover:bg-accent flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {locale === 'ar' ? 'تعديل' : 'Edit'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || createRecord.isPending}
              className="px-6 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-50 flex items-center gap-2"
            >
              {createRecord.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: { key: string; label: string }[];
  currentStep: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < currentIndex
                  ? 'bg-success text-success-foreground'
                  : i === currentIndex
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === currentIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${i < currentIndex ? 'bg-success' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function AutosaveBadge({ status, locale }: { status: string; locale: string }) {
  if (status === 'idle') return null;
  const labels: Record<string, { en: string; ar: string; icon: React.ReactNode }> = {
    saving: { en: 'Saving...', ar: 'جاري الحفظ...', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    saved: { en: 'Draft saved', ar: 'تم حفظ المسودة', icon: <Save className="w-3 h-3" /> },
    error: { en: 'Save failed', ar: 'فشل الحفظ', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const l = labels[status];
  if (!l) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
      status === 'error' ? 'bg-destructive-soft text-destructive' : 'bg-muted text-muted-foreground'
    }`}>
      {l.icon}
      {locale === 'ar' ? l.ar : l.en}
    </span>
  );
}
