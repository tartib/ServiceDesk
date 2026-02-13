'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface StoryPointsEditorProps {
  taskId: string;
  initialValue?: number;
  onSave: (taskId: string, points: number | null) => Promise<void>;
}

const COMMON_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

export function StoryPointsEditor({ taskId, initialValue, onSave }: StoryPointsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSelect = async (points: number | null) => {
    if (points === initialValue) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(taskId, points);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save story points:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
          initialValue
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${isSaving ? 'opacity-50' : ''}`}
      >
        <span>{initialValue !== undefined && initialValue !== null ? initialValue : '—'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
          <div className="py-1">
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              None
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            {COMMON_POINTS.map((points) => (
              <button
                key={points}
                onClick={() => handleSelect(points)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 transition-colors ${
                  initialValue === points ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                {points} {points === 1 ? 'point' : 'points'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
