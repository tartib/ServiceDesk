'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Shield,
 CheckCircle,
 XCircle,
 Clock,
 Users,
 MessageSquare,
 FileText,
 ChevronRight,
 X,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 ProjectToolbar,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface GateReview {
 id: string;
 name: string;
 phaseId: string;
 phaseName: string;
 criteria: GateCriteria[];
 approvers: Approver[];
 status: 'pending' | 'in_review' | 'approved' | 'rejected';
 requestedAt?: string;
 completedAt?: string;
 comments: GateComment[];
}

interface GateCriteria {
 id: string;
 name: string;
 description?: string;
 status: 'not_checked' | 'passed' | 'failed';
 checkedBy?: string;
 checkedAt?: string;
}

interface Approver {
 id: string;
 name: string;
 role: string;
 decision?: 'approved' | 'rejected' | 'pending';
 decidedAt?: string;
 comment?: string;
}

interface GateComment {
 id: string;
 author: string;
 content: string;
 createdAt: string;
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

interface PhaseOption {
 _id: string;
 name: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapGate = (g: Record<string, any>): GateReview => {
 const getName = (u: any) => u?.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u?.email || 'Unknown';
 return {
 id: g._id,
 name: g.name,
 phaseId: g.phaseId || '',
 phaseName: g.phaseName || '',
 status: g.status || 'pending',
 requestedAt: g.requestedAt,
 completedAt: g.completedAt,
 criteria: (g.criteria || []).map((c: any, i: number) => ({
 id: c._id || `c${i}`, name: c.name, description: c.description,
 status: c.status || 'not_checked', checkedBy: c.checkedBy, checkedAt: c.checkedAt,
 })),
 approvers: (g.approvers || []).map((a: any, i: number) => ({
 id: a._id || `a${i}`, name: getName(a.userId), role: a.role,
 decision: a.decision || 'pending', decidedAt: a.decidedAt, comment: a.comment,
 })),
 comments: (g.comments || []).map((c: any, i: number) => ({
 id: c._id || `cm${i}`, author: getName(c.author), content: c.content, createdAt: c.createdAt,
 })),
 };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const statusConfig = {
 pending: { label: 'Pending', color: 'bg-muted text-foreground', icon: Clock },
 in_review: { label: 'In Review', color: 'bg-brand-soft text-brand', icon: Users },
 approved: { label: 'Approved', color: 'bg-success-soft text-success', icon: CheckCircle },
 rejected: { label: 'Rejected', color: 'bg-destructive-soft text-destructive', icon: XCircle },
};

export default function GatesPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [gates, setGates] = useState<GateReview[]>([]);
 const [selectedGate, setSelectedGate] = useState<GateReview | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [phases, setPhases] = useState<PhaseOption[]>([]);
 const [newGate, setNewGate] = useState({ name: '', phaseId: '', phaseName: '', criteriaText: '' });
 const [isSaving, setIsSaving] = useState(false);

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, gatesRes, phRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/gates`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/phases`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const gatesData = await gatesRes.json();
 if (gatesData.success) setGates((gatesData.data.gates || []).map(mapGate));
 const phData = await phRes.json();
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 if (phData.success) setPhases((phData.data.phases || []).map((p: Record<string, any>) => ({ _id: p._id, name: p.name })));
 } catch (error) {
 console.error('Failed to fetch gates:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const handleCreateGate = async () => {
 if (!newGate.name) return;
 const token = getToken();
 if (!token) return;
 setIsSaving(true);
 try {
 const criteria = newGate.criteriaText
 .split('\n')
 .map(c => c.trim())
 .filter(Boolean)
 .map(name => ({ name, status: 'not_checked' }));
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const body: Record<string, any> = { name: newGate.name, criteria };
 if (newGate.phaseId) {
 body.phaseId = newGate.phaseId;
 body.phaseName = phases.find(p => p._id === newGate.phaseId)?.name || '';
 }
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/gates`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setShowCreateModal(false);
 setNewGate({ name: '', phaseId: '', phaseName: '', criteriaText: '' });
 }
 } catch (error) {
 console.error('Failed to create gate:', error);
 } finally {
 setIsSaving(false);
 }
 };

 const handleUpdateGateStatus = async (gateId: string, status: string) => {
 const token = getToken();
 if (!token) return;
 try {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const body: Record<string, any> = { status };
 if (status === 'in_review') body.requestedAt = new Date().toISOString();
 if (status === 'approved' || status === 'rejected') body.completedAt = new Date().toISOString();
 const res = await fetch(`${API_URL}/pm/gates/${gateId}`, {
 method: 'PATCH',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (data.success) {
 fetchData(token);
 setSelectedGate(null);
 }
 } catch (error) {
 console.error('Failed to update gate:', error);
 }
 };

 const formatDate = (dateStr?: string) => {
 if (!dateStr) return '—';
 return new Date(dateStr).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
 };

 const getApprovalProgress = (gate: GateReview) => {
 const approved = gate.approvers.filter(a => a.decision === 'approved').length;
 return { approved, total: gate.approvers.length };
 };

 const getCriteriaProgress = (gate: GateReview) => {
 const passed = gate.criteria.filter(c => c.status === 'passed').length;
 return { passed, total: gate.criteria.length };
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
 searchPlaceholder="Search gate reviews..."
 primaryAction={{
 label: 'Add Gate Review',
 onClick: () => setShowCreateModal(true),
 }}
 />

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Gates List */}
 <div className={`${selectedGate ? 'w-1/2 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
 <div className="space-y-3">
 {gates.map((gate) => {
 const approvalProgress = getApprovalProgress(gate);
 const criteriaProgress = getCriteriaProgress(gate);

 return (
 <div
 key={gate.id}
 onClick={() => setSelectedGate(gate)}
 className={`bg-background border rounded-xl p-4 cursor-pointer transition-all ${
 selectedGate?.id === gate.id 
 ? 'border-brand ring-2 ring-brand-border' 
 : 'border-border hover:border-border hover:shadow-md'
 }`}
 >
 <div className="flex items-start gap-4">
 {/* Icon */}
 <div className={`p-2 rounded-lg ${
 gate.status === 'approved' ? 'bg-success-soft' :
 gate.status === 'rejected' ? 'bg-destructive-soft' :
 gate.status === 'in_review' ? 'bg-brand-soft' :
 'bg-muted'
 }`}>
 <Shield className={`h-5 w-5 ${
 gate.status === 'approved' ? 'text-success' :
 gate.status === 'rejected' ? 'text-destructive' :
 gate.status === 'in_review' ? 'text-brand' :
 'text-muted-foreground'
 }`} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-1">
 <h3 className="font-semibold text-foreground">{gate.name}</h3>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[gate.status].color}`}>
 {statusConfig[gate.status].label}
 </span>
 </div>
 
 <p className="text-sm text-muted-foreground mb-3">Phase: {gate.phaseName}</p>

 <div className="flex items-center gap-6 text-sm">
 <div className="flex items-center gap-2">
 <CheckCircle className="h-4 w-4 text-muted-foreground" />
 <span className="text-muted-foreground">
 Criteria: {criteriaProgress.passed}/{criteriaProgress.total}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Users className="h-4 w-4 text-muted-foreground" />
 <span className="text-muted-foreground">
 Approvals: {approvalProgress.approved}/{approvalProgress.total}
 </span>
 </div>
 </div>
 </div>

 <ChevronRight className="h-5 w-5 text-muted-foreground" />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Gate Detail Panel */}
 {selectedGate && (
 <div className="w-1/2 overflow-y-auto bg-background">
 <div className="p-6">
 {/* Header */}
 <div className="flex items-start justify-between mb-6">
 <div>
 <h2 className="text-xl font-semibold text-foreground">{selectedGate.name}</h2>
 <p className="text-sm text-muted-foreground mt-1">Phase: {selectedGate.phaseName}</p>
 </div>
 <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedGate.status].color}`}>
 {statusConfig[selectedGate.status].label}
 </span>
 </div>

 {/* Timeline */}
 <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
 {selectedGate.requestedAt && (
 <span>Requested: {formatDate(selectedGate.requestedAt)}</span>
 )}
 {selectedGate.completedAt && (
 <span>Completed: {formatDate(selectedGate.completedAt)}</span>
 )}
 </div>

 {/* Criteria Section */}
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
 <FileText className="h-4 w-4" />
 Gate Criteria
 </h3>
 <div className="space-y-2">
 {selectedGate.criteria.map((criterion) => (
 <div
 key={criterion.id}
 className={`flex items-center gap-3 p-3 rounded-lg border ${
 criterion.status === 'passed' ? 'bg-success-soft border-success/30' :
 criterion.status === 'failed' ? 'bg-destructive-soft border-destructive/30' :
 'bg-muted/50 border-border'
 }`}
 >
 {criterion.status === 'passed' ? (
 <CheckCircle className="h-5 w-5 text-success" />
 ) : criterion.status === 'failed' ? (
 <XCircle className="h-5 w-5 text-destructive" />
 ) : (
 <Clock className="h-5 w-5 text-muted-foreground" />
 )}
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">{criterion.name}</p>
 {criterion.checkedBy && (
 <p className="text-xs text-muted-foreground">Checked by {criterion.checkedBy}</p>
 )}
 </div>
 {criterion.status === 'not_checked' && (
 <button className="px-3 py-1 text-xs bg-background border border-border rounded-lg hover:bg-muted/50">
 Verify
 </button>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Approvers Section */}
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
 <Users className="h-4 w-4" />
 Approvers
 </h3>
 <div className="space-y-2">
 {selectedGate.approvers.map((approver) => (
 <div
 key={approver.id}
 className="flex items-center gap-3 p-3 rounded-lg border border-border"
 >
 <div className="w-8 h-8 rounded-full bg-info-soft flex items-center justify-center text-sm font-medium text-info">
 {approver.name.split(' ').map(n => n[0]).join('')}
 </div>
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">{approver.name}</p>
 <p className="text-xs text-muted-foreground">{approver.role}</p>
 </div>
 <span className={`px-2 py-1 text-xs font-medium rounded-full ${
 approver.decision === 'approved' ? 'bg-success-soft text-success' :
 approver.decision === 'rejected' ? 'bg-destructive-soft text-destructive' :
 'bg-muted text-muted-foreground'
 }`}>
 {approver.decision === 'approved' ? 'Approved' :
 approver.decision === 'rejected' ? 'Rejected' : 'Pending'}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Comments Section */}
 {selectedGate.comments.length > 0 && (
 <div className="mb-6">
 <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
 <MessageSquare className="h-4 w-4" />
 Comments
 </h3>
 <div className="space-y-3">
 {selectedGate.comments.map((comment) => (
 <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-sm font-medium text-foreground">{comment.author}</span>
 <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
 </div>
 <p className="text-sm text-foreground">{comment.content}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Actions */}
 {selectedGate.status === 'in_review' && (
 <div className="flex items-center gap-3 pt-4 border-t border-border">
 <button
 onClick={() => handleUpdateGateStatus(selectedGate.id, 'approved')}
 className="flex-1 px-4 py-2.5 bg-success text-success-foreground font-medium rounded-lg hover:bg-success/80 transition-colors"
 >
 Approve Gate
 </button>
 <button
 onClick={() => handleUpdateGateStatus(selectedGate.id, 'rejected')}
 className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/90 transition-colors"
 >
 Reject Gate
 </button>
 </div>
 )}
 {selectedGate.status === 'pending' && (
 <div className="pt-4 border-t border-border">
 <button
 onClick={() => handleUpdateGateStatus(selectedGate.id, 'in_review')}
 className="w-full px-4 py-2.5 bg-brand text-brand-foreground font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 Request Gate Review
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Create Gate Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-xl">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-foreground">Add Gate Review</h2>
 <button onClick={() => setShowCreateModal(false)} className="p-1 text-muted-foreground hover:text-muted-foreground rounded"><X className="h-5 w-5" /></button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Gate Name *</label>
 <input
 type="text"
 value={newGate.name}
 onChange={(e) => setNewGate(g => ({ ...g, name: e.target.value }))}
 placeholder="e.g., Design Review Gate"
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Phase</label>
 <select
 value={newGate.phaseId}
 onChange={(e) => setNewGate(g => ({ ...g, phaseId: e.target.value }))}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="">Select phase...</option>
 {phases.map(ph => (
 <option key={ph._id} value={ph._id}>{ph.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Criteria (one per line)</label>
 <textarea
 value={newGate.criteriaText}
 onChange={(e) => setNewGate(g => ({ ...g, criteriaText: e.target.value }))}
 placeholder={"All unit tests passing\nCode review completed\nDocumentation updated"}
 rows={4}
 className="w-full px-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => { setShowCreateModal(false); setNewGate({ name: '', phaseId: '', phaseName: '', criteriaText: '' }); }}
 className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateGate}
 disabled={isSaving || !newGate.name}
 className="flex-1 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSaving ? 'Adding...' : 'Add Gate'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
