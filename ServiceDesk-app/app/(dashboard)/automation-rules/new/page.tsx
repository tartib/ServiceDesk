'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Zap, Settings, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConditionBuilder from '@/components/automation/ConditionBuilder';
import {
  useCreateAutomationRule,
  type IAutomationRule,
  type RuleTriggerType,
  type RuleActionType,
  type RuleConditionGroup,
  type RuleAction,
} from '@/hooks/useAutomationRules';

// ============================================
// Constants
// ============================================

const TRIGGER_TYPES: { value: RuleTriggerType; labelEn: string; labelAr: string }[] = [
  { value: 'ticket_created', labelEn: 'Ticket Created', labelAr: 'إنشاء تذكرة' },
  { value: 'ticket_updated', labelEn: 'Ticket Updated', labelAr: 'تحديث تذكرة' },
  { value: 'status_changed', labelEn: 'Status Changed', labelAr: 'تغيير الحالة' },
  { value: 'priority_changed', labelEn: 'Priority Changed', labelAr: 'تغيير الأولوية' },
  { value: 'assignment_changed', labelEn: 'Assignment Changed', labelAr: 'تغيير التعيين' },
  { value: 'sla_breach_warning', labelEn: 'SLA Breach Warning', labelAr: 'تحذير خرق SLA' },
  { value: 'sla_breached', labelEn: 'SLA Breached', labelAr: 'خرق SLA' },
  { value: 'time_trigger', labelEn: 'Time Trigger', labelAr: 'محفز زمني' },
  { value: 'scheduled', labelEn: 'Scheduled', labelAr: 'مجدول' },
  { value: 'webhook_received', labelEn: 'Webhook Received', labelAr: 'استقبال Webhook' },
  { value: 'custom_event', labelEn: 'Custom Event', labelAr: 'حدث مخصص' },
];

const ACTION_TYPES: { value: RuleActionType; labelEn: string; labelAr: string }[] = [
  { value: 'assign_ticket', labelEn: 'Assign Ticket', labelAr: 'تعيين التذكرة' },
  { value: 'set_priority', labelEn: 'Set Priority', labelAr: 'تعيين الأولوية' },
  { value: 'set_status', labelEn: 'Set Status', labelAr: 'تعيين الحالة' },
  { value: 'add_tag', labelEn: 'Add Tag', labelAr: 'إضافة وسم' },
  { value: 'remove_tag', labelEn: 'Remove Tag', labelAr: 'إزالة وسم' },
  { value: 'add_comment', labelEn: 'Add Comment', labelAr: 'إضافة تعليق' },
  { value: 'notify_user', labelEn: 'Notify User', labelAr: 'إشعار مستخدم' },
  { value: 'notify_team', labelEn: 'Notify Team', labelAr: 'إشعار فريق' },
  { value: 'send_email', labelEn: 'Send Email', labelAr: 'إرسال بريد' },
  { value: 'execute_webhook', labelEn: 'Execute Webhook', labelAr: 'تنفيذ Webhook' },
  { value: 'create_task', labelEn: 'Create Task', labelAr: 'إنشاء مهمة' },
  { value: 'set_field', labelEn: 'Set Field', labelAr: 'تعيين حقل' },
  { value: 'run_script', labelEn: 'Run Script', labelAr: 'تشغيل سكربت' },
  { value: 'route_to_queue', labelEn: 'Route to Queue', labelAr: 'توجيه لقائمة' },
  { value: 'request_approval', labelEn: 'Request Approval', labelAr: 'طلب موافقة' },
];

// ============================================
// Page
// ============================================

export default function NewAutomationRulePage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const router = useRouter();
  const createMutation = useCreateAutomationRule();

  // Form state
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<RuleTriggerType>('ticket_created');
  const [rootOperator, setRootOperator] = useState<'AND' | 'OR'>('AND');
  const [conditionGroups, setConditionGroups] = useState<RuleConditionGroup[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // ---- Actions management ----
  const addAction = useCallback(() => {
    setActions((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        type: 'set_field' as RuleActionType,
        config: {},
        stopOnFailure: false,
      },
    ]);
  }, []);

  const removeAction = useCallback((idx: number) => {
    setActions((prev) =>
      prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i + 1 }))
    );
  }, []);

  const updateAction = useCallback((idx: number, patch: Partial<RuleAction>) => {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }, []);

  // ---- Save ----
  const handleSave = useCallback(
    async (activate: boolean) => {
      const errs: string[] = [];
      if (!name.trim()) errs.push(isAr ? 'الاسم مطلوب' : 'Name is required');
      if (actions.length === 0) errs.push(isAr ? 'أضف إجراء واحد على الأقل' : 'Add at least one action');
      if (errs.length > 0) {
        setErrors(errs);
        return;
      }
      setErrors([]);
      setSaving(true);

      try {
        const payload: Partial<IAutomationRule> = {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          description: description.trim() || undefined,
          status: activate ? 'active' : 'draft',
          trigger: {
            type: triggerType,
            config: {},
          },
          conditions: {
            operator: rootOperator,
            groups: conditionGroups,
          },
          actions,
          execution: {
            maxExecutionsPerTicket: 10,
            preventReTrigger: true,
            allowParallel: false,
            priority: 5,
          },
          scope: {
            ticketTypes: [],
            services: [],
            categories: [],
            priorities: [],
            applyTo: 'all',
          },
        };

        await createMutation.mutateAsync(payload);
        router.push('/automation-rules');
      } catch (err) {
        console.error('Failed to create rule:', err);
        setErrors([isAr ? 'فشل في إنشاء القاعدة' : 'Failed to create rule']);
      } finally {
        setSaving(false);
      }
    },
    [name, nameAr, description, triggerType, rootOperator, conditionGroups, actions, isAr, createMutation, router]
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isAr ? 'قاعدة أتمتة جديدة' : 'New Automation Rule'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAr ? 'حدد المحفز والشروط والإجراءات' : 'Define trigger, conditions, and actions'}
            </p>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-600">{err}</p>
            ))}
          </div>
        )}

        {/* Basic Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {isAr ? 'معلومات أساسية' : 'Basic Info'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">{isAr ? 'الاسم (EN)' : 'Name (EN)'} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auto-assign critical tickets"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">{isAr ? 'الاسم (AR)' : 'Name (AR)'}</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="تعيين التذاكر الحرجة تلقائيًا"
                className="mt-1"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">{isAr ? 'الوصف' : 'Description'}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isAr ? 'وصف ما تفعله هذه القاعدة...' : 'Describe what this rule does...'}
              className="mt-1 w-full h-16 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </section>

        {/* Trigger */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {isAr ? 'المحفز' : 'Trigger'}
          </h2>
          <div>
            <Label className="text-xs text-gray-500">{isAr ? 'نوع المحفز' : 'Trigger Type'}</Label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as RuleTriggerType)}
              className="mt-1 w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {isAr ? t.labelAr : t.labelEn}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Conditions */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <ConditionBuilder
            rootOperator={rootOperator}
            groups={conditionGroups}
            onRootOperatorChange={setRootOperator}
            onGroupsChange={setConditionGroups}
            isAr={isAr}
          />
        </section>

        {/* Actions */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Play className="w-4 h-4" />
              {isAr ? 'الإجراءات' : 'Actions'}
            </h2>
            <button
              type="button"
              onClick={addAction}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + {isAr ? 'إضافة إجراء' : 'Add Action'}
            </button>
          </div>

          {actions.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              {isAr ? 'لا توجد إجراءات' : 'No actions configured yet'}
            </p>
          )}

          {actions.map((action, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <select
                  value={action.type}
                  onChange={(e) => updateAction(idx, { type: e.target.value as RuleActionType, config: {} })}
                  className="flex-1 h-8 rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {isAr ? t.labelAr : t.labelEn}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAction(idx)}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                >
                  &times;
                </button>
              </div>

              {/* Generic config key/value pairs */}
              <div className="grid grid-cols-2 gap-2">
                {action.type === 'assign_ticket' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'المعين إليه' : 'Assignee ID'}</Label>
                      <Input
                        value={String(action.config.assigneeId || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, assigneeId: e.target.value } })}
                        placeholder="user-id"
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'الفريق' : 'Team ID'}</Label>
                      <Input
                        value={String(action.config.teamId || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, teamId: e.target.value } })}
                        placeholder="team-id"
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </>
                )}
                {action.type === 'set_priority' && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'الأولوية' : 'Priority'}</Label>
                    <select
                      value={String(action.config.priority || 'medium')}
                      onChange={(e) => updateAction(idx, { config: { ...action.config, priority: e.target.value } })}
                      className="w-full h-7 rounded border border-gray-300 bg-white px-2 text-xs mt-0.5"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                )}
                {action.type === 'set_status' && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'الحالة' : 'Status'}</Label>
                    <Input
                      value={String(action.config.status || '')}
                      onChange={(e) => updateAction(idx, { config: { ...action.config, status: e.target.value } })}
                      placeholder="in_progress"
                      className="h-7 text-xs mt-0.5 font-mono"
                    />
                  </div>
                )}
                {(action.type === 'add_tag' || action.type === 'remove_tag') && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'الوسم' : 'Tag'}</Label>
                    <Input
                      value={String(action.config.tag || '')}
                      onChange={(e) => updateAction(idx, { config: { ...action.config, tag: e.target.value } })}
                      placeholder="urgent"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                )}
                {action.type === 'add_comment' && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'التعليق' : 'Comment'}</Label>
                    <textarea
                      value={String(action.config.comment || '')}
                      onChange={(e) => updateAction(idx, { config: { ...action.config, comment: e.target.value } })}
                      placeholder={isAr ? 'نص التعليق...' : 'Comment text...'}
                      className="w-full h-14 rounded border border-gray-300 bg-white px-2 py-1 text-xs mt-0.5 resize-none"
                    />
                  </div>
                )}
                {(action.type === 'notify_user' || action.type === 'notify_team') && (
                  <>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'المعرف' : 'Target ID'}</Label>
                      <Input
                        value={String(action.config.targetId || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, targetId: e.target.value } })}
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'الرسالة' : 'Message'}</Label>
                      <Input
                        value={String(action.config.message || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, message: e.target.value } })}
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </>
                )}
                {action.type === 'send_email' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'إلى' : 'To'}</Label>
                      <Input
                        value={String(action.config.to || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, to: e.target.value } })}
                        placeholder="user@example.com"
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'الموضوع' : 'Subject'}</Label>
                      <Input
                        value={String(action.config.subject || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, subject: e.target.value } })}
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </>
                )}
                {action.type === 'execute_webhook' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-gray-400">URL</Label>
                      <Input
                        value={String(action.config.url || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, url: e.target.value } })}
                        placeholder="https://..."
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">Method</Label>
                      <select
                        value={String(action.config.method || 'POST')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, method: e.target.value } })}
                        className="w-full h-7 rounded border border-gray-300 bg-white px-2 text-xs mt-0.5"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  </>
                )}
                {action.type === 'set_field' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'الحقل' : 'Field'}</Label>
                      <Input
                        value={String(action.config.fieldPath || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, fieldPath: e.target.value } })}
                        placeholder="priority"
                        className="h-7 text-xs mt-0.5 font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{isAr ? 'القيمة' : 'Value'}</Label>
                      <Input
                        value={String(action.config.value || '')}
                        onChange={(e) => updateAction(idx, { config: { ...action.config, value: e.target.value } })}
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Stop on failure toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={action.stopOnFailure}
                  onChange={(e) => updateAction(idx, { stopOnFailure: e.target.checked })}
                  className="h-3 w-3 rounded border-gray-300"
                />
                <span className="text-[10px] text-gray-500">
                  {isAr ? 'إيقاف عند الفشل' : 'Stop on failure'}
                </span>
              </label>
            </div>
          ))}
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتفعيل' : 'Save & Activate')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
