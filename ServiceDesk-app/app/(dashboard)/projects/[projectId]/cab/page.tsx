'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Users,
 Calendar,
 CheckCircle,
 AlertTriangle,
 ThumbsUp,
 ThumbsDown,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { usePendingCabApproval, useChangeStats } from '@/hooks/useChanges';
import { IChange, IChangeStats } from '@/types/itsm';

interface Project {
 _id: string;
 name: string;
 key: string;
}

const riskConfig: Record<string, { label: string; color: string }> = {
 low: { label: 'Low', color: 'bg-success-soft text-success' },
 medium: { label: 'Medium', color: 'bg-warning-soft text-warning' },
 high: { label: 'High', color: 'bg-destructive-soft text-destructive' },
 critical: { label: 'Critical', color: 'bg-destructive-soft text-destructive' },
};

const changeStatusConfig: Record<string, { label: string; color: string }> = {
 draft: { label: 'Draft', color: 'bg-muted text-foreground' },
 pending_approval: { label: 'Pending Approval', color: 'bg-warning-soft text-warning' },
 approved: { label: 'Approved', color: 'bg-success-soft text-success' },
 rejected: { label: 'Rejected', color: 'bg-destructive-soft text-destructive' },
 scheduled: { label: 'Scheduled', color: 'bg-brand-soft text-brand' },
 implementing: { label: 'Implementing', color: 'bg-info-soft text-info' },
 completed: { label: 'Completed', color: 'bg-success-soft text-success' },
 cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export default function CabPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [projectLoading, setProjectLoading] = useState(true);
 const [selectedChange, setSelectedChange] = useState<IChange | null>(null);

 const { data: cabChangesRaw, isLoading: cabLoading } = usePendingCabApproval();
 const { data: changeStatsRaw } = useChangeStats();
 const changeStats = changeStatsRaw as IChangeStats | undefined;
 const cabChanges: IChange[] = useMemo(() => {
 if (!cabChangesRaw) return [];
 return Array.isArray(cabChangesRaw) ? cabChangesRaw : (cabChangesRaw as Record<string, IChange[]>)?.data || [];
 }, [cabChangesRaw]);

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
 weekday: 'short',
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 });
 };

 const isLoading = projectLoading || cabLoading;

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
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <Users className="h-5 w-5 text-info" />
 <h2 className="text-lg font-semibold text-foreground">Change Advisory Board</h2>
 </div>
 <span className="px-3 py-1 text-sm font-medium rounded-full bg-warning-soft text-warning">
 {cabChanges.length} Pending Review
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground flex items-center gap-1">
 <Calendar className="h-4 w-4" />
 {formatDate(new Date().toISOString())}
 </span>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Changes List */}
 <div className={`${selectedChange ? 'w-2/3 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
 <h3 className="font-semibold text-foreground mb-4">Changes Pending CAB Review ({cabChanges.length})</h3>
 {cabChanges.length === 0 ? (
 <div className="text-center py-12">
 <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">No changes pending CAB review</p>
 </div>
 ) : (
 <div className="space-y-4">
 {cabChanges.map((change) => {
 const rCfg = riskConfig[change.risk] || riskConfig.medium;
 const sCfg = changeStatusConfig[change.status] || changeStatusConfig.draft;
 const approvalPct = change.approval_progress || 0;

 return (
 <div
 key={change._id}
 onClick={() => setSelectedChange(change)}
 className={`bg-background border rounded-xl p-4 cursor-pointer transition-all ${
 selectedChange?._id === change._id 
 ? 'border-info/50 ring-2 ring-info/20' 
 : 'border-border hover:border-border hover:shadow-md'
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-sm font-mono text-muted-foreground">{change.change_id}</span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${rCfg.color}`}>
 {rCfg.label} Risk
 </span>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sCfg.color}`}>
 {sCfg.label}
 </span>
 </div>
 <h4 className="font-medium text-foreground">{change.title}</h4>
 <p className="text-sm text-muted-foreground mt-1">Requested by {change.requested_by?.name || 'Unknown'}</p>
 </div>
 </div>

 {/* Approval Progress */}
 <div className="mt-4">
 <div className="flex items-center justify-between text-sm mb-2">
 <span className="text-muted-foreground">Approval Progress</span>
 <span className="font-medium">{approvalPct}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-2">
 <div
 className={`h-2 rounded-full ${approvalPct >= 100 ? 'bg-success' : approvalPct > 0 ? 'bg-warning' : 'bg-muted'}`}
 style={{ width: `${Math.min(approvalPct, 100)}%` }}
 />
 </div>
 </div>

 {/* Quick Actions */}
 <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
 <button
 onClick={(e) => { e.stopPropagation(); }}
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-success-soft text-success rounded-lg hover:bg-success-soft transition-colors"
 >
 <ThumbsUp className="h-4 w-4" />
 Approve
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); }}
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive-soft text-destructive rounded-lg hover:bg-destructive-soft transition-colors"
 >
 <ThumbsDown className="h-4 w-4" />
 Reject
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Change Detail Panel */}
 {selectedChange && (
 <div className="w-1/3 overflow-y-auto bg-background p-4">
 <h3 className="font-semibold text-foreground mb-4">Change Details</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Change ID</p>
 <p className="text-sm font-mono font-medium text-foreground">{selectedChange.change_id}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
 <p className="text-sm font-medium text-foreground">{selectedChange.title}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
 <p className="text-sm text-muted-foreground">{selectedChange.description || 'No description'}</p>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground">Type</p>
 <p className="text-sm font-medium text-foreground capitalize">{selectedChange.type}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground">Priority</p>
 <p className="text-sm font-medium text-foreground capitalize">{selectedChange.priority}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground">Risk</p>
 <p className="text-sm font-medium text-foreground capitalize">{selectedChange.risk}</p>
 </div>
 <div className="p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground">Impact</p>
 <p className="text-sm font-medium text-foreground capitalize">{selectedChange.impact}</p>
 </div>
 </div>
 {selectedChange.implementation_plan && (
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Implementation Plan</p>
 <p className="text-sm text-muted-foreground mt-1">{selectedChange.implementation_plan}</p>
 </div>
 )}
 {selectedChange.rollback_plan && (
 <div className="p-3 bg-warning-soft border border-warning/30 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <AlertTriangle className="h-4 w-4 text-warning" />
 <p className="text-xs text-warning font-medium uppercase tracking-wide">Rollback Plan</p>
 </div>
 <p className="text-sm text-warning">{selectedChange.rollback_plan}</p>
 </div>
 )}
 {selectedChange.schedule && (
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Schedule</p>
 <div className="mt-1 text-sm text-muted-foreground">
 {selectedChange.schedule.planned_start && (
 <p>Start: {formatDate(selectedChange.schedule.planned_start as unknown as string)}</p>
 )}
 {selectedChange.schedule.planned_end && (
 <p>End: {formatDate(selectedChange.schedule.planned_end as unknown as string)}</p>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Change Stats Summary */}
 {changeStats && (
 <div className="mt-6 p-4 bg-info-soft rounded-lg">
 <h4 className="font-medium text-info mb-3">Overall Change Stats</h4>
 <div className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-info">Total Changes</span>
 <span className="font-medium text-info">{changeStats.total || 0}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-info">Pending Approval</span>
 <span className="font-medium text-warning">{changeStats.pendingApproval || 0}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-info">Approved</span>
 <span className="font-medium text-success">{changeStats.approved || 0}</span>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
