'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Trash2, ChevronDown, ChevronRight, Link2 } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import GuardEditor, { type Guard } from './GuardEditor';
import ValidatorEditor, { type Validator } from './ValidatorEditor';
import ActionEditor, { type WFAction } from './ActionEditor';

interface WFPropertiesPanelProps {
  nodes?: Node[];
  edges?: Edge[];
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeChange: (id: string, data: Record<string, unknown>) => void;
  onEdgeChange: (id: string, data: Partial<Edge>) => void;
  onDeleteNode?: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  onAddEdge?: (edge: Edge) => void;
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

// ============================================
// Collapsible Section helper
// ============================================

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 w-full text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className="text-xs font-medium text-gray-700">{title}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ============================================
// Toggle switch helper
// ============================================

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs text-gray-500">{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================
// Edge data helpers
// ============================================

function getEdgeData(edge: Edge): Record<string, unknown> {
  return (edge.data || {}) as Record<string, unknown>;
}

function getEdgeGuards(edge: Edge): Guard[] {
  const d = getEdgeData(edge);
  return Array.isArray(d.guards) ? (d.guards as Guard[]) : [];
}

function getEdgeValidators(edge: Edge): Validator[] {
  const d = getEdgeData(edge);
  return Array.isArray(d.validators) ? (d.validators as Validator[]) : [];
}

function getEdgeActions(edge: Edge): WFAction[] {
  const d = getEdgeData(edge);
  return Array.isArray(d.actions) ? (d.actions as WFAction[]) : [];
}

interface EdgeUIConfig {
  requireComment?: boolean;
  requireSignature?: boolean;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
  confirmationMessageAr?: string;
  buttonColor?: string;
}

function getEdgeUI(edge: Edge): EdgeUIConfig {
  const d = getEdgeData(edge);
  return (d.ui || {}) as EdgeUIConfig;
}

export default function WFPropertiesPanel({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  onNodeChange,
  onEdgeChange,
  onDeleteNode,
  onDeleteEdge,
  onAddEdge,
}: WFPropertiesPanelProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Resolve node ID → human-readable name
  const resolveNodeName = useCallback(
    (nodeId: string) => {
      if (!nodes) return nodeId;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return nodeId;
      const d = node.data as Record<string, unknown>;
      const label = d.label ? String(d.label) : '';
      const typeLabel = nodeTypeLabels[node.type || ''];
      if (label) return label;
      if (typeLabel) return isAr ? typeLabel.ar : typeLabel.en;
      return nodeId;
    },
    [nodes, isAr]
  );

  // Helper to update edge.data sub-fields without losing other edge props
  const patchEdgeData = useCallback(
    (edgeId: string, edge: Edge, patch: Record<string, unknown>) => {
      const prev = getEdgeData(edge);
      onEdgeChange(edgeId, { data: { ...prev, ...patch } } as Partial<Edge>);
    },
    [onEdgeChange]
  );

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
  // Edge properties (expanded with guards / validators / actions / UI config)
  // ============================================
  if (selectedEdge) {
    const edgeData = getEdgeData(selectedEdge);
    const edgeGuards = getEdgeGuards(selectedEdge);
    const edgeValidators = getEdgeValidators(selectedEdge);
    const edgeActions = getEdgeActions(selectedEdge);
    const edgeUI = getEdgeUI(selectedEdge);

    // Find grouped transitions (same transitionGroupId)
    const groupId = edgeData.transitionGroupId ? String(edgeData.transitionGroupId) : '';
    const groupedEdges = groupId && edges
      ? edges.filter((e) => {
          const d = getEdgeData(e);
          return d.transitionGroupId === groupId && e.id !== selectedEdge.id;
        })
      : [];

    // Available source nodes for "Add Source Status"
    const sourceNodeTypes = ['wfStart', 'wfState', 'wfApproval', 'wfCondition', 'wfFork', 'wfTimer', 'wfExternalTask'];
    const availableSourceNodes = nodes
      ? nodes.filter((n) => {
          if (!sourceNodeTypes.includes(n.type || '')) return false;
          // Exclude nodes that already have an edge to the same target
          const allGroupSources = [selectedEdge.source, ...groupedEdges.map((e) => e.source)];
          return !allGroupSources.includes(n.id);
        })
      : [];

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
          {/* Transition Name */}
          <div>
            <Label htmlFor="edge-label" className="text-xs text-gray-500">
              {isAr ? 'اسم الانتقال (إنجليزي)' : 'Transition Name'}
            </Label>
            <Input
              id="edge-label"
              value={String(selectedEdge.label || '')}
              onChange={(e) => onEdgeChange(selectedEdge.id, { label: e.target.value })}
              placeholder={isAr ? 'مثال: Approve' : 'e.g. Start Work, Resolve'}
              className="mt-1"
            />
          </div>

          {/* Transition Name (Arabic) */}
          <div>
            <Label htmlFor="edge-label-ar" className="text-xs text-gray-500">
              {isAr ? 'اسم الانتقال (عربي)' : 'Transition Name (Arabic)'}
            </Label>
            <Input
              id="edge-label-ar"
              value={String(edgeData.nameAr || '')}
              onChange={(e) => patchEdgeData(selectedEdge.id, selectedEdge, { nameAr: e.target.value })}
              placeholder={isAr ? 'مثال: بدء العمل، حل' : 'e.g. بدء العمل'}
              className="mt-1"
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="edge-desc" className="text-xs text-gray-500">
              {isAr ? 'الوصف' : 'Description'}
            </Label>
            <textarea
              id="edge-desc"
              value={String(edgeData.description || '')}
              onChange={(e) => patchEdgeData(selectedEdge.id, selectedEdge, { description: e.target.value })}
              placeholder={isAr ? 'وصف مختصر للانتقال' : 'Brief transition description'}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* From / To */}
          <div className="flex gap-3 text-xs">
            <div className="flex-1">
              <span className="text-gray-400">{isAr ? 'من' : 'From'}</span>
              <p className="text-gray-700 font-medium mt-0.5">{resolveNodeName(selectedEdge.source)}</p>
              <p className="text-gray-400 font-mono text-[10px]">{selectedEdge.source}</p>
            </div>
            <div className="flex items-center text-gray-300 pt-3">→</div>
            <div className="flex-1">
              <span className="text-gray-400">{isAr ? 'إلى' : 'To'}</span>
              <p className="text-gray-700 font-medium mt-0.5">{resolveNodeName(selectedEdge.target)}</p>
              <p className="text-gray-400 font-mono text-[10px]">{selectedEdge.target}</p>
            </div>
          </div>

          {/* === Shared Sources (multiple from-states) === */}
          {(groupedEdges.length > 0 || availableSourceNodes.length > 0) && (
            <CollapsibleSection
              title={isAr ? 'مصادر مشتركة' : 'Shared Sources'}
              defaultOpen={groupedEdges.length > 0}
            >
              <div className="space-y-2">
                {groupedEdges.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-400">
                      {isAr ? 'انتقالات مرتبطة بنفس المجموعة' : 'Other edges in this transition group'}
                    </Label>
                    {groupedEdges.map((ge) => (
                      <div
                        key={ge.id}
                        className="flex items-center gap-2 px-2 py-1.5 bg-blue-50/50 border border-blue-100 rounded text-xs"
                      >
                        <Link2 className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-gray-600 truncate">
                          {resolveNodeName(ge.source)} → {resolveNodeName(ge.target)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {availableSourceNodes.length > 0 && onAddEdge && (
                  <div>
                    <Label className="text-[10px] text-gray-400 mb-1 block">
                      {isAr ? 'إضافة حالة مصدر' : 'Add Source Status'}
                    </Label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const nodeId = e.target.value;
                        if (!nodeId) return;
                        const newGroupId = groupId || `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                        // If current edge has no group, assign one
                        if (!groupId) {
                          patchEdgeData(selectedEdge.id, selectedEdge, { transitionGroupId: newGroupId });
                        }
                        const newEdge: Edge = {
                          id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                          source: nodeId,
                          target: selectedEdge.target,
                          type: 'transition',
                          animated: selectedEdge.animated ?? false,
                          label: selectedEdge.label,
                          style: { strokeWidth: 2 },
                          data: {
                            guards: [...edgeGuards],
                            validators: [...edgeValidators],
                            actions: [...edgeActions],
                            ui: { ...edgeUI },
                            nameAr: edgeData.nameAr || '',
                            description: edgeData.description || '',
                            transitionGroupId: newGroupId,
                          },
                        };
                        onAddEdge(newEdge);
                        e.target.value = '';
                      }}
                      className="w-full h-7 rounded border border-gray-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">{isAr ? '— اختر حالة —' : '— Select status —'}</option>
                      {availableSourceNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {resolveNodeName(n.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* === Guards Section === */}
          <CollapsibleSection title={isAr ? 'الحراس (شروط الانتقال)' : 'Guards (Conditions)'}>
            <GuardEditor
              guards={edgeGuards}
              onChange={(guards) => patchEdgeData(selectedEdge.id, selectedEdge, { guards })}
              isAr={isAr}
            />
          </CollapsibleSection>

          {/* === Validators Section === */}
          <CollapsibleSection title={isAr ? 'المدققات' : 'Validators'}>
            <ValidatorEditor
              validators={edgeValidators}
              onChange={(validators) => patchEdgeData(selectedEdge.id, selectedEdge, { validators })}
              isAr={isAr}
            />
          </CollapsibleSection>

          {/* === Post-Functions (Actions) Section === */}
          <CollapsibleSection title={isAr ? 'إجراءات تلقائية' : 'Post-Functions (Actions)'}>
            <ActionEditor
              actions={edgeActions}
              onChange={(actions) => patchEdgeData(selectedEdge.id, selectedEdge, { actions })}
              isAr={isAr}
            />
          </CollapsibleSection>

          {/* === Transition UI Config Section === */}
          <CollapsibleSection title={isAr ? 'إعدادات الواجهة' : 'UI Config'}>
            <div className="space-y-2">
              <ToggleSwitch
                checked={edgeUI.requireComment ?? false}
                onChange={(v) =>
                  patchEdgeData(selectedEdge.id, selectedEdge, {
                    ui: { ...edgeUI, requireComment: v },
                  })
                }
                label={isAr ? 'يتطلب تعليق' : 'Require Comment'}
              />
              <ToggleSwitch
                checked={edgeUI.requireSignature ?? false}
                onChange={(v) =>
                  patchEdgeData(selectedEdge.id, selectedEdge, {
                    ui: { ...edgeUI, requireSignature: v },
                  })
                }
                label={isAr ? 'يتطلب توقيع' : 'Require Signature'}
              />
              <ToggleSwitch
                checked={edgeUI.confirmationRequired ?? false}
                onChange={(v) =>
                  patchEdgeData(selectedEdge.id, selectedEdge, {
                    ui: { ...edgeUI, confirmationRequired: v },
                  })
                }
                label={isAr ? 'يتطلب تأكيد' : 'Require Confirmation'}
              />
              {edgeUI.confirmationRequired && (
                <>
                  <div>
                    <Label className="text-[10px] text-gray-400">{isAr ? 'رسالة التأكيد (EN)' : 'Confirmation Msg (EN)'}</Label>
                    <Input
                      value={edgeUI.confirmationMessage || ''}
                      onChange={(e) =>
                        patchEdgeData(selectedEdge.id, selectedEdge, {
                          ui: { ...edgeUI, confirmationMessage: e.target.value },
                        })
                      }
                      placeholder="Are you sure?"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-400">{isAr ? 'رسالة التأكيد (AR)' : 'Confirmation Msg (AR)'}</Label>
                    <Input
                      value={edgeUI.confirmationMessageAr || ''}
                      onChange={(e) =>
                        patchEdgeData(selectedEdge.id, selectedEdge, {
                          ui: { ...edgeUI, confirmationMessageAr: e.target.value },
                        })
                      }
                      placeholder="هل أنت متأكد؟"
                      className="h-7 text-xs mt-0.5"
                      dir="rtl"
                    />
                  </div>
                </>
              )}
              <div>
                <Label className="text-[10px] text-gray-400">{isAr ? 'لون الزر' : 'Button Color'}</Label>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="color"
                    value={edgeUI.buttonColor || '#3B82F6'}
                    onChange={(e) =>
                      patchEdgeData(selectedEdge.id, selectedEdge, {
                        ui: { ...edgeUI, buttonColor: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    {edgeUI.buttonColor || '#3B82F6'}
                  </span>
                </div>
              </div>

              <ToggleSwitch
                checked={selectedEdge.animated ?? false}
                onChange={(v) => onEdgeChange(selectedEdge.id, { animated: v })}
                label={isAr ? 'خط متحرك' : 'Animated'}
              />
            </div>
          </CollapsibleSection>
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
                  value={String(nodeData.color || '#ffffff')}
                  onChange={(e) => onNodeChange(selectedNode.id, { ...nodeData, color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-400 font-mono">
                  {String(nodeData.color || '#ffffff')}
                </span>
              </div>
            </div>

            {/* === SLA Config === */}
            <CollapsibleSection title={isAr ? 'إعدادات SLA' : 'SLA Configuration'}>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'استجابة (ساعات)' : 'Response (hrs)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={String((nodeData.sla as Record<string, unknown>)?.responseHours || '')}
                      onChange={(e) =>
                        onNodeChange(selectedNode.id, {
                          ...nodeData,
                          sla: {
                            ...((nodeData.sla as Record<string, unknown>) || {}),
                            responseHours: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="4"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-gray-400">{isAr ? 'حل (ساعات)' : 'Resolution (hrs)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={String((nodeData.sla as Record<string, unknown>)?.resolutionHours || '')}
                      onChange={(e) =>
                        onNodeChange(selectedNode.id, {
                          ...nodeData,
                          sla: {
                            ...((nodeData.sla as Record<string, unknown>) || {}),
                            resolutionHours: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="24"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-400">
                    {isAr ? 'نسبة التحذير' : 'Warning %'}: {Number((nodeData.sla as Record<string, unknown>)?.warningPercent ?? 80)}%
                  </Label>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={Number((nodeData.sla as Record<string, unknown>)?.warningPercent ?? 80)}
                    onChange={(e) =>
                      onNodeChange(selectedNode.id, {
                        ...nodeData,
                        sla: {
                          ...((nodeData.sla as Record<string, unknown>) || {}),
                          warningPercent: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 mt-1 accent-blue-600"
                  />
                </div>
                <ToggleSwitch
                  checked={Boolean((nodeData.sla as Record<string, unknown>)?.workingHoursOnly)}
                  onChange={(v) =>
                    onNodeChange(selectedNode.id, {
                      ...nodeData,
                      sla: {
                        ...((nodeData.sla as Record<string, unknown>) || {}),
                        workingHoursOnly: v,
                      },
                    })
                  }
                  label={isAr ? 'ساعات العمل فقط' : 'Working Hours Only'}
                />
              </div>
            </CollapsibleSection>

            {/* === onEnter Actions === */}
            <CollapsibleSection title={isAr ? 'إجراءات الدخول (onEnter)' : 'onEnter Actions'}>
              <ActionEditor
                actions={Array.isArray(nodeData.onEnter) ? (nodeData.onEnter as WFAction[]) : []}
                onChange={(actions) => onNodeChange(selectedNode.id, { ...nodeData, onEnter: actions })}
                isAr={isAr}
                label="onEnter Actions"
                labelAr="إجراءات الدخول"
              />
            </CollapsibleSection>

            {/* === onExit Actions === */}
            <CollapsibleSection title={isAr ? 'إجراءات الخروج (onExit)' : 'onExit Actions'}>
              <ActionEditor
                actions={Array.isArray(nodeData.onExit) ? (nodeData.onExit as WFAction[]) : []}
                onChange={(actions) => onNodeChange(selectedNode.id, { ...nodeData, onExit: actions })}
                isAr={isAr}
                label="onExit Actions"
                labelAr="إجراءات الخروج"
              />
            </CollapsibleSection>
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
