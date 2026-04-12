'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import type { GuardOperator } from './GuardEditor';

// ============================================
// Types — mirrors backend IWFValidator
// ============================================

export type ValidatorType = 'required_field' | 'field_value' | 'expression' | 'custom';

export interface ValidatorConfig {
 fieldPath?: string;
 operator?: GuardOperator;
 value?: unknown;
 expression?: string;
 functionName?: string;
}

export interface Validator {
 validatorId: string;
 type: ValidatorType;
 config: ValidatorConfig;
 errorMessage: string;
 errorMessageAr?: string;
}

// ============================================
// Constants
// ============================================

const VALIDATOR_TYPES: { value: ValidatorType; labelEn: string; labelAr: string }[] = [
 { value: 'required_field', labelEn: 'Required Field', labelAr: 'حقل مطلوب' },
 { value: 'field_value', labelEn: 'Field Value', labelAr: 'قيمة حقل' },
 { value: 'expression', labelEn: 'Expression', labelAr: 'تعبير' },
 { value: 'custom', labelEn: 'Custom', labelAr: 'مخصص' },
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
 { value: 'matches_regex', labelEn: 'Regex' },
];

// ============================================
// Component
// ============================================

interface ValidatorEditorProps {
 validators: Validator[];
 onChange: (validators: Validator[]) => void;
 isAr: boolean;
}

export default function ValidatorEditor({ validators, onChange, isAr }: ValidatorEditorProps) {
 const addValidator = useCallback(() => {
 onChange([
 ...validators,
 {
 validatorId: `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
 type: 'required_field',
 config: { fieldPath: '' },
 errorMessage: '',
 },
 ]);
 }, [validators, onChange]);

 const removeValidator = useCallback(
 (idx: number) => {
 onChange(validators.filter((_, i) => i !== idx));
 },
 [validators, onChange]
 );

 const updateValidator = useCallback(
 (idx: number, patch: Partial<Validator>) => {
 onChange(validators.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
 },
 [validators, onChange]
 );

 const updateConfig = useCallback(
 (idx: number, configPatch: Partial<ValidatorConfig>) => {
 onChange(
 validators.map((v, i) =>
 i === idx ? { ...v, config: { ...v.config, ...configPatch } } : v
 )
 );
 },
 [validators, onChange]
 );

 const changeType = useCallback(
 (idx: number, newType: ValidatorType) => {
 const defaultConfigs: Record<ValidatorType, ValidatorConfig> = {
 required_field: { fieldPath: '' },
 field_value: { fieldPath: '', operator: 'equals', value: '' },
 expression: { expression: '' },
 custom: { functionName: '' },
 };
 onChange(
 validators.map((v, i) =>
 i === idx ? { ...v, type: newType, config: defaultConfigs[newType] } : v
 )
 );
 },
 [validators, onChange]
 );

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label className="text-xs text-muted-foreground flex items-center gap-1">
 <CheckSquare className="w-3.5 h-3.5" />
 {isAr ? 'المدققات' : 'Validators'}
 </Label>
 <button
 type="button"
 onClick={addValidator}
 className="flex items-center gap-1 text-xs text-brand hover:text-brand-strong"
 >
 <Plus className="w-3 h-3" />
 {isAr ? 'إضافة' : 'Add'}
 </button>
 </div>

 {validators.length === 0 && (
 <p className="text-[11px] text-muted-foreground italic">
 {isAr ? 'لا توجد مدققات' : 'No validators'}
 </p>
 )}

 {validators.map((validator, idx) => (
 <div
 key={validator.validatorId}
 className="border border-border rounded-lg p-2.5 space-y-2 bg-muted/50/50"
 >
 {/* Header: type + delete */}
 <div className="flex items-center gap-2">
 <select
 value={validator.type}
 onChange={(e) => changeType(idx, e.target.value as ValidatorType)}
 className="flex-1 h-7 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 >
 {VALIDATOR_TYPES.map((t) => (
 <option key={t.value} value={t.value}>
 {isAr ? t.labelAr : t.labelEn}
 </option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => removeValidator(idx)}
 className="p-1 text-destructive hover:text-destructive rounded"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Dynamic config per type */}
 {validator.type === 'required_field' && (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'مسار الحقل' : 'Field Path'}</Label>
 <Input
 value={validator.config.fieldPath || ''}
 onChange={(e) => updateConfig(idx, { fieldPath: e.target.value })}
 placeholder="entity.description"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 )}

 {validator.type === 'field_value' && (
 <>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'مسار الحقل' : 'Field Path'}</Label>
 <Input
 value={validator.config.fieldPath || ''}
 onChange={(e) => updateConfig(idx, { fieldPath: e.target.value })}
 placeholder="entity.priority"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1">
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'العامل' : 'Operator'}</Label>
 <select
 value={validator.config.operator || 'equals'}
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
 value={String(validator.config.value ?? '')}
 onChange={(e) => updateConfig(idx, { value: e.target.value })}
 placeholder="high"
 className="h-7 text-xs mt-0.5"
 />
 </div>
 </div>
 </>
 )}

 {validator.type === 'expression' && (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'التعبير' : 'Expression'}</Label>
 <textarea
 value={validator.config.expression || ''}
 onChange={(e) => updateConfig(idx, { expression: e.target.value })}
 placeholder="entity.estimatedHours > 0"
 rows={2}
 className="w-full rounded border border-border bg-background px-2 py-1 text-xs mt-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
 />
 </div>
 )}

 {validator.type === 'custom' && (
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'اسم الدالة' : 'Function Name'}</Label>
 <Input
 value={validator.config.functionName || ''}
 onChange={(e) => updateConfig(idx, { functionName: e.target.value })}
 placeholder="validateBudget"
 className="h-7 text-xs mt-0.5 font-mono"
 />
 </div>
 )}

 {/* Error messages */}
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'رسالة الخطأ (EN)' : 'Error Message (EN)'}</Label>
 <Input
 value={validator.errorMessage || ''}
 onChange={(e) => updateValidator(idx, { errorMessage: e.target.value })}
 placeholder={isAr ? 'الوصف مطلوب' : 'Description is required'}
 className="h-7 text-xs mt-0.5"
 />
 </div>
 <div>
 <Label className="text-[10px] text-muted-foreground">{isAr ? 'رسالة الخطأ (AR)' : 'Error Message (AR)'}</Label>
 <Input
 value={validator.errorMessageAr || ''}
 onChange={(e) => updateValidator(idx, { errorMessageAr: e.target.value })}
 placeholder="الوصف مطلوب"
 className="h-7 text-xs mt-0.5"
 dir="rtl"
 />
 </div>
 </div>
 ))}
 </div>
 );
}
