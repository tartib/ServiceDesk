'use client';

import { X } from 'lucide-react';
import type { FilterState } from './AdvancedFilterModal';

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (category: keyof FilterState, value: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const hasActiveFilters = 
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.statuses.length > 0;

  if (!hasActiveFilters) return null;

  const totalFilters = 
    filters.types.length +
    filters.priorities.length +
    filters.assignees.length +
    filters.statuses.length;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200">
      <span className="text-sm font-medium text-blue-900">
        {totalFilters} {totalFilters === 1 ? 'filter' : 'filters'} active:
      </span>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.types.map((type) => (
          <span
            key={`type-${type}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
          >
            Type: {type}
            <button
              onClick={() => onRemoveFilter('types', type)}
              className="hover:bg-blue-200 rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {filters.priorities.map((priority) => (
          <span
            key={`priority-${priority}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
          >
            Priority: {priority}
            <button
              onClick={() => onRemoveFilter('priorities', priority)}
              className="hover:bg-blue-200 rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {filters.assignees.map((assignee) => (
          <span
            key={`assignee-${assignee}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
          >
            Assignee: {assignee === 'unassigned' ? 'Unassigned' : assignee}
            <button
              onClick={() => onRemoveFilter('assignees', assignee)}
              className="hover:bg-blue-200 rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {filters.statuses.map((status) => (
          <span
            key={`status-${status}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
          >
            Status: {status}
            <button
              onClick={() => onRemoveFilter('statuses', status)}
              className="hover:bg-blue-200 rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <button
        onClick={onClearAll}
        className="ml-auto text-xs text-blue-700 hover:text-blue-900 font-medium"
      >
        Clear all
      </button>
    </div>
  );
}
