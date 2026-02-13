'use client';

import { DragEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Square, Diamond, ArrowRightLeft, Timer, Play, StopCircle } from 'lucide-react';

interface NodeTypeItem {
  type: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const nodeTypeItems: NodeTypeItem[] = [
  { type: 'start', labelEn: 'Start', labelAr: 'بداية', icon: Play, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  { type: 'end', labelEn: 'End', labelAr: 'نهاية', icon: StopCircle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  { type: 'process', labelEn: 'Process', labelAr: 'عملية', icon: Square, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { type: 'decision', labelEn: 'Decision', labelAr: 'قرار', icon: Diamond, color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  { type: 'inputOutput', labelEn: 'Input/Output', labelAr: 'إدخال/إخراج', icon: ArrowRightLeft, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { type: 'delay', labelEn: 'Delay', labelAr: 'تأخير', icon: Timer, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
];

export default function NodePalette() {
  const { locale } = useLanguage();

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-white border-e border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          {locale === 'ar' ? 'لوحة العقد' : 'Node Palette'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {locale === 'ar' ? 'اسحب العقد إلى اللوحة' : 'Drag nodes to the canvas'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodeTypeItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all ${item.bgColor}`}
            >
              <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ar' ? item.labelAr : item.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
