'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Clock,
 CheckCircle,
 AlertTriangle,
 XCircle,
 Target,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useSlaPolicies, useSlaStats, ISlaPolicy } from '@/hooks/useSlaV2';

interface Project {
 _id: string;
 name: string;
 key: string;
}

const priorityConfig: Record<string, { label: string; color: string; textColor: string; bgColor: string }> = {
 critical: { label: 'Critical', color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive-soft' },
 high: { label: 'High', color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning-soft' },
 medium: { label: 'Medium', color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning-soft' },
 low: { label: 'Low', color: 'bg-muted-foreground/50', textColor: 'text-foreground', bgColor: 'bg-muted' },
};

export default function SlaPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [projectLoading, setProjectLoading] = useState(true);
 const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

 const { data: slaData, isLoading: slaLoading } = useSlaPolicies({ isActive: true });
 const { data: stats } = useSlaStats();
 const slaDefinitions: ISlaPolicy[] = useMemo(() => slaData || [], [slaData]);

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

 const formatTime = (minutes: number) => {
 if (minutes < 60) return `${minutes}m`;
 if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
 return `${(minutes / 1440).toFixed(1)}d`;
 };

 const overallActive = stats?.policies?.active || 0;
 const overallDefaults = 0;
 const overallTotal = stats?.policies?.total || 0;

 const isLoading = projectLoading || slaLoading;

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
 <div className="flex items-center gap-2">
 <Target className="h-5 w-5 text-brand" />
 <h2 className="text-lg font-semibold text-foreground">SLA Dashboard</h2>
 <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">Project View</span>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={timeRange}
 onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="week">Last 7 days</option>
 <option value="month">Last 30 days</option>
 <option value="quarter">Last 90 days</option>
 </select>
 <button className="px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors">
 Export Report
 </button>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Overall Stats */}
 <div className="grid grid-cols-4 gap-4 mb-8">
 {/* Total SLAs */}
 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Total SLAs</span>
 <div className="p-2 rounded-lg bg-brand-soft">
 <Target className="h-5 w-5 text-brand" />
 </div>
 </div>
 <p className="text-4xl font-bold text-foreground">{overallTotal}</p>
 <p className="text-sm text-muted-foreground mt-1">Defined policies</p>
 </div>

 {/* Active SLAs */}
 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Active SLAs</span>
 <div className="p-2 rounded-lg bg-success-soft">
 <CheckCircle className="h-5 w-5 text-success" />
 </div>
 </div>
 <p className="text-4xl font-bold text-success">{overallActive}</p>
 <p className="text-sm text-muted-foreground mt-1">Currently enforced</p>
 </div>

 {/* Default SLAs */}
 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Default SLAs</span>
 <div className="p-2 rounded-lg bg-info-soft">
 <Clock className="h-5 w-5 text-info" />
 </div>
 </div>
 <p className="text-4xl font-bold text-info">{overallDefaults}</p>
 <p className="text-sm text-muted-foreground mt-1">Fallback policies</p>
 </div>

 {/* Priorities Covered */}
 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Priorities Covered</span>
 <div className="p-2 rounded-lg bg-warning-soft">
 <AlertTriangle className="h-5 w-5 text-warning" />
 </div>
 </div>
 <p className="text-4xl font-bold text-warning">
 {slaDefinitions.length > 0 ? new Set(slaDefinitions.map(s => s.priority)).size : 0}
 </p>
 <p className="text-sm text-muted-foreground mt-1">Priority levels</p>
 </div>
 </div>

 {/* SLA Definitions */}
 <div className="bg-background rounded-xl border border-border mb-8">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">SLA Policies by Priority</h3>
 </div>
 <div className="p-6">
 {slaDefinitions.length === 0 ? (
 <div className="text-center py-8">
 <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">No SLA policies defined yet</p>
 </div>
 ) : (
 <div className="space-y-6">
 {slaDefinitions.map((sla) => {
 const priorityLabel = typeof sla.priority === 'number'
 ? ['', 'Critical', 'High', 'Medium', 'Low'][sla.priority] || String(sla.priority)
 : String(sla.priority);
 const priorityKey = priorityLabel.toLowerCase();
 const config = priorityConfig[priorityKey] || priorityConfig.medium;
 const firstGoal = sla.goals?.[0];

 return (
 <div key={sla.id} className="flex items-center gap-6">
 {/* Priority Badge */}
 <div className="w-32">
 <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
 {priorityLabel}
 </span>
 </div>

 {/* Name */}
 <div className="w-40">
 <p className="text-sm font-medium text-foreground">{sla.name}</p>
 <p className="text-xs text-muted-foreground">{sla.code}</p>
 </div>

 {/* Targets */}
 <div className="w-48 text-sm">
 {firstGoal ? (
 <p className="text-muted-foreground">Target: <span className="font-medium text-foreground">{formatTime(firstGoal.targetMinutes)}</span></p>
 ) : (
 <p className="text-muted-foreground text-xs">No goals defined</p>
 )}
 </div>

 {/* Status */}
 <div className="flex-1">
 <div className="flex items-center gap-3">
 {sla.isActive ? (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-success-soft text-success">
 <CheckCircle className="h-3 w-3" /> Active
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
 <XCircle className="h-3 w-3" /> Inactive
 </span>
 )}
 </div>
 </div>

 {/* Goals */}
 <div className="w-32 text-center">
 <p className="text-lg font-bold text-foreground">{sla.goals?.length || 0}</p>
 <p className="text-xs text-muted-foreground">Goals</p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* Instance Status Breakdown */}
 {stats?.instances && Object.keys(stats.instances).length > 0 && (
 <div className="bg-background rounded-xl border border-border">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">SLA Instance Status</h3>
 </div>
 <div className="p-6">
 <div className="grid grid-cols-4 gap-4">
 {Object.entries(stats.instances).map(([status, count]) => {
 const config = priorityConfig[status] || { color: 'bg-brand', textColor: 'text-brand', bgColor: 'bg-brand-soft', label: status };
 return (
 <div key={status} className="p-4 bg-muted/50 rounded-lg">
 <div className="flex items-center gap-2 mb-3">
 <span className={`w-3 h-3 rounded-full ${config.color}`} />
 <p className="text-sm font-medium text-foreground capitalize">{status.replace(/_/g, ' ')}</p>
 </div>
 <p className="text-3xl font-bold text-foreground">{count as number}</p>
 <p className="text-xs text-muted-foreground mt-1">Instances</p>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
