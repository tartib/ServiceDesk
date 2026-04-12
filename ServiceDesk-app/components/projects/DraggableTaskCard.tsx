'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User } from 'lucide-react';

interface Task {
 _id: string;
 key: string;
 title: string;
 type: string;
 status: {
 id: string;
 name: string;
 category: string;
 };
 priority: string;
 assignee?: {
 _id: string;
 name?: string;
 profile?: {
 firstName: string;
 lastName: string;
 avatar?: string;
 };
 };
 storyPoints?: number;
}

interface DraggableTaskCardProps {
 task: Task;
 onClick: () => void;
 getTypeIcon: (type: string) => string;
 getPriorityColor: (priority: string) => string;
}

function DraggableTaskCardInner({
 task,
 onClick,
 getTypeIcon,
 getPriorityColor,
}: DraggableTaskCardProps) {
 const {
 attributes,
 listeners,
 setNodeRef,
 transform,
 transition,
 isDragging,
 } = useSortable({ id: task._id });

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 opacity: isDragging ? 0.5 : 1,
 };

 return (
 <div
 ref={setNodeRef}
 style={style}
 {...attributes}
 {...listeners}
 onClick={onClick}
 data-testid={`task-card-${task.key}`}
 draggable="true"
 className={`bg-background border border-border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer group ${
 isDragging ? 'shadow-lg ring-2 ring-ring' : ''
 }`}
 >
 <p data-testid="task-title" className="text-sm text-foreground mb-3">{task.title}</p>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span data-testid="task-key" className="text-xs text-brand bg-brand-soft px-1.5 py-0.5 rounded">
 {task.key}
 </span>
 <span data-testid="task-type-icon" className="text-xs">{getTypeIcon(task.type)}</span>
 <span data-testid="priority-indicator" className={`text-xs ${getPriorityColor(task.priority)}`}>
 =
 </span>
 {task.storyPoints && (
 <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
 {task.storyPoints}
 </span>
 )}
 </div>
 {task.assignee ? (
 <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center text-xs text-white">
 {task.assignee.profile?.firstName?.[0] || task.assignee.name?.[0] || 'U'}
 {task.assignee.profile?.lastName?.[0] || ''}
 </div>
 ) : (
 <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
 <User className="h-3 w-3 text-muted-foreground" />
 </div>
 )}
 </div>
 </div>
 );
}

export const DraggableTaskCard = React.memo(DraggableTaskCardInner);
