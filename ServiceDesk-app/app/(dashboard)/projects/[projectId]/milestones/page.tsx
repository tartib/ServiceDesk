'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Flag,
 MoreHorizontal,
 CheckCircle,
 Clock,
 AlertTriangle,
 Calendar,
 Target,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 ProjectToolbar,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Phase {
 _id: string;
 name: string;
}

interface Milestone {
 id: string;
 name: string;
 description?: string;
 dueDate: string;
 phaseId?: string;
 phaseName?: string;
 status: 'upcoming' | 'completed' | 'missed' | 'at_risk';
 completedAt?: string;
 owner?: string;
 dependencies: string[];
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapMilestone = (m: Record<string, any>): Milestone => ({
 id: m._id,
 name: m.name,
 description: m.description,
 dueDate: m.dueDate,
 phaseId: m.phaseId,
 status: m.status || 'upcoming',
 completedAt: m.completedAt,
 owner: m.owner?.profile ? `${m.owner.profile.firstName} ${m.owner.profile.lastName}`.trim() : m.owner?.email,
 dependencies: m.dependencies || [],
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const statusConfig = {
 upcoming: { label: 'Upcoming', color: 'bg-brand-soft text-brand', icon: Clock, iconColor: 'text-brand' },
 completed: { label: 'Completed', color: 'bg-success-soft text-success', icon: CheckCircle, iconColor: 'text-success' },
 missed: { label: 'Missed', color: 'bg-destructive-soft text-destructive', icon: AlertTriangle, iconColor: 'text-destructive' },
 at_risk: { label: 'At Risk', color: 'bg-warning-soft text-warning', icon: AlertTriangle, iconColor: 'text-warning' },
};

export default function MilestonesPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [milestones, setMilestones] = useState<Milestone[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
 const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
 const [phases, setPhases] = useState<Phase[]>([]);
 const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '', phaseId: '' });
 const [isSaving, setIsSaving] = useState(false);

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, msRes, phRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/milestones`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/phases`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const msData = await msRes.json();
 if (msData.success) setMilestones((msData.data.milestones || []).map(mapMilestone));
 const phData = await phRes.json();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (phData.success) setPhases((phData.data.phases || []).map((p: Record<string, any>) => ({ _id: p._id, name: p.name })));
 } catch (error) {
 console.error('Failed to fetch milestones:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const handleCreateMilestone = async () => {
 if (!newMilestone.name || !newMilestone.dueDate) return;
 const token = getToken();
 if (!token) return;
 setIsSaving(true);
 try {
 const body: Record<string, string> = { name: newMilestone.name, dueDate: newMilestone.dueDate };
 if (newMilestone.description) body.description = newMilestone.description;
 if (newMilestone.phaseId) body.phaseId = newMilestone.phaseId;
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/milestones`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setShowNewMilestoneModal(false);
 setNewMilestone({ name: '', description: '', dueDate: '', phaseId: '' });
 }
 } catch (error) {
 console.error('Failed to create milestone:', error);
 } finally {
 setIsSaving(false);
 }
 };

 const handleMarkComplete = async (milestoneId: string) => {
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/milestones/${milestoneId}`, {
 method: 'PATCH',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() }),
 });
 const data = await res.json();
 if (data.success) fetchData(token);
 } catch (error) {
 console.error('Failed to mark milestone complete:', error);
 }
 };

 const formatDate = (dateStr: string) => {
 return new Date(dateStr).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
 };

 const getDaysUntil = (dateStr: string) => {
 const today = new Date();
 const dueDate = new Date(dateStr);
 const diffTime = dueDate.getTime() - today.getTime();
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 return diffDays;
 };

 const getStats = () => {
 return {
 total: milestones.length,
 completed: milestones.filter(m => m.status === 'completed').length,
 upcoming: milestones.filter(m => m.status === 'upcoming').length,
 atRisk: milestones.filter(m => m.status === 'at_risk').length,
 missed: milestones.filter(m => m.status === 'missed').length,
 };
 };

 const stats = getStats();

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
 searchPlaceholder="Search milestones..."
 primaryAction={{
 label: 'Add Milestone',
 onClick: () => setShowNewMilestoneModal(true),
 }}
 rightActions={
 <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
 <button
 onClick={() => setViewMode('list')}
 className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
 viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 List
 </button>
 <button
 onClick={() => setViewMode('timeline')}
 className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
 viewMode === 'timeline' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Timeline
 </button>
 </div>
 }
 />

 {/* Stats Bar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Target className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{stats.total} Total</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle className="h-4 w-4 text-success" />
 <span className="text-sm text-muted-foreground">{stats.completed} Completed</span>
 </div>
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-brand" />
 <span className="text-sm text-muted-foreground">{stats.upcoming} Upcoming</span>
 </div>
 {stats.atRisk > 0 && (
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-warning" />
 <span className="text-sm text-warning">{stats.atRisk} At Risk</span>
 </div>
 )}
 {stats.missed > 0 && (
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-destructive" />
 <span className="text-sm text-destructive">{stats.missed} Missed</span>
 </div>
 )}
 </div>
 </div>

 {/* Milestones List */}
 <div className="flex-1 overflow-y-auto p-4">
 <div className="space-y-3">
 {milestones.map((milestone) => {
 const daysUntil = getDaysUntil(milestone.dueDate);

 return (
 <div
 key={milestone.id}
 className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
 >
 <div className="flex items-start gap-4">
 {/* Icon */}
 <div className={`p-2 rounded-lg ${
 milestone.status === 'completed' ? 'bg-success-soft' :
 milestone.status === 'at_risk' ? 'bg-warning-soft' :
 milestone.status === 'missed' ? 'bg-destructive-soft' :
 'bg-brand-soft'
 }`}>
 <Flag className={`h-5 w-5 ${statusConfig[milestone.status].iconColor}`} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-1">
 <h3 className="font-semibold text-foreground">{milestone.name}</h3>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[milestone.status].color}`}>
 {statusConfig[milestone.status].label}
 </span>
 {milestone.phaseName && (
 <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
 {milestone.phaseName}
 </span>
 )}
 </div>
 
 {milestone.description && (
 <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
 )}

 <div className="flex items-center gap-4 text-sm">
 <div className="flex items-center gap-1.5 text-muted-foreground">
 <Calendar className="h-4 w-4" />
 <span>{formatDate(milestone.dueDate)}</span>
 {milestone.status !== 'completed' && milestone.status !== 'missed' && (
 <span className={`ml-1 ${daysUntil < 0 ? 'text-destructive' : daysUntil <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
 ({daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`})
 </span>
 )}
 </div>
 {milestone.owner && (
 <div className="flex items-center gap-1.5 text-muted-foreground">
 <span>Owner:</span>
 <span className="font-medium text-foreground">{milestone.owner}</span>
 </div>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2">
 {milestone.status === 'upcoming' && (
 <button
 onClick={() => handleMarkComplete(milestone.id)}
 className="px-3 py-1.5 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success/80 transition-colors"
 >
 Mark Complete
 </button>
 )}
 <button className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* New Milestone Modal */}
 {showNewMilestoneModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-xl">
 <h2 className="text-lg font-semibold text-foreground mb-4">Add New Milestone</h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Milestone Name *</label>
 <input
 type="text"
 value={newMilestone.name}
 onChange={(e) => setNewMilestone(p => ({ ...p, name: e.target.value }))}
 placeholder="e.g., Beta Release"
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={newMilestone.description}
 onChange={(e) => setNewMilestone(p => ({ ...p, description: e.target.value }))}
 placeholder="Describe the milestone..."
 rows={2}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Due Date *</label>
 <input
 type="date"
 value={newMilestone.dueDate}
 onChange={(e) => setNewMilestone(p => ({ ...p, dueDate: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Phase</label>
 <select
 value={newMilestone.phaseId}
 onChange={(e) => setNewMilestone(p => ({ ...p, phaseId: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="">Select phase...</option>
 {phases.map(ph => (
 <option key={ph._id} value={ph._id}>{ph.name}</option>
 ))}
 </select>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => { setShowNewMilestoneModal(false); setNewMilestone({ name: '', description: '', dueDate: '', phaseId: '' }); }}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateMilestone}
 disabled={isSaving || !newMilestone.name || !newMilestone.dueDate}
 className="flex-1 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSaving ? 'Adding...' : 'Add Milestone'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
