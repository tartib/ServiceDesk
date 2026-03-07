'use client';

import { useState, useMemo, useCallback } from 'react';
import { X, ArrowRight, Plus, Check } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

// ============================================
// Types
// ============================================

interface AddTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  onAddTransitions: (transitions: NewTransition[]) => void;
  isAr: boolean;
}

export interface NewTransition {
  fromNodeId: string;
  toNodeId: string;
  name: string;
  nameAr?: string;
  transitionGroupId: string;
}

// Node types that can be source/target of transitions
const SOURCE_NODE_TYPES = ['wfStart', 'wfState', 'wfApproval', 'wfCondition', 'wfFork', 'wfTimer', 'wfExternalTask'];
const TARGET_NODE_TYPES = ['wfEnd', 'wfState', 'wfApproval', 'wfCondition', 'wfJoin', 'wfTimer', 'wfExternalTask'];

// ============================================
// Component
// ============================================

export default function AddTransitionDialog({
  open,
  onClose,
  nodes,
  edges,
  onAddTransitions,
  isAr,
}: AddTransitionDialogProps) {
  const [selectedFromIds, setSelectedFromIds] = useState<string[]>([]);
  const [selectedToId, setSelectedToId] = useState('');
  const [transitionName, setTransitionName] = useState('');
  const [transitionNameAr, setTransitionNameAr] = useState('');

  // Build source/target node lists
  const sourceNodes = useMemo(
    () => nodes.filter((n) => SOURCE_NODE_TYPES.includes(n.type || '')),
    [nodes]
  );

  const targetNodes = useMemo(
    () => nodes.filter((n) => TARGET_NODE_TYPES.includes(n.type || '')),
    [nodes]
  );

  // Check if an edge already exists between two nodes
  const edgeExists = useCallback(
    (fromId: string, toId: string) => {
      return edges.some((e) => e.source === fromId && e.target === toId);
    },
    [edges]
  );

  // Get human-readable node name
  const getNodeName = useCallback((node: Node) => {
    const d = node.data as Record<string, unknown>;
    const label = d.label ? String(d.label) : '';
    const nameAr = d.nameAr ? String(d.nameAr) : '';
    if (label && nameAr) return `${label} / ${nameAr}`;
    return label || node.type || node.id;
  }, []);

  // Toggle from-status selection
  const toggleFrom = useCallback((nodeId: string) => {
    setSelectedFromIds((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  }, []);

  // Validation
  const canSubmit = selectedFromIds.length > 0 && selectedToId && transitionName.trim();

  // Count duplicate edges that would be created
  const duplicateCount = useMemo(() => {
    if (!selectedToId) return 0;
    return selectedFromIds.filter((fId) => edgeExists(fId, selectedToId)).length;
  }, [selectedFromIds, selectedToId, edgeExists]);

  const newEdgeCount = selectedFromIds.length - duplicateCount;

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    const groupId = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const transitions: NewTransition[] = selectedFromIds
      .filter((fId) => !edgeExists(fId, selectedToId))
      .map((fromId) => ({
        fromNodeId: fromId,
        toNodeId: selectedToId,
        name: transitionName.trim(),
        nameAr: transitionNameAr.trim() || undefined,
        transitionGroupId: groupId,
      }));

    if (transitions.length > 0) {
      onAddTransitions(transitions);
    }

    // Reset & close
    setSelectedFromIds([]);
    setSelectedToId('');
    setTransitionName('');
    setTransitionNameAr('');
    onClose();
  }, [canSubmit, selectedFromIds, selectedToId, transitionName, transitionNameAr, edgeExists, onAddTransitions, onClose]);

  const handleClose = useCallback(() => {
    setSelectedFromIds([]);
    setSelectedToId('');
    setTransitionName('');
    setTransitionNameAr('');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isAr ? 'إضافة انتقال' : 'Add Transition'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAr
                ? 'حدد حالات المصدر والوجهة واسم الإجراء'
                : 'Select source and target statuses, and name the action'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Transition Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? 'اسم الانتقال (إنجليزي)' : 'Transition Name'} *
            </label>
            <input
              type="text"
              value={transitionName}
              onChange={(e) => setTransitionName(e.target.value)}
              placeholder={isAr ? 'مثال: Start Work, Resolve, Close' : 'e.g. Start Work, Resolve, Close'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>

          {/* Transition Name (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? 'اسم الانتقال (عربي)' : 'Transition Name (Arabic)'}
            </label>
            <input
              type="text"
              value={transitionNameAr}
              onChange={(e) => setTransitionNameAr(e.target.value)}
              placeholder={isAr ? 'مثال: بدء العمل، حل، إغلاق' : 'e.g. بدء العمل، حل، إغلاق'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              dir="rtl"
            />
          </div>

          {/* From Status (multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? 'من الحالة (يمكن اختيار أكثر من واحدة)' : 'From Status (select one or more)'} *
            </label>
            {sourceNodes.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                {isAr ? 'أضف حالات إلى اللوحة أولاً' : 'Add statuses to the canvas first'}
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {sourceNodes.map((node) => {
                  const isSelected = selectedFromIds.includes(node.id);
                  const isDuplicate = selectedToId && edgeExists(node.id, selectedToId);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => toggleFrom(node.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition border-b border-gray-50 last:border-b-0 ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1 truncate">{getNodeName(node)}</span>
                      {isDuplicate && (
                        <span className="text-[10px] text-amber-500 font-medium shrink-0">
                          {isAr ? 'موجود' : 'exists'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          {selectedFromIds.length > 0 && (
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          )}

          {/* To Status (single select) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? 'إلى الحالة' : 'To Status'} *
            </label>
            {targetNodes.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                {isAr ? 'أضف حالات إلى اللوحة أولاً' : 'Add statuses to the canvas first'}
              </p>
            ) : (
              <select
                value={selectedToId}
                onChange={(e) => setSelectedToId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">
                  {isAr ? '— اختر الحالة —' : '— Select status —'}
                </option>
                {targetNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {getNodeName(node)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Summary */}
          {selectedFromIds.length > 0 && selectedToId && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-600">
              <p>
                {isAr ? 'سيتم إنشاء' : 'Will create'}{' '}
                <strong className="text-gray-900">{newEdgeCount}</strong>{' '}
                {isAr ? 'انتقال جديد' : newEdgeCount === 1 ? 'transition' : 'transitions'}
                {duplicateCount > 0 && (
                  <span className="text-amber-500">
                    {' '}({isAr ? `${duplicateCount} موجود مسبقاً` : `${duplicateCount} already exist`})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || newEdgeCount === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة الانتقال' : 'Add Transition'}
            {newEdgeCount > 1 && <span>({newEdgeCount})</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
