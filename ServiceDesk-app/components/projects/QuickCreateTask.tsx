'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, User, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamMember {
  _id: string;
  name?: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

interface QuickCreateTaskProps {
  projectId: string;
  organizationId?: string;
  teamMembers: TeamMember[];
  onTaskCreated: () => void;
  onCancel: () => void;
}

export function QuickCreateTask({
  projectId,
  organizationId,
  teamMembers,
  onTaskCreated,
  onCancel,
}: QuickCreateTaskProps) {
  const { t, locale } = useLanguage();
  const isRTL = locale === 'ar';
  
  const issueTypes = [
    { id: 'task', name: t('projects.roadmap.types.task') || 'Task', icon: '✓', color: 'bg-blue-100 text-blue-700' },
    { id: 'bug', name: t('projects.roadmap.types.bug') || 'Bug', icon: '🐛', color: 'bg-red-100 text-red-700' },
    { id: 'story', name: t('projects.roadmap.types.story') || 'Story', icon: '📖', color: 'bg-green-100 text-green-700' },
    { id: 'epic', name: t('projects.roadmap.types.epic') || 'Epic', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
  ];
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('task');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // US-06: Focus on title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // US-06: Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedType = () => issueTypes.find(t => t.id === selectedType) || issueTypes[0];
  const getSelectedAssignee = () => teamMembers.find(m => m._id === selectedAssignee);

  const getMemberName = (member: TeamMember | undefined): string => {
    if (!member) return '';
    if (member.profile?.firstName || member.profile?.lastName) {
      return `${member.profile.firstName || ''} ${member.profile.lastName || ''}`.trim();
    }
    return member.name || member.email || '';
  };

  const getMemberInitials = (member: TeamMember | undefined): string => {
    if (!member) return '?';
    if (member.profile?.firstName || member.profile?.lastName) {
      return `${member.profile.firstName?.[0] || ''}${member.profile.lastName?.[0] || ''}`.toUpperCase();
    }
    if (member.name) {
      return member.name.split(' ').map(p => p[0] || '').join('').toUpperCase().slice(0, 2);
    }
    return member.email?.[0]?.toUpperCase() || '?';
  };

  const handleCreate = async () => {
    // US-02: Title is required
    if (!title.trim()) {
      setStatusMessage(t('projects.backlog.titleRequired') || 'Title is required');
      return;
    }

    // US-05: Prevent duplicate submissions
    if (isCreating) return;

    setIsCreating(true);
    setStatusMessage(t('projects.backlog.creating') || 'Creating task...');

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      setStatusMessage(t('common.authRequired') || 'Authentication required');
      setIsCreating(false);
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (organizationId) headers['X-Organization-ID'] = organizationId;

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type: selectedType,
      };

      // US-04: Only send assignee if selected
      if (selectedAssignee) {
        payload.assignee = selectedAssignee;
      }

      // US-03: Only send dueDate if selected
      if (dueDate) {
        payload.dueDate = new Date(dueDate).toISOString();
      }

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      // US-05: Success - clear fields and refocus
      setStatusMessage(t('projects.backlog.taskCreated') || 'Task created successfully!');
      setTitle('');
      setSelectedType('task');
      setSelectedAssignee(null);
      setDueDate('');
      
      setTimeout(() => {
        setStatusMessage('');
        titleInputRef.current?.focus();
        onTaskCreated();
      }, 1000);
    } catch (error) {
      // US-05: Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setStatusMessage(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // US-06: Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg">
      {/* US-07: Status announcements for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        {/* US-01: Issue Type Selector - Compact */}
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
            aria-label={`${t('projects.backlog.issueType') || 'Issue type'}: ${getSelectedType().name}`}
            aria-haspopup="listbox"
            aria-expanded={showTypeDropdown}
            type="button"
          >
            <span className="text-lg">{getSelectedType().icon}</span>
            <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* US-01: Type Dropdown */}
          {showTypeDropdown && (
            <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50`}>
              <ul role="listbox" aria-label={t('projects.backlog.selectIssueType') || 'Select issue type'}>
                {issueTypes.map((type) => (
                  <li
                    key={type.id}
                    role="option"
                    aria-selected={selectedType === type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setShowTypeDropdown(false);
                    }}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-100 ${
                      selectedType === type.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm">{type.name}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200">
                <button className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                  {t('projects.backlog.addWorkType') || 'Add work type'}
                </button>
                <button className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                  {t('projects.backlog.editWorkType') || 'Edit work type'}
                </button>
                <button className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                  {t('projects.backlog.manage') || 'Manage'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* US-02: Title Input - Inline */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('projects.backlog.enterTaskTitle') || 'What needs to be done?'}
          maxLength={255}
          className="flex-1 px-2 py-1 text-sm border-0 focus:outline-none bg-transparent"
          aria-label={t('projects.backlog.taskTitle') || 'Task title'}
          aria-required="true"
          aria-invalid={!title.trim() && isCreating}
          disabled={isCreating}
        />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* US-03: Due Date Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
                dueDate ? 'text-blue-600' : 'text-gray-400'
              }`}
              aria-label={
                dueDate
                  ? `${t('projects.backlog.dueDate') || 'Due date'}: ${new Date(dueDate).toLocaleDateString()}`
                  : t('projects.backlog.setDueDate') || 'Set due date'
              }
              type="button"
            >
              <Calendar className="h-4 w-4" />
            </button>

            {/* US-03: Date Picker */}
            {showDatePicker && (
              <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                <label htmlFor="due-date-input" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('projects.backlog.dueDate') || 'Due date'}
                </label>
                <input
                  id="due-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={t('projects.backlog.selectDueDate') || 'Select due date'}
                />
                {dueDate && (
                  <button
                    onClick={() => {
                      setDueDate('');
                      setShowDatePicker(false);
                    }}
                    className="mt-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                    type="button"
                  >
                    {t('common.clear') || 'Clear date'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* US-04: Assignee Selector */}
          <div className="relative" ref={assigneeDropdownRef}>
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              aria-label={
                selectedAssignee
                  ? `${t('projects.backlog.assignedTo') || 'Assigned to'}: ${getMemberName(getSelectedAssignee())}`
                  : t('projects.backlog.unassigned') || 'Unassigned'
              }
              aria-haspopup="listbox"
              aria-expanded={showAssigneeDropdown}
              type="button"
            >
              {selectedAssignee && getSelectedAssignee() ? (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                  {getMemberInitials(getSelectedAssignee())}
                </div>
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {/* US-04: Assignee Dropdown */}
            {showAssigneeDropdown && (
              <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                <ul role="listbox" aria-label={t('projects.backlog.selectAssignee') || 'Select assignee'}>
                  <li
                    role="option"
                    aria-selected={!selectedAssignee}
                    onClick={() => {
                      setSelectedAssignee(null);
                      setShowAssigneeDropdown(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      !selectedAssignee ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-sm text-gray-600">{t('projects.backlog.unassigned') || 'Unassigned'}</span>
                  </li>
                  {teamMembers.filter(member => getMemberName(member)).map((member) => (
                    <li
                      key={member._id}
                      role="option"
                      aria-selected={selectedAssignee === member._id}
                      onClick={() => {
                        setSelectedAssignee(member._id);
                        setShowAssigneeDropdown(false);
                      }}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-100 ${
                        selectedAssignee === member._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                        {getMemberInitials(member)}
                      </div>
                      <span className="text-sm">
                        {getMemberName(member)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* US-05: Create Button */}
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              !title.trim() || isCreating
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label={t('projects.backlog.createTask') || 'Create task'}
            aria-disabled={!title.trim() || isCreating}
            type="button"
          >
            {isCreating ? (t('common.creating') || 'Creating...') : (t('common.create') || 'Create')}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label={t('common.cancel') || 'Cancel'}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* US-05: Status message display */}
      {statusMessage && (
        <div
          className={`mx-3 mb-2 px-3 py-2 rounded text-sm ${
            statusMessage.includes('success') || statusMessage.includes('created')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
          role="alert"
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
