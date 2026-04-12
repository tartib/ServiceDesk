'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
 ChevronDown, 
 ChevronRight, 
 MoreHorizontal, 
 Plus,
 Edit3,
 ArrowUpDown,
 Trash2,
 MoveRight,
 CheckCircle2,
 Circle,
 Clock,
 GripVertical
} from 'lucide-react';
import TaskCard from './TaskCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
 _id: string;
 key: string;
 title: string;
 type: string;
 priority: string;
 storyPoints?: number;
 status: { id: string; name: string; category: string };
 assignee?: { _id?: string; name?: string; email?: string; profile?: { firstName?: string; lastName?: string } };
}

interface SprintStats {
 totalTasks: number;
 completedTasks: number;
 totalPoints: number;
 completedPoints: number;
 todoTasks?: number;
 todoPoints?: number;
 inProgressTasks?: number;
 inProgressPoints?: number;
 doneTasks?: number;
 donePoints?: number;
}

interface SprintSectionProps {
 id: string;
 name: string;
 startDate: string;
 endDate: string;
 status: 'planning' | 'active' | 'completed';
 stats?: SprintStats;
 tasks: Task[];
 isExpanded: boolean;
 onToggle: () => void;
 onStartSprint?: () => void;
 onCompleteSprint?: () => void;
 onTaskClick?: (task: Task) => void;
 onCreateTask?: (summary: string) => void;
 onTaskSelect?: (taskId: string, selected: boolean) => void;
 selectedTasks?: Set<string>;
 onRenameSprint?: (newName: string) => void;
 onDeleteSprint?: () => void;
 onMoveWorkItems?: () => void;
 onReorderSprint?: () => void;
 isDragActive?: boolean;
}

// Sortable task item within a sprint
function SortableSprintTask({ task, onClick, onTaskSelect, isSelected }: {
 task: Task;
 onClick?: () => void;
 onTaskSelect?: (taskId: string, selected: boolean) => void;
 isSelected: boolean;
}) {
 const {
 attributes,
 listeners,
 setNodeRef,
 setActivatorNodeRef,
 transform,
 transition,
 isDragging,
 } = useSortable({ id: task._id });

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 opacity: isDragging ? 0.4 : 1,
 zIndex: isDragging ? 50 : undefined,
 };

 return (
 <div
 ref={setNodeRef}
 style={style}
 {...attributes}
 {...listeners}
 className={`group/drag flex items-center border-b border-border last:border-b-0 cursor-grab active:cursor-grabbing ${
 isDragging ? 'shadow-lg ring-2 ring-ring bg-brand-surface rounded-lg' : ''
 }`}
 >
 {/* Drag Handle (visual indicator) */}
 <div
 ref={setActivatorNodeRef}
 className="flex items-center justify-center w-6 shrink-0 opacity-30 group-hover/drag:opacity-100 transition-opacity"
 >
 <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
 </div>
 {/* Checkbox */}
 <div className="ps-1" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-border"
 checked={isSelected}
 onChange={(e) => onTaskSelect?.(task._id, e.target.checked)}
 />
 </div>
 {/* Task details */}
 <div className="flex-1" onClick={onClick}>
 <TaskCard
 taskKey={task.key}
 title={task.title}
 type={task.type}
 priority={task.priority}
 status={task.status}
 assignee={task.assignee}
 storyPoints={task.storyPoints}
 variant="list"
 showStatus
 />
 </div>
 </div>
 );
}

export default function SprintSection({
 id,
 name,
 startDate,
 endDate,
 status,
 stats,
 tasks,
 isExpanded,
 onToggle,
 onStartSprint,
 onCompleteSprint,
 onTaskClick,
 onCreateTask,
 onTaskSelect,
 selectedTasks = new Set(),
 onRenameSprint,
 onDeleteSprint,
 onMoveWorkItems,
 onReorderSprint,
 isDragActive = false,
}: SprintSectionProps) {
 const { t } = useLanguage();
 const [showActionsMenu, setShowActionsMenu] = useState(false);
 const [isCreating, setIsCreating] = useState(false);
 const [newTaskSummary, setNewTaskSummary] = useState('');
 const [isRenaming, setIsRenaming] = useState(false);
 const [renameValue, setRenameValue] = useState(name);
 const actionsMenuRef = useRef<HTMLDivElement>(null);
 const createInputRef = useRef<HTMLInputElement>(null);

 // Droppable zone for this sprint
 const droppableId = `sprint-${id}`;
 const isCompleted = status === 'completed';
 const { setNodeRef: setDroppableRef, isOver } = useDroppable({
 id: droppableId,
 disabled: isCompleted,
 });
 const taskIds = useMemo(() => tasks.map(t => t._id), [tasks]);

 // Close menu on outside click
 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
 setShowActionsMenu(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Focus input when creating
 useEffect(() => {
 if (isCreating && createInputRef.current) {
 createInputRef.current.focus();
 }
 }, [isCreating]);

 const formatDate = (dateStr: string) => {
 return new Date(dateStr).toLocaleDateString('en-US', { 
 day: 'numeric', 
 month: 'short' 
 });
 };

 // Calculate progress stats from tasks
 const calculateStats = () => {
 const todoTasks = tasks.filter(t => t.status.category === 'todo');
 const inProgressTasks = tasks.filter(t => t.status.category === 'in-progress');
 const doneTasks = tasks.filter(t => t.status.category === 'done');

 return {
 todo: {
 count: todoTasks.length,
 points: todoTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
 },
 inProgress: {
 count: inProgressTasks.length,
 points: inProgressTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
 },
 done: {
 count: doneTasks.length,
 points: doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
 }
 };
 };

 const progressStats = calculateStats();

 const handleCreateTask = () => {
 if (newTaskSummary.trim() && onCreateTask) {
 onCreateTask(newTaskSummary.trim());
 setNewTaskSummary('');
 setIsCreating(false);
 }
 };

 const handleRename = () => {
 if (renameValue.trim() && onRenameSprint) {
 onRenameSprint(renameValue.trim());
 setIsRenaming(false);
 }
 };

 const handleSelectAll = (e: React.MouseEvent) => {
 e.stopPropagation();
 const allSelected = tasks.every(t => selectedTasks.has(t._id));
 tasks.forEach(task => {
 onTaskSelect?.(task._id, !allSelected);
 });
 };

 return (
 <div className="bg-background border border-border rounded-lg overflow-hidden">
 {/* Sprint Header */}
 <div 
 className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/50 gap-2 transition-colors"
 onClick={onToggle}
 >
 <div className="flex items-center gap-3 min-w-0">
 {/* US6: Checkbox for bulk selection */}
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded border-border bg-background shrink-0" 
 checked={tasks.length > 0 && tasks.every(t => selectedTasks.has(t._id))}
 onChange={() => {}}
 onClick={handleSelectAll}
 />
 {isExpanded ? (
 <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
 ) : (
 <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
 )}
 
 {/* US1: Sprint name (editable) */}
 {isRenaming ? (
 <input
 type="text"
 value={renameValue}
 onChange={(e) => setRenameValue(e.target.value)}
 onBlur={handleRename}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleRename();
 if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(name); }
 }}
 onClick={(e) => e.stopPropagation()}
 className="font-medium text-foreground bg-background border border-brand rounded px-2 py-0.5 focus:outline-none"
 autoFocus
 />
 ) : (
 <span className="font-medium text-foreground truncate">{name}</span>
 )}
 
 {/* US1: Date range */}
 <span className="text-muted-foreground text-sm whitespace-nowrap hidden sm:inline">
 {formatDate(startDate)} – {formatDate(endDate)}
 </span>
 
 {/* US1: Ticket count */}
 <span className="text-muted-foreground text-sm whitespace-nowrap">
 ({tasks.length || stats?.totalTasks || 0} {t('projects.common.items') || 'items'})
 </span>
 </div>

 <div className="flex items-center gap-3 ms-auto sm:ms-0">
 {/* US3: Progress Summary */}
 <div className="hidden md:flex items-center gap-2">
 {/* To Do */}
 <div className="flex items-center gap-1" title={t('projects.board.columns.todo') || 'To Do'}>
 <Circle className="h-3 w-3 text-muted-foreground" />
 <span className="text-xs text-muted-foreground">
 {progressStats.todo.count} of {progressStats.todo.points}
 </span>
 </div>
 {/* In Progress */}
 <div className="flex items-center gap-1" title={t('projects.board.columns.inProgress') || 'In Progress'}>
 <Clock className="h-3 w-3 text-brand" />
 <span className="text-xs text-muted-foreground">
 {progressStats.inProgress.count} of {progressStats.inProgress.points}
 </span>
 </div>
 {/* Done */}
 <div className="flex items-center gap-1" title={t('projects.board.columns.done') || 'Done'}>
 <CheckCircle2 className="h-3 w-3 text-success" />
 <span className="text-xs text-muted-foreground">
 {progressStats.done.count} of {progressStats.done.points}
 </span>
 </div>
 </div>

 {/* US2: Action Buttons */}
 {status === 'planning' && onStartSprint && (
 <button 
 onClick={(e) => { e.stopPropagation(); onStartSprint(); }} 
 className="px-3 py-1 bg-brand hover:bg-brand-strong text-brand-foreground text-sm rounded transition-colors"
 >
 {t('projects.backlog.startSprint') || 'Start sprint'}
 </button>
 )}
 {status === 'active' && onCompleteSprint && (
 <button 
 onClick={(e) => { e.stopPropagation(); onCompleteSprint(); }}
 className="px-3 py-1 bg-brand hover:bg-brand-strong text-brand-foreground text-sm rounded transition-colors"
 >
 {t('projects.backlog.completeSprint') || 'Complete sprint'}
 </button>
 )}
 
 {/* US7: Sprint Actions Menu */}
 <div className="relative" ref={actionsMenuRef}>
 <button 
 onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }}
 className="p-1 text-muted-foreground hover:text-foreground transition-colors"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 
 {showActionsMenu && (
 <div className="absolute end-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-20 py-1">
 <button
 onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setShowActionsMenu(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 text-start text-foreground hover:bg-muted/50 text-sm"
 >
 <Edit3 className="h-4 w-4 text-muted-foreground" />
 {t('projects.sprints.renameSprint') || 'Rename sprint'}
 </button>
 {onReorderSprint && (
 <button
 onClick={(e) => { e.stopPropagation(); onReorderSprint(); setShowActionsMenu(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 text-start text-foreground hover:bg-muted/50 text-sm"
 >
 <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
 {t('projects.sprints.reorderSprint') || 'Reorder'}
 </button>
 )}
 {onMoveWorkItems && (
 <button
 onClick={(e) => { e.stopPropagation(); onMoveWorkItems(); setShowActionsMenu(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 text-start text-foreground hover:bg-muted/50 text-sm"
 >
 <MoveRight className="h-4 w-4 text-muted-foreground" />
 {t('projects.sprints.moveWorkItems') || 'Move work items'}
 </button>
 )}
 <div className="border-t border-border my-1" />
 {onDeleteSprint && (
 <button
 onClick={(e) => { e.stopPropagation(); onDeleteSprint(); setShowActionsMenu(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 text-start text-destructive hover:bg-destructive-soft text-sm"
 >
 <Trash2 className="h-4 w-4" />
 {t('projects.sprints.deleteSprint') || 'Delete sprint'}
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Sprint Tasks */}
 {(isExpanded || (isDragActive && !isCompleted)) && (
 <div
 ref={setDroppableRef}
 className={`border-t border-border transition-colors ${
 isOver && !isCompleted ? 'bg-brand-surface ring-2 ring-inset ring-brand-border' : ''
 } ${isCompleted && isDragActive ? 'opacity-50' : ''}`}
 >
 <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
 {tasks.length === 0 ? (
 <div className={`px-3 py-4 text-sm text-center ${
 isOver && !isCompleted ? 'text-brand font-medium' : 'text-muted-foreground'
 }`}>
 {isOver && !isCompleted
 ? (t('projects.backlog.dropHere') || 'Drop here')
 : (t('projects.sprints.noTasksInSprint') || 'No tasks in this sprint')}
 </div>
 ) : (
 tasks.map((task) => (
 <SortableSprintTask
 key={task._id}
 task={task}
 onClick={() => onTaskClick?.(task)}
 onTaskSelect={onTaskSelect}
 isSelected={selectedTasks.has(task._id)}
 />
 ))
 )}
 </SortableContext>
 
 {/* US4: Create Task Inline */}
 {isCreating ? (
 <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
 <Plus className="h-4 w-4 text-muted-foreground" />
 <input
 ref={createInputRef}
 type="text"
 value={newTaskSummary}
 onChange={(e) => setNewTaskSummary(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleCreateTask();
 if (e.key === 'Escape') { setIsCreating(false); setNewTaskSummary(''); }
 }}
 onBlur={() => {
 if (!newTaskSummary.trim()) setIsCreating(false);
 }}
 placeholder={t('projects.board.enterSummary') || 'Enter a summary'}
 className="flex-1 text-sm bg-transparent border-none focus:outline-none text-foreground placeholder-muted-foreground"
 />
 <button
 onClick={handleCreateTask}
 disabled={!newTaskSummary.trim()}
 className="px-2 py-1 text-xs bg-brand text-brand-foreground rounded hover:bg-brand-strong disabled:bg-muted disabled:cursor-not-allowed"
 >
 {t('projects.common.create') || 'Create'}
 </button>
 </div>
 ) : (
 <button 
 onClick={(e) => { e.stopPropagation(); setIsCreating(true); }}
 className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full text-sm transition-colors"
 >
 <Plus className="h-4 w-4" />
 {t('projects.common.create') || 'Create'}
 </button>
 )}
 </div>
 )}
 </div>
 );
}
