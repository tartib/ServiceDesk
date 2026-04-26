'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
 TaskDetailPanel,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';
import {
 useRoadmapData,
 useRoadmapTimeline,
 RoadmapToolbar,
 RoadmapTimelineHeader,
 RoadmapTaskRow,
 RoadmapFooter,
 RoadmapInlineCreate,
 getTaskProgress,
} from '@/components/roadmap';

export default function RoadmapPage() {
 const params = useParams();
 const projectId = params?.projectId as string;
 const { t } = useLanguage();
 const { methodology } = useMethodology(projectId);

 // Data hook — fetching, CRUD, filtering, grouping
 const data = useRoadmapData(projectId);

 // Timeline hook — zoom, columns, bar positioning
 const timeline = useRoadmapTimeline(data.tasks, projectId);

 // Local UI states
 const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
 const [showDependencies, setShowDependencies] = useState(false);
 const [hoveredTask, setHoveredTask] = useState<string | null>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [draggedItem, setDraggedItem] = useState<string | null>(null);
 const [dragStartX, setDragStartX] = useState(0);

 const toggleItem = (id: string) => {
 const newExpanded = new Set(expandedItems);
 if (newExpanded.has(id)) {
 newExpanded.delete(id);
 } else {
 newExpanded.add(id);
 }
 setExpandedItems(newExpanded);
 };

 const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
 setIsDragging(true);
 setDraggedItem(taskId);
 setDragStartX(e.clientX);
 e.dataTransfer.effectAllowed = 'move';
 }, []);

 const handleDragEnd = useCallback(async (e: React.DragEvent, task: { _id: string; startDate?: string; dueDate?: string }) => {
 setIsDragging(false);
 setDraggedItem(null);
 if (timeline.timelineRef.current) {
 const deltaX = e.clientX - dragStartX;
 const columnWidth = timeline.zoomLevel === 'day' ? 40 : 100;
 const totalWidth = timeline.timelineColumns.length * columnWidth;
 const daysMoved = Math.round((deltaX / totalWidth) * timeline.timelineRange.totalDays);
 if (daysMoved !== 0 && task.startDate) {
 const newStart = new Date(task.startDate);
 newStart.setDate(newStart.getDate() + daysMoved);
 const newEnd = task.dueDate ? new Date(task.dueDate) : new Date(newStart);
 if (task.dueDate) newEnd.setDate(newEnd.getDate() + daysMoved);
 await data.updateTask(task._id, { startDate: newStart.toISOString().split('T')[0], dueDate: newEnd.toISOString().split('T')[0] });
 }
 }
 }, [dragStartX, timeline, data]);

 if (data.isLoading) {
 return <LoadingState />;
 }

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={data.project?.key} 
 projectName={data.project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Filter & Search Toolbar */}
 <RoadmapToolbar
 searchQuery={data.searchQuery}
 onSearchChange={data.setSearchQuery}
 selectedAssignees={data.selectedAssignees}
 onAssigneesChange={data.setSelectedAssignees}
 selectedTypes={data.selectedTypes}
 onTypesChange={data.setSelectedTypes}
 selectedStatuses={data.selectedStatuses}
 onStatusesChange={data.setSelectedStatuses}
 onClearFilters={data.clearFilters}
 showDependencies={showDependencies}
 onToggleDependencies={() => setShowDependencies(!showDependencies)}
 onExportCSV={data.exportCSV}
 onExportJSON={data.exportJSON}
 timelineSettings={timeline.timelineSettings}
 onTimelineSettingsChange={timeline.setTimelineSettings}
 t={t}
 />

 {/* Timeline + Detail Panel — side by side */}
 <div className="flex flex-1 overflow-hidden">
 {/* Timeline / Roadmap Grid */}
 <div 
 className="flex-1 overflow-auto bg-background"
 ref={timeline.timelineRef}
 role="main"
 aria-label="Timeline roadmap"
 >
 <div className="relative" style={{ minWidth: `calc(${timeline.timelineColumns.length * (timeline.zoomLevel === 'day' ? 40 : 120)}px + 24rem)` }}>
 {/* Today Line */}
 {timeline.getTodayPosition().isVisible && (
 <div 
 className="absolute top-0 bottom-0 w-0.5 bg-destructive z-30 pointer-events-none" 
 style={{ left: `calc(24rem + ${timeline.getTodayPosition().left})` }}
 aria-label="Today"
 />
 )}

 {/* Timeline Header */}
 <RoadmapTimelineHeader
 timelineColumns={timeline.timelineColumns}
 zoomLevel={timeline.zoomLevel}
 workItemsLabel={t('roadmap.columns.workItems')}
 />

 {/* Data Rows — Epics */}
 {data.groupedTasks.epics.map((epic, epicIndex) => (
 <div key={epic._id}>
 <RoadmapTaskRow
 task={epic}
 isEpic={true}
 rowIndex={epicIndex}
 zoomLevel={timeline.zoomLevel}
 timelineColumns={timeline.timelineColumns}
 timelineRange={timeline.timelineRange}
 getTaskBarStyle={timeline.getTaskBarStyle}
 progress={data.getEpicProgress(epic._id)}
 isExpanded={expandedItems.has(epic._id)}
 onToggleExpand={() => toggleItem(epic._id)}
 selectedTaskId={data.selectedTask?._id}
 hoveredTaskId={hoveredTask}
 onHover={setHoveredTask}
 onSelect={data.openTaskDetail}
 onDragStart={handleDragStart}
 onDragEnd={handleDragEnd}
 isDragging={isDragging}
 draggedItemId={draggedItem}
 />

 {/* Child Task Rows */}
 {expandedItems.has(epic._id) && (data.groupedTasks.childrenMap.get(epic._id) || data.groupedTasks.childrenMap.get(epic.id || '') || []).map((task, taskIndex) => (
 <RoadmapTaskRow
 key={task._id}
 task={task}
 isEpic={false}
 isChild={true}
 rowIndex={taskIndex}
 zoomLevel={timeline.zoomLevel}
 timelineColumns={timeline.timelineColumns}
 timelineRange={timeline.timelineRange}
 getTaskBarStyle={timeline.getTaskBarStyle}
 progress={getTaskProgress(task)}
 selectedTaskId={data.selectedTask?._id}
 hoveredTaskId={hoveredTask}
 onHover={setHoveredTask}
 onSelect={data.openTaskDetail}
 />
 ))}
 </div>
 ))}

 {/* Standalone Tasks */}
 {data.groupedTasks.standaloneTasks.map((task, idx) => (
 <RoadmapTaskRow
 key={task._id}
 task={task}
 isEpic={false}
 rowIndex={data.groupedTasks.epics.length + idx}
 zoomLevel={timeline.zoomLevel}
 timelineColumns={timeline.timelineColumns}
 timelineRange={timeline.timelineRange}
 getTaskBarStyle={timeline.getTaskBarStyle}
 progress={getTaskProgress(task)}
 selectedTaskId={data.selectedTask?._id}
 hoveredTaskId={hoveredTask}
 onHover={setHoveredTask}
 onSelect={data.openTaskDetail}
 />
 ))}
 </div>
 </div>

 {/* Task Detail Panel — slides in from end */}
 {data.showTaskDetail && data.selectedTask && (
 <TaskDetailPanel
 task={data.selectedTask as React.ComponentProps<typeof TaskDetailPanel>['task']}
 taskDetail={data.taskDetail as React.ComponentProps<typeof TaskDetailPanel>['taskDetail']}
 projectId={projectId as string}
 onClose={data.closeTaskDetail}
 onTaskUpdate={data.refreshTasks}
 />
 )}
 </div>

 {/* Create New Task */}
 <RoadmapInlineCreate
 isCreating={data.isCreating}
 onSetCreating={data.setIsCreating}
 onCreateTask={data.createTask}
 t={t}
 />

 {/* Update Status Toast */}
 {(data.isUpdating || data.updateError || data.updateSuccess) && (
 <div className="fixed top-4 right-4 z-[60] animate-in fade-in slide-in-from-top-2">
 {data.isUpdating && (
 <div className="bg-brand text-brand-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 <span className="text-sm">Saving...</span>
 </div>
 )}
 {data.updateSuccess && !data.isUpdating && (
 <div className="bg-success text-success-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
 <span>✓</span>
 <span className="text-sm">Saved successfully</span>
 </div>
 )}
 {data.updateError && !data.isUpdating && (
 <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
 <span>✕</span>
 <span className="text-sm">{data.updateError}</span>
 </div>
 )}
 </div>
 )}

 {/* Footer — Zoom Controls */}
 <RoadmapFooter
 zoomLevel={timeline.zoomLevel}
 onZoomChange={timeline.handleZoomChange}
 t={t}
 />
 </div>
 );
}
