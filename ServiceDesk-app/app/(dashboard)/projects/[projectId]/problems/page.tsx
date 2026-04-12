'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Search,
 AlertOctagon,
 AlertCircle,
 CheckCircle,
 Link2,
 MoreHorizontal,
 TrendingUp,
 FileText,
 Loader2,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 ProjectToolbar,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useProblems, useProblemStats, useCreateProblem } from '@/hooks/useProblems';
import { useCategories } from '@/hooks/useCategories';
import { IProblem, ProblemStatus, Priority, Impact } from '@/types/itsm';

interface Project {
 _id: string;
 name: string;
 key: string;
}

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
 critical: { label: 'Critical', color: 'bg-destructive-soft text-destructive', dot: 'bg-destructive' },
 high: { label: 'High', color: 'bg-warning-soft text-warning', dot: 'bg-warning' },
 medium: { label: 'Medium', color: 'bg-warning-soft text-warning', dot: 'bg-warning' },
 low: { label: 'Low', color: 'bg-muted text-foreground', dot: 'bg-muted-foreground/30' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
 logged: { label: 'Logged', color: 'bg-brand-soft text-brand' },
 rca_in_progress: { label: 'RCA In Progress', color: 'bg-info-soft text-info' },
 known_error: { label: 'Known Error', color: 'bg-warning-soft text-warning' },
 resolved: { label: 'Resolved', color: 'bg-success-soft text-success' },
 closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
};

export default function ProblemsPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [projectLoading, setProjectLoading] = useState(true);
 const [selectedProblem, setSelectedProblem] = useState<IProblem | null>(null);
 const [showNewProblemModal, setShowNewProblemModal] = useState(false);
 const [filterStatus, setFilterStatus] = useState<string>('all');

 // Form state
 const [newForm, setNewForm] = useState({
 title: '',
 description: '',
 priority: Priority.MEDIUM,
 impact: Impact.MEDIUM,
 category_id: '',
 });
 const [formError, setFormError] = useState('');

 // API hooks
 const statusFilter = filterStatus !== 'all' ? [filterStatus as ProblemStatus] : undefined;
 const { data: problemsData } = useProblems({ status: statusFilter });
 const { data: stats } = useProblemStats();
 const createProblem = useCreateProblem();
 const { data: categories = [] } = useCategories(true);

 const problems: IProblem[] = useMemo(() => problemsData?.data || [], [problemsData]);

 const fetchProject = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) setProject(data.data.project);
 } catch (error) {
 console.error('Failed to fetch project:', error);
 } finally {
 setProjectLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) {
 router.push('/login');
 return;
 }
 fetchProject(token);
 }, [projectId, router, fetchProject]);

 const formatDate = (dateStr: string) => {
 return new Date(dateStr).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
 };

 const handleCreateProblem = async () => {
 setFormError('');
 if (!newForm.title.trim() || newForm.title.trim().length < 3) {
 setFormError('Title must be at least 3 characters');
 return;
 }
 if (!newForm.description.trim() || newForm.description.trim().length < 10) {
 setFormError('Description must be at least 10 characters');
 return;
 }
 try {
 await createProblem.mutateAsync({
 title: newForm.title,
 description: newForm.description,
 priority: newForm.priority,
 impact: newForm.impact,
 category_id: newForm.category_id || 'general',
 site_id: 'default',
 });
 setShowNewProblemModal(false);
 setNewForm({ title: '', description: '', priority: Priority.MEDIUM, impact: Impact.MEDIUM, category_id: '' });
 } catch (err: unknown) {
 const axiosErr = err as { response?: { data?: { message?: string } } };
 setFormError(axiosErr?.response?.data?.message || 'Failed to create problem');
 }
 };

 if (projectLoading) {
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
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

 {/* Toolbar */}
 <ProjectToolbar
 searchPlaceholder="Search problems..."
 primaryAction={{
 label: 'New Problem',
 onClick: () => setShowNewProblemModal(true),
 }}
 rightActions={
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="all">All Status</option>
 <option value="logged">Logged</option>
 <option value="rca_in_progress">RCA In Progress</option>
 <option value="known_error">Known Error</option>
 <option value="resolved">Resolved</option>
 <option value="closed">Closed</option>
 </select>
 }
 />

 {/* Stats Bar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <AlertOctagon className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{stats?.total || problems.length} Total</span>
 </div>
 <div className="flex items-center gap-2">
 <Search className="h-4 w-4 text-info" />
 <span className="text-sm text-muted-foreground">{stats?.logged || 0} Logged</span>
 </div>
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-warning" />
 <span className="text-sm text-muted-foreground">{stats?.knownErrors || 0} Known Errors</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle className="h-4 w-4 text-success" />
 <span className="text-sm text-muted-foreground">{stats?.resolved || 0} Resolved</span>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Problems List */}
 <div className={`${selectedProblem ? 'w-1/2 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
 {problems.length === 0 ? (
 <div className="text-center py-12">
 <AlertOctagon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">No problems found</p>
 </div>
 ) : (
 <div className="space-y-3">
 {problems.map((problem) => {
 const pCfg = priorityConfig[problem.priority] || priorityConfig.medium;
 const sCfg = statusConfig[problem.status] || statusConfig.logged;

 return (
 <div
 key={problem._id}
 onClick={() => setSelectedProblem(problem)}
 className={`bg-background border rounded-xl p-4 cursor-pointer transition-all ${
 selectedProblem?._id === problem._id 
 ? 'border-brand ring-2 ring-brand-border' 
 : 'border-border hover:border-border hover:shadow-md'
 }`}
 >
 <div className="flex items-start gap-4">
 {/* Icon */}
 <div className={`p-2 rounded-lg ${
 problem.priority === 'critical' ? 'bg-destructive-soft' :
 problem.priority === 'high' ? 'bg-warning-soft' :
 'bg-muted'
 }`}>
 <AlertOctagon className={`h-5 w-5 ${
 problem.priority === 'critical' ? 'text-destructive' :
 problem.priority === 'high' ? 'text-warning' :
 'text-muted-foreground'
 }`} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xs font-mono text-muted-foreground">{problem.problem_id}</span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${pCfg.color}`}>
 {pCfg.label}
 </span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sCfg.color}`}>
 {sCfg.label}
 </span>
 </div>
 <h3 className="font-medium text-foreground mb-1">{problem.title}</h3>
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <span>{problem.category_id}</span>
 <span className="flex items-center gap-1">
 <Link2 className="h-3.5 w-3.5" />
 {problem.linked_incidents_count ?? problem.linked_incidents?.length ?? 0} incidents
 </span>
 </div>
 </div>

 {/* Owner */}
 {problem.owner?.name && (
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-info-soft flex items-center justify-center text-xs font-medium text-info">
 {problem.owner.name.split(' ').map((n: string) => n[0]).join('')}
 </div>
 </div>
 )}

 <button className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Problem Detail Panel */}
 {selectedProblem && (
 <div className="w-1/2 overflow-y-auto bg-background">
 <div className="p-6">
 {/* Header */}
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-sm font-mono text-muted-foreground">{selectedProblem.problem_id}</span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(priorityConfig[selectedProblem.priority] || priorityConfig.medium).color}`}>
 {(priorityConfig[selectedProblem.priority] || priorityConfig.medium).label}
 </span>
 </div>
 <h2 className="text-xl font-semibold text-foreground">{selectedProblem.title}</h2>
 </div>
 <span className={`px-3 py-1 text-sm font-medium rounded-full ${(statusConfig[selectedProblem.status] || statusConfig.logged).color}`}>
 {(statusConfig[selectedProblem.status] || statusConfig.logged).label}
 </span>
 </div>

 {/* Description */}
 {selectedProblem.description && (
 <p className="text-muted-foreground mb-6">{selectedProblem.description}</p>
 )}

 {/* Details Grid */}
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
 <p className="text-sm font-medium text-foreground mt-1">{selectedProblem.category_id}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Owner</p>
 <p className="text-sm font-medium text-foreground mt-1">{selectedProblem.owner?.name || 'Unassigned'}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
 <p className="text-sm font-medium text-foreground mt-1">{formatDate(selectedProblem.created_at)}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Related Incidents</p>
 <p className="text-sm font-medium text-brand mt-1">{selectedProblem.linked_incidents_count ?? selectedProblem.linked_incidents?.length ?? 0} incidents</p>
 </div>
 </div>

 {/* Root Cause */}
 {selectedProblem.root_cause && (
 <div className="mb-6 p-4 bg-info-soft border border-info/20 rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="h-5 w-5 text-info" />
 <h3 className="font-semibold text-info">Root Cause</h3>
 </div>
 <p className="text-sm text-info">{selectedProblem.root_cause}</p>
 </div>
 )}

 {/* Workaround */}
 {selectedProblem.workaround && (
 <div className="mb-6 p-4 bg-warning-soft border border-warning/30 rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <FileText className="h-5 w-5 text-warning" />
 <h3 className="font-semibold text-warning">Workaround</h3>
 </div>
 <p className="text-sm text-warning">{selectedProblem.workaround}</p>
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center gap-3 pt-4 border-t border-border">
 {selectedProblem.status === ProblemStatus.LOGGED && (
 <button className="flex-1 px-4 py-2.5 bg-info text-white font-medium rounded-lg hover:bg-info transition-colors">
 Start Investigation
 </button>
 )}
 {selectedProblem.status === ProblemStatus.RCA_IN_PROGRESS && (
 <button className="flex-1 px-4 py-2.5 bg-info text-white font-medium rounded-lg hover:bg-info transition-colors">
 Document Root Cause
 </button>
 )}
 {selectedProblem.status === ProblemStatus.KNOWN_ERROR && (
 <button className="flex-1 px-4 py-2.5 bg-success text-success-foreground font-medium rounded-lg hover:bg-success/80 transition-colors">
 Mark Resolved
 </button>
 )}
 <button className="px-4 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors">
 Edit
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* New Problem Modal */}
 {showNewProblemModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-lg shadow-xl">
 <h2 className="text-lg font-semibold text-foreground mb-4">Create New Problem</h2>
 <div className="space-y-4">
 {formError && (
 <div className="flex items-center gap-2 text-sm text-destructive bg-destructive-soft p-3 rounded-lg">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <span>{formError}</span>
 </div>
 )}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Title <span className="text-destructive">*</span></label>
 <input
 type="text"
 value={newForm.title}
 onChange={(e) => { setNewForm({ ...newForm, title: e.target.value }); setFormError(''); }}
 placeholder="Brief description of the problem"
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description <span className="text-destructive">*</span></label>
 <textarea
 value={newForm.description}
 onChange={(e) => { setNewForm({ ...newForm, description: e.target.value }); setFormError(''); }}
 placeholder="Detailed description (at least 10 characters)..."
 rows={3}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
 <select
 value={newForm.priority}
 onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as Priority })}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value={Priority.CRITICAL}>Critical</option>
 <option value={Priority.HIGH}>High</option>
 <option value={Priority.MEDIUM}>Medium</option>
 <option value={Priority.LOW}>Low</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Impact</label>
 <select
 value={newForm.impact}
 onChange={(e) => setNewForm({ ...newForm, impact: e.target.value as Impact })}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value={Impact.HIGH}>High</option>
 <option value={Impact.MEDIUM}>Medium</option>
 <option value={Impact.LOW}>Low</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Category</label>
 <select
 value={newForm.category_id}
 onChange={(e) => setNewForm({ ...newForm, category_id: e.target.value })}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="">Select category</option>
 {categories.map((cat) => (
 <option key={cat.id} value={cat.id}>{cat.name}</option>
 ))}
 </select>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => { setShowNewProblemModal(false); setFormError(''); }}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateProblem}
 disabled={createProblem.isPending}
 className="flex-1 px-4 py-2.5 bg-info text-white rounded-lg hover:bg-info disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
 >
 {createProblem.isPending ? (
 <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
 ) : (
 'Create Problem'
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
