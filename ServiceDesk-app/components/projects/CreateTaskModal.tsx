'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronDown, Loader2, User } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  project: Project | null;
}

interface TaskFormData {
  title: string;
  type: string;
  description: string;
  status: string;
  assignee?: string;
}

interface Member {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    email?: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

const workTypes = [
  { id: 'epic', name: 'Epic', icon: '⚡', color: 'text-purple-400' },
  { id: 'feature', name: 'Feature', icon: '📦', color: 'text-orange-400' },
  { id: 'task', name: 'Task', icon: '✓', color: 'text-blue-400' },
  { id: 'story', name: 'Story', icon: '📖', color: 'text-green-400' },
  { id: 'bug', name: 'Bug', icon: '🐛', color: 'text-red-400' },
];

const taskStatuses = [
  { id: 'idea', name: 'Idea', color: 'bg-slate-500' },
  { id: 'todo', name: 'To Do', color: 'bg-blue-500' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-yellow-500' },
  { id: 'done', name: 'Done', color: 'bg-green-500' },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  project,
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    type: 'task',
    description: '',
    status: 'idea',
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { t } = useLanguage();

  const selectedType = workTypes.find(w => w.id === formData.type);
  const selectedStatus = taskStatuses.find(s => s.id === formData.status);
  const selectedAssignee = members.find(m => m.userId._id === formData.assignee);

  // Fetch project members
  useEffect(() => {
    if (!project || !isOpen) return;

    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${project._id}/members`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        // Handle both response formats: {success, data: {members}} or direct array
        if (Array.isArray(data)) {
          setMembers(data);
        } else if (data.success && data.data?.members) {
          setMembers(data.data.members);
        } else if (data.members) {
          setMembers(data.members);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [project, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (createAnother) {
        setFormData({ ...formData, title: '', description: '' });
      } else {
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', type: 'task', description: '', status: 'idea', assignee: undefined });
    setShowTypeDropdown(false);
    setShowStatusDropdown(false);
    setShowAssigneeDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-4 md:pt-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl mb-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Create {selectedType?.name || 'Task'}
          </h2>
          <button 
            onClick={handleClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 md:px-6 py-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            Required fields are marked with an asterisk <span className="text-red-500">*</span>
          </p>

          {/* Project/Space */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
              <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-xs font-bold shrink-0">
                {project?.key?.substring(0, 2) || 'PR'}
              </div>
              <span className="truncate">{project?.name} ({project?.key})</span>
              <ChevronDown className="h-4 w-4 ml-auto shrink-0" />
            </div>
          </div>

          {/* Work Type */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work type <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); setShowAssigneeDropdown(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700 border border-blue-500 rounded text-white"
            >
              <span>{selectedType?.icon}</span>
              <span>{selectedType?.name}</span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {workTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => { setFormData({ ...formData, type: type.id }); setShowTypeDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${formData.type === type.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <button
              type="button"
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); setShowAssigneeDropdown(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900"
            >
              <span className={`w-2 h-2 rounded-full ${selectedStatus?.color}`}></span>
              <span>{selectedStatus?.name}</span>
              <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
            </button>
            <p className="text-xs text-gray-500 mt-1">This is the initial status upon creation</p>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {taskStatuses.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => { setFormData({ ...formData, status: status.id }); setShowStatusDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${formData.status === status.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                    <span>{status.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <button
              type="button"
              onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setShowTypeDropdown(false); setShowStatusDropdown(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900"
              disabled={isLoadingMembers}
            >
              {isLoadingMembers ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-500">Loading...</span>
                </>
              ) : selectedAssignee ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {selectedAssignee.userId.profile ? 
                      `${selectedAssignee.userId.profile.firstName?.charAt(0) || ''}${selectedAssignee.userId.profile.lastName?.charAt(0) || ''}` :
                      selectedAssignee.userId.name?.charAt(0) || 'U'
                    }
                  </div>
                  <span className="truncate">
                    {selectedAssignee.userId.profile ? 
                      `${selectedAssignee.userId.profile.firstName} ${selectedAssignee.userId.profile.lastName}` :
                      selectedAssignee.userId.name
                    }
                  </span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Unassigned</span>
                </>
              )}
              <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
            </button>
            {showAssigneeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {/* Unassigned option */}
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, assignee: undefined }); setShowAssigneeDropdown(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${!formData.assignee ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-400" />
                  </div>
                  <span>Unassigned</span>
                </button>
                
                {/* Members list */}
                {members.map((member) => {
                  const isSelected = formData.assignee === member.userId._id;
                  const displayName = member.userId.profile ? 
                    `${member.userId.profile.firstName} ${member.userId.profile.lastName}` :
                    member.userId.name || 'Unknown';
                  const initials = member.userId.profile ? 
                    `${member.userId.profile.firstName?.charAt(0) || ''}${member.userId.profile.lastName?.charAt(0) || ''}` :
                    member.userId.name?.charAt(0) || 'U';
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                  const colorIndex = (member.userId.profile?.firstName?.charCodeAt(0) ?? 
                                   member.userId.name?.charCodeAt(0) ?? 0) % colors.length;

                  return (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => { setFormData({ ...formData, assignee: member.userId._id }); setShowAssigneeDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      <div className={`w-6 h-6 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{member.userId.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Title/Summary */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!formData.title.trim() ? 'border-red-300' : 'border-gray-300'}`}
              placeholder={t('projects.common.enterSummary') || 'Enter a summary'}
              autoFocus
            />
            {!formData.title.trim() && (
              <p className="text-xs text-red-500 mt-1">Summary is required</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              placeholder={t('projects.common.addDescription') || 'Add a description...'}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={createAnother}
              onChange={(e) => setCreateAnother(e.target.checked)}
              className="rounded border-gray-300"
            />
            Create another
          </label>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
