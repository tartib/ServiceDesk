'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api/config';
import { useLanguage } from '@/contexts/LanguageContext';
import {
 ArrowRight,
 ExternalLink,
 GripVertical,
 Plus,
 Trash2,
 Edit3,
 Check,
 X,
 AlertCircle,
 Workflow,
 RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface WorkflowStatus {
 id: string;
 name: string;
 category: 'todo' | 'in_progress' | 'done';
 color: string;
 order: number;
 isInitial?: boolean;
 isFinal?: boolean;
}

interface WorkflowTransition {
 id: string;
 name: string;
 fromStatus: string;
 toStatus: string;
 conditions?: {
 requiredFields?: string[];
 requiredRole?: string[];
 requireComment?: boolean;
 };
}

interface ProjectWorkflow {
 _id: string;
 name: string;
 description?: string;
 methodology: string;
 isDefault: boolean;
 statuses: WorkflowStatus[];
 transitions: WorkflowTransition[];
}

interface WorkflowSettingsPanelProps {
 projectId: string;
}

// ============================================
// Category badge
// ============================================

const categoryConfig: Record<string, { label: string; labelAr: string; bg: string; text: string }> = {
 todo: { label: 'To Do', labelAr: 'قيد الانتظار', bg: 'bg-muted', text: 'text-foreground' },
 in_progress: { label: 'In Progress', labelAr: 'قيد التنفيذ', bg: 'bg-brand-soft', text: 'text-brand' },
 done: { label: 'Done', labelAr: 'مكتمل', bg: 'bg-success-soft', text: 'text-success' },
};

// ============================================
// Component
// ============================================

export default function WorkflowSettingsPanel({ projectId }: WorkflowSettingsPanelProps) {
 const { locale } = useLanguage();
 const isAr = locale === 'ar';

 const [workflow, setWorkflow] = useState<ProjectWorkflow | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');

 // Add status form state
 const [showAddStatus, setShowAddStatus] = useState(false);
 const [newStatus, setNewStatus] = useState<{ id: string; name: string; category: 'todo' | 'in_progress' | 'done'; color: string }>({ id: '', name: '', category: 'todo', color: '#6B7280' });
 const [isSavingStatus, setIsSavingStatus] = useState(false);

 // Edit status state
 const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
 const [editingName, setEditingName] = useState('');

 // Add transition form state
 const [showAddTransition, setShowAddTransition] = useState(false);
 const [newTransition, setNewTransition] = useState<{ name: string; fromStatus: string; toStatus: string }>({ name: '', fromStatus: '', toStatus: '' });
 const [isSavingTransition, setIsSavingTransition] = useState(false);

 // ============================================
 // Fetch workflow
 // ============================================

 const fetchWorkflow = useCallback(async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;

 setIsLoading(true);
 setError('');
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success && data.data?.workflow) {
 setWorkflow(data.data.workflow);
 } else if (data.success && data.data) {
 // Some endpoints return data directly
 setWorkflow(data.data);
 } else {
 setError(data.message || 'Failed to load workflow');
 }
 } catch (err) {
 console.error('Failed to fetch workflow:', err);
 setError('Failed to load workflow');
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 fetchWorkflow();
 }, [fetchWorkflow]);

 // ============================================
 // Add status
 // ============================================

 const handleAddStatus = async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !newStatus.id.trim() || !newStatus.name.trim()) return;

 setIsSavingStatus(true);
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow/statuses`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 id: newStatus.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
 name: newStatus.name.trim(),
 category: newStatus.category,
 color: newStatus.color,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setNewStatus({ id: '', name: '', category: 'todo', color: '#6B7280' });
 setShowAddStatus(false);
 fetchWorkflow();
 } else {
 setError(data.message || 'Failed to add status');
 }
 } catch (err) {
 console.error('Failed to add status:', err);
 setError('Failed to add status');
 } finally {
 setIsSavingStatus(false);
 }
 };

 // ============================================
 // Update status name
 // ============================================

 const handleUpdateStatus = async (statusId: string) => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !editingName.trim()) return;

 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow/statuses/${statusId}`, {
 method: 'PATCH',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ name: editingName.trim() }),
 });
 const data = await res.json();
 if (data.success) {
 setEditingStatusId(null);
 fetchWorkflow();
 }
 } catch (err) {
 console.error('Failed to update status:', err);
 }
 };

 // ============================================
 // Delete status
 // ============================================

 const handleDeleteStatus = async (statusId: string) => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;

 if (!confirm(isAr ? 'هل تريد حذف هذه الحالة؟' : 'Delete this status?')) return;

 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow/statuses/${statusId}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 fetchWorkflow();
 } else {
 setError(data.message || 'Failed to delete status');
 }
 } catch (err) {
 console.error('Failed to delete status:', err);
 }
 };

 // ============================================
 // Add transition
 // ============================================

 const handleAddTransition = async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !newTransition.name.trim() || !newTransition.fromStatus || !newTransition.toStatus) return;

 setIsSavingTransition(true);
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow/transitions`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 name: newTransition.name.trim(),
 fromStatus: newTransition.fromStatus,
 toStatus: newTransition.toStatus,
 }),
 });
 const data = await res.json();
 if (data.success) {
 setNewTransition({ name: '', fromStatus: '', toStatus: '' });
 setShowAddTransition(false);
 fetchWorkflow();
 } else {
 setError(data.message || data.error || 'Failed to add transition');
 }
 } catch (err) {
 console.error('Failed to add transition:', err);
 setError('Failed to add transition');
 } finally {
 setIsSavingTransition(false);
 }
 };

 // ============================================
 // Delete transition
 // ============================================

 const handleDeleteTransition = async (transitionId: string) => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 if (!confirm(isAr ? 'هل تريد حذف هذا الانتقال؟' : 'Delete this transition?')) return;

 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/workflow/transitions/${transitionId}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 fetchWorkflow();
 } else {
 setError(data.message || data.error || 'Failed to delete transition');
 }
 } catch (err) {
 console.error('Failed to delete transition:', err);
 setError('Failed to delete transition');
 }
 };

 // ============================================
 // Resolve status name
 // ============================================

 const resolveStatusName = useCallback(
 (statusId: string) => {
 if (!workflow) return statusId;
 const status = workflow.statuses.find((s) => s.id === statusId);
 return status?.name || statusId;
 },
 [workflow]
 );

 // ============================================
 // Loading
 // ============================================

 if (isLoading) {
 return (
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-info-soft flex items-center justify-center">
 <Workflow className="h-5 w-5 text-info" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-foreground">
 {isAr ? 'سير العمل' : 'Workflows'}
 </h3>
 </div>
 </div>
 <div className="flex items-center justify-center py-12">
 <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
 </div>
 </div>
 );
 }

 // ============================================
 // Render
 // ============================================

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-info-soft flex items-center justify-center">
 <Workflow className="h-5 w-5 text-info" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-foreground">
 {isAr ? 'سير العمل' : 'Workflows'}
 </h3>
 <p className="text-sm text-muted-foreground">
 {isAr
 ? 'إدارة حالات المشروع والانتقالات بينها'
 : 'Manage project statuses and transitions'}
 </p>
 </div>
 </div>
 <Link
 href="/workflow-builder"
 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-info bg-info-soft rounded-lg hover:bg-info-soft transition-colors"
 >
 <ExternalLink className="h-4 w-4" />
 {isAr ? 'فتح محرر سير العمل' : 'Open Workflow Builder'}
 </Link>
 </div>

 {/* Error banner */}
 {error && (
 <div className="flex items-center gap-2 px-4 py-3 bg-destructive-soft border border-destructive/30 rounded-lg text-sm text-destructive">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{error}</span>
 <button onClick={() => setError('')} className="ml-auto p-0.5 hover:bg-destructive-soft rounded">
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 )}

 {/* Workflow info */}
 {workflow && (
 <div className="p-4 bg-muted/50 border border-border rounded-xl">
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-foreground">{workflow.name}</span>
 {workflow.isDefault && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-soft text-brand font-medium">
 {isAr ? 'افتراضي' : 'Default'}
 </span>
 )}
 </div>
 {workflow.description && (
 <p className="text-xs text-muted-foreground">{workflow.description}</p>
 )}
 <p className="text-xs text-muted-foreground mt-1">
 {isAr ? 'المنهجية:' : 'Methodology:'} {workflow.methodology}
 </p>
 </div>
 )}

 {/* ============================================ */}
 {/* Statuses Section */}
 {/* ============================================ */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-foreground">
 {isAr ? 'الحالات' : 'Statuses'}
 {workflow && (
 <span className="text-muted-foreground font-normal ms-1.5">({workflow.statuses.length})</span>
 )}
 </h4>
 <button
 onClick={() => setShowAddStatus(!showAddStatus)}
 className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-strong"
 >
 <Plus className="h-3.5 w-3.5" />
 {isAr ? 'إضافة حالة' : 'Add Status'}
 </button>
 </div>

 {/* Add status form */}
 {showAddStatus && (
 <div className="mb-3 p-3 bg-brand-surface border border-brand-border rounded-lg space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'المعرف' : 'ID (slug)'}
 </label>
 <input
 type="text"
 value={newStatus.id}
 onChange={(e) =>
 setNewStatus((prev) => ({
 ...prev,
 id: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
 }))
 }
 placeholder="e.g. in-review"
 className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'الاسم' : 'Name'}
 </label>
 <input
 type="text"
 value={newStatus.name}
 onChange={(e) => setNewStatus((prev) => ({ ...prev, name: e.target.value }))}
 placeholder="e.g. In Review"
 className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'الفئة' : 'Category'}
 </label>
 <select
 value={newStatus.category}
 onChange={(e) =>
 setNewStatus((prev) => ({ ...prev, category: e.target.value as 'todo' | 'in_progress' | 'done' }))
 }
 className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="todo">{isAr ? 'قيد الانتظار' : 'To Do'}</option>
 <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
 <option value="done">{isAr ? 'مكتمل' : 'Done'}</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'اللون' : 'Color'}
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="color"
 value={newStatus.color}
 onChange={(e) => setNewStatus((prev) => ({ ...prev, color: e.target.value }))}
 className="w-7 h-7 rounded border border-border cursor-pointer"
 />
 <input
 type="text"
 value={newStatus.color}
 onChange={(e) => setNewStatus((prev) => ({ ...prev, color: e.target.value }))}
 className="flex-1 px-2 py-1.5 border border-border rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
 />
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 pt-1">
 <button
 onClick={handleAddStatus}
 disabled={!newStatus.id.trim() || !newStatus.name.trim() || isSavingStatus}
 className="px-3 py-1.5 text-xs font-medium text-brand-foreground bg-brand rounded hover:bg-brand-strong disabled:opacity-40 transition-colors"
 >
 {isSavingStatus
 ? (isAr ? 'جاري الحفظ...' : 'Saving...')
 : (isAr ? 'إضافة' : 'Add')}
 </button>
 <button
 onClick={() => {
 setShowAddStatus(false);
 setNewStatus({ id: '', name: '', category: 'todo', color: '#6B7280' });
 }}
 className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded transition-colors"
 >
 {isAr ? 'إلغاء' : 'Cancel'}
 </button>
 </div>
 </div>
 )}

 {/* Status list */}
 {workflow && workflow.statuses.length > 0 ? (
 <div className="space-y-1">
 {workflow.statuses
 .sort((a, b) => a.order - b.order)
 .map((status) => {
 const cat = categoryConfig[status.category] || categoryConfig.todo;
 const isEditing = editingStatusId === status.id;

 return (
 <div
 key={status.id}
 className="flex items-center gap-2 p-2.5 bg-background border border-border rounded-lg group hover:border-border transition-colors"
 >
 <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
 <div
 className="w-3 h-3 rounded-full shrink-0 border border-border"
 style={{ backgroundColor: status.color }}
 />
 {isEditing ? (
 <input
 type="text"
 value={editingName}
 onChange={(e) => setEditingName(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleUpdateStatus(status.id);
 if (e.key === 'Escape') setEditingStatusId(null);
 }}
 autoFocus
 className="flex-1 px-1.5 py-0.5 text-sm border border-brand-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
 />
 ) : (
 <span className="flex-1 text-sm text-foreground">{status.name}</span>
 )}
 <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cat.bg} ${cat.text}`}>
 {isAr ? cat.labelAr : cat.label}
 </span>
 {status.isInitial && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning font-medium">
 {isAr ? 'بداية' : 'Initial'}
 </span>
 )}
 {status.isFinal && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">
 {isAr ? 'نهاية' : 'Final'}
 </span>
 )}
 <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
 {isEditing ? (
 <>
 <button
 onClick={() => handleUpdateStatus(status.id)}
 className="p-1 text-success hover:bg-success-soft rounded"
 >
 <Check className="h-3.5 w-3.5" />
 </button>
 <button
 onClick={() => setEditingStatusId(null)}
 className="p-1 text-muted-foreground hover:bg-muted rounded"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </>
 ) : (
 <>
 <button
 onClick={() => {
 setEditingStatusId(status.id);
 setEditingName(status.name);
 }}
 className="p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded"
 >
 <Edit3 className="h-3.5 w-3.5" />
 </button>
 {!status.isInitial && !status.isFinal && (
 <button
 onClick={() => handleDeleteStatus(status.id)}
 className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded"
 >
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 )}
 </>
 )}
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground italic py-4 text-center">
 {isAr ? 'لا توجد حالات محددة' : 'No statuses defined'}
 </p>
 )}
 </div>

 {/* ============================================ */}
 {/* Transitions Section */}
 {/* ============================================ */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-foreground">
 {isAr ? 'الانتقالات' : 'Transitions'}
 {workflow && (
 <span className="text-muted-foreground font-normal ms-1.5">({workflow.transitions.length})</span>
 )}
 </h4>
 <button
 onClick={() => setShowAddTransition(!showAddTransition)}
 className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-strong"
 >
 <Plus className="h-3.5 w-3.5" />
 {isAr ? 'إضافة انتقال' : 'Add Transition'}
 </button>
 </div>

 {/* Add transition form */}
 {showAddTransition && workflow && (
 <div className="mb-3 p-3 bg-brand-surface border border-brand-border rounded-lg space-y-2">
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'الاسم' : 'Name'}
 </label>
 <input
 type="text"
 value={newTransition.name}
 onChange={(e) => setNewTransition((prev) => ({ ...prev, name: e.target.value }))}
 placeholder={isAr ? 'مثال: ابدأ العمل' : 'e.g. Start Work'}
 className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
 />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'من' : 'From Status'}
 </label>
 <select
 value={newTransition.fromStatus}
 onChange={(e) => setNewTransition((prev) => ({ ...prev, fromStatus: e.target.value }))}
 className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
 {workflow.statuses.map((s) => (
 <option key={s.id} value={s.id}>{s.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[10px] text-muted-foreground mb-0.5">
 {isAr ? 'إلى' : 'To Status'}
 </label>
 <select
 value={newTransition.toStatus}
 onChange={(e) => setNewTransition((prev) => ({ ...prev, toStatus: e.target.value }))}
 className="w-full px-2 py-1.5 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
 >
 <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
 {workflow.statuses.map((s) => (
 <option key={s.id} value={s.id}>{s.name}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="flex items-center gap-2 pt-1">
 <button
 onClick={handleAddTransition}
 disabled={!newTransition.name.trim() || !newTransition.fromStatus || !newTransition.toStatus || isSavingTransition}
 className="px-3 py-1.5 text-xs font-medium text-brand-foreground bg-brand rounded hover:bg-brand-strong disabled:opacity-40 transition-colors"
 >
 {isSavingTransition
 ? (isAr ? 'جاري الحفظ...' : 'Saving...')
 : (isAr ? 'إضافة' : 'Add')}
 </button>
 <button
 onClick={() => {
 setShowAddTransition(false);
 setNewTransition({ name: '', fromStatus: '', toStatus: '' });
 }}
 className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded transition-colors"
 >
 {isAr ? 'إلغاء' : 'Cancel'}
 </button>
 </div>
 </div>
 )}

 {workflow && workflow.transitions.length > 0 ? (
 <div className="space-y-1">
 {workflow.transitions.map((tr) => (
 <div
 key={tr.id}
 className="flex items-center gap-2 p-2.5 bg-background border border-border rounded-lg group hover:border-border transition-colors"
 >
 <div className="flex items-center gap-1.5 flex-1 min-w-0">
 <span className="text-xs text-muted-foreground truncate max-w-[90px]">
 {resolveStatusName(tr.fromStatus)}
 </span>
 <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
 <span className="text-xs text-muted-foreground truncate max-w-[90px]">
 {resolveStatusName(tr.toStatus)}
 </span>
 </div>
 <span className="text-xs font-medium text-foreground truncate flex-1">
 {tr.name}
 </span>
 {tr.conditions?.requireComment && (
 <span className="text-[9px] px-1 py-0.5 rounded bg-warning-soft text-warning shrink-0">
 {isAr ? 'تعليق مطلوب' : 'Comment req.'}
 </span>
 )}
 <button
 onClick={() => handleDeleteTransition(tr.id)}
 className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
 title={isAr ? 'حذف' : 'Delete'}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground italic py-4 text-center">
 {isAr ? 'لا توجد انتقالات محددة' : 'No transitions defined'}
 </p>
 )}
 </div>

 {/* ============================================ */}
 {/* Visual flow preview */}
 {/* ============================================ */}
 {workflow && workflow.statuses.length > 0 && (
 <div>
 <h4 className="text-sm font-semibold text-foreground mb-3">
 {isAr ? 'معاينة التدفق' : 'Flow Preview'}
 </h4>
 <div className="p-4 bg-muted/50 border border-border rounded-xl overflow-x-auto">
 <div className="flex items-center gap-2 min-w-max">
 {workflow.statuses
 .sort((a, b) => a.order - b.order)
 .map((status, idx) => (
 <div key={status.id} className="flex items-center gap-2">
 <div
 className="px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap"
 style={{
 borderColor: status.color === '#ffffff' ? '#e5e7eb' : status.color,
 backgroundColor: status.color === '#ffffff' ? '#f9fafb' : `${status.color}15`,
 color: status.color === '#ffffff' ? '#374151' : status.color,
 }}
 >
 {status.name}
 </div>
 {idx < workflow.statuses.length - 1 && (
 <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
