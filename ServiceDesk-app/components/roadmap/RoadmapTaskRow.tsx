'use client';

import React from 'react';
import {
 ChevronRight,
 ChevronDown,
 GripVertical,
 AlertTriangle,
 ArrowLeft,
 ArrowRight,
} from 'lucide-react';
import type { Task, TimelineColumn, ZoomLevel, TaskBarStyle, TimelineRange } from './types';
import { getTypeColor, getTypeIcon, getTaskProgress, getTaskBarColor, getProgressColor, getProgressTextColor } from './utils';

interface RoadmapTaskRowProps {
 task: Task;
 isEpic: boolean;
 rowIndex: number;
 zoomLevel: ZoomLevel;
 timelineColumns: TimelineColumn[];
 timelineRange: TimelineRange;
 getTaskBarStyle: (task: Task, columnsCount: number) => TaskBarStyle;
 progress: number;
 // Expand/collapse (epics only)
 isExpanded?: boolean;
 onToggleExpand?: () => void;
 // Interaction
 selectedTaskId?: string;
 hoveredTaskId: string | null;
 onHover: (taskId: string | null) => void;
 onSelect: (task: Task) => void;
 // Drag
 onDragStart?: (e: React.DragEvent, taskId: string) => void;
 onDragEnd?: (e: React.DragEvent, task: Task) => void;
 isDragging?: boolean;
 draggedItemId?: string | null;
 // Depth
 isChild?: boolean;
}

export const RoadmapTaskRow = React.memo(function RoadmapTaskRow({
 task,
 isEpic,
 rowIndex,
 zoomLevel,
 timelineColumns,
 getTaskBarStyle: getBarStyle,
 progress,
 isExpanded,
 onToggleExpand,
 selectedTaskId,
 hoveredTaskId,
 onHover,
 onSelect,
 onDragStart,
 onDragEnd,
 isDragging,
 draggedItemId,
 isChild,
}: RoadmapTaskRowProps) {
 const barStyle = getBarStyle(task, timelineColumns.length);
 const isHovered = hoveredTaskId === task._id;
 const isSelected = selectedTaskId === task._id;
 const barHeight = isEpic ? 'h-7' : 'h-5';
 const barRounding = isEpic ? 'rounded-md' : 'rounded';
 const rowMinHeight = isEpic ? '80px' : '56px';
 const bgClass = rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50/30';

 return (
 <div className={`flex border-b border-border ${bgClass}`} style={{ minHeight: rowMinHeight }}>
 {/* Sticky left cell */}
 <div className={`sticky left-0 z-20 w-96 shrink-0 border-r border-border ${isChild ? 'ps-10 pe-3 sm:pe-4 py-2.5' : 'px-3 sm:px-4 py-3'} hover:bg-brand-surface transition-colors cursor-pointer ${bgClass}`}>
 <div className="flex items-center gap-2">
 <GripVertical className={`${isEpic ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground cursor-grab hover:text-muted-foreground`} />
 {isEpic && onToggleExpand && (
 <button onClick={onToggleExpand} className="p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" aria-expanded={isExpanded}>
 {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
 </button>
 )}
 <span className={`${getTypeColor(task.type)} ${isEpic ? 'text-lg' : 'text-sm'}`}>{getTypeIcon(task.type)}</span>
 <button onClick={() => onSelect(task)} className={`text-brand ${isEpic ? 'text-xs sm:text-sm' : 'text-xs'} font-mono hover:underline`}>
 {task.key}
 </button>
 <span className={`text-foreground text-sm ${isEpic ? 'font-medium' : ''} flex-1 break-words`}>{task.title || task.summary}</span>
 </div>
 <div className={`${isChild ? 'ms-12' : 'ms-16'} mt-${isEpic ? '2' : '1'} flex items-center gap-2`}>
 <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
 <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div>
 </div>
 <span className={`text-xs font-medium ${getProgressTextColor(progress)}`}>{progress}%</span>
 </div>
 </div>
 {/* Timeline cells */}
 <div className="relative flex flex-1">
 {timelineColumns.map((col, colIdx) => (
 <div key={colIdx} className={`border-r border-border last:border-r-0 ${zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'} ${col.isCurrent ? 'bg-brand-surface' : ''}`} />
 ))}
 {/* Task Bar */}
 <div 
 className={`absolute ${barHeight} ${barRounding} ${isEpic ? 'shadow-sm cursor-grab active:cursor-grabbing' : 'cursor-pointer'} transition-all ${isEpic ? 'group/bar' : ''} ${isHovered ? 'shadow-lg scale-[1.02] z-20' : ''} ${isSelected ? `ring-2 ${isEpic ? 'ring-info/40' : 'ring-brand-border'} shadow-lg z-20` : ''} ${isDragging && draggedItemId === task._id ? 'opacity-70 scale-105 z-30' : ''}`}
 style={{
 ...barStyle,
 top: '50%',
 transform: 'translateY(-50%)',
 background: getTaskBarColor(task),
 }}
 onMouseEnter={() => onHover(task._id)}
 onMouseLeave={() => onHover(null)}
 onClick={() => onSelect(task)}
 draggable={isEpic}
 onDragStart={isEpic && onDragStart ? (e) => onDragStart(e, task._id) : undefined}
 onDragEnd={isEpic && onDragEnd ? (e) => onDragEnd(e, task) : undefined}
 >
 {barStyle.showLeftArrow && (
 <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-background rounded-full p-0.5 shadow-sm">
 <ArrowLeft className={`${isEpic ? 'h-3 w-3 text-info' : 'h-2.5 w-2.5 text-brand'}`} />
 </div>
 )}
 {barStyle.showRightArrow && (
 <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-background rounded-full p-0.5 shadow-sm">
 <ArrowRight className={`${isEpic ? 'h-3 w-3 text-info' : 'h-2.5 w-2.5 text-brand'}`} />
 </div>
 )}
 {isEpic && (
 <div className="absolute inset-y-0 left-0 bg-background/30 rounded-l-md transition-all duration-500" style={{ width: `${progress}%` }} />
 )}
 {!isEpic && (
 <div className="absolute inset-y-0 left-0 bg-background/30 rounded-l transition-all duration-500" style={{ width: `${getTaskProgress(task)}%` }} />
 )}
 <span className={`absolute inset-0 flex items-center justify-center text-white text-xs font-medium truncate ${isEpic ? 'px-3' : 'px-2'} drop-shadow-sm`}>
 {barStyle.hasMissingDates && <span className="inline-flex" title="Missing or invalid dates"><AlertTriangle className={`${isEpic ? 'h-3 w-3' : 'h-2.5 w-2.5'} me-1`} /></span>}
 {task.title || task.summary}
 </span>
 {/* Tooltip */}
 {isHovered && (
 <div className={`absolute ${isEpic ? '-top-12' : '-top-10'} left-1/2 -translate-x-1/2 bg-foreground text-background text-xs ${isEpic ? 'px-3 py-2' : 'px-2 py-1.5'} rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none`}>
 <div className="font-medium">{task.title || task.summary}</div>
 {isEpic && (
 <div className="text-muted-foreground mt-0.5">
 {task.startDate || task.startDateRFC3339 ? new Date(task.startDate || task.startDateRFC3339!).toLocaleDateString() : 'No start'} → {task.dueDate || task.dueDateRFC3339 ? new Date(task.dueDate || task.dueDateRFC3339!).toLocaleDateString() : 'No end'}
 </div>
 )}
 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
 </div>
 )}
 </div>
 </div>
 </div>
 );
});
