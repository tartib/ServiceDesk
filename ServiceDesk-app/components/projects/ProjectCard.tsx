'use client';

import { Star, MoreHorizontal } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  projectKey: string;
  methodology: {
    code: string;
  };
  lead?: {
    name: string;
    email?: string;
  };
  createdBy?: {
    name: string;
  };
  onClick?: () => void;
  onStar?: () => void;
  onMore?: () => void;
  variant?: 'table' | 'card';
}

const methodologyColors: Record<string, string> = {
  scrum: 'bg-green-100 text-green-700 border-green-300',
  kanban: 'bg-blue-100 text-blue-700 border-blue-300',
  waterfall: 'bg-purple-100 text-purple-700 border-purple-300',
  itil: 'bg-orange-100 text-orange-700 border-orange-300',
  lean: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  okr: 'bg-pink-100 text-pink-700 border-pink-300',
};

export default function ProjectCard({
  name,
  projectKey,
  methodology,
  lead,
  createdBy,
  onClick,
  onStar,
  onMore,
  variant = 'card',
}: ProjectCardProps) {
  const methodologyColor = methodologyColors[methodology?.code?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
  const leadName = lead?.name || createdBy?.name;

  // Card variant for mobile/grid view
  if (variant === 'card') {
    return (
      <div
        onClick={onClick}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${methodologyColor}`}>
            {projectKey.substring(0, 2)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onStar?.(); }}
              className="p-1.5 text-gray-300 hover:text-yellow-500 transition-colors"
              aria-label="Star project"
            >
              <Star className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMore?.(); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{projectKey}</p>
        
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded border ${methodologyColor}`}>
            {methodology.code}
          </span>
          {leadName && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white">
                {leadName[0]}
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
                {leadName}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Table row variant
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
    >
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onStar?.(); }}
          className="text-gray-300 hover:text-yellow-500 transition-colors"
          aria-label="Star project"
        >
          <Star className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${methodologyColor}`}>
            {projectKey.substring(0, 2)}
          </div>
          <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline truncate">
            {name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-slate-400 hidden sm:table-cell">
        {projectKey}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className={`px-2 py-1 text-xs font-medium rounded ${methodologyColor}`}>
          {methodology.code}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {leadName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white shrink-0">
              {leadName[0]}
            </div>
            <span className="text-gray-600 dark:text-slate-400 text-sm truncate">
              {leadName}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onMore?.(); }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
