'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

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
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  storyPoints?: number;
}

interface VirtualTaskListProps {
  tasks: Task[];
  renderTask: (task: Task) => React.ReactNode;
}

export function VirtualTaskList({ tasks, renderTask }: VirtualTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  if (tasks.length < 20) {
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task._id}>{renderTask(task)}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="overflow-y-auto h-full">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={task._id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderTask(task)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
