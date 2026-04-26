'use client';

import type { TimelineColumn, ZoomLevel } from './types';

interface RoadmapTimelineHeaderProps {
 timelineColumns: TimelineColumn[];
 zoomLevel: ZoomLevel;
 workItemsLabel: string;
}

export function RoadmapTimelineHeader({
 timelineColumns,
 zoomLevel,
 workItemsLabel,
}: RoadmapTimelineHeaderProps) {
 return (
 <>
 {/* ── Header Row ── */}
 <div className="sticky top-0 z-40 flex">
 {/* Sticky corner: Work Items header */}
 <div className="sticky left-0 z-50 w-96 shrink-0 bg-muted/50 border-b border-r border-border">
 <div className="px-3 sm:px-4 py-1">
 <span className="text-sm font-semibold text-foreground">{workItemsLabel}</span>
 </div>
 </div>
 {/* Timeline header columns */}
 <div className="flex flex-1">
 {zoomLevel === 'day' ? (
 (() => {
 const monthGroups: { month: string; count: number }[] = [];
 let currentMonth = '';
 let cnt = 0;
 timelineColumns.forEach((col, idx) => {
 if (col.monthLabel !== currentMonth) {
 if (currentMonth) monthGroups.push({ month: currentMonth, count: cnt });
 currentMonth = col.monthLabel || '';
 cnt = 1;
 } else {
 cnt++;
 }
 if (idx === timelineColumns.length - 1) monthGroups.push({ month: currentMonth, count: cnt });
 });
 return monthGroups.map((group, idx) => (
 <div
 key={idx}
 className="px-2 py-2 text-center text-sm font-semibold text-foreground bg-muted border-b border-r border-border last:border-r-0"
 style={{ flex: group.count, minWidth: `${group.count * 40}px` }}
 >
 {group.month}
 </div>
 ));
 })()
 ) : (
 timelineColumns.map((col, idx) => (
 <div
 key={idx}
 className={`px-1 py-2 text-center text-xs border-b border-r border-border last:border-r-0 min-w-[100px] flex-1 ${
 col.isCurrent ? 'bg-brand-soft text-brand font-bold' : 'text-muted-foreground bg-muted/50'
 }`}
 >
 <div className="font-medium">{col.label}</div>
 {col.sublabel && <div className="text-xs text-muted-foreground mt-0.5">{col.sublabel}</div>}
 </div>
 ))
 )}
 </div>
 </div>

 {/* ── Day sub-header (only for day zoom) ── */}
 {zoomLevel === 'day' && (
 <div className="sticky top-[37px] z-40 flex">
 <div className="sticky left-0 z-50 w-96 shrink-0 bg-muted/50 border-b border-r border-border px-4 py-1">
 <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sprints</span>
 </div>
 <div className="flex flex-1">
 {timelineColumns.map((col, idx) => (
 <div
 key={idx}
 className={`px-1 py-1.5 text-center text-xs border-b border-r border-border last:border-r-0 min-w-[40px] ${
 col.isCurrent ? 'bg-brand-soft text-brand font-bold' : 'text-muted-foreground bg-muted/50'
 }`}
 >
 {col.label}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── Sprints Row (non-day zoom) ── */}
 {zoomLevel !== 'day' && (
 <div className="flex">
 <div className="sticky left-0 z-30 w-96 shrink-0 bg-muted/50 border-b border-r border-border px-4 py-2">
 <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sprints</span>
 </div>
 <div className="flex flex-1 border-b border-border bg-muted/50/50" style={{ height: '41px' }}>
 {timelineColumns.map((_, idx) => (
 <div key={idx} className="border-r border-border last:border-r-0 min-w-[100px] flex-1" />
 ))}
 </div>
 </div>
 )}
 </>
 );
}
