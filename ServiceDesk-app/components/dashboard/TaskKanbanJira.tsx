'use client';

import { Task, TaskPriority } from '@/types';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
 Calendar, 
 Clock, 
 CheckCircle, 
 AlertTriangle, 
 MoreHorizontal,
 User,
 Flag,
 Timer
} from 'lucide-react';
import { useStartTask, useCompleteTask } from '@/hooks/useTasks';
import { formatDistanceToNow } from 'date-fns';

interface TaskKanbanProps {
 tasks: Task[];
}

// Jira-style priority icons
const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
 switch (priority) {
 case 'critical':
 return <Flag className="h-4 w-4 text-destructive fill-destructive" />;
 case 'high':
 return <Flag className="h-4 w-4 text-warning fill-warning" />;
 case 'medium':
 return <Flag className="h-4 w-4 text-warning" />;
 case 'low':
 return <Flag className="h-4 w-4 text-brand" />;
 default:
 return <Flag className="h-4 w-4 text-muted-foreground" />;
 }
};

// Jira-style task card
const JiraTaskCard = ({ 
 task, 
 onClick,
 t
}: { 
 task: Task; 
 onClick: () => void;
 t: (key: string) => string;
}) => {
 const { mutate: startTask, isPending: isStarting } = useStartTask();
 const { mutate: completeTask, isPending: isCompleting } = useCompleteTask();
 
 const assignedName = typeof task.assignedTo === 'object' 
 ? task.assignedTo?.name 
 : task.assignedToName;
 
 const getInitials = (name: string) => {
 return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
 };

 const getAvatarColor = (name: string) => {
 const colors = [
 'bg-brand', 'bg-success', 'bg-info', 
 'bg-destructive', 'bg-info', 'bg-success'
 ];
 const index = name?.charCodeAt(0) % colors.length || 0;
 return colors[index];
 };

 const handleStart = (e: React.MouseEvent) => {
 e.stopPropagation();
 startTask(task.id || '');
 };

 const handleComplete = (e: React.MouseEvent) => {
 e.stopPropagation();
 completeTask({ taskId: task.id || '' });
 };

 return (
 <div 
 onClick={onClick}
 className="bg-background rounded-lg border border-border p-3 hover:bg-muted/50 
 cursor-pointer transition-all duration-200 hover:shadow-md
 group relative"
 >
 {/* Top row - Priority & Type */}
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <PriorityIcon priority={task.priority} />
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
 {task.taskType?.replace('_', ' ') || 'Task'}
 </span>
 </div>
 <button 
 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
 onClick={(e) => e.stopPropagation()}
 >
 <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>

 {/* Task Title */}
 <h3 className="font-medium text-foreground text-sm mb-2 line-clamp-2 group-hover:text-brand">
 {task.productName}
 </h3>

 {/* Task ID & Time */}
 <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
 <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
 TASK-{(task.id || '').slice(-4).toUpperCase()}
 </span>
 <span>•</span>
 <div className="flex items-center gap-1">
 <Timer className="h-3 w-3" />
 <span>{task.prepTimeMinutes}m</span>
 </div>
 </div>

 {/* Status badges for overdue/escalated */}
 {(task.isOverdue || task.status === 'late' || task.status === 'overdue') && (
 <div className="mb-2">
 <span className="inline-flex items-center gap-1 text-xs bg-destructive-soft text-destructive px-2 py-0.5 rounded-full">
 <AlertTriangle className="h-3 w-3" />
 {t('tasks.overdue')}
 </span>
 </div>
 )}

 {/* Bottom row - Assignee & Actions */}
 <div className="flex items-center justify-between pt-2 border-t border-border">
 {/* Assignee */}
 <div className="flex items-center gap-2">
 {assignedName ? (
 <div 
 className={`h-6 w-6 rounded-full ${getAvatarColor(assignedName)} 
 flex items-center justify-center text-white text-xs font-medium`}
 title={assignedName}
 >
 {getInitials(assignedName)}
 </div>
 ) : (
 <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
 <User className="h-3 w-3 text-muted-foreground" />
 </div>
 )}
 <span className="text-xs text-muted-foreground max-w-[80px] truncate">
 {assignedName || t('tasks.unassigned')}
 </span>
 </div>

 {/* Quick Actions */}
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 {task.status === 'scheduled' && (
 <button
 onClick={handleStart}
 disabled={isStarting}
 className="text-xs bg-brand text-brand-foreground px-2 py-1 rounded hover:bg-brand-strong 
                transition-colors disabled:opacity-50"
 >
 {isStarting ? '...' : t('tasks.start')}
 </button>
 )}
 {task.status === 'in_progress' && (
 <button
 onClick={handleComplete}
 disabled={isCompleting}
 className="text-xs bg-success text-success-foreground px-2 py-1 rounded hover:bg-success/80 
                transition-colors disabled:opacity-50"
 >
 {isCompleting ? '...' : t('tasks.done')}
 </button>
 )}
 </div>
 </div>

 {/* Due date indicator */}
 {task.dueAt && (
 <div className="mt-2 text-xs text-muted-foreground">
 Due {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}
 </div>
 )}
 </div>
 );
};

export default function TaskKanbanJira({ tasks }: TaskKanbanProps) {
 const router = useRouter();
 const { t } = useLanguage();

 // Group tasks by status
 const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
 const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
 const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done');
 const overdueTasks = tasks.filter(t => t.status === 'late' || t.status === 'overdue');

 const columns = [
 {
 id: 'overdue',
 title: t('tasks.kanban.overdue'),
 tasks: overdueTasks,
 icon: AlertTriangle,
 dotColor: 'bg-destructive',
 headerBg: 'bg-destructive-soft',
 },
 {
 id: 'todo',
 title: t('tasks.kanban.todo'),
 tasks: scheduledTasks,
 icon: Calendar,
 dotColor: 'bg-muted-foreground/30',
 headerBg: 'bg-muted/50',
 },
 {
 id: 'in_progress',
 title: t('tasks.kanban.inProgress'),
 tasks: inProgressTasks,
 icon: Clock,
 dotColor: 'bg-brand',
 headerBg: 'bg-brand-surface',
 },
 {
 id: 'done',
 title: t('tasks.kanban.done'),
 tasks: completedTasks,
 icon: CheckCircle,
 dotColor: 'bg-success',
 headerBg: 'bg-success-soft',
 },
 ];

 return (
 <div className="flex gap-4 overflow-x-auto pb-4">
 {columns.map((column) => {
 const Icon = column.icon;
 return (
 <div 
 key={column.id} 
 className="shrink-0 w-[300px] bg-muted rounded-lg"
 >
 {/* Column Header - Jira Style */}
 <div className={`px-3 py-2.5 ${column.headerBg} rounded-t-lg border-b border-border`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className={`h-2 w-2 rounded-full ${column.dotColor}`} />
 <span className="text-xs font-semibold text-foreground tracking-wide">
 {column.title}
 </span>
 <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded-full font-medium">
 {column.tasks.length}
 </span>
 </div>
 <button className="p-1 hover:bg-background/50 rounded transition-colors">
 <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </div>

 {/* Column Content */}
 <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-250px)] overflow-y-auto">
 {column.tasks.length > 0 ? (
 column.tasks.map((task) => (
 <JiraTaskCard
 key={task.id}
 task={task}
 onClick={() => router.push(`/tasks/${task.id}`)}
 t={t}
 />
 ))
 ) : (
 <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
 <Icon className="h-8 w-8 mb-2 opacity-50" />
 <span className="text-sm">{t('tasks.noTasks')}</span>
 </div>
 )}
 </div>

 {/* Add Task Button */}
 <div className="p-2 border-t border-border">
 <button className="w-full py-2 text-sm text-muted-foreground hover:text-foreground 
 hover:bg-background rounded transition-colors flex items-center 
 justify-center gap-1">
 <span className="text-lg leading-none">+</span>
 <span>{t('tasks.createTask')}</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 );
}
