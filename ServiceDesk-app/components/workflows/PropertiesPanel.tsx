'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeChange: (id: string, data: Record<string, unknown>) => void;
  onEdgeChange: (id: string, data: Partial<Edge>) => void;
}

export default function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onNodeChange,
  onEdgeChange,
}: PropertiesPanelProps) {
  const { locale } = useLanguage();

  const nodeTypeLabels: Record<string, { en: string; ar: string }> = {
    start: { en: 'Start', ar: 'بداية' },
    end: { en: 'End', ar: 'نهاية' },
    process: { en: 'Process', ar: 'عملية' },
    decision: { en: 'Decision', ar: 'قرار' },
    inputOutput: { en: 'Input/Output', ar: 'إدخال/إخراج' },
    delay: { en: 'Delay', ar: 'تأخير' },
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-64 bg-white border-s border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            {locale === 'ar' ? 'الخصائص' : 'Properties'}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Settings className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {locale === 'ar'
                ? 'حدد عقدة أو اتصال لتعديل خصائصه'
                : 'Select a node or edge to edit its properties'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedNode) {
    const nodeData = selectedNode.data as Record<string, unknown>;
    const nodeTypeLabel = nodeTypeLabels[selectedNode.type || ''];

    return (
      <div className="w-64 bg-white border-s border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            {locale === 'ar' ? 'خصائص العقدة' : 'Node Properties'}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Type */}
          <div>
            <Label className="text-xs text-gray-500">
              {locale === 'ar' ? 'نوع العقدة' : 'Node Type'}
            </Label>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {nodeTypeLabel
                ? locale === 'ar' ? nodeTypeLabel.ar : nodeTypeLabel.en
                : selectedNode.type}
            </p>
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="node-label" className="text-xs text-gray-500">
              {locale === 'ar' ? 'التسمية' : 'Label'}
            </Label>
            <Input
              id="node-label"
              value={String(nodeData.label || '')}
              onChange={(e) =>
                onNodeChange(selectedNode.id, { ...nodeData, label: e.target.value })
              }
              placeholder={locale === 'ar' ? 'أدخل التسمية' : 'Enter label'}
              className="mt-1"
            />
          </div>

          {/* Description (for process, inputOutput, delay) */}
          {['process', 'inputOutput', 'delay'].includes(selectedNode.type || '') && (
            <div>
              <Label htmlFor="node-desc" className="text-xs text-gray-500">
                {locale === 'ar' ? 'الوصف' : 'Description'}
              </Label>
              <Input
                id="node-desc"
                value={String(nodeData.description || '')}
                onChange={(e) =>
                  onNodeChange(selectedNode.id, { ...nodeData, description: e.target.value })
                }
                placeholder={locale === 'ar' ? 'أدخل الوصف' : 'Enter description'}
                className="mt-1"
              />
            </div>
          )}

          {/* Position */}
          <div>
            <Label className="text-xs text-gray-500">
              {locale === 'ar' ? 'الموقع' : 'Position'}
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <span className="text-xs text-gray-400">X</span>
                <p className="text-sm text-gray-700">{Math.round(selectedNode.position.x)}</p>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400">Y</span>
                <p className="text-sm text-gray-700">{Math.round(selectedNode.position.y)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="w-64 bg-white border-s border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            {locale === 'ar' ? 'خصائص الاتصال' : 'Edge Properties'}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Edge Label */}
          <div>
            <Label htmlFor="edge-label" className="text-xs text-gray-500">
              {locale === 'ar' ? 'تسمية الاتصال' : 'Edge Label'}
            </Label>
            <Input
              id="edge-label"
              value={String(selectedEdge.label || '')}
              onChange={(e) =>
                onEdgeChange(selectedEdge.id, { label: e.target.value })
              }
              placeholder={locale === 'ar' ? 'أدخل تسمية الاتصال' : 'Enter edge label'}
              className="mt-1"
            />
          </div>

          {/* Animated toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-500">
              {locale === 'ar' ? 'متحرك' : 'Animated'}
            </Label>
            <button
              onClick={() =>
                onEdgeChange(selectedEdge.id, { animated: !selectedEdge.animated })
              }
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

          {/* Source / Target info */}
          <div>
            <Label className="text-xs text-gray-500">
              {locale === 'ar' ? 'من' : 'Source'}
            </Label>
            <p className="text-sm text-gray-700 mt-1">{selectedEdge.source}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">
              {locale === 'ar' ? 'إلى' : 'Target'}
            </Label>
            <p className="text-sm text-gray-700 mt-1">{selectedEdge.target}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
