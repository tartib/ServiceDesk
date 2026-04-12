'use client';

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import ActionConfigForm, { ACTION_TYPES, type ActionType, type ActionConfig } from './ActionConfigForm';

// ============================================
// Types
// ============================================

export interface WFAction {
 actionId: string;
 type: ActionType;
 config: ActionConfig;
 order: number;
 retryOnFailure?: boolean;
 maxRetries?: number;
 continueOnError?: boolean;
}

// ============================================
// Component
// ============================================

interface ActionEditorProps {
 actions: WFAction[];
 onChange: (actions: WFAction[]) => void;
 isAr: boolean;
 label?: string;
 labelAr?: string;
}

export default function ActionEditor({
 actions,
 onChange,
 isAr,
 label = 'Post-Functions',
 labelAr = 'إجراءات تلقائية',
}: ActionEditorProps) {
 const addAction = useCallback(() => {
 const nextOrder = actions.length > 0 ? Math.max(...actions.map((a) => a.order)) + 1 : 1;
 onChange([
 ...actions,
 {
 actionId: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
 type: 'set_field',
 config: { fieldPath: '', value: '', operation: 'set' },
 order: nextOrder,
 retryOnFailure: false,
 continueOnError: false,
 },
 ]);
 }, [actions, onChange]);

 const removeAction = useCallback(
 (idx: number) => {
 const updated = actions.filter((_, i) => i !== idx);
 onChange(updated.map((a, i) => ({ ...a, order: i + 1 })));
 },
 [actions, onChange]
 );

 const updateAction = useCallback(
 (idx: number, patch: Partial<WFAction>) => {
 onChange(actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
 },
 [actions, onChange]
 );

 const updateConfig = useCallback(
 (idx: number, config: ActionConfig) => {
 onChange(actions.map((a, i) => (i === idx ? { ...a, config } : a)));
 },
 [actions, onChange]
 );

 const changeType = useCallback(
 (idx: number, newType: ActionType) => {
 onChange(
 actions.map((a, i) => (i === idx ? { ...a, type: newType, config: {} } : a))
 );
 },
 [actions, onChange]
 );

 const moveUp = useCallback(
 (idx: number) => {
 if (idx <= 0) return;
 const arr = [...actions];
 [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
 onChange(arr.map((a, i) => ({ ...a, order: i + 1 })));
 },
 [actions, onChange]
 );

 const moveDown = useCallback(
 (idx: number) => {
 if (idx >= actions.length - 1) return;
 const arr = [...actions];
 [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
 onChange(arr.map((a, i) => ({ ...a, order: i + 1 })));
 },
 [actions, onChange]
 );

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label className="text-xs text-muted-foreground flex items-center gap-1">
 <Zap className="w-3.5 h-3.5" />
 {isAr ? labelAr : label}
 </Label>
 <button
 type="button"
 onClick={addAction}
 className="flex items-center gap-1 text-xs text-brand hover:text-brand-strong"
 >
 <Plus className="w-3 h-3" />
 {isAr ? 'إضافة' : 'Add'}
 </button>
 </div>

 {actions.length === 0 && (
 <p className="text-[11px] text-muted-foreground italic">
 {isAr ? 'لا توجد إجراءات' : 'No actions configured'}
 </p>
 )}

 {actions.map((action, idx) => (
 <div
 key={action.actionId}
 className="border border-border rounded-lg p-2.5 space-y-2 bg-muted/50/50"
 >
 {/* Header: order badge + type + move + delete */}
 <div className="flex items-center gap-1.5">
 <span className="shrink-0 w-5 h-5 rounded-full bg-brand-soft text-brand flex items-center justify-center text-[10px] font-bold">
 {idx + 1}
 </span>
 <select
 value={action.type}
 onChange={(e) => changeType(idx, e.target.value as ActionType)}
 className="flex-1 h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 >
 {ACTION_TYPES.map((t) => (
 <option key={t.value} value={t.value}>
 {isAr ? t.labelAr : t.labelEn}
 </option>
 ))}
 </select>
 <div className="flex items-center">
 <button
 type="button"
 onClick={() => moveUp(idx)}
 disabled={idx === 0}
 className="p-0.5 text-muted-foreground hover:text-muted-foreground disabled:opacity-30"
 >
 <ChevronUp className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => moveDown(idx)}
 disabled={idx === actions.length - 1}
 className="p-0.5 text-muted-foreground hover:text-muted-foreground disabled:opacity-30"
 >
 <ChevronDown className="w-3.5 h-3.5" />
 </button>
 </div>
 <button
 type="button"
 onClick={() => removeAction(idx)}
 className="p-1 text-destructive hover:text-destructive rounded"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Per-type config form */}
 <ActionConfigForm
 actionType={action.type}
 config={action.config}
 onChange={(config) => updateConfig(idx, config)}
 isAr={isAr}
 />

 {/* Options row */}
 <div className="flex items-center gap-3 pt-1 border-t border-border">
 <label className="flex items-center gap-1.5">
 <input
 type="checkbox"
 checked={action.retryOnFailure ?? false}
 onChange={(e) => updateAction(idx, { retryOnFailure: e.target.checked })}
 className="h-3 w-3 rounded border-border"
 />
 <span className="text-[10px] text-muted-foreground">{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
 </label>
 {action.retryOnFailure && (
 <div className="flex items-center gap-1">
 <span className="text-[10px] text-muted-foreground">{isAr ? 'محاولات:' : 'Max:'}</span>
 <input
 type="number"
 min={1}
 max={5}
 value={action.maxRetries ?? 3}
 onChange={(e) => updateAction(idx, { maxRetries: Number(e.target.value) })}
 className="w-10 h-5 rounded border border-border bg-background px-1 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-ring"
 />
 </div>
 )}
 <label className="flex items-center gap-1.5">
 <input
 type="checkbox"
 checked={action.continueOnError ?? false}
 onChange={(e) => updateAction(idx, { continueOnError: e.target.checked })}
 className="h-3 w-3 rounded border-border"
 />
 <span className="text-[10px] text-muted-foreground">{isAr ? 'متابعة عند الخطأ' : 'Continue on error'}</span>
 </label>
 </div>
 </div>
 ))}
 </div>
 );
}
