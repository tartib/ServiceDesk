'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import TaskCard from './TaskCard';

interface Task {
  _id: string;
  key: string;
  title: string;
  type: string;
  priority: string;
  status: { id: string; name: string; category: string };
  assignee?: {
    _id?: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
  };
  storyPoints?: number;
}

interface DraggableBacklogItemProps {
  task: Task;
  onClick?: () => void;
}

export default function DraggableBacklogItem({ task, onClick }: DraggableBacklogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
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
      className={`group/drag flex items-center border-b border-gray-100 last:border-b-0 cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50/50 rounded-lg' : ''
      } ${isSorting ? 'transition-transform' : ''}`}
    >
      {/* Drag Handle (visual indicator) */}
      <div
        ref={setActivatorNodeRef}
        className="flex items-center justify-center w-8 shrink-0 opacity-30 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
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
