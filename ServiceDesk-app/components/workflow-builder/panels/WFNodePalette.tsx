'use client';

import { DragEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Play,
  StopCircle,
  Square,
  GitFork,
  GitMerge,
  Clock,
  ShieldCheck,
  HelpCircle,
  Cog,
} from 'lucide-react';

interface WFNodeTypeItem {
  type: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  descriptionAr: string;
}

const nodeTypeItems: WFNodeTypeItem[] = [
  {
    type: 'wfStart',
    labelEn: 'Start',
    labelAr: 'بداية',
    icon: Play,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    description: 'Workflow entry point',
    descriptionAr: 'نقطة بداية سير العمل',
  },
  {
    type: 'wfEnd',
    labelEn: 'End',
    labelAr: 'نهاية',
    icon: StopCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
    description: 'Workflow exit point',
    descriptionAr: 'نقطة نهاية سير العمل',
  },
  {
    type: 'wfState',
    labelEn: 'State',
    labelAr: 'حالة',
    icon: Square,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    description: 'A workflow state / step',
    descriptionAr: 'حالة / خطوة في سير العمل',
  },
  {
    type: 'wfApproval',
    labelEn: 'Approval',
    labelAr: 'موافقة',
    icon: ShieldCheck,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    description: 'Requires approval to proceed',
    descriptionAr: 'تتطلب موافقة للمتابعة',
  },
  {
    type: 'wfCondition',
    labelEn: 'Condition',
    labelAr: 'شرط',
    icon: HelpCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    description: 'Conditional branching',
    descriptionAr: 'تفرع شرطي',
  },
  {
    type: 'wfFork',
    labelEn: 'Fork',
    labelAr: 'تفرع',
    icon: GitFork,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    description: 'Split into parallel branches',
    descriptionAr: 'تقسيم إلى فروع متوازية',
  },
  {
    type: 'wfJoin',
    labelEn: 'Join',
    labelAr: 'انضمام',
    icon: GitMerge,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    description: 'Merge parallel branches',
    descriptionAr: 'دمج الفروع المتوازية',
  },
  {
    type: 'wfTimer',
    labelEn: 'Timer',
    labelAr: 'مؤقت',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    description: 'Time-based trigger',
    descriptionAr: 'محفز زمني',
  },
  {
    type: 'wfExternalTask',
    labelEn: 'External Task',
    labelAr: 'مهمة خارجية',
    icon: Cog,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    description: 'Delegated to external worker',
    descriptionAr: 'مفوضة لعامل خارجي',
  },
];

export default function WFNodePalette() {
  const { locale } = useLanguage();

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-60 bg-white border-e border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">
          {locale === 'ar' ? 'عناصر BPMN' : 'BPMN Elements'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {locale === 'ar' ? 'اسحب العناصر إلى اللوحة' : 'Drag elements to the canvas'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {nodeTypeItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${item.bgColor}`}
            >
              <Icon className={`h-4 w-4 ${item.color} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-700 block">
                  {locale === 'ar' ? item.labelAr : item.labelEn}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight block">
                  {locale === 'ar' ? item.descriptionAr : item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
