'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 AlertCircle,
 Clock,
 CheckCircle,
 XCircle,
 AlertTriangle,
 MoreHorizontal,
 Loader2,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 ProjectToolbar,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useIncidents, useIncidentStats, useCreateIncident } from '@/hooks/useIncidents';
import { useCategories } from '@/hooks/useCategories';
import { IIncident, Impact, Urgency, Channel } from '@/types/itsm';
import type { IncidentStatus, Priority } from '@/types/itsm';

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

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
 open: { label: 'Open', color: 'bg-brand-soft text-brand', icon: AlertCircle },
 in_progress: { label: 'In Progress', color: 'bg-info-soft text-info', icon: Clock },
 pending: { label: 'Pending', color: 'bg-warning-soft text-warning', icon: Clock },
 resolved: { label: 'Resolved', color: 'bg-success-soft text-success', icon: CheckCircle },
 closed: { label: 'Closed', color: 'bg-muted text-foreground', icon: XCircle },
};

export default function IncidentsPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [projectLoading, setProjectLoading] = useState(true);
 const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
 const [filterStatus, setFilterStatus] = useState<string>('all');
 const [filterPriority, setFilterPriority] = useState<string>('all');

 // Form state for new incident modal
 const [newIncForm, setNewIncForm] = useState({
 title: '',
 description: '',
 impact: Impact.MEDIUM,
 urgency: Urgency.MEDIUM,
 category_id: '',
 });
 const [formError, setFormError] = useState('');

 // Real API hooks
 const statusFilter = filterStatus !== 'all' ? [filterStatus as IncidentStatus] : undefined;
 const priorityFilter = filterPriority !== 'all' ? [filterPriority as Priority] : undefined;
 const { data: incidentsData, isLoading: incidentsLoading } = useIncidents({
 status: statusFilter,
 priority: priorityFilter,
 });
 const { data: stats } = useIncidentStats();
 const createIncident = useCreateIncident();
 const { data: categories = [] } = useCategories(true);

 const incidents: IIncident[] = useMemo(() => incidentsData?.data || [], [incidentsData]);

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
 hour: '2-digit',
 minute: '2-digit',
 });
 };

 const handleCreateIncident = async () => {
 setFormError('');
 if (!newIncForm.title.trim() || newIncForm.title.trim().length < 3) {
 setFormError('Title must be at least 3 characters');
 return;
 }
 if (!newIncForm.description.trim() || newIncForm.description.trim().length < 10) {
 setFormError('Description must be at least 10 characters');
 return;
 }
 try {
 await createIncident.mutateAsync({
 title: newIncForm.title,
 description: newIncForm.description,
 impact: newIncForm.impact,
 urgency: newIncForm.urgency,
 channel: Channel.SELF_SERVICE,
 category_id: newIncForm.category_id || 'general',
 site_id: 'default',
 });
 setShowNewIncidentModal(false);
 setNewIncForm({ title: '', description: '', impact: Impact.MEDIUM, urgency: Urgency.MEDIUM, category_id: '' });
 } catch (err: unknown) {
 const axiosErr = err as { response?: { data?: { message?: string } } };
 setFormError(axiosErr?.response?.data?.message || 'Failed to create incident');
 }
 };

 const isLoading = projectLoading || incidentsLoading;

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
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

 {/* Toolbar */}
 <ProjectToolbar
 searchPlaceholder="Search incidents..."
 primaryAction={{
 label: 'New Incident',
 onClick: () => setShowNewIncidentModal(true),
 }}
 rightActions={
 <div className="flex items-center gap-2">
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="all">All Status</option>
 <option value="open">Open</option>
 <option value="in_progress">In Progress</option>
 <option value="pending">Pending</option>
 <option value="resolved">Resolved</option>
 <option value="closed">Closed</option>
 </select>
 <select
 value={filterPriority}
 onChange={(e) => setFilterPriority(e.target.value)}
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="all">All Priority</option>
 <option value="critical">Critical</option>
 <option value="high">High</option>
 <option value="medium">Medium</option>
 <option value="low">Low</option>
 </select>
 </div>
 }
 />

 {/* Stats Bar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <AlertCircle className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{stats?.total || 0} Total</span>
 </div>
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-brand" />
 <span className="text-sm text-muted-foreground">{stats?.open || 0} Open</span>
 </div>
 {(stats?.breached || 0) > 0 && (
 <div className="flex items-center gap-2">
 <XCircle className="h-4 w-4 text-destructive" />
 <span className="text-sm text-destructive">{stats?.breached || 0} SLA Breached</span>
 </div>
 )}
 </div>
 </div>

 {/* Incidents List */}
 <div className="flex-1 overflow-y-auto p-4">
 <div className="bg-background border border-border rounded-xl overflow-hidden">
 {/* Table Header */}
 <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
 <div className="col-span-1">ID</div>
 <div className="col-span-4">Title</div>
 <div className="col-span-1">Priority</div>
 <div className="col-span-2">Status</div>
 <div className="col-span-2">Assignee</div>
 <div className="col-span-2">Updated</div>
 </div>

 {/* Table Body */}
 {incidents.length === 0 ? (
 <div className="text-center py-12">
 <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">No incidents found</p>
 </div>
 ) : (
 incidents.map((incident) => {
 const pCfg = priorityConfig[incident.priority] || priorityConfig.medium;
 const sCfg = statusConfig[incident.status] || statusConfig.open;
 const StatusIcon = sCfg.icon;

 return (
 <div
 key={incident._id}
 onClick={() => router.push(`/incidents/${incident.incident_id}`)}
 className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors items-center"
 >
 <div className="col-span-1">
 <span className="text-sm font-mono text-muted-foreground">{incident.incident_id}</span>
 </div>
 <div className="col-span-4">
 <div className="flex items-center gap-2">
 {incident.sla?.breach_flag && (
 <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
 )}
 <div className="min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{incident.title}</p>
 <p className="text-xs text-muted-foreground">{incident.category_id}</p>
 </div>
 </div>
 </div>
 <div className="col-span-1">
 <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${pCfg.color}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
 {pCfg.label}
 </span>
 </div>
 <div className="col-span-2">
 <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${sCfg.color}`}>
 <StatusIcon className="h-3 w-3" />
 {sCfg.label}
 </span>
 </div>
 <div className="col-span-2">
 {incident.assigned_to?.name ? (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-info-soft flex items-center justify-center text-xs font-medium text-info">
 {incident.assigned_to.name.split(' ').map((n: string) => n[0]).join('')}
 </div>
 <span className="text-sm text-foreground truncate">{incident.assigned_to.name}</span>
 </div>
 ) : (
 <span className="text-sm text-muted-foreground">Unassigned</span>
 )}
 </div>
 <div className="col-span-2 flex items-center justify-between">
 <span className="text-sm text-muted-foreground">{formatDate(incident.updated_at)}</span>
 <button className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* New Incident Modal */}
 {showNewIncidentModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-lg shadow-xl">
 <h2 className="text-lg font-semibold text-foreground mb-4">Report New Incident</h2>
 <div className="space-y-4">
 {formError && (
 <div className="flex items-center gap-2 text-sm text-destructive bg-destructive-soft p-3 rounded-lg">
 <AlertCircle className="h-4 w-4 flex-shrink-0" />
 <span>{formError}</span>
 </div>
 )}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Title <span className="text-destructive">*</span></label>
 <input
 type="text"
 value={newIncForm.title}
 onChange={(e) => { setNewIncForm({ ...newIncForm, title: e.target.value }); setFormError(''); }}
 placeholder="Brief description of the incident"
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description <span className="text-destructive">*</span></label>
 <textarea
 value={newIncForm.description}
 onChange={(e) => { setNewIncForm({ ...newIncForm, description: e.target.value }); setFormError(''); }}
 placeholder="Detailed description (at least 10 characters)..."
 rows={3}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Impact</label>
 <select
 value={newIncForm.impact}
 onChange={(e) => setNewIncForm({ ...newIncForm, impact: e.target.value as Impact })}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value={Impact.LOW}>Low</option>
 <option value={Impact.MEDIUM}>Medium</option>
 <option value={Impact.HIGH}>High</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Urgency</label>
 <select
 value={newIncForm.urgency}
 onChange={(e) => setNewIncForm({ ...newIncForm, urgency: e.target.value as Urgency })}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value={Urgency.LOW}>Low</option>
 <option value={Urgency.MEDIUM}>Medium</option>
 <option value={Urgency.HIGH}>High</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Category</label>
 <select
 value={newIncForm.category_id}
 onChange={(e) => setNewIncForm({ ...newIncForm, category_id: e.target.value })}
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
 onClick={() => { setShowNewIncidentModal(false); setFormError(''); }}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateIncident}
 disabled={createIncident.isPending}
 className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
 >
 {createIncident.isPending ? (
 <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
 ) : (
 'Report Incident'
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
