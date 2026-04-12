'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================
// Types — mirrors backend WFActionType
// ============================================

export type ActionType =
 | 'set_field' | 'notify' | 'send_email' | 'assign'
 | 'create_task' | 'call_webhook' | 'call_api' | 'escalate'
 | 'update_entity' | 'log_activity' | 'add_comment'
 | 'run_script' | 'external_task' | 'custom';

export interface ActionConfig {
 // set_field
 fieldPath?: string;
 value?: unknown;
 operation?: 'set' | 'append' | 'increment';
 // notify
 to?: string;
 template?: string;
 channel?: 'in_app' | 'email' | 'push' | 'slack';
 // send_email
 subject?: string;
 body?: string;
 // assign
 userId?: string;
 groupId?: string;
 strategy?: 'specific' | 'round_robin' | 'least_busy';
 // create_task
 title?: string;
 description?: string;
 assignee?: string;
 priority?: string;
 // call_webhook / call_api
 url?: string;
 endpoint?: string;
 method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
 headers?: Record<string, string>;
 bodyTemplate?: string;
 payload?: string;
 // escalate
 level?: number;
 targetRole?: string;
 notifyTemplate?: string;
 // update_entity
 updates?: Record<string, unknown>;
 // log_activity / add_comment
 message?: string;
 isInternal?: boolean;
 // run_script
 scriptBody?: string;
 // external_task
 topic?: string;
 // custom
 functionName?: string;
 params?: Record<string, unknown>;
}

// ============================================
// Action type metadata
// ============================================

export const ACTION_TYPES: { value: ActionType; labelEn: string; labelAr: string }[] = [
 { value: 'set_field', labelEn: 'Set Field', labelAr: 'تعيين حقل' },
 { value: 'notify', labelEn: 'Notify', labelAr: 'إشعار' },
 { value: 'send_email', labelEn: 'Send Email', labelAr: 'إرسال بريد' },
 { value: 'assign', labelEn: 'Assign', labelAr: 'تعيين مسؤول' },
 { value: 'create_task', labelEn: 'Create Task', labelAr: 'إنشاء مهمة' },
 { value: 'call_webhook', labelEn: 'Call Webhook', labelAr: 'استدعاء Webhook' },
 { value: 'call_api', labelEn: 'Call API', labelAr: 'استدعاء API' },
 { value: 'escalate', labelEn: 'Escalate', labelAr: 'تصعيد' },
 { value: 'update_entity', labelEn: 'Update Entity', labelAr: 'تحديث كيان' },
 { value: 'log_activity', labelEn: 'Log Activity', labelAr: 'تسجيل نشاط' },
 { value: 'add_comment', labelEn: 'Add Comment', labelAr: 'إضافة تعليق' },
 { value: 'run_script', labelEn: 'Run Script', labelAr: 'تشغيل سكربت' },
 { value: 'external_task', labelEn: 'External Task', labelAr: 'مهمة خارجية' },
 { value: 'custom', labelEn: 'Custom', labelAr: 'مخصص' },
];

// ============================================
// Component
// ============================================

interface ActionConfigFormProps {
 actionType: ActionType;
 config: ActionConfig;
 onChange: (config: ActionConfig) => void;
 isAr: boolean;
}

export default function ActionConfigForm({ actionType, config, onChange, isAr }: ActionConfigFormProps) {
 const patch = (p: Partial<ActionConfig>) => onChange({ ...config, ...p });

 switch (actionType) {
 case 'set_field':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'مسار الحقل' : 'Field Path'}</Label>
 <Input
 value={config.fieldPath || ''}
 onChange={(e) => patch({ fieldPath: e.target.value })}
 placeholder="entity.priority"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'العملية' : 'Operation'}</Label>
 <select
 value={config.operation || 'set'}
 onChange={(e) => patch({ operation: e.target.value as ActionConfig['operation'] })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="set">{isAr ? 'تعيين' : 'Set'}</option>
 <option value="append">{isAr ? 'إلحاق' : 'Append'}</option>
 <option value="increment">{isAr ? 'زيادة' : 'Increment'}</option>
 </select>
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'القيمة' : 'Value'}</Label>
 <Input
 value={String(config.value ?? '')}
 onChange={(e) => patch({ value: e.target.value })}
 placeholder="high"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 </div>
 );

 case 'notify':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'المستلم' : 'To (userId / expression)'}</Label>
 <Input
 value={config.to || ''}
 onChange={(e) => patch({ to: e.target.value })}
 placeholder="entity.assigneeId"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'القالب' : 'Template'}</Label>
 <Input
 value={config.template || ''}
 onChange={(e) => patch({ template: e.target.value })}
 placeholder="status_change"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'القناة' : 'Channel'}</Label>
 <select
 value={config.channel || 'in_app'}
 onChange={(e) => patch({ channel: e.target.value as ActionConfig['channel'] })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="in_app">In-App</option>
 <option value="email">Email</option>
 <option value="push">Push</option>
 <option value="slack">Slack</option>
 </select>
 </div>
 </div>
 </div>
 );

 case 'send_email':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'المستلم' : 'To'}</Label>
 <Input
 value={config.to || ''}
 onChange={(e) => patch({ to: e.target.value })}
 placeholder="user@example.com"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الموضوع' : 'Subject'}</Label>
 <Input
 value={config.subject || ''}
 onChange={(e) => patch({ subject: e.target.value })}
 placeholder="Ticket {{ticketId}} updated"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'المحتوى' : 'Body Template'}</Label>
 <textarea
 value={config.body || ''}
 onChange={(e) => patch({ body: e.target.value })}
 placeholder="Hello {{assignee}}, ..."
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 </div>
 );

 case 'assign':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الاستراتيجية' : 'Strategy'}</Label>
 <select
 value={config.strategy || 'specific'}
 onChange={(e) => patch({ strategy: e.target.value as ActionConfig['strategy'] })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="specific">{isAr ? 'شخص محدد' : 'Specific User'}</option>
 <option value="round_robin">{isAr ? 'دوري' : 'Round Robin'}</option>
 <option value="least_busy">{isAr ? 'الأقل انشغالاً' : 'Least Busy'}</option>
 </select>
 </div>
 {config.strategy === 'specific' || !config.strategy ? (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'معرف المستخدم' : 'User ID'}</Label>
 <Input
 value={config.userId || ''}
 onChange={(e) => patch({ userId: e.target.value })}
 placeholder="user_id or expression"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 ) : (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'معرف المجموعة' : 'Group ID'}</Label>
 <Input
 value={config.groupId || ''}
 onChange={(e) => patch({ groupId: e.target.value })}
 placeholder="team_l2_support"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 )}
 </div>
 );

 case 'create_task':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'العنوان' : 'Title'}</Label>
 <Input
 value={config.title || ''}
 onChange={(e) => patch({ title: e.target.value })}
 placeholder="Review ticket {{ticketId}}"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الوصف' : 'Description'}</Label>
 <textarea
 value={config.description || ''}
 onChange={(e) => patch({ description: e.target.value })}
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'المسؤول' : 'Assignee'}</Label>
 <Input
 value={config.assignee || ''}
 onChange={(e) => patch({ assignee: e.target.value })}
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الأولوية' : 'Priority'}</Label>
 <select
 value={config.priority || 'medium'}
 onChange={(e) => patch({ priority: e.target.value })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
 <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
 <option value="high">{isAr ? 'عالي' : 'High'}</option>
 <option value="critical">{isAr ? 'حرج' : 'Critical'}</option>
 </select>
 </div>
 </div>
 </div>
 );

 case 'call_webhook':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">URL</Label>
 <Input
 value={config.url || ''}
 onChange={(e) => patch({ url: e.target.value })}
 placeholder="https://api.example.com/webhook"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الطريقة' : 'Method'}</Label>
 <select
 value={config.method || 'POST'}
 onChange={(e) => patch({ method: e.target.value as ActionConfig['method'] })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="GET">GET</option>
 <option value="POST">POST</option>
 <option value="PUT">PUT</option>
 <option value="PATCH">PATCH</option>
 <option value="DELETE">DELETE</option>
 </select>
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الجسم' : 'Body Template (JSON)'}</Label>
 <textarea
 value={config.bodyTemplate || ''}
 onChange={(e) => patch({ bodyTemplate: e.target.value })}
 placeholder='{"ticketId": "{{entity.id}}"}'
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 </div>
 );

 case 'call_api':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'النقطة النهائية' : 'Endpoint'}</Label>
 <Input
 value={config.endpoint || ''}
 onChange={(e) => patch({ endpoint: e.target.value })}
 placeholder="/api/v2/tickets/{{entity.id}}/escalate"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الطريقة' : 'Method'}</Label>
 <select
 value={config.method || 'POST'}
 onChange={(e) => patch({ method: e.target.value as ActionConfig['method'] })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="GET">GET</option>
 <option value="POST">POST</option>
 <option value="PUT">PUT</option>
 <option value="PATCH">PATCH</option>
 </select>
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'البيانات (JSON)' : 'Payload (JSON)'}</Label>
 <textarea
 value={config.payload || ''}
 onChange={(e) => patch({ payload: e.target.value })}
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 </div>
 );

 case 'escalate':
 return (
 <div className="space-y-1.5">
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'المستوى' : 'Level'}</Label>
 <Input
 type="number"
 min={1}
 max={5}
 value={config.level ?? 1}
 onChange={(e) => patch({ level: Number(e.target.value) })}
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الدور المستهدف' : 'Target Role'}</Label>
 <Input
 value={config.targetRole || ''}
 onChange={(e) => patch({ targetRole: e.target.value })}
 placeholder="manager"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'قالب الإشعار' : 'Notify Template'}</Label>
 <Input
 value={config.notifyTemplate || ''}
 onChange={(e) => patch({ notifyTemplate: e.target.value })}
 placeholder="escalation_l2"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 );

 case 'update_entity':
 return (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'التحديثات (JSON)' : 'Updates (JSON)'}</Label>
 <textarea
 value={JSON.stringify(config.updates || {}, null, 2)}
 onChange={(e) => {
 try { patch({ updates: JSON.parse(e.target.value) }); } catch { /* keep typing */ }
 }}
 placeholder='{"priority": "critical", "tags": ["escalated"]}'
 rows={3}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 );

 case 'log_activity':
 return (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الرسالة' : 'Message Template'}</Label>
 <Input
 value={config.message || ''}
 onChange={(e) => patch({ message: e.target.value })}
 placeholder="Ticket moved to {{toState}} by {{actor.name}}"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 );

 case 'add_comment':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'التعليق' : 'Comment Message'}</Label>
 <textarea
 value={config.message || ''}
 onChange={(e) => patch({ message: e.target.value })}
 placeholder="Auto-comment: Status changed to {{toState}}"
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 <label className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={config.isInternal ?? false}
 onChange={(e) => patch({ isInternal: e.target.checked })}
 className="h-3.5 w-3.5 rounded border-border"
 />
 <span className="text-[10px] text-muted-foreground">{isAr ? 'تعليق داخلي' : 'Internal comment'}</span>
 </label>
 </div>
 );

 case 'run_script':
 return (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'السكربت' : 'Script Body'}</Label>
 <textarea
 value={config.scriptBody || ''}
 onChange={(e) => patch({ scriptBody: e.target.value })}
 placeholder="// JavaScript expression\nreturn context.entity.priority === 'high';"
 rows={4}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 );

 case 'external_task':
 return (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الموضوع (Topic)' : 'Topic'}</Label>
 <Input
 value={config.topic || ''}
 onChange={(e) => patch({ topic: e.target.value })}
 placeholder="send-invoice"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 );

 case 'custom':
 return (
 <div className="space-y-1.5">
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'اسم الدالة' : 'Function Name'}</Label>
 <Input
 value={config.functionName || ''}
 onChange={(e) => patch({ functionName: e.target.value })}
 placeholder="customHandler"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'معلمات (JSON)' : 'Params (JSON)'}</Label>
 <textarea
 value={JSON.stringify(config.params || {}, null, 2)}
 onChange={(e) => {
 try { patch({ params: JSON.parse(e.target.value) }); } catch { /* keep typing */ }
 }}
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 </div>
 );

 default:
 return (
 <p className="text-[10px] text-muted-foreground italic">
 {isAr ? 'لا يوجد إعدادات لهذا النوع' : 'No configuration for this action type'}
 </p>
 );
 }
}
