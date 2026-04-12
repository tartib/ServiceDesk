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
 { type: 'start', labelEn: 'Start', labelAr: 'بداية', icon: Play, color: 'text-success', bgColor: 'bg-success-soft border-success/30' },
 { type: 'end', labelEn: 'End', labelAr: 'نهاية', icon: StopCircle, color: 'text-destructive', bgColor: 'bg-destructive-soft border-destructive/30' },
 { type: 'process', labelEn: 'Process', labelAr: 'عملية', icon: Square, color: 'text-brand', bgColor: 'bg-brand-surface border-brand-border' },
 { type: 'decision', labelEn: 'Decision', labelAr: 'قرار', icon: Diamond, color: 'text-warning', bgColor: 'bg-warning-soft border-warning/30' },
 { type: 'inputOutput', labelEn: 'Input/Output', labelAr: 'إدخال/إخراج', icon: ArrowRightLeft, color: 'text-info', bgColor: 'bg-info-soft border-info/20' },
 { type: 'delay', labelEn: 'Delay', labelAr: 'تأخير', icon: Timer, color: 'text-warning', bgColor: 'bg-warning-soft border-warning/20' },
];

export default function NodePalette() {
 const { locale } = useLanguage();

 const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
 event.dataTransfer.setData('application/reactflow', nodeType);
 event.dataTransfer.effectAllowed = 'move';
 };

 return (
 <div className="w-56 bg-background border-e border-border flex flex-col h-full">
 <div className="p-4 border-b border-border">
 <h3 className="text-sm font-semibold text-foreground">
 {locale === 'ar' ? 'لوحة العقد' : 'Node Palette'}
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
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
 <span className="text-sm font-medium text-foreground">
 {locale === 'ar' ? item.labelAr : item.labelEn}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
}
