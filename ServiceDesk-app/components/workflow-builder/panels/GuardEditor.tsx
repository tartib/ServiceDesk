'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';

// ============================================
// Types — mirrors backend WFGuardType / WFGuardOperator
// ============================================

export type GuardType = 'role' | 'field_value' | 'approval_status' | 'expression' | 'time_window' | 'custom_function';

export type GuardOperator =
 | 'equals' | 'not_equals' | 'contains' | 'not_contains'
 | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal'
 | 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | 'between' | 'matches_regex';

export interface GuardConfig {
 roles?: string[];
 fieldPath?: string;
 operator?: GuardOperator;
 value?: unknown;
 expression?: string;
 afterHours?: number;
 beforeHours?: number;
 workingHoursOnly?: boolean;
 functionName?: string;
 params?: Record<string, unknown>;
}

export interface Guard {
 guardId: string;
 type: GuardType;
 config: GuardConfig;
 errorMessage?: string;
 errorMessageAr?: string;
}

// ============================================
// Constants
// ============================================

const GUARD_TYPES: { value: GuardType; labelEn: string; labelAr: string }[] = [
 { value: 'role', labelEn: 'Role', labelAr: 'دور' },
 { value: 'field_value', labelEn: 'Field Value', labelAr: 'قيمة حقل' },
 { value: 'expression', labelEn: 'Expression', labelAr: 'تعبير' },
 { value: 'time_window', labelEn: 'Time Window', labelAr: 'نافذة زمنية' },
 { value: 'approval_status', labelEn: 'Approval Status', labelAr: 'حالة الموافقة' },
 { value: 'custom_function', labelEn: 'Custom Function', labelAr: 'دالة مخصصة' },
];

const OPERATORS: { value: GuardOperator; labelEn: string }[] = [
 { value: 'equals', labelEn: '=' },
 { value: 'not_equals', labelEn: '≠' },
 { value: 'contains', labelEn: 'Contains' },
 { value: 'not_contains', labelEn: 'Not Contains' },
 { value: 'greater_than', labelEn: '>' },
 { value: 'less_than', labelEn: '<' },
 { value: 'greater_or_equal', labelEn: '≥' },
 { value: 'less_or_equal', labelEn: '≤' },
 { value: 'in', labelEn: 'In' },
 { value: 'not_in', labelEn: 'Not In' },
 { value: 'is_empty', labelEn: 'Is Empty' },
 { value: 'is_not_empty', labelEn: 'Not Empty' },
 { value: 'between', labelEn: 'Between' },
 { value: 'matches_regex', labelEn: 'Regex' },
];

// ============================================
// Component
// ============================================

interface GuardEditorProps {
 guards: Guard[];
 onChange: (guards: Guard[]) => void;
 isAr: boolean;
}

export default function GuardEditor({ guards, onChange, isAr }: GuardEditorProps) {
 const addGuard = useCallback(() => {
 onChange([
 ...guards,
 {
 guardId: `guard_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
 type: 'role',
 config: { roles: [] },
 errorMessage: '',
 },
 ]);
 }, [guards, onChange]);

 const removeGuard = useCallback(
 (idx: number) => {
 onChange(guards.filter((_, i) => i !== idx));
 },
 [guards, onChange]
 );

 const updateGuard = useCallback(
 (idx: number, patch: Partial<Guard>) => {
 onChange(guards.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
 },
 [guards, onChange]
 );

 const updateConfig = useCallback(
 (idx: number, configPatch: Partial<GuardConfig>) => {
 onChange(
 guards.map((g, i) =>
 i === idx ? { ...g, config: { ...g.config, ...configPatch } } : g
 )
 );
 },
 [guards, onChange]
 );

 const changeType = useCallback(
 (idx: number, newType: GuardType) => {
 const defaultConfigs: Record<GuardType, GuardConfig> = {
 role: { roles: [] },
 field_value: { fieldPath: '', operator: 'equals', value: '' },
 expression: { expression: '' },
 time_window: { afterHours: 0, beforeHours: 0, workingHoursOnly: false },
 approval_status: {},
 custom_function: { functionName: '', params: {} },
 };
 onChange(
 guards.map((g, i) =>
 i === idx ? { ...g, type: newType, config: defaultConfigs[newType] } : g
 )
 );
 },
 [guards, onChange]
 );

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label className="text-xs text-muted-foreground flex items-center gap-1">
 <ShieldCheck className="w-3.5 h-3.5" />
 {isAr ? 'الحراس (شروط)' : 'Guards (Conditions)'}
 </Label>
 <button
 type="button"
 onClick={addGuard}
 className="flex items-center gap-1 text-xs text-brand hover:text-brand-strong"
 >
 <Plus className="w-3 h-3" />
 {isAr ? 'إضافة' : 'Add'}
 </button>
 </div>

 {guards.length === 0 && (
 <p className="text-[11px] text-muted-foreground italic">
 {isAr ? 'لا توجد شروط — الانتقال متاح للجميع' : 'No guards — transition is open to all'}
 </p>
 )}

 {guards.map((guard, idx) => (
 <div
 key={guard.guardId}
 className="border border-border rounded-lg p-2.5 space-y-2 bg-muted/50/50"
 >
 {/* Header: type + delete */}
 <div className="flex items-center gap-2">
 <select
 value={guard.type}
 onChange={(e) => changeType(idx, e.target.value as GuardType)}
 className="flex-1 h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 >
 {GUARD_TYPES.map((t) => (
 <option key={t.value} value={t.value}>
 {isAr ? t.labelAr : t.labelEn}
 </option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => removeGuard(idx)}
 className="p-1 text-destructive hover:text-destructive rounded"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Dynamic config per type */}
 {guard.type === 'role' && (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'الأدوار (فاصلة)' : 'Roles (comma-separated)'}</Label>
 <Input
 value={(guard.config.roles || []).join(', ')}
 onChange={(e) =>
 updateConfig(idx, {
 roles: e.target.value
 .split(',')
 .map((r) => r.trim())
 .filter(Boolean),
 })
 }
 placeholder="admin, manager, technician"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 )}

 {guard.type === 'field_value' && (
 <>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'مسار الحقل' : 'Field Path'}</Label>
 <Input
 value={guard.config.fieldPath || ''}
 onChange={(e) => updateConfig(idx, { fieldPath: e.target.value })}
 placeholder="entity.priority"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'العامل' : 'Operator'}</Label>
 <select
 value={guard.config.operator || 'equals'}
 onChange={(e) => updateConfig(idx, { operator: e.target.value as GuardOperator })}
 className="w-full h-7 rounded border border-border bg-background px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
 >
 {OPERATORS.map((op) => (
 <option key={op.value} value={op.value}>
 {op.labelEn}
 </option>
 ))}
 </select>
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'القيمة' : 'Value'}</Label>
 <Input
 value={String(guard.config.value ?? '')}
 onChange={(e) => updateConfig(idx, { value: e.target.value })}
 placeholder="high"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 </>
 )}

 {guard.type === 'expression' && (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'التعبير' : 'Expression'}</Label>
 <textarea
 value={guard.config.expression || ''}
 onChange={(e) => updateConfig(idx, { expression: e.target.value })}
 placeholder="entity.priority === 'high' && actor.roles.includes('manager')"
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 )}

 {guard.type === 'time_window' && (
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'بعد (ساعات)' : 'After (hrs)'}</Label>
 <Input
 type="number"
 min={0}
 value={guard.config.afterHours ?? ''}
 onChange={(e) =>
 updateConfig(idx, { afterHours: e.target.value ? Number(e.target.value) : undefined })
 }
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'قبل (ساعات)' : 'Before (hrs)'}</Label>
 <Input
 type="number"
 min={0}
 value={guard.config.beforeHours ?? ''}
 onChange={(e) =>
 updateConfig(idx, { beforeHours: e.target.value ? Number(e.target.value) : undefined })
 }
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 )}

 {guard.type === 'custom_function' && (
 <>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'اسم الدالة' : 'Function Name'}</Label>
 <Input
 value={guard.config.functionName || ''}
 onChange={(e) => updateConfig(idx, { functionName: e.target.value })}
 placeholder="validateApproval"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'معلمات (JSON)' : 'Params (JSON)'}</Label>
 <Input
 value={JSON.stringify(guard.config.params || {})}
 onChange={(e) => {
 try {
 updateConfig(idx, { params: JSON.parse(e.target.value) });
 } catch {
 // invalid JSON, keep typing
 }
 }}
 placeholder='{"key": "value"}'
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 </>
 )}

 {/* Error message */}
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'رسالة الخطأ' : 'Error Message'}</Label>
 <Input
 value={guard.errorMessage || ''}
 onChange={(e) => updateGuard(idx, { errorMessage: e.target.value })}
 placeholder={isAr ? 'يجب أن تكون مديرًا' : 'Must be a manager'}
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 ))}
 </div>
 );
}
