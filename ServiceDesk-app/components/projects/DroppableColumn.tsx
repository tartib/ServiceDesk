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
 color?: string;
}

export function DroppableColumn({
 id,
 title,
 count,
 children,
 taskIds,
 onCreateTask,
 showCreateButton = false,
 color = '#f5f3ff',
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      data-testid={`column-${id}`}
      style={{ backgroundColor: color }}
      className={`w-72 shrink-0 rounded-lg flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-ring bg-brand-surface' : ''
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm uppercase tracking-wide">
              {title}
            </span>
            <span data-testid={`column-${id}-count`} className="text-sm text-muted-foreground">{count}</span>
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
 className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors text-sm"
 >
 <Plus className="h-4 w-4" />
 <span>Create</span>
 </button>
 )}

 <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
 {children}
 </SortableContext>

 {count === 0 && !showCreateButton && (
 <div data-testid="empty-column-state" className="text-center py-8 text-muted-foreground text-sm">No tasks</div>
 )}
 </div>
 </div>
 );
}
