'use client';

import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

interface Task {
  _id: string;
  key: string;
  title: string;
  type: string;
  priority: string;
  status: {
    id: string;
    name: string;
    category: string;
  };
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

interface BoardColumnProps {
  id: string;
  name: string;
  color?: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateTask?: () => void;
  showCreateButton?: boolean;
  emptyMessage?: string;
}

export default function BoardColumn({
  name,
  tasks,
  onTaskClick,
  onCreateTask,
  showCreateButton = false,
  emptyMessage = 'No tasks',
}: BoardColumnProps) {
  return (
    <div className="w-72 md:w-80 shrink-0 bg-slate-800/50 rounded-lg flex flex-col max-h-full">
      {/* Column Header */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300 text-sm uppercase tracking-wide">
              {name}
            </span>
            <span className="text-sm text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="px-2 pb-2 space-y-2 flex-1 overflow-y-auto min-h-0">
        {/* Create Button */}
        {showCreateButton && onCreateTask && (
          <button
            onClick={onCreateTask}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </button>
        )}

        {/* Task Cards */}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            taskKey={task.key}
            title={task.title}
            type={task.type}
            priority={task.priority}
            status={task.status}
            assignee={task.assignee}
            storyPoints={task.storyPoints}
            onClick={() => onTaskClick?.(task)}
            variant="board"
          />
        ))}

        {/* Empty State */}
        {tasks.length === 0 && !showCreateButton && (
          <div className="text-center py-8 text-slate-500 text-sm">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
