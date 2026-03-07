'use client';

import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Filter } from 'lucide-react';
import type { RuleCondition, RuleConditionGroup, RuleOperator } from '@/hooks/useAutomationRules';

// ============================================
// Constants
// ============================================

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_or_equal', label: '≥' },
  { value: 'less_or_equal', label: '≤' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Not Empty' },
  { value: 'matches_regex', label: 'Regex' },
  { value: 'is_true', label: 'Is True' },
  { value: 'is_false', label: 'Is False' },
];

const VALUE_TYPES: { value: RuleCondition['valueType']; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'array', label: 'Array' },
];

const COMMON_FIELDS = [
  'entity.status',
  'entity.priority',
  'entity.category',
  'entity.type',
  'entity.assigneeId',
  'entity.requesterId',
  'entity.department',
  'entity.service',
  'entity.tags',
  'entity.createdAt',
  'entity.updatedAt',
  'actor.role',
  'actor.department',
];

// ============================================
// Component
// ============================================

interface ConditionBuilderProps {
  rootOperator: 'AND' | 'OR';
  groups: RuleConditionGroup[];
  onRootOperatorChange: (op: 'AND' | 'OR') => void;
  onGroupsChange: (groups: RuleConditionGroup[]) => void;
  isAr: boolean;
}

export default function ConditionBuilder({
  rootOperator,
  groups,
  onRootOperatorChange,
  onGroupsChange,
  isAr,
}: ConditionBuilderProps) {
  // For MVP: single flat group (no nested groups)
  // If no groups, initialize one
  const activeGroup: RuleConditionGroup = useMemo(
    () => groups[0] || { operator: 'AND' as const, conditions: [] },
    [groups]
  );

  const updateConditions = useCallback(
    (conditions: RuleCondition[]) => {
      onGroupsChange([{ ...activeGroup, conditions }]);
    },
    [activeGroup, onGroupsChange]
  );

  const addCondition = useCallback(() => {
    updateConditions([
      ...activeGroup.conditions,
      { field: '', operator: 'equals', value: '', valueType: 'string' },
    ]);
  }, [activeGroup.conditions, updateConditions]);

  const removeCondition = useCallback(
    (idx: number) => {
      updateConditions(activeGroup.conditions.filter((_, i) => i !== idx));
    },
    [activeGroup.conditions, updateConditions]
  );

  const updateCondition = useCallback(
    (idx: number, patch: Partial<RuleCondition>) => {
      updateConditions(
        activeGroup.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c))
      );
    },
    [activeGroup.conditions, updateConditions]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Filter className="w-4 h-4" />
          {isAr ? 'الشروط' : 'Conditions'}
        </Label>
        <button
          type="button"
          onClick={addCondition}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-3 h-3" />
          {isAr ? 'إضافة شرط' : 'Add Condition'}
        </button>
      </div>

      {/* Root operator toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{isAr ? 'تطابق' : 'Match'}:</span>
        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onRootOperatorChange('AND')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              rootOperator === 'AND'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isAr ? 'الكل (AND)' : 'ALL (AND)'}
          </button>
          <button
            type="button"
            onClick={() => onRootOperatorChange('OR')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              rootOperator === 'OR'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isAr ? 'أي (OR)' : 'ANY (OR)'}
          </button>
        </div>
      </div>

      {/* Conditions list */}
      {activeGroup.conditions.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          {isAr
            ? 'لا توجد شروط — سيتم تنفيذ القاعدة دائمًا عند التفعيل'
            : 'No conditions — rule will always execute when triggered'}
        </p>
      )}

      {activeGroup.conditions.map((condition, idx) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50"
        >
          {/* Connector label between conditions */}
          {idx > 0 && (
            <div className="flex justify-center -mt-5 mb-1">
              <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                {rootOperator}
              </span>
            </div>
          )}

          {/* Field */}
          <div>
            <Label className="text-[10px] text-gray-400">{isAr ? 'الحقل' : 'Field'}</Label>
            <div className="flex gap-1.5 mt-0.5">
              <Input
                value={condition.field}
                onChange={(e) => updateCondition(idx, { field: e.target.value })}
                placeholder="entity.priority"
                className="h-8 text-xs font-mono flex-1"
                list={`field-suggestions-${idx}`}
              />
              <datalist id={`field-suggestions-${idx}`}>
                {COMMON_FIELDS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="p-1.5 text-red-400 hover:text-red-600 rounded shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Operator + Value */}
          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <Label className="text-[10px] text-gray-400">{isAr ? 'العامل' : 'Operator'}</Label>
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(idx, { operator: e.target.value as RuleOperator })}
                className="w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-[10px] text-gray-400">{isAr ? 'القيمة' : 'Value'}</Label>
              <Input
                value={String(condition.value ?? '')}
                onChange={(e) => updateCondition(idx, { value: e.target.value })}
                placeholder="high"
                className="h-8 text-xs mt-0.5"
              />
            </div>
          </div>

          {/* Value type */}
          <div>
            <Label className="text-[10px] text-gray-400">{isAr ? 'نوع القيمة' : 'Value Type'}</Label>
            <select
              value={condition.valueType}
              onChange={(e) =>
                updateCondition(idx, { valueType: e.target.value as RuleCondition['valueType'] })
              }
              className="w-full h-7 rounded border border-gray-300 bg-white px-2 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {VALUE_TYPES.map((vt) => (
                <option key={vt.value} value={vt.value}>
                  {vt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
