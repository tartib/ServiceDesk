'use client';

import React from 'react';
import { User } from 'lucide-react';

interface TaskAssignee {
 name?: string;
 email?: string;
 profile?: {
 firstName?: string;
 lastName?: string;
 avatar?: string;
 };
}

interface TaskCardProps {
 taskKey: string;
 title: string;
 type: string;
 priority: string;
 status?: {
 id: string;
 name: string;
 category: string;
 };
 assignee?: TaskAssignee;
 storyPoints?: number;
 onClick?: () => void;
 variant?: 'board' | 'list' | 'compact';
 showStatus?: boolean;
 parentKey?: string;
 subtaskCount?: number;
 subtaskDoneCount?: number;
}

const typeIcons: Record<string, string> = {
 epic: '⚡',
 story: '📖',
 task: '✓',
 bug: '🐛',
 subtask: '📎',
 feature: '📦',
};

const priorityColors: Record<string, string> = {
 critical: 'text-destructive',
 high: 'text-warning',
 medium: 'text-warning',
 low: 'text-success',
};

const statusColors: Record<string, string> = {
 'idea': 'bg-muted text-foreground',
 'todo': 'bg-muted text-foreground',
 'to do': 'bg-muted text-foreground',
 'backlog': 'bg-muted text-foreground',
 'in_progress': 'bg-brand-soft text-brand',
 'in progress': 'bg-brand-soft text-brand',
 'in-progress': 'bg-brand-soft text-brand',
 'in review': 'bg-info-soft text-info',
 'in-review': 'bg-info-soft text-info',
 'testing': 'bg-warning-soft text-warning',
 'done': 'bg-success-soft text-success',
 'ready': 'bg-brand-soft text-brand',
};

function TaskCard({
 taskKey,
 title,
 type,
 priority,
 status,
 assignee,
 storyPoints,
 onClick,
 variant = 'board',
 showStatus = false,
 parentKey,
 subtaskCount,
 subtaskDoneCount,
}: TaskCardProps) {
 const typeIcon = typeIcons[type] || '✓';
 const priorityColor = priorityColors[priority] || 'text-muted-foreground';
 const statusColor = status ? (statusColors[status.name.toLowerCase()] || 'bg-muted text-foreground') : '';

 const renderAssignee = () => {
 if (assignee) {
 let initials = '?';
 if (assignee.profile?.firstName || assignee.profile?.lastName) {
 initials = `${assignee.profile.firstName?.[0] || ''}${assignee.profile.lastName?.[0] || ''}`.toUpperCase() || '?';
 } else if (assignee.name) {
 initials = assignee.name.split(' ').map(p => p[0] || '').join('').toUpperCase().slice(0, 2) || '?';
 }
 return (
 <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center text-xs text-white font-medium shrink-0">
 {initials}
 </div>
 );
 }
 return (
 <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
 <User className="h-3 w-3 text-muted-foreground" />
 </div>
 );
 };

 // Board variant - Card style
 if (variant === 'board') {
 return (
 <div
 onClick={onClick}
 className="bg-background border border-border rounded-lg p-3 hover:shadow-md hover:border-border transition-all cursor-pointer group"
 >
 {parentKey && (
 <div className="flex items-center gap-1 mb-1.5">
 <span className="text-[10px] text-info bg-info-soft px-1.5 py-0.5 rounded font-medium">↑ {parentKey}</span>
 </div>
 )}
 <p className="text-sm text-foreground mb-3 line-clamp-2">{title}</p>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-xs text-brand bg-brand-soft px-1.5 py-0.5 rounded font-medium">
 {taskKey}
 </span>
 <span className="text-xs">{typeIcon}</span>
 <span className={`text-xs ${priorityColor}`}>=</span>
 {storyPoints !== undefined && (
 <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
 {storyPoints}
 </span>
 )}
 {subtaskCount !== undefined && subtaskCount > 0 && (
 <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-0.5" title={`${subtaskDoneCount || 0}/${subtaskCount} subtasks done`}>
 ☐ {subtaskDoneCount || 0}/{subtaskCount}
 </span>
 )}
 </div>
 {renderAssignee()}
 </div>
 </div>
 );
 }

 // List variant - Row style
 if (variant === 'list') {
 return (
 <div
 onClick={onClick}
 className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 border-b border-border cursor-pointer group transition-colors"
 >
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded border-border bg-background shrink-0" 
 onClick={(e) => e.stopPropagation()}
 />
 <span className="text-sm shrink-0">{typeIcon}</span>
 <span className="text-brand text-sm font-medium shrink-0">{taskKey}</span>
 {parentKey && (
 <span className="text-[10px] text-info bg-info-soft px-1 py-0.5 rounded font-medium shrink-0">↑ {parentKey}</span>
 )}
 <span className="flex-1 text-sm text-foreground truncate">{title}</span>
 {showStatus && status && (
 <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${statusColor}`}>
 {status.name.toUpperCase()}
 </span>
 )}
 <span className="text-muted-foreground shrink-0">—</span>
 <span className={`${priorityColor} shrink-0`}>=</span>
 {subtaskCount !== undefined && subtaskCount > 0 && (
 <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0" title={`${subtaskDoneCount || 0}/${subtaskCount} subtasks done`}>
 ☐ {subtaskDoneCount || 0}/{subtaskCount}
 </span>
 )}
 {renderAssignee()}
 </div>
 );
 }

 // Compact variant - Minimal style
 return (
 <div
 onClick={onClick}
 className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer transition-colors"
 >
 <span className="text-xs">{typeIcon}</span>
 <span className="text-brand text-xs">{taskKey}</span>
 <span className="text-xs text-foreground truncate flex-1">{title}</span>
 {renderAssignee()}
 </div>
 );
}

export default React.memo(TaskCard);
