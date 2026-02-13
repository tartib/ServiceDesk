'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Users, Grid, Flag, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type GroupBy = 'status' | 'assignee' | 'type' | 'priority';

interface GroupBySelectorProps {
  currentGroupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
}

const groupOptions = [
  { value: 'status' as GroupBy, label: 'Status', icon: CheckCircle },
  { value: 'assignee' as GroupBy, label: 'Assignee', icon: Users },
  { value: 'type' as GroupBy, label: 'Type', icon: Grid },
  { value: 'priority' as GroupBy, label: 'Priority', icon: Flag },
];

export function GroupBySelector({ currentGroupBy, onGroupByChange }: GroupBySelectorProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = groupOptions.find(opt => opt.value === currentGroupBy);
  const CurrentIcon = currentOption?.icon || Grid;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg text-sm transition-colors"
      >
        <CurrentIcon className="h-4 w-4" />
        <span>{t('projects.board.groupBy') || 'Group by'}:</span>
        <span className="font-medium">{currentOption?.label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
          <div className="py-1">
            {groupOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onGroupByChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    currentGroupBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <OptionIcon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
