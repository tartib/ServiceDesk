'use client';

import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FilterState {
  types: string[];
  priorities: string[];
  assignees: string[];
  statuses: string[];
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
  availableTypes?: string[];
  availablePriorities?: string[];
  availableAssignees?: Array<{ _id: string; name: string }>;
  availableStatuses?: Array<{ id: string; name: string }>;
}

export function AdvancedFilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
  availableTypes = ['epic', 'feature', 'story', 'task', 'bug'],
  availablePriorities = ['critical', 'high', 'medium', 'low'],
  availableAssignees = [],
  availableStatuses = [],
}: AdvancedFilterModalProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  if (!isOpen) return null;

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const clearAll = () => {
    setFilters({
      types: [],
      priorities: [],
      assignees: [],
      statuses: [],
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('projects.board.advancedFilters') || 'Advanced Filters'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Type Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('projects.board.workType') || 'Work Type'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('types', type)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.types.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('projects.board.priority') || 'Priority'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availablePriorities.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => toggleFilter('priorities', priority)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.priorities.includes(priority)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('projects.board.assignee') || 'Assignee'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFilter('assignees', 'unassigned')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.assignees.includes('unassigned')
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('projects.board.unassigned') || 'Unassigned'}
                </button>
                {availableAssignees.map((assignee) => (
                  <button
                    key={assignee._id}
                    onClick={() => toggleFilter('assignees', assignee._id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.assignees.includes(assignee._id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {assignee.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            {availableStatuses.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  {t('projects.common.status') || 'Status'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => toggleFilter('statuses', status.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        filters.statuses.includes(status.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('projects.board.clearAll') || 'Clear All'}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('projects.common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t('projects.board.applyFilters') || 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
