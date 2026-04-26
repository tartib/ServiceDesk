import type { Task } from './types';

export const getStatusBadge = (status: string) => {
 const statusColors: Record<string, string> = {
 'idea': 'bg-muted text-foreground',
 'todo': 'bg-muted text-foreground',
 'in_progress': 'bg-brand-soft text-brand',
 'in progress': 'bg-brand-soft text-brand',
 'done': 'bg-success-soft text-success',
 'testing': 'bg-warning-soft text-warning',
 };
 return statusColors[status.toLowerCase()] || 'bg-muted text-foreground';
};

export const getTypeColor = (type: string) => {
 const colors: Record<string, string> = {
 epic: 'text-info',
 story: 'text-success',
 task: 'text-brand',
 bug: 'text-destructive',
 };
 return colors[type] || 'text-brand';
};

export const getTypeIcon = (type: string) => {
 const icons: Record<string, string> = {
 epic: '⚡',
 story: '📖',
 task: '✓',
 bug: '🐛',
 };
 return icons[type] || '✓';
};

export const getTaskProgress = (task: Task) => {
 const statusName = task.status?.name?.toLowerCase() || '';
 const statusCategory = task.status?.category?.toLowerCase() || '';

 if (statusName === 'done' || statusName === 'resolved' || statusCategory === 'done' || task.resolved) {
 return 100;
 }
 if (statusName === 'in progress' || statusName === 'in_progress' || statusCategory === 'in_progress') {
 return 50;
 }
 if (statusName === 'testing' || statusName === 'review' || statusName === 'in review') {
 return 75;
 }
 if (statusName === 'todo' || statusName === 'to do' || statusName === 'idea' || statusCategory === 'todo') {
 return 0;
 }
 return 0;
};

export const getTaskBarColor = (task: Task) => {
 if (task.type === 'epic') {
 return task.color === 'PURPLE' ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' :
 task.color === 'BLUE' ? 'linear-gradient(135deg, #ffffff 0%, #2563eb 100%)' :
 task.color === 'GREEN' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)';
 }
 return task.type === 'bug' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
 task.type === 'story' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
 'linear-gradient(135deg, #ffffff 0%, #2563eb 100%)';
};

export const getProgressColor = (progress: number) => {
 if (progress === 100) return 'bg-success';
 if (progress >= 50) return 'bg-brand';
 if (progress > 0) return 'bg-warning';
 return 'bg-muted';
};

export const getProgressTextColor = (progress: number) => {
 if (progress === 100) return 'text-success';
 if (progress >= 50) return 'text-brand';
 if (progress > 0) return 'text-warning';
 return 'text-muted-foreground';
};
