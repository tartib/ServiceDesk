'use client';

import { useState, useRef, useEffect } from 'react';

interface EditableTaskTitleProps {
  taskId: string;
  initialValue: string;
  onSave: (taskId: string, newTitle: string) => Promise<void>;
  className?: string;
}

export function EditableTaskTitle({ taskId, initialValue, onSave, className = '' }: EditableTaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value.trim() === '' || value === initialValue) {
      setValue(initialValue);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(taskId, value.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save title:', error);
      setValue(initialValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      />
    );
  }

  return (
    <p
      onClick={() => setIsEditing(true)}
      className={`text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 -mx-1 ${className}`}
    >
      {initialValue}
    </p>
  );
}
