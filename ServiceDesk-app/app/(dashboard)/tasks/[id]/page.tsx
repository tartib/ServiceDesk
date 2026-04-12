'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTask, useStartTask, useCompleteTask, useAssignTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import { 
 ArrowLeft, 
 Clock, 
 User, 
 Package, 
 Calendar, 
 Loader2, 
 Play, 
 CheckCircle,
 AlertCircle,
 FileText,
 Flag,
 Timer,
 AlertTriangle,
 TrendingUp,
 RefreshCw,
 Tag,
 ChefHat,
 Scale,
 UserPlus
} from 'lucide-react';
import { use, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Priority Icon Component
const PriorityIcon = ({ priority }: { priority: string }) => {
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

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter();
 const { t } = useLanguage();
 const { user } = useAuthStore();
 const { id } = use(params);
 const { data: task, isLoading } = useTask(id);
 const { mutate: startTask, isPending: isStarting } = useStartTask();
 const { mutate: completeTask, isPending: isCompleting } = useCompleteTask();
 const { mutate: assignTask, isPending: isAssigning } = useAssignTask();
 const { data: users = [], isLoading: isLoadingUsers } = useUsers();
 const [selectedUserId, setSelectedUserId] = useState<string>('');
 const [isEditingAssignment, setIsEditingAssignment] = useState(false);

 if (isLoading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center min-h-[400px]">
 <Loader2 className="h-8 w-8 animate-spin text-brand" />
 </div>
 </DashboardLayout>
 );
 }

 if (!task || !task.status) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground text-lg">{t('tasks.taskNotFound')}</p>
 <Button onClick={() => router.push('/tasks')} className="mt-4">
 {t('tasks.backToTasks')}
 </Button>
 </div>
 </DashboardLayout>
 );
 }

 const assignedUserId = typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo;
 const assignedUserName = typeof task.assignedTo === 'object' ? task.assignedTo?.name : task.assignedToName;
 const canStartTask = task.status === 'scheduled' && (!assignedUserId || assignedUserId === user?.id);
 const canCompleteTask = task.status === 'in_progress' && assignedUserId === user?.id;
 
 // Extract product info
 const productInfo = typeof task.productId === 'object' ? task.productId : null;
 const productId = typeof task.productId === 'object' ? task.productId._id : task.productId;

 const handleStart = () => {
 startTask(task.id || '');
 };

 const handleComplete = () => {
 completeTask({ taskId: task.id || '' });
 };

 const handleAssignToMe = () => {
 if (user?.id) {
 assignTask({ 
 taskId: task.id || '', 
 userId: user.id,
 userName: user.name || user.email || 'Unknown User'
 });
 }
 };

 const handleAssignToUser = () => {
 if (selectedUserId) {
 const selectedUser = users.find(u => u.id === selectedUserId);
 if (selectedUser) {
 assignTask({ 
 taskId: task.id || '', 
 userId: selectedUserId,
 userName: selectedUser.name
 });
 setSelectedUserId('');
 }
 }
 };

 // Allow assignment for unassigned tasks, or reassignment for tasks not yet completed
 const canAssign = ['scheduled', 'late', 'overdue', 'in_progress'].includes(task.status);

 const getStatusIcon = () => {
 switch (task.status) {
 case 'late':
 case 'overdue':
 return <AlertCircle className="h-5 w-5 text-destructive" />;
 case 'in_progress':
 return <Loader2 className="h-5 w-5 text-brand animate-spin" />;
 case 'completed':
 case 'done':
 return <CheckCircle className="h-5 w-5 text-success" />;
 default:
 return <Calendar className="h-5 w-5 text-muted-foreground" />;
 }
 };

 const getStatusLabel = (status: string) => {
 switch (status) {
 case 'late': return t('tasks.overdue');
 case 'overdue': return t('tasks.overdue');
 case 'in_progress': return t('tasks.inProgress');
 case 'scheduled': return t('tasks.scheduled');
 case 'completed': return t('tasks.completed');
 case 'done': return t('tasks.done');
 default: return status;
 }
 };

 const getPriorityLabel = (priority: string) => {
 switch (priority) {
 case 'critical': return t('tasks.critical');
 case 'high': return t('tasks.high');
 case 'medium': return t('tasks.medium');
 case 'low': return t('tasks.low');
 default: return priority;
 }
 };

 return (
 <DashboardLayout>
 <div className="max-w-5xl mx-auto space-y-6">
 {/* Header with Back Button */}
 <div className="flex items-center gap-4">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => router.back()}
 className="gap-2 text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" />
 {t('common.back')}
 </Button>
 </div>

 {/* Main Header Card */}
 <div className="bg-background rounded-xl shadow-sm border overflow-hidden">
 {/* Status Banner */}
 <div className={`px-6 py-3 ${task.status === 'late' || task.status === 'overdue' ? 'bg-destructive' : task.status === 'in_progress' ? 'bg-brand' : task.status === 'completed' || task.status === 'done' ? 'bg-success' : 'bg-muted-foreground/50'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-white">
 {getStatusIcon()}
 <span className="font-semibold uppercase tracking-wide text-sm">
 {getStatusLabel(task.status)}
 </span>
 </div>
 <span className="text-white/80 text-sm font-mono">
 TASK-{(task.id || '').slice(-6).toUpperCase()}
 </span>
 </div>
 </div>

 {/* Task Title & Quick Info */}
 <div className="p-6">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <h1 className="text-2xl font-bold text-foreground mb-2">
 {task.productName}
 </h1>
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <PriorityIcon priority={task.priority} />
 <span className="capitalize">{getPriorityLabel(task.priority)} {t('tasks.priority')}</span>
 </div>
 <div className="flex items-center gap-1">
 <Timer className="h-4 w-4" />
 <span>{task.prepTimeMinutes} {t('tasks.min')}</span>
 </div>
 <div className="flex items-center gap-1">
 <Tag className="h-4 w-4" />
 <span className="capitalize">{task.taskType?.replace('_', ' ') || 'Task'}</span>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2">
 {canStartTask && (
 <Button
 onClick={handleStart}
 disabled={isStarting}
 className="bg-brand hover:bg-brand-strong"
 >
 {isStarting ? (
 <Loader2 className="h-4 w-4 animate-spin mr-2" />
 ) : (
 <Play className="h-4 w-4 mr-2" />
 )}
 {t('tasks.startTask')}
 </Button>
 )}
 {canCompleteTask && (
 <Button
 onClick={handleComplete}
 disabled={isCompleting}
 className="bg-success hover:bg-success/80"
 >
 {isCompleting ? (
 <Loader2 className="h-4 w-4 animate-spin mr-2" />
 ) : (
 <CheckCircle className="h-4 w-4 mr-2" />
 )}
 {t('tasks.complete')}
 </Button>
 )}
 </div>
 </div>

 {/* Overdue Warning */}
 {(task.isOverdue || task.status === 'late' || task.status === 'overdue') && (
 <div className="mt-4 p-3 bg-destructive-soft border border-destructive/30 rounded-lg flex items-center gap-2">
 <AlertTriangle className="h-5 w-5 text-destructive" />
 <span className="text-destructive font-medium">{t('tasks.overdueWarning')}</span>
 </div>
 )}
 </div>
 </div>

 {/* Two Column Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column - Main Details */}
 <div className="lg:col-span-2 space-y-6">
 {/* Schedule & Time Card */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Clock className="h-5 w-5 text-brand" />
 {t('tasks.scheduleTime')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('tasks.scheduledAt')}</p>
 <p className="font-semibold text-foreground">
 {format(new Date(task.scheduledAt), 'MMM dd, yyyy')}
 </p>
 <p className="text-sm text-muted-foreground">
 {format(new Date(task.scheduledAt), 'hh:mm a')}
 </p>
 </div>
 <div className="p-4 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('tasks.prepTime')}</p>
 <p className="font-semibold text-foreground">
 {formatDuration(task.prepTimeMinutes)}
 </p>
 <p className="text-sm text-muted-foreground">
 {task.prepTimeMinutes} {t('tasks.minutes')}
 </p>
 </div>
 {task.startedAt && (
 <div className="p-4 bg-brand-surface rounded-lg">
 <p className="text-xs text-brand uppercase tracking-wide mb-1">{t('tasks.startedAt')}</p>
 <p className="font-semibold text-foreground">
 {format(new Date(task.startedAt), 'MMM dd, hh:mm a')}
 </p>
 </div>
 )}
 {task.completedAt && (
 <div className="p-4 bg-success-soft rounded-lg">
 <p className="text-xs text-success uppercase tracking-wide mb-1">{t('tasks.completedAt')}</p>
 <p className="font-semibold text-foreground">
 {format(new Date(task.completedAt), 'MMM dd, hh:mm a')}
 </p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Product Details Card */}
 {productInfo && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <ChefHat className="h-5 w-5 text-warning" />
 {t('tasks.productDetails')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-warning-soft rounded-lg">
 <div>
 <p className="font-semibold text-foreground">{productInfo.name}</p>
 </div>
 <Badge variant="outline" className="capitalize">
 {productInfo.category}
 </Badge>
 </div>

 
 </div>
 </CardContent>
 </Card>
 )}

 {/* Notes Card */}
 {task.notes && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <FileText className="h-5 w-5 text-warning" />
 {t('tasks.notes')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="p-4 bg-warning-soft border-l-4 border-warning/40 rounded-r-lg">
 <p className="text-foreground">{task.notes}</p>
 </div>
 </CardContent>
 </Card>
 )}
 </div>

 {/* Right Column - Sidebar */}
 <div className="space-y-6">
 {/* Assignment Card */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <User className="h-5 w-5 text-info" />
 {t('tasks.assignment')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t('tasks.assignedTo')}</p>
 {assignedUserName ? (
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-info-soft flex items-center justify-center">
 <span className="text-info font-semibold">
 {assignedUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
 </span>
 </div>
 <div>
 <p className="font-medium text-foreground">{assignedUserName}</p>
 <p className="text-xs text-muted-foreground capitalize">{task.assignmentType?.replace('_', ' ')}</p>
 </div>
 </div>
 {canAssign && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setIsEditingAssignment(!isEditingAssignment)}
 className="text-muted-foreground hover:text-foreground"
 >
 {isEditingAssignment ? t('common.cancel') : t('common.edit')}
 </Button>
 )}
 </div>
 ) : (
 <div className="flex items-center gap-3 text-muted-foreground">
 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
 <User className="h-5 w-5" />
 </div>
 <span>{t('tasks.unassigned')}</span>
 </div>
 )}
 </div>
 {/* Assign Actions */}
 {(canAssign && (!assignedUserId || isEditingAssignment)) && (
 <div className="space-y-3 pt-2 border-t">
 {/* Assign to Me Button */}
 <Button
 onClick={handleAssignToMe}
 disabled={isAssigning}
 variant="outline"
 className="w-full"
 >
 {isAssigning ? (
 <Loader2 className="h-4 w-4 animate-spin mr-2" />
 ) : (
 <UserPlus className="h-4 w-4 mr-2" />
 )}
 {t('tasks.assignToMe')}
 </Button>

 {/* Assign to User Dropdown */}
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('tasks.assignToUser')}</p>
 <div className="flex gap-2">
 <select
 value={selectedUserId}
 onChange={(e) => setSelectedUserId(e.target.value)}
 disabled={isAssigning || isLoadingUsers}
 className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
 >
 <option value="">{t('tasks.selectUser')}</option>
 {users.map((u) => (
 <option key={u.id} value={u.id}>
 {u.name} ({u.role})
 </option>
 ))}
 </select>
 <Button
 onClick={handleAssignToUser}
 disabled={isAssigning || !selectedUserId}
 size="sm"
 className="px-3"
 >
 {isAssigning ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <UserPlus className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Metrics Card */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <TrendingUp className="h-5 w-5 text-success" />
 {t('tasks.metrics')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2">
 <Scale className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{t('tasks.waste')}</span>
 </div>
 <span className="font-semibold">{task.waste || 0}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2">
 <Timer className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{t('tasks.timeRemaining')}</span>
 </div>
 <span className="font-semibold">{task.timeRemaining || 0} {t('tasks.min')}</span>
 </div>
 {task.performanceScore !== null && task.performanceScore !== undefined && (
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2">
 <TrendingUp className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{t('tasks.performance')}</span>
 </div>
 <span className="font-semibold">{task.performanceScore}%</span>
 </div>
 )}
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2">
 <RefreshCw className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{t('tasks.recurring')}</span>
 </div>
 <Badge variant={task.isRecurring ? 'default' : 'secondary'}>
 {task.isRecurring ? t('tasks.yes') : t('tasks.no')}
 </Badge>
 </div>
 </CardContent>
 </Card>

 {/* Tags Card */}
 {task.tags && task.tags.length > 0 && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Tag className="h-5 w-5 text-info" />
 {t('tasks.tags')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2">
 {task.tags.map((tag: string, idx: number) => (
 <Badge key={idx} variant="outline" className="bg-info-soft">
 {tag}
 </Badge>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Timestamps Card */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Calendar className="h-5 w-5 text-muted-foreground" />
 {t('tasks.activity')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">{t('tasks.created')}</span>
 <span className="text-foreground">
 {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">{t('tasks.updated')}</span>
 <span className="text-foreground">
 {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
 </span>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}
