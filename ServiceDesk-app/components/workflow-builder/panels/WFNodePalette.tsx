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
 color: 'text-success',
 bgColor: 'bg-success-soft border-success/20 hover:bg-success-soft',
 description: 'Workflow entry point',
 descriptionAr: 'نقطة بداية سير العمل',
 },
 {
 type: 'wfEnd',
 labelEn: 'End',
 labelAr: 'نهاية',
 icon: StopCircle,
 color: 'text-destructive',
 bgColor: 'bg-destructive-soft border-destructive/30 hover:bg-destructive-soft',
 description: 'Workflow exit point',
 descriptionAr: 'نقطة نهاية سير العمل',
 },
 {
 type: 'wfState',
 labelEn: 'State',
 labelAr: 'حالة',
 icon: Square,
 color: 'text-brand',
 bgColor: 'bg-brand-surface border-brand-border hover:bg-brand-soft',
 description: 'A workflow state / step',
 descriptionAr: 'حالة / خطوة في سير العمل',
 },
 {
 type: 'wfApproval',
 labelEn: 'Approval',
 labelAr: 'موافقة',
 icon: ShieldCheck,
 color: 'text-info',
 bgColor: 'bg-info-soft border-info/20 hover:bg-info-soft',
 description: 'Requires approval to proceed',
 descriptionAr: 'تتطلب موافقة للمتابعة',
 },
 {
 type: 'wfCondition',
 labelEn: 'Condition',
 labelAr: 'شرط',
 icon: HelpCircle,
 color: 'text-warning',
 bgColor: 'bg-warning-soft border-warning/30 hover:bg-warning-soft',
 description: 'Conditional branching',
 descriptionAr: 'تفرع شرطي',
 },
 {
 type: 'wfFork',
 labelEn: 'Fork',
 labelAr: 'تفرع',
 icon: GitFork,
 color: 'text-info',
 bgColor: 'bg-info-soft border-info/20 hover:bg-info-soft',
 description: 'Split into parallel branches',
 descriptionAr: 'تقسيم إلى فروع متوازية',
 },
 {
 type: 'wfJoin',
 labelEn: 'Join',
 labelAr: 'انضمام',
 icon: GitMerge,
 color: 'text-success',
 bgColor: 'bg-success-soft border-success/20 hover:bg-success-soft',
 description: 'Merge parallel branches',
 descriptionAr: 'دمج الفروع المتوازية',
 },
 {
 type: 'wfTimer',
 labelEn: 'Timer',
 labelAr: 'مؤقت',
 icon: Clock,
 color: 'text-warning',
 bgColor: 'bg-warning-soft border-warning/20 hover:bg-warning-soft',
 description: 'Time-based trigger',
 descriptionAr: 'محفز زمني',
 },
 {
 type: 'wfExternalTask',
 labelEn: 'External Task',
 labelAr: 'مهمة خارجية',
 icon: Cog,
 color: 'text-warning',
 bgColor: 'bg-warning-soft border-warning/20 hover:bg-warning-soft',
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
 <div className="w-60 bg-background border-e border-border flex flex-col h-full">
 <div className="p-4 border-b border-border">
 <h3 className="text-sm font-semibold text-foreground">
 {locale === 'ar' ? 'عناصر BPMN' : 'BPMN Elements'}
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
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
 <span className="text-sm font-medium text-foreground block">
 {locale === 'ar' ? item.labelAr : item.labelEn}
 </span>
 <span className="text-[10px] text-muted-foreground leading-tight block">
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
