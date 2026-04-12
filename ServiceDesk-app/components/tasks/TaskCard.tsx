import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { formatTime, formatDuration, getTaskStatusColor, getTaskPriorityColor, getTaskTypeLabel } from '@/lib/utils';
import { Clock, User, Play, CheckCircle, AlertCircle, Loader2, Timer } from 'lucide-react';
import { useStartTask, useCompleteTask } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import LiveTimer from './LiveTimer';

interface TaskCardProps {
 task: Task;
 showActions?: boolean;
 onClick?: () => void;
}

export default function TaskCard({ task, showActions = true, onClick }: TaskCardProps) {
 const { user } = useAuthStore();
 const { t } = useLanguage();
 const { mutate: startTask, isPending: isStarting } = useStartTask();
 const { mutate: completeTask, isPending: isCompleting } = useCompleteTask();

 const assignedUserId = typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo;
 const canStartTask = task.status === 'scheduled' && (!assignedUserId || assignedUserId === user?.id);
 const canCompleteTask = task.status === 'in_progress' && assignedUserId === user?.id;

 // Calculate expected ready time
 const getExpectedReadyTime = () => {
 if (task.status === 'completed' && task.completedAt) {
 return formatTime(task.completedAt);
 }
 if (task.status === 'in_progress' && task.startedAt) {
 const startTime = new Date(task.startedAt);
 const expectedTime = new Date(startTime.getTime() + task.prepTimeMinutes * 60000);
 return formatTime(expectedTime.toISOString());
 }
 // For scheduled tasks, add prep time to scheduled time
 const scheduledTime = new Date(task.scheduledAt);
 const expectedTime = new Date(scheduledTime.getTime() + task.prepTimeMinutes * 60000);
 return formatTime(expectedTime.toISOString());
 };

 const handleStart = (e: React.MouseEvent) => {
 e.stopPropagation();
 startTask(task.id || '');
 };

 const handleComplete = (e: React.MouseEvent) => {
 e.stopPropagation();
 completeTask({ taskId: task.id || '' });
 };

 // Get border color and animation based on priority
 const getBorderStyle = () => {
 switch (task.priority) {
 case 'critical':
 return 'border-l-4 border-l-destructive animate-pulse';
 case 'high':
 return 'border-l-4 border-l-warning';
 case 'medium':
 return 'border-l-4 border-l-brand';
 case 'low':
 return 'border-l-4 border-l-muted-foreground';
 default:
 return 'border-l-4 border-l-border';
 }
 };

 return (
 <Card
 className={`hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group ${getBorderStyle()}`}
 onClick={onClick}
 >
 <CardContent className="p-4">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <h3 className="font-semibold text-lg group-hover:text-brand transition-colors">
 {task.productName}
 </h3>
 {task.isOverdue && (
 <Badge className="bg-destructive text-destructive-foreground text-xs">
 OVERDUE
 </Badge>
 )}
 {task.isEscalated && (
 <Badge className="bg-info text-white text-xs">
 ESCALATED
 </Badge>
 )}
 </div>
 {/* Task Type */}
 <div className="mb-2">
 <Badge variant="outline" className="text-xs">
 {getTaskTypeLabel(task.taskType)}
 </Badge>
 </div>
 
 {/* Assigned User - More Prominent */}
 {task.assignedToName && (
 <div className="flex items-center gap-2 mt-2 mb-2">
 <div className="h-7 w-7 rounded-full bg-gradient-to-r from-brand to-brand flex items-center justify-center shadow-sm">
 <User className="h-4 w-4 text-white" />
 </div>
 <div className="flex flex-col">
 <span className="text-xs text-muted-foreground">{t('assignedTo')}</span>
 <span className="text-sm font-semibold text-foreground">{task.assignedToName}</span>
 </div>
 </div>
 )}
 
 <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
 <Clock className="h-4 w-4" />
 <span>{formatTime(task.scheduledAt)}</span>
 <span className="mx-1">•</span>
 <span className="font-medium">{formatDuration(task.prepTimeMinutes)}</span>
 </div>
 
 {/* Expected Ready Time */}
 <div className="flex items-center gap-2 mt-2 text-sm">
 <Timer className="h-4 w-4 text-success" />
 <span className="text-xs text-muted-foreground">{t('expectedReadyTime')}:</span>
 <span className="font-semibold text-success">{getExpectedReadyTime()}</span>
 </div>
 
 {/* Live Timer - Prep Time Tracking */}
 <div className="mt-2">
 <LiveTimer
 scheduledAt={task.scheduledAt}
 status={task.status}
 startedAt={task.startedAt}
 completedAt={task.completedAt}
 prepTimeMinutes={task.prepTimeMinutes}
 />
 </div>
 </div>
 <div className="flex flex-col items-end gap-2">
 <Badge className={`${getTaskStatusColor(task.status)} font-medium`}>
 {task.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
 {task.status === 'in_progress' && <Loader2 className="h-3 w-3 mr-1 inline animate-spin" />}
 {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1 inline" />}
 {task.status.replace('_', ' ')}
 </Badge>
 <Badge className={`${getTaskPriorityColor(task.priority)} text-xs`}>
 {task.priority.toUpperCase()}
 </Badge>
 </div>
 </div>

 {task.notes && (
 <div className="text-xs text-muted-foreground mb-3 italic bg-warning-soft border-l-2 border-warning/40 px-3 py-2 rounded">
 &ldquo;{task.notes.length > 60 ? task.notes.substring(0, 60) + '...' : task.notes}&rdquo;
 </div>
 )}

 {showActions && (
 <div className="flex gap-2 mt-3">
 {canStartTask && (
 <Button
 size="sm"
 onClick={handleStart}
 disabled={isStarting}
 className="flex-1 bg-brand hover:bg-brand-strong transform hover:scale-105 transition-transform duration-200 shadow-sm"
 >
 {isStarting ? (
 <Loader2 className="h-4 w-4 mr-1 animate-spin" />
 ) : (
 <Play className="h-4 w-4 mr-1" />
 )}
 {isStarting ? 'Starting...' : 'Start Task'}
 </Button>
 )}
 {canCompleteTask && (
 <Button
 size="sm"
 onClick={handleComplete}
 disabled={isCompleting}
 className="flex-1 bg-success hover:bg-success/80 transform hover:scale-105 transition-transform duration-200 shadow-sm"
 >
 {isCompleting ? (
 <Loader2 className="h-4 w-4 mr-1 animate-spin" />
 ) : (
 <CheckCircle className="h-4 w-4 mr-1" />
 )}
 {isCompleting ? 'Completing...' : 'Complete'}
 </Button>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 );
}
