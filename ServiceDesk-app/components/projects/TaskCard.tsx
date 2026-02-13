'use client';

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
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

const statusColors: Record<string, string> = {
  'idea': 'bg-gray-200 text-gray-700',
  'todo': 'bg-gray-200 text-gray-700',
  'to do': 'bg-gray-200 text-gray-700',
  'backlog': 'bg-gray-200 text-gray-700',
  'in_progress': 'bg-blue-100 text-blue-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'in review': 'bg-purple-100 text-purple-700',
  'in-review': 'bg-purple-100 text-purple-700',
  'testing': 'bg-yellow-100 text-yellow-700',
  'done': 'bg-green-100 text-green-700',
  'ready': 'bg-blue-100 text-blue-700',
};

export default function TaskCard({
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
}: TaskCardProps) {
  const typeIcon = typeIcons[type] || '✓';
  const priorityColor = priorityColors[priority] || 'text-gray-500';
  const statusColor = status ? (statusColors[status.name.toLowerCase()] || 'bg-gray-200 text-gray-700') : '';

  const renderAssignee = () => {
    if (assignee) {
      let initials = '?';
      if (assignee.profile?.firstName || assignee.profile?.lastName) {
        initials = `${assignee.profile.firstName?.[0] || ''}${assignee.profile.lastName?.[0] || ''}`.toUpperCase() || '?';
      } else if (assignee.name) {
        initials = assignee.name.split(' ').map(p => p[0] || '').join('').toUpperCase().slice(0, 2) || '?';
      }
      return (
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white font-medium shrink-0">
          {initials}
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <User className="h-3 w-3 text-gray-400" />
      </div>
    );
  };

  // Board variant - Card style
  if (variant === 'board') {
    return (
      <div
        onClick={onClick}
        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      >
        <p className="text-sm text-gray-900 mb-3 line-clamp-2">{title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
              {taskKey}
            </span>
            <span className="text-xs">{typeIcon}</span>
            <span className={`text-xs ${priorityColor}`}>=</span>
            {storyPoints !== undefined && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {storyPoints}
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
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 cursor-pointer group transition-colors"
      >
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded border-gray-300 bg-white shrink-0" 
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm shrink-0">{typeIcon}</span>
        <span className="text-blue-600 text-sm font-medium shrink-0">{taskKey}</span>
        <span className="flex-1 text-sm text-gray-900 truncate">{title}</span>
        {showStatus && status && (
          <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${statusColor}`}>
            {status.name.toUpperCase()}
          </span>
        )}
        <span className="text-gray-400 shrink-0">—</span>
        <span className={`${priorityColor} shrink-0`}>=</span>
        {renderAssignee()}
      </div>
    );
  }

  // Compact variant - Minimal style
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors"
    >
      <span className="text-xs">{typeIcon}</span>
      <span className="text-blue-600 text-xs">{taskKey}</span>
      <span className="text-xs text-gray-900 truncate flex-1">{title}</span>
      {renderAssignee()}
    </div>
  );
}
