'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Assignee {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface AssigneeFilterProps {
  assignees: Assignee[];
  selectedAssignees: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  includeUnassigned?: boolean;
  maxVisible?: number;
}

export default function AssigneeFilter({
  assignees,
  selectedAssignees,
  onSelectionChange,
  includeUnassigned = true,
  maxVisible = 5,
}: AssigneeFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter assignees based on search query
  const filteredAssignees = assignees.filter((assignee) => {
    if (!assignee?.profile?.firstName) return false;
    const fullName = `${assignee.profile.firstName} ${assignee.profile.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Determine which assignees to show
  const visibleAssignees = showAll
    ? filteredAssignees
    : filteredAssignees.slice(0, maxVisible);

  const remainingCount = filteredAssignees.length - maxVisible;

  // Handle checkbox toggle
  const handleToggle = (id: string) => {
    const newSelection = selectedAssignees.includes(id)
      ? selectedAssignees.filter((assigneeId) => assigneeId !== id)
      : [...selectedAssignees, id];
    onSelectionChange(newSelection);
  };

  // Handle "Unassigned" toggle
  const handleUnassignedToggle = () => {
    handleToggle('unassigned');
  };

  // Get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Count of selected filters
  const selectedCount = selectedAssignees.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
          selectedCount > 0
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
        }`}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">
          {t('projects.filter.assignee') || 'Assignee'}
        </span>
        {selectedCount > 0 && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full ltr:left-0 rtl:right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('projects.filter.searchAssignees') || 'Search assignees...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 ltr:pl-9 rtl:pr-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assignee List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Unassigned Option */}
            {includeUnassigned && (
              <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes('unassigned')}
                  onChange={handleUnassignedToggle}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {t('projects.filter.unassigned') || 'Unassigned'}
                </span>
              </label>
            )}

            {/* Assignee Options */}
            {visibleAssignees.map((assignee) => (
              <label
                key={assignee._id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(assignee._id)}
                  onChange={() => handleToggle(assignee._id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                {assignee.profile.avatar ? (
                  <Image
                    src={assignee.profile.avatar}
                    alt={`${assignee.profile.firstName} ${assignee.profile.lastName}`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarColor(
                      assignee.profile.firstName
                    )} flex items-center justify-center text-white text-xs font-medium`}
                  >
                    {getInitials(assignee.profile.firstName, assignee.profile.lastName)}
                  </div>
                )}
                <span className="text-sm text-gray-700">
                  {assignee.profile.firstName} {assignee.profile.lastName}
                </span>
              </label>
            ))}

            {/* Show More / Show Less */}
            {filteredAssignees.length > maxVisible && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {t('projects.filter.showLess') || 'Show less'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {t('projects.filter.showMore') || `Show ${remainingCount} more`}
                  </>
                )}
              </button>
            )}

            {/* No Results */}
            {filteredAssignees.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {t('projects.filter.noAssigneesFound') || 'No assignees found'}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {selectedCount > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => onSelectionChange([])}
                className="w-full text-sm text-gray-600 hover:text-gray-900 py-1.5"
              >
                {t('projects.filter.clearSelection') || 'Clear selection'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
