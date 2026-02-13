'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useRef } from 'react';

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  taskIds: string[];
  onCreateTask?: () => void;
  showCreateButton?: boolean;
}

export function DroppableColumn({
  id,
  title,
  count,
  children,
  taskIds,
  onCreateTask,
  showCreateButton = false,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      data-testid={`column-${id}`}
      className={`w-72 shrink-0 bg-gray-200/70 rounded-lg flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 text-sm uppercase tracking-wide">
              {title}
            </span>
            <span data-testid={`column-${id}-count`} className="text-sm text-gray-500">{count}</span>
          </div>
        </div>
      </div>

      <div 
        ref={(node) => {
          setNodeRef(node);
          scrollRef.current = node;
        }}
        className="px-2 pb-2 space-y-2 flex-1 overflow-y-auto"
      >
        {showCreateButton && onCreateTask && (
          <button
            data-testid="create-task-btn"
            onClick={onCreateTask}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-300/50 rounded transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        )}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>

        {count === 0 && !showCreateButton && (
          <div data-testid="empty-column-state" className="text-center py-8 text-gray-400 text-sm">No tasks</div>
        )}
      </div>
    </div>
  );
}
