'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Bug,
  Bookmark,
  Layers,
  CheckCircle2,
  Circle,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  AlertTriangle,
  User,
} from 'lucide-react';
import type { MapNodeDataDTO } from '@/lib/domains/pm/dto';

const statusCategoryColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  done: 'bg-green-100 text-green-700 border-green-300',
};

const priorityIcons: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-3 w-3 text-red-600" />,
  high: <ArrowUpCircle className="h-3 w-3 text-orange-500" />,
  medium: <MinusCircle className="h-3 w-3 text-yellow-500" />,
  low: <ArrowDownCircle className="h-3 w-3 text-blue-400" />,
};

const typeIcons: Record<string, React.ReactNode> = {
  epic: <Zap className="h-3.5 w-3.5 text-purple-600" />,
  story: <Bookmark className="h-3.5 w-3.5 text-green-600" />,
  task: <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />,
  bug: <Bug className="h-3.5 w-3.5 text-red-600" />,
  subtask: <Layers className="h-3.5 w-3.5 text-gray-500" />,
  change_request: <Circle className="h-3.5 w-3.5 text-amber-600" />,
};

function ProjectMapNodeInner({ data, selected }: NodeProps) {
  const nodeData = data as unknown as MapNodeDataDTO;
  const categoryClass = statusCategoryColors[nodeData.statusCategory] || statusCategoryColors.todo;

  return (
    <div
      className={`
        bg-white rounded-lg border-2 shadow-sm px-3 py-2 min-w-[180px] max-w-[240px]
        transition-all duration-150
        ${selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />

      {/* Header: type icon + key */}
      <div className="flex items-center gap-1.5 mb-1">
        {typeIcons[nodeData.type] || <Circle className="h-3.5 w-3.5 text-gray-400" />}
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          {nodeData.key}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {priorityIcons[nodeData.priority]}
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2 mb-1.5">
        {nodeData.title}
      </p>

      {/* Footer: status badge + assignee + story points */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${categoryClass}`}>
          {nodeData.status}
        </span>

        {nodeData.storyPoints !== undefined && nodeData.storyPoints !== null && (
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {nodeData.storyPoints}SP
          </span>
        )}

        {nodeData.assigneeName && (
          <div className="ml-auto flex items-center gap-1" title={nodeData.assigneeName}>
            {nodeData.assigneeAvatar ? (
              <img
                src={nodeData.assigneeAvatar}
                alt={nodeData.assigneeName}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <User className="h-3 w-3 text-gray-400" />
            )}
            <span className="text-[10px] text-gray-500 max-w-[60px] truncate">
              {nodeData.assigneeName.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Labels */}
      {nodeData.labels && nodeData.labels.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {nodeData.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-[9px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded"
            >
              {label}
            </span>
          ))}
          {nodeData.labels.length > 3 && (
            <span className="text-[9px] text-gray-400">+{nodeData.labels.length - 3}</span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}

const ProjectMapNode = memo(ProjectMapNodeInner);
export default ProjectMapNode;
