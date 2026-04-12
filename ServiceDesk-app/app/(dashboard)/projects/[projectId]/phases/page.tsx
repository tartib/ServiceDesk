'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 ChevronRight,
 ChevronDown,
 Plus,
 MoreHorizontal,
 CheckCircle,
 Clock,
 Pause,
 Calendar,
 FileText,
 Users,
 Edit,
 Trash2,
 X,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 ProjectToolbar,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Phase {
 id: string;
 name: string;
 description?: string;
 order: number;
 plannedStartDate?: string;
 plannedEndDate?: string;
 actualStartDate?: string;
 actualEndDate?: string;
 status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
 deliverables: string[];
 progress: number;
 tasks: PhaseTask[];
}

interface PhaseTask {
 _id: string;
 key: string;
 title: string;
 status: { name: string; category: string };
 assignee?: { profile: { firstName: string; lastName: string } };
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPhase = (p: Record<string, any>): Phase => ({
 id: p._id,
 name: p.name,
 description: p.description,
 order: p.order,
 plannedStartDate: p.plannedStartDate,
 plannedEndDate: p.plannedEndDate,
 actualStartDate: p.actualStartDate,
 actualEndDate: p.actualEndDate,
 status: p.status || 'not_started',
 deliverables: p.deliverables || [],
 progress: p.progress || 0,
 tasks: [],
});

const statusConfig = {
 not_started: { label: 'Not Started', color: 'bg-muted text-foreground', icon: Clock },
 in_progress: { label: 'In Progress', color: 'bg-brand-soft text-brand', icon: Clock },
 completed: { label: 'Completed', color: 'bg-success-soft text-success', icon: CheckCircle },
 on_hold: { label: 'On Hold', color: 'bg-warning-soft text-warning', icon: Pause },
};

export default function PhasesPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [phases, setPhases] = useState<Phase[]>([]);
 const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
 const [isLoading, setIsLoading] = useState(true);
 const [showNewPhaseModal, setShowNewPhaseModal] = useState(false);
 const [newPhase, setNewPhase] = useState({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' });
 const [addingDeliverableTo, setAddingDeliverableTo] = useState<string | null>(null);
 const [newDeliverable, setNewDeliverable] = useState('');
 const [openMenuId, setOpenMenuId] = useState<string | null>(null);
 const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
 const [editPhaseData, setEditPhaseData] = useState({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' });
 const [deletingPhase, setDeletingPhase] = useState<Phase | null>(null);
 const [phaseTaskCounts, setPhaseTaskCounts] = useState<Record<string, number>>({});

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, phasesRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/phases`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const phasesData = await phasesRes.json();
 if (phasesData.success) setPhases((phasesData.data.phases || []).map(mapPhase));
 } catch (error) {
 console.error('Failed to fetch phases:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 // Fetch task counts for each phase
 useEffect(() => {
 const fetchTaskCounts = async () => {
 const token = getToken();
 if (!token || phases.length === 0) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/tasks?limit=1000`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success && data.data?.tasks) {
 const counts: Record<string, number> = {};
 data.data.tasks.forEach((task: { phaseId?: string }) => {
 if (task.phaseId) {
 counts[task.phaseId] = (counts[task.phaseId] || 0) + 1;
 }
 });
 setPhaseTaskCounts(counts);
 }
 } catch (error) { console.error('Failed to fetch task counts:', error); }
 };
 fetchTaskCounts();
 }, [projectId, phases.length]);

 const handleAddDeliverable = async (phaseId: string) => {
 if (!newDeliverable.trim()) return;
 const token = getToken();
 if (!token) return;
 const phase = phases.find(p => p.id === phaseId);
 if (!phase) return;
 try {
 const updatedDeliverables = [...phase.deliverables, newDeliverable.trim()];
 const res = await fetch(`${API_URL}/pm/phases/${phaseId}`, {
 method: 'PATCH',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ deliverables: updatedDeliverables }),
 });
 const data = await res.json();
 if (data.success) {
 setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, deliverables: updatedDeliverables } : p));
 setNewDeliverable('');
 setAddingDeliverableTo(null);
 }
 } catch (error) { console.error('Failed to add deliverable:', error); }
 };

 const handleCreatePhase = async () => {
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/phases`, {
 method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(newPhase),
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setShowNewPhaseModal(false);
 setNewPhase({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' });
 }
 } catch (error) { console.error('Failed to create phase:', error); }
 };

 const handleUpdatePhaseStatus = async (phaseId: string, status: Phase['status'], progress?: number) => {
 const token = getToken();
 if (!token) return;
 try {
 const body: Record<string, unknown> = { status };
 if (progress !== undefined) body.progress = progress;
 if (status === 'in_progress') body.actualStartDate = new Date().toISOString();
 if (status === 'completed') { body.actualEndDate = new Date().toISOString(); body.progress = 100; }
 const res = await fetch(`${API_URL}/pm/phases/${phaseId}`, {
 method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (data.success) fetchData(token);
 } catch (error) { console.error('Failed to update phase:', error); }
 };

 const handleEditPhase = async () => {
 if (!editingPhase) return;
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/phases/${editingPhase.id}`, {
 method: 'PATCH',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: editPhaseData.name,
 description: editPhaseData.description,
 plannedStartDate: editPhaseData.plannedStartDate,
 plannedEndDate: editPhaseData.plannedEndDate,
 }),
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setEditingPhase(null);
 }
 } catch (error) { console.error('Failed to edit phase:', error); }
 };

 const handleDeletePhase = async () => {
 if (!deletingPhase) return;
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/phases/${deletingPhase.id}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setDeletingPhase(null);
 }
 } catch (error) { console.error('Failed to delete phase:', error); }
 };

 const openEditModal = (phase: Phase) => {
 setEditingPhase(phase);
 setEditPhaseData({
 name: phase.name,
 description: phase.description || '',
 plannedStartDate: phase.plannedStartDate || '',
 plannedEndDate: phase.plannedEndDate || '',
 });
 setOpenMenuId(null);
 };

 const togglePhase = (phaseId: string) => {
 setExpandedPhases((prev) => {
 const next = new Set(prev);
 if (next.has(phaseId)) {
 next.delete(phaseId);
 } else {
 next.add(phaseId);
 }
 return next;
 });
 };

 const formatDate = (dateStr?: string) => {
 if (!dateStr) return '—';
 return new Date(dateStr).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
 };

 const getOverallProgress = () => {
 const total = phases.reduce((sum, p) => sum + p.progress, 0);
 return Math.round(total / phases.length);
 };

 if (isLoading) {
 return <LoadingState />;
 }

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'waterfall'} />

 {/* Toolbar */}
 <ProjectToolbar
 searchPlaceholder="Search phases..."
 primaryAction={{
 label: 'Add Phase',
 onClick: () => setShowNewPhaseModal(true),
 }}
 />

 {/* Progress Overview */}
 <div className="bg-background border-b border-border px-4 py-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium text-foreground">Overall Progress</span>
 <span className="text-sm font-semibold text-foreground">{getOverallProgress()}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-2">
 <div
 className="bg-brand h-2 rounded-full transition-all duration-300"
 style={{ width: `${getOverallProgress()}%` }}
 />
 </div>
 <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-success" />
 {phases.filter(p => p.status === 'completed').length} Completed
 </span>
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-brand" />
 {phases.filter(p => p.status === 'in_progress').length} In Progress
 </span>
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
 {phases.filter(p => p.status === 'not_started').length} Not Started
 </span>
 </div>
 </div>

 {/* Phases List */}
 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {phases.map((phase, index) => {
 const isExpanded = expandedPhases.has(phase.id);
 const isLast = index === phases.length - 1;
 const prevPhase = index > 0 ? phases[index - 1] : null;
 const canStart = !prevPhase || prevPhase.status === 'completed';

 return (
 <div
 key={phase.id}
 className="bg-background border border-border rounded-xl overflow-hidden shadow-sm"
 >
 {/* Phase Header */}
 <div
 className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
 onClick={() => togglePhase(phase.id)}
 >
 {/* Expand/Collapse */}
 <button className="p-1 text-muted-foreground hover:text-muted-foreground">
 {isExpanded ? (
 <ChevronDown className="h-5 w-5" />
 ) : (
 <ChevronRight className="h-5 w-5" />
 )}
 </button>

 {/* Phase Number */}
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
 phase.status === 'completed' 
 ? 'bg-success-soft text-success' 
 : phase.status === 'in_progress'
 ? 'bg-brand-soft text-brand'
 : 'bg-muted text-muted-foreground'
 }`}>
 {phase.status === 'completed' ? (
 <CheckCircle className="h-5 w-5" />
 ) : (
 index + 1
 )}
 </div>

 {/* Phase Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3">
 <h3 className="font-semibold text-foreground">{phase.name}</h3>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[phase.status].color}`}>
 {statusConfig[phase.status].label}
 </span>
 </div>
 {phase.description && (
 <p className="text-sm text-muted-foreground mt-0.5 truncate">{phase.description}</p>
 )}
 </div>

 {/* Progress */}
 <div className="hidden sm:flex items-center gap-3">
 <div className="w-32">
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="text-muted-foreground">Progress</span>
 <span className="font-medium text-foreground">{phase.progress}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div
 className={`h-1.5 rounded-full transition-all ${
 phase.status === 'completed' ? 'bg-success' : 'bg-brand'
 }`}
 style={{ width: `${phase.progress}%` }}
 />
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="relative">
 <button
 onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === phase.id ? null : phase.id); }}
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 {openMenuId === phase.id && (
 <div className="absolute right-0 mt-1 w-40 bg-background border border-border rounded-lg shadow-lg z-10">
 <button
 onClick={(e) => { e.stopPropagation(); openEditModal(phase); }}
 className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 flex items-center gap-2"
 >
 <Edit className="h-4 w-4" /> Edit
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); setDeletingPhase(phase); setOpenMenuId(null); }}
 className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive-soft flex items-center gap-2"
 >
 <Trash2 className="h-4 w-4" /> Delete
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Phase Details (Expanded) */}
 {isExpanded && (
 <div className="border-t border-border px-4 py-4 bg-muted/50/50">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 {/* Dates */}
 <div className="flex items-start gap-3">
 <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Timeline</p>
 <p className="text-sm text-foreground mt-1">
 {formatDate(phase.plannedStartDate)} — {formatDate(phase.plannedEndDate)}
 </p>
 </div>
 </div>

 {/* Deliverables */}
 <div className="flex items-start gap-3">
 <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Deliverables</p>
 <p className="text-sm text-foreground mt-1">{phase.deliverables.length} items</p>
 </div>
 </div>

 {/* Tasks */}
 <div className="flex items-start gap-3">
 <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Tasks</p>
 <p className="text-sm text-foreground mt-1">{phaseTaskCounts[phase.id] || 0} tasks</p>
 </div>
 </div>
 </div>

 {/* Deliverables List */}
 <div className="mb-4">
 <h4 className="text-sm font-medium text-foreground mb-2">Deliverables</h4>
 <div className="flex flex-wrap gap-2">
 {phase.deliverables.map((deliverable, i) => (
 <span
 key={i}
 className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
 >
 {deliverable}
 </span>
 ))}
 {addingDeliverableTo === phase.id ? (
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={newDeliverable}
 onChange={(e) => setNewDeliverable(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') handleAddDeliverable(phase.id); if (e.key === 'Escape') { setAddingDeliverableTo(null); setNewDeliverable(''); }}}
 placeholder="Enter deliverable..."
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-40"
 autoFocus
 />
 <button
 onClick={() => handleAddDeliverable(phase.id)}
 disabled={!newDeliverable.trim()}
 className="px-3 py-1.5 bg-brand text-brand-foreground rounded-lg text-sm font-medium hover:bg-brand-strong transition-colors disabled:opacity-50"
 >
 Add
 </button>
 <button
 onClick={() => { setAddingDeliverableTo(null); setNewDeliverable(''); }}
 className="px-3 py-1.5 border border-border text-muted-foreground rounded-lg text-sm hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 </div>
 ) : (
 <button
 onClick={() => setAddingDeliverableTo(phase.id)}
 className="px-3 py-1.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-border hover:text-foreground transition-colors"
 >
 <Plus className="h-4 w-4 inline mr-1" />
 Add
 </button>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 pt-3 border-t border-border">
 {phase.status === 'not_started' && canStart && (
 <button onClick={() => handleUpdatePhaseStatus(phase.id, 'in_progress')} className="px-4 py-2 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors">
 Start Phase
 </button>
 )}
 {phase.status === 'in_progress' && (
 <>
 <button onClick={() => handleUpdatePhaseStatus(phase.id, 'completed', 100)} className="px-4 py-2 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success/80 transition-colors">
 Complete Phase
 </button>
 <button onClick={() => handleUpdatePhaseStatus(phase.id, 'on_hold')} className="px-4 py-2 bg-warning text-warning-foreground text-sm font-medium rounded-lg hover:bg-warning/70 transition-colors">
 Put On Hold
 </button>
 </>
 )}
 {phase.status === 'on_hold' && (
 <button onClick={() => handleUpdatePhaseStatus(phase.id, 'in_progress')} className="px-4 py-2 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors">
 Resume Phase
 </button>
 )}
 <button
 onClick={() => router.push(`/projects/${projectId}/board?phase=${phase.id}`)}
 className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
 >
 View Tasks
 </button>
 <button
 onClick={() => router.push(`/projects/${projectId}/gates?requestReview=${phase.id}`)}
 className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
 >
 Request Gate Review
 </button>
 </div>
 </div>
 )}

 {/* Connection Line */}
 {!isLast && (
 <div className="flex justify-center -mb-3 relative z-10">
 <div className="w-0.5 h-6 bg-muted" />
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* New Phase Modal */}
 {showNewPhaseModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-xl">
 <h2 className="text-lg font-semibold text-foreground mb-4">Add New Phase</h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Phase Name</label>
 <input
 type="text"
 value={newPhase.name}
 onChange={(e) => setNewPhase(p => ({ ...p, name: e.target.value }))}
 placeholder="e.g., User Acceptance Testing"
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={newPhase.description}
 onChange={(e) => setNewPhase(p => ({ ...p, description: e.target.value }))}
 placeholder="Describe the phase objectives..."
 rows={3}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
 <input
 type="date"
 value={newPhase.plannedStartDate}
 onChange={(e) => setNewPhase(p => ({ ...p, plannedStartDate: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
 <input
 type="date"
 value={newPhase.plannedEndDate}
 onChange={(e) => setNewPhase(p => ({ ...p, plannedEndDate: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => { setShowNewPhaseModal(false); setNewPhase({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' }); }}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreatePhase}
 disabled={!newPhase.name}
 className="flex-1 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Add Phase
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Edit Phase Modal */}
 {editingPhase && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-xl">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-foreground">Edit Phase</h2>
 <button onClick={() => setEditingPhase(null)} className="p-1 text-muted-foreground hover:text-muted-foreground">
 <X className="h-5 w-5" />
 </button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Phase Name</label>
 <input
 type="text"
 value={editPhaseData.name}
 onChange={(e) => setEditPhaseData(p => ({ ...p, name: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={editPhaseData.description}
 onChange={(e) => setEditPhaseData(p => ({ ...p, description: e.target.value }))}
 rows={3}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
 <input
 type="date"
 value={editPhaseData.plannedStartDate}
 onChange={(e) => setEditPhaseData(p => ({ ...p, plannedStartDate: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
 <input
 type="date"
 value={editPhaseData.plannedEndDate}
 onChange={(e) => setEditPhaseData(p => ({ ...p, plannedEndDate: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setEditingPhase(null)}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleEditPhase}
 disabled={!editPhaseData.name}
 className="flex-1 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Save Changes
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Delete Confirmation Modal */}
 {deletingPhase && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-sm shadow-xl">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-full bg-destructive-soft flex items-center justify-center">
 <Trash2 className="h-5 w-5 text-destructive" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-foreground">Delete Phase</h2>
 <p className="text-sm text-muted-foreground">This action cannot be undone</p>
 </div>
 </div>
 <p className="text-sm text-foreground mb-6">
 Are you sure you want to delete <strong>{deletingPhase.name}</strong>? All associated data will be permanently removed.
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => setDeletingPhase(null)}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleDeletePhase}
 className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
 >
 Delete
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
