'use client';

import { API_URL } from '@/lib/api/config';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronDown, Loader2, User, Search, GitBranch } from 'lucide-react';
import { useProjectIssueTypes } from '@/hooks/useProjectIssueTypes';

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
 parentId?: string;
}

interface ParentTaskOption {
 _id: string;
 key: string;
 title: string;
 type: string;
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

const taskStatuses = [
 { id: 'idea', name: 'Idea', color: 'bg-muted/70' },
 { id: 'todo', name: 'To Do', color: 'bg-brand' },
 { id: 'in_progress', name: 'In Progress', color: 'bg-warning' },
 { id: 'done', name: 'Done', color: 'bg-success' },
];

export default function CreateTaskModal({
 isOpen,
 onClose,
 onSubmit,
 project,
}: CreateTaskModalProps) {
 const { issueTypes: workTypes } = useProjectIssueTypes(project?._id);
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
 const [showParentDropdown, setShowParentDropdown] = useState(false);
 const [parentSearch, setParentSearch] = useState('');
 const [parentTasks, setParentTasks] = useState<ParentTaskOption[]>([]);
 const [isLoadingParents, setIsLoadingParents] = useState(false);
 const { t } = useLanguage();

 const selectedType = workTypes.find(w => w.id === formData.type);
 const selectedStatus = taskStatuses.find(s => s.id === formData.status);
 const selectedAssignee = members.find(m => m.userId._id === formData.assignee);
 const selectedParent = parentTasks.find(t => t._id === formData.parentId);

 // Fetch project members
 useEffect(() => {
 if (!project || !isOpen) return;

 const fetchMembers = async () => {
 setIsLoadingMembers(true);
 try {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;

 const response = await fetch(
 `${API_URL}/pm/projects/${project._id}/members`,
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

 // Fetch tasks for parent picker
 useEffect(() => {
 if (!project || !isOpen) return;

 const fetchParentTasks = async () => {
 setIsLoadingParents(true);
 try {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;

 const response = await fetch(
 `${API_URL}/pm/projects/${project._id}/tasks?limit=100`,
 { headers: { Authorization: `Bearer ${token}` } }
 );
 const data = await response.json();
 if (data.success && data.data?.tasks) {
 setParentTasks(data.data.tasks.map((t: { _id: string; key: string; title: string; type: string }) => ({
 _id: t._id,
 key: t.key,
 title: t.title,
 type: t.type,
 })));
 }
 } catch (error) {
 console.error('Failed to fetch parent tasks:', error);
 } finally {
 setIsLoadingParents(false);
 }
 };

 fetchParentTasks();
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
 setFormData({ title: '', type: 'task', description: '', status: 'idea', assignee: undefined, parentId: undefined });
 setShowTypeDropdown(false);
 setShowStatusDropdown(false);
 setShowAssigneeDropdown(false);
 setShowParentDropdown(false);
 setParentSearch('');
 onClose();
 };

 const closeAllDropdowns = () => {
 setShowTypeDropdown(false);
 setShowStatusDropdown(false);
 setShowAssigneeDropdown(false);
 setShowParentDropdown(false);
 };

 const typeIcons: Record<string, string> = {
 epic: '\u26A1', story: '\uD83D\uDCD6', task: '\u2713', bug: '\uD83D\uDC1B',
 subtask: '\uD83D\uDCCB', feature: '\uD83D\uDCE6',
 };

 const filteredParentTasks = parentTasks.filter(t =>
 (t.key.toLowerCase().includes(parentSearch.toLowerCase()) ||
 t.title.toLowerCase().includes(parentSearch.toLowerCase())) &&
 t.type !== 'subtask'
 );

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-4 md:pt-8 px-4 overflow-y-auto">
 <div className="bg-background rounded-lg w-full max-w-2xl shadow-2xl mb-8">
 {/* Modal Header */}
 <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
 <h2 className="text-lg md:text-xl font-semibold text-foreground">
 Create {selectedType?.name || 'Task'}
 </h2>
 <button 
 onClick={handleClose} 
 className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Modal Body */}
 <div className="px-4 md:px-6 py-4 max-h-[70vh] overflow-y-auto">
 <p className="text-sm text-muted-foreground mb-4">
 Required fields are marked with an asterisk <span className="text-destructive">*</span>
 </p>

 {/* Project/Space */}
 <div className="mb-4">
 <label className="block text-sm font-medium text-foreground mb-1">
 Space <span className="text-destructive">*</span>
 </label>
 <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-border/60 rounded text-foreground">
 <div className="w-5 h-5 bg-warning rounded flex items-center justify-center text-xs font-bold shrink-0">
 {project?.key?.substring(0, 2) || 'PR'}
 </div>
 <span className="truncate">{project?.name} ({project?.key})</span>
 <ChevronDown className="h-4 w-4 ml-auto shrink-0" />
 </div>
 </div>

 {/* Work Type */}
 <div className="mb-4 relative">
 <label className="block text-sm font-medium text-foreground mb-1">
 Work type <span className="text-destructive">*</span>
 </label>
 <button
 type="button"
 onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); setShowAssigneeDropdown(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 bg-muted border border-brand rounded text-foreground"
 >
 <span>{selectedType?.icon}</span>
 <span>{selectedType?.name}</span>
 <ChevronDown className="h-4 w-4 ml-auto" />
 </button>
 {showTypeDropdown && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
 {workTypes.map((type) => (
 <button
 key={type.id}
 type="button"
 onClick={() => { setFormData({ ...formData, type: type.id }); setShowTypeDropdown(false); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left ${formData.type === type.id ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
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
 <label className="block text-sm font-medium text-foreground mb-1">Status</label>
 <button
 type="button"
 onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); setShowAssigneeDropdown(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 bg-background border border-border rounded text-foreground"
 >
 <span className={`w-2 h-2 rounded-full ${selectedStatus?.color}`}></span>
 <span>{selectedStatus?.name}</span>
 <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
 </button>
 <p className="text-xs text-muted-foreground mt-1">This is the initial status upon creation</p>
 {showStatusDropdown && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10">
 {taskStatuses.map((status) => (
 <button
 key={status.id}
 type="button"
 onClick={() => { setFormData({ ...formData, status: status.id }); setShowStatusDropdown(false); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left ${formData.status === status.id ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
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
 <label className="block text-sm font-medium text-foreground mb-1">Assignee</label>
 <button
 type="button"
 onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setShowTypeDropdown(false); setShowStatusDropdown(false); }}
 className="w-full flex items-center gap-2 px-3 py-2 bg-background border border-border rounded text-foreground"
 disabled={isLoadingMembers}
 >
 {isLoadingMembers ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 <span className="text-muted-foreground">Loading...</span>
 </>
 ) : selectedAssignee ? (
 <>
 <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-xs font-medium">
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
 <User className="h-4 w-4 text-muted-foreground" />
 <span className="text-muted-foreground">Unassigned</span>
 </>
 )}
 <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
 </button>
 {showAssigneeDropdown && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
 {/* Unassigned option */}
 <button
 type="button"
 onClick={() => { setFormData({ ...formData, assignee: undefined }); setShowAssigneeDropdown(false); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left ${!formData.assignee ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
 >
 <div className="w-6 h-6 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
 <User className="h-3 w-3 text-muted-foreground" />
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
 const colors = ['bg-brand', 'bg-success', 'bg-info', 'bg-warning', 'bg-destructive', 'bg-success'];
 const colorIndex = (member.userId.profile?.firstName?.charCodeAt(0) ?? 
 member.userId.name?.charCodeAt(0) ?? 0) % colors.length;

 return (
 <button
 key={member._id}
 type="button"
 onClick={() => { setFormData({ ...formData, assignee: member.userId._id }); setShowAssigneeDropdown(false); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left ${isSelected ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
 >
 <div className={`w-6 h-6 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
 {initials}
 </div>
 <div className="flex-1 min-w-0">
 <p className="truncate">{displayName}</p>
 <p className="text-xs text-muted-foreground truncate">{member.userId.email}</p>
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Parent Task */}
 <div className="mb-4 relative">
 <label className="block text-sm font-medium text-foreground mb-1">
 <GitBranch className="inline h-3.5 w-3.5 mr-1" />
 Parent task
 </label>
 <button
 type="button"
 onClick={() => { closeAllDropdowns(); setShowParentDropdown(!showParentDropdown); }}
 className="w-full flex items-center gap-2 px-3 py-2 bg-background border border-border rounded text-foreground"
 disabled={isLoadingParents}
 >
 {isLoadingParents ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 <span className="text-muted-foreground">Loading...</span>
 </>
 ) : selectedParent ? (
 <>
 <span className="text-xs">{typeIcons[selectedParent.type] || '\u2713'}</span>
 <span className="text-brand text-sm font-medium">{selectedParent.key}</span>
 <span className="truncate text-sm">{selectedParent.title}</span>
 </>
 ) : (
 <span className="text-muted-foreground">No parent (top-level task)</span>
 )}
 <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
 </button>
 {formData.parentId && (
 <p className="text-xs text-brand mt-1">Type will be set to subtask automatically</p>
 )}
 {showParentDropdown && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
 <div className="p-2 border-b border-border">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={parentSearch}
 onChange={(e) => setParentSearch(e.target.value)}
 placeholder="Search tasks..."
 className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
 autoFocus
 />
 </div>
 </div>
 <div className="max-h-48 overflow-y-auto">
 {/* No parent option */}
 <button
 type="button"
 onClick={() => { setFormData({ ...formData, parentId: undefined, type: formData.type === 'subtask' ? 'task' : formData.type }); setShowParentDropdown(false); setParentSearch(''); }}
 className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left ${!formData.parentId ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
 >
 <span className="text-muted-foreground">--</span>
 <span>No parent (top-level task)</span>
 </button>
 {filteredParentTasks.length === 0 ? (
 <p className="px-4 py-3 text-sm text-muted-foreground">No tasks found</p>
 ) : (
 filteredParentTasks.map((task) => (
 <button
 key={task._id}
 type="button"
 onClick={() => { setFormData({ ...formData, parentId: task._id, type: 'subtask' }); setShowParentDropdown(false); setParentSearch(''); }}
 className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted text-left ${formData.parentId === task._id ? 'bg-brand-surface text-brand' : 'text-foreground'}`}
 >
 <span className="text-xs">{typeIcons[task.type] || '\u2713'}</span>
 <span className="text-brand text-xs font-medium shrink-0">{task.key}</span>
 <span className="text-sm truncate flex-1">{task.title}</span>
 </button>
 ))
 )}
 </div>
 </div>
 )}
 </div>

 {/* Title/Summary */}
 <div className="mb-4">
 <label className="block text-sm font-medium text-foreground mb-1">
 Summary <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 className={`w-full px-3 py-2 border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand ${!formData.title.trim() ? 'border-destructive/30' : 'border-border'}`}
 placeholder={t('projects.common.enterSummary') || 'Enter a summary'}
 autoFocus
 />
 {!formData.title.trim() && (
 <p className="text-xs text-destructive mt-1">Summary is required</p>
 )}
 </div>

 {/* Description */}
 <div className="mb-4">
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-3 py-2 border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand resize-none"
 rows={4}
 placeholder={t('projects.common.addDescription') || 'Add a description...'}
 />
 </div>
 </div>

 {/* Modal Footer */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-4 border-t border-border bg-muted/50 rounded-b-lg gap-3">
 <label className="flex items-center gap-2 text-sm text-muted-foreground">
 <input
 type="checkbox"
 checked={createAnother}
 onChange={(e) => setCreateAnother(e.target.checked)}
 className="rounded border-border"
 />
 Create another
 </label>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <button
 type="button"
 onClick={handleClose}
 className="flex-1 sm:flex-none px-4 py-2 text-foreground hover:bg-muted rounded transition-colors"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleSubmit}
 disabled={!formData.title.trim() || isSubmitting}
 className="flex-1 sm:flex-none px-4 py-2 bg-brand hover:bg-brand-strong disabled:bg-brand-soft text-brand-foreground rounded transition-colors flex items-center justify-center gap-2"
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
