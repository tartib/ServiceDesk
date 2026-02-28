'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Trash2 } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

interface WFPropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeChange: (id: string, data: Record<string, unknown>) => void;
  onEdgeChange: (id: string, data: Partial<Edge>) => void;
  onDeleteNode?: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
}

const nodeTypeLabels: Record<string, { en: string; ar: string }> = {
  wfStart: { en: 'Start', ar: 'بداية' },
  wfEnd: { en: 'End', ar: 'نهاية' },
  wfState: { en: 'State', ar: 'حالة' },
  wfApproval: { en: 'Approval', ar: 'موافقة' },
  wfCondition: { en: 'Condition', ar: 'شرط' },
  wfFork: { en: 'Fork (Parallel)', ar: 'تفرع (متوازي)' },
  wfJoin: { en: 'Join (Merge)', ar: 'انضمام (دمج)' },
  wfTimer: { en: 'Timer', ar: 'مؤقت' },
  wfExternalTask: { en: 'External Task', ar: 'مهمة خارجية' },
};

const categoryOptions = [
  { value: 'todo', labelEn: 'To Do', labelAr: 'قيد الانتظار' },
  { value: 'in_progress', labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
  { value: 'done', labelEn: 'Done', labelAr: 'مكتمل' },
  { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغى' },
];

const joinStrategyOptions = [
  { value: 'all', labelEn: 'All branches', labelAr: 'جميع الفروع' },
  { value: 'any', labelEn: 'Any branch', labelAr: 'أي فرع' },
  { value: 'count', labelEn: 'Count', labelAr: 'عدد محدد' },
];

export default function WFPropertiesPanel({
  selectedNode,
  selectedEdge,
  onNodeChange,
  onEdgeChange,
  onDeleteNode,
  onDeleteEdge,
}: WFPropertiesPanelProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // ============================================
  // Empty state
  // ============================================
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-72 bg-white border-s border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            {isAr ? 'الخصائص' : 'Properties'}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Settings className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {isAr
                ? 'حدد عنصر لتعديل خصائصه'
                : 'Select an element to edit its properties'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Edge properties
  // ============================================
  if (selectedEdge) {
    return (
      <div className="w-72 bg-white border-s border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {isAr ? 'خصائص الانتقال' : 'Transition Properties'}
          </h3>
          {onDeleteEdge && (
            <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="p-1 text-red-400 hover:text-red-600 rounded"
              title={isAr ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label htmlFor="edge-label" className="text-xs text-gray-500">
              {isAr ? 'اسم الانتقال' : 'Transition Name'}
            </Label>
            <Input
              id="edge-label"
              value={String(selectedEdge.label || '')}
              onChange={(e) => onEdgeChange(selectedEdge.id, { label: e.target.value })}
              placeholder={isAr ? 'مثال: موافقة' : 'e.g. Approve'}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500">
              {isAr ? 'خط متحرك' : 'Animated'}
            </Label>
            <button
              onClick={() => onEdgeChange(selectedEdge.id, { animated: !selectedEdge.animated })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                selectedEdge.animated ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  selectedEdge.animated ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div>
              <Label className="text-xs text-gray-500">{isAr ? 'من' : 'From'}</Label>
              <p className="text-sm text-gray-700 mt-0.5 font-mono">{selectedEdge.source}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{isAr ? 'إلى' : 'To'}</Label>
              <p className="text-sm text-gray-700 mt-0.5 font-mono">{selectedEdge.target}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Node properties
  // ============================================
  if (!selectedNode) return null;
  const nodeData = selectedNode.data as Record<string, unknown>;
  const nodeType = selectedNode.type || '';
  const typeLabel = nodeTypeLabels[nodeType];
  const isStateOrApproval = ['wfState', 'wfApproval'].includes(nodeType);
  const isJoin = nodeType === 'wfJoin';
  const isTimer = nodeType === 'wfTimer';
  const isExternalTask = nodeType === 'wfExternalTask';

  return (
    <div className="w-72 bg-white border-s border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {isAr ? 'خصائص العنصر' : 'Element Properties'}
        </h3>
        {onDeleteNode && (
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="p-1 text-red-400 hover:text-red-600 rounded"
            title={isAr ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type */}
        <div>
          <Label className="text-xs text-gray-500">
            {isAr ? 'النوع' : 'Type'}
          </Label>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {typeLabel ? (isAr ? typeLabel.ar : typeLabel.en) : nodeType}
          </p>
        </div>

        {/* Label (for state, approval) */}
        {isStateOrApproval && (
          <>
            <div>
              <Label htmlFor="node-label" className="text-xs text-gray-500">
                {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
              </Label>
              <Input
                id="node-label"
                value={String(nodeData.label || '')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, label: e.target.value })}
                placeholder={isAr ? 'مثال: Open' : 'e.g. Open'}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="node-label-ar" className="text-xs text-gray-500">
                {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
              </Label>
              <Input
                id="node-label-ar"
                value={String(nodeData.nameAr || '')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, nameAr: e.target.value })}
                placeholder={isAr ? 'مثال: مفتوح' : 'e.g. مفتوح'}
                className="mt-1"
                dir="rtl"
              />
            </div>

            {/* State Code */}
            <div>
              <Label htmlFor="node-code" className="text-xs text-gray-500">
                {isAr ? 'الكود' : 'Code'}
              </Label>
              <Input
                id="node-code"
                value={String(nodeData.code || '')}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                placeholder="open, in_review, done"
                className="mt-1 font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="node-category" className="text-xs text-gray-500">
                {isAr ? 'التصنيف' : 'Category'}
              </Label>
              <select
                id="node-category"
                value={String(nodeData.category || 'in_progress')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, category: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="node-color" className="text-xs text-gray-500">
                {isAr ? 'اللون' : 'Color'}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="node-color"
                  type="color"
                  value={String(nodeData.color || '#3B82F6')}
                  onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-400 font-mono">
                  {String(nodeData.color || '#3B82F6')}
                </span>
              </div>
            </div>

            {/* SLA Hours */}
            <div className="pt-2 border-t border-gray-100">
              <Label htmlFor="node-sla" className="text-xs text-gray-500">
                {isAr ? 'SLA (ساعات)' : 'SLA (hours)'}
              </Label>
              <Input
                id="node-sla"
                type="number"
                min={0}
                value={String(
                  (nodeData.sla as Record<string, unknown>)?.resolutionHours || ''
                )}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    sla: {
                      ...((nodeData.sla as Record<string, unknown>) || {}),
                      resolutionHours: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                placeholder={isAr ? 'اختياري' : 'Optional'}
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Join Strategy */}
        {isJoin && (
          <div>
            <Label htmlFor="join-strategy" className="text-xs text-gray-500">
              {isAr ? 'استراتيجية الانضمام' : 'Join Strategy'}
            </Label>
            <select
              id="join-strategy"
              value={String(nodeData.joinStrategy || 'all')}
              onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, joinStrategy: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {joinStrategyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timer Hours */}
        {isTimer && (
          <div>
            <Label htmlFor="timer-hours" className="text-xs text-gray-500">
              {isAr ? 'المدة (ساعات)' : 'Duration (hours)'}
            </Label>
            <Input
              id="timer-hours"
              type="number"
              min={0}
              step={0.5}
              value={String(nodeData.hours || '')}
              onChange={(e) =>
                onNodeChange(selectedNode.id, {
                  ...nodeData,
                  hours: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="24"
              className="mt-1"
            />
          </div>
        )}

        {/* External Task Config */}
        {isExternalTask && (
          <>
            <div>
              <Label htmlFor="ext-label" className="text-xs text-gray-500">
                {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
              </Label>
              <Input
                id="ext-label"
                value={String(nodeData.label || '')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, label: e.target.value })}
                placeholder={isAr ? 'مثال: Send Invoice' : 'e.g. Send Invoice'}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ext-label-ar" className="text-xs text-gray-500">
                {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
              </Label>
              <Input
                id="ext-label-ar"
                value={String(nodeData.nameAr || '')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, nameAr: e.target.value })}
                placeholder={isAr ? 'مثال: إرسال فاتورة' : 'e.g. إرسال فاتورة'}
                className="mt-1"
                dir="rtl"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Label htmlFor="ext-topic" className="text-xs text-gray-500">
                {isAr ? 'الموضوع (Topic)' : 'Topic'} *
              </Label>
              <Input
                id="ext-topic"
                value={String(nodeData.topic || '')}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    topic: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                placeholder="send-invoice, validate-payment"
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="ext-retries" className="text-xs text-gray-500">
                {isAr ? 'عدد المحاولات' : 'Retries'}
              </Label>
              <Input
                id="ext-retries"
                type="number"
                min={0}
                max={10}
                value={String(nodeData.retries ?? 3)}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    retries: e.target.value ? Number(e.target.value) : 3,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ext-timeout" className="text-xs text-gray-500">
                {isAr ? 'مدة القفل (ثواني)' : 'Lock Timeout (seconds)'}
              </Label>
              <Input
                id="ext-timeout"
                type="number"
                min={10}
                value={String(nodeData.timeout ?? 300)}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    timeout: e.target.value ? Number(e.target.value) : 300,
                  })
                }
                placeholder="300"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ext-priority" className="text-xs text-gray-500">
                {isAr ? 'الأولوية' : 'Priority'}
              </Label>
              <Input
                id="ext-priority"
                type="number"
                min={0}
                value={String(nodeData.priority ?? 0)}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, {
                    ...nodeData,
                    priority: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ext-error-handling" className="text-xs text-gray-500">
                {isAr ? 'عند الفشل' : 'Error Handling'}
              </Label>
              <select
                id="ext-error-handling"
                value={String(nodeData.errorHandling || 'retry')}
                onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, errorHandling: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="retry">{isAr ? 'إعادة المحاولة' : 'Retry'}</option>
                <option value="fail_instance">{isAr ? 'إنهاء سير العمل' : 'Fail Instance'}</option>
                <option value="skip">{isAr ? 'تخطي' : 'Skip'}</option>
              </select>
            </div>
          </>
        )}

        {/* Position (read-only) */}
        <div className="pt-2 border-t border-gray-100">
          <Label className="text-xs text-gray-500">
            {isAr ? 'الموقع' : 'Position'}
          </Label>
          <div className="flex gap-4 mt-1">
            <div>
              <span className="text-[10px] text-gray-400">X</span>
              <p className="text-sm text-gray-600">{Math.round(selectedNode.position.x)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400">Y</span>
              <p className="text-sm text-gray-600">{Math.round(selectedNode.position.y)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
