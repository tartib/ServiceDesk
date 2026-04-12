'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
 BarChart3,
 FolderKanban,
 CheckCircle,
 Clock,
 AlertTriangle,
 Users,
 Zap,
 Target,
 TrendingUp,
 ChevronDown,
 ChevronRight,
 RefreshCw,
 Wifi,
 WifiOff,
 ArrowUpRight,
 ArrowDownRight,
 FileText,
 Shield,
 Mail,
 Download,
 Calendar,
 Loader2,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { usePortfolioSocket } from '@/hooks/useSocket';
import DashboardLayout from '@/components/layout/DashboardLayout';

const API = API_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewData {
 projects: { total: number; active: number; archived: number };
 tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number; completionRate: number };
 storyPoints: { total: number; completed: number };
 sprints: { total: number; active: number; completed: number };
 timeline: { onTime: number; overdue: number; noDeadline: number };
 teamMembers: number;
}

interface ProjectOwner {
 _id: string;
 name: string;
 email: string;
 avatar: string | null;
}

interface ProjectSummary {
 _id: string;
 name: string;
 key: string;
 methodology: string;
 status: string;
 health: 'green' | 'yellow' | 'red';
 priority: 'low' | 'medium' | 'high' | 'critical';
 escalated: boolean;
 escalationReason: string;
 startDate: string | null;
 targetEndDate: string | null;
 owner: ProjectOwner | null;
 memberCount: number;
 tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number };
 completionPct: number;
 storyPoints: { total: number; completed: number };
 velocity: number;
 activeSprint: { name: string; daysLeft: number; progress: number } | null;
 timeline: { status: string; daysRemaining: number | null };
}

interface TrendPoint {
 week: string;
 created: number;
 completed: number;
}

interface MemberWorkload {
 _id: string;
 name: string;
 email: string;
 avatar?: string;
 total: number;
 todo: number;
 inProgress: number;
 done: number;
 overdue: number;
 totalPoints: number;
 completedPoints: number;
}

interface DrilldownData {
 project: { _id: string; name: string; key: string; methodology: string };
 tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number; completionPct: number };
 byPriority: Record<string, number>;
 byType: Record<string, number>;
 velocityHistory: { name: string; number: number; planned: number; completed: number }[];
 memberPerformance: { userId: string; name: string; total: number; done: number; inProgress: number; points: number; completionRate: number }[];
 recentActivity: { _id: string; type: string; description: string; actor: { name?: string; email?: string; profile?: { firstName?: string; lastName?: string } }; createdAt: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHeaders() {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 return { Authorization: `Bearer ${token}` };
}

const methodologyColors: Record<string, string> = {
 scrum: 'bg-brand-soft text-brand',
 kanban: 'bg-info-soft text-info',
 waterfall: 'bg-success-soft text-success',
 itil: 'bg-warning-soft text-warning',
 lean: 'bg-success-soft text-success',
 okr: 'bg-info-soft text-info',
};

const timelineStatusColors: Record<string, string> = {
 on_track: 'bg-success-soft text-success',
 at_risk: 'bg-warning-soft text-warning',
 overdue: 'bg-destructive-soft text-destructive',
 no_deadline: 'bg-muted text-muted-foreground',
};

const healthColors: Record<string, { dot: string; bg: string; text: string; label: string }> = {
 green: { dot: 'bg-success', bg: 'bg-success-soft', text: 'text-success', label: 'Healthy' },
 yellow: { dot: 'bg-warning', bg: 'bg-warning-soft', text: 'text-warning', label: 'At Risk' },
 red: { dot: 'bg-destructive', bg: 'bg-destructive-soft', text: 'text-destructive', label: 'Critical' },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
 low: { bg: 'bg-muted', text: 'text-muted-foreground' },
 medium: { bg: 'bg-brand-soft', text: 'text-brand' },
 high: { bg: 'bg-warning-soft', text: 'text-warning' },
 critical: { bg: 'bg-destructive-soft', text: 'text-destructive' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PortfolioAnalyticsPage() {
 const router = useRouter();
 const { t } = useLocale();

 const [overview, setOverview] = useState<OverviewData | null>(null);
 const [projects, setProjects] = useState<ProjectSummary[]>([]);
 const [trends, setTrends] = useState<TrendPoint[]>([]);
 const [workload, setWorkload] = useState<MemberWorkload[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
 const [expandedProject, setExpandedProject] = useState<string | null>(null);
 const [drilldownData, setDrilldownData] = useState<Record<string, DrilldownData>>({});
 const [drilldownLoading, setDrilldownLoading] = useState<string | null>(null);
 const [sortField, setSortField] = useState<'name' | 'completionPct' | 'velocity' | 'overdue'>('completionPct');
 const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
 const [reportGenerating, setReportGenerating] = useState<string | null>(null);

 const generateReport = useCallback(async (projectId: string, projectName: string) => {
 setReportGenerating(projectId);
 try {
 const res = await fetch(`${API}/pm/analytics/portfolio/projects/${projectId}/report`, { headers: getHeaders() });
 const data = await res.json();
 if (data.success) {
 const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `${projectName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 }
 } catch (error) {
 console.error('Failed to generate report:', error);
 } finally {
 setReportGenerating(null);
 }
 }, []);

 const fetchAllData = useCallback(async () => {
 const headers = getHeaders();
 if (!headers.Authorization || headers.Authorization === 'Bearer null') {
 router.push('/login');
 return;
 }

 try {
 const [overviewRes, projectsRes, trendsRes, workloadRes] = await Promise.all([
 fetch(`${API}/pm/analytics/portfolio/overview`, { headers }),
 fetch(`${API}/pm/analytics/portfolio/projects`, { headers }),
 fetch(`${API}/pm/analytics/portfolio/trends?weeks=12`, { headers }),
 fetch(`${API}/pm/analytics/portfolio/team-workload`, { headers }),
 ]);

 const [overviewData, projectsData, trendsData, workloadData] = await Promise.all([
 overviewRes.json(),
 projectsRes.json(),
 trendsRes.json(),
 workloadRes.json(),
 ]);

 if (overviewData.success) setOverview(overviewData.data);
 if (projectsData.success) setProjects(projectsData.data.projects || []);
 if (trendsData.success) setTrends(trendsData.data.series || []);
 if (workloadData.success) setWorkload(workloadData.data.members || []);
 setLastUpdated(new Date());
 } catch (error) {
 console.error('Failed to fetch portfolio data:', error);
 } finally {
 setIsLoading(false);
 }
 }, [router]);

 // Socket for realtime updates
 const { isConnected } = usePortfolioSocket({
 onStatsUpdated: useCallback(() => {
 fetchAllData();
 }, [fetchAllData]),
 });

 useEffect(() => {
 fetchAllData();
 }, [fetchAllData]);

 // Fetch drilldown data on expand
 const toggleDrilldown = useCallback(async (projectId: string) => {
 if (expandedProject === projectId) {
 setExpandedProject(null);
 return;
 }
 setExpandedProject(projectId);

 if (drilldownData[projectId]) return;

 setDrilldownLoading(projectId);
 try {
 const res = await fetch(`${API}/pm/analytics/portfolio/projects/${projectId}/performance`, { headers: getHeaders() });
 const data = await res.json();
 if (data.success) {
 setDrilldownData((prev) => ({ ...prev, [projectId]: data.data }));
 }
 } catch (error) {
 console.error('Failed to fetch drilldown:', error);
 } finally {
 setDrilldownLoading(null);
 }
 }, [expandedProject, drilldownData]);

 // Sorted projects
 const sortedProjects = useMemo(() => {
 return [...projects].sort((a, b) => {
 let aVal: number, bVal: number;
 switch (sortField) {
 case 'name': return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
 case 'completionPct': aVal = a.completionPct; bVal = b.completionPct; break;
 case 'velocity': aVal = a.velocity; bVal = b.velocity; break;
 case 'overdue': aVal = a.tasks.overdue; bVal = b.tasks.overdue; break;
 default: aVal = a.completionPct; bVal = b.completionPct;
 }
 return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
 });
 }, [projects, sortField, sortDir]);

 const handleSort = (field: typeof sortField) => {
 if (sortField === field) {
 setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
 } else {
 setSortField(field);
 setSortDir('desc');
 }
 };

 // Trend chart dimensions
 const maxTrend = useMemo(() => Math.max(1, ...trends.map((t) => Math.max(t.created, t.completed))), [trends]);

 if (isLoading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-full">
 <div className="text-center">
 <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto mb-3" />
 <p className="text-muted-foreground">{t('portfolio.loading')}</p>
 </div>
 </div>
 </DashboardLayout>
 );
 }

 return (
 <DashboardLayout>
 <div className="flex flex-col h-full bg-muted/50">
 {/* Header */}
 <div className="bg-background border-b border-border px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-brand-soft rounded-lg">
 <BarChart3 className="h-6 w-6 text-brand" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground">{t('portfolio.title')}</h1>
 <p className="text-sm text-muted-foreground">{t('portfolio.subtitle')}</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 {/* Realtime indicator */}
 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
 {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
 {isConnected ? t('portfolio.connected') : t('portfolio.disconnected')}
 </div>
 <span className="text-xs text-muted-foreground">
 {t('portfolio.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
 </span>
 <button
 onClick={() => { setIsLoading(true); fetchAllData(); }}
 className="p-2 hover:bg-muted rounded-lg transition-colors"
 title={t('portfolio.refresh')}
 >
 <RefreshCw className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* KPI Cards */}
 {overview && <KPICards overview={overview} t={t} />}

 {/* Project Health Table */}
 <div className="bg-background rounded-xl border border-border overflow-hidden">
 <div className="px-6 py-4 border-b border-border">
 <h2 className="text-lg font-semibold text-foreground">{t('portfolio.projects.title')}</h2>
 </div>
 {sortedProjects.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
 <th className="px-6 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
 {t('portfolio.projects.name')} {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
 </th>
 <th className="px-4 py-3 text-start font-medium">Health</th>
 <th className="px-4 py-3 text-start font-medium">Priority</th>
 <th className="px-4 py-3 text-start font-medium">Owner</th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('completionPct')}>
 {t('portfolio.projects.completion')} {sortField === 'completionPct' && (sortDir === 'asc' ? '↑' : '↓')}
 </th>
 <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.timeline')}</th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('overdue')}>
 {t('portfolio.projects.overdue')} {sortField === 'overdue' && (sortDir === 'asc' ? '↑' : '↓')}
 </th>
 <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.members')}</th>
 <th className="px-4 py-3 text-start font-medium">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {sortedProjects.map((project) => (
 <ProjectRow
 key={project._id}
 project={project}
 isExpanded={expandedProject === project._id}
 onToggle={() => toggleDrilldown(project._id)}
 drilldown={drilldownData[project._id]}
 isLoadingDrilldown={drilldownLoading === project._id}
 onGenerateReport={() => generateReport(project._id, project.name)}
 isGeneratingReport={reportGenerating === project._id}
 t={t}
 />
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="px-6 py-12 text-center text-muted-foreground">
 <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
 <p>{t('portfolio.projects.noProjects')}</p>
 </div>
 )}
 </div>

 {/* Charts Row */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Weekly Trends */}
 <div className="bg-background rounded-xl border border-border p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('portfolio.trends.title')}</h3>
 {trends.length > 0 ? (
 <div>
 <div className="flex items-center gap-6 mb-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-brand" />
 <span className="text-xs text-muted-foreground">{t('portfolio.trends.created')}</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-success" />
 <span className="text-xs text-muted-foreground">{t('portfolio.trends.completed')}</span>
 </div>
 </div>
 <div className="flex items-end gap-1 h-48">
 {trends.map((point, i) => (
 <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
 <div
 className="flex-1 bg-brand rounded-t transition-all hover:bg-brand-strong"
 style={{ height: `${(point.created / maxTrend) * 100}%`, minHeight: point.created > 0 ? '4px' : '0px' }}
 title={`${t('portfolio.trends.created')}: ${point.created}`}
 />
 <div
 className="flex-1 bg-success/60 rounded-t transition-all hover:bg-success/80"
 style={{ height: `${(point.completed / maxTrend) * 100}%`, minHeight: point.completed > 0 ? '4px' : '0px' }}
 title={`${t('portfolio.trends.completed')}: ${point.completed}`}
 />
 </div>
 ))}
 </div>
 <div className="flex justify-between mt-2">
 <span className="text-[10px] text-muted-foreground">{trends[0]?.week}</span>
 <span className="text-[10px] text-muted-foreground">{trends[trends.length - 1]?.week}</span>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-center h-48 text-muted-foreground">
 <p>{t('portfolio.trends.noTrends')}</p>
 </div>
 )}
 </div>

 {/* Team Workload */}
 <div className="bg-background rounded-xl border border-border p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('portfolio.workload.title')}</h3>
 {workload.length > 0 ? (
 <div className="space-y-3 max-h-48 overflow-y-auto">
 {workload.slice(0, 10).map((member) => {
 const total = member.total || 1;
 return (
 <div key={member._id} className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-xs font-medium text-brand shrink-0">
 {(member.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
 <span className="text-xs text-muted-foreground shrink-0">{member.total} {t('portfolio.workload.assigned')}</span>
 </div>
 <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
 <div className="bg-success h-2" style={{ width: `${(member.done / total) * 100}%` }} />
 <div className="bg-brand h-2" style={{ width: `${(member.inProgress / total) * 100}%` }} />
 <div className="bg-warning/50 h-2" style={{ width: `${(member.todo / total) * 100}%` }} />
 {member.overdue > 0 && (
 <div className="bg-destructive h-2" style={{ width: `${(member.overdue / total) * 100}%` }} />
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="flex items-center justify-center h-48 text-muted-foreground">
 <p>{t('portfolio.workload.noMembers')}</p>
 </div>
 )}
 {workload.length > 0 && (
 <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-success" /><span className="text-[10px] text-muted-foreground">{t('portfolio.workload.completed')}</span></div>
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-brand" /><span className="text-[10px] text-muted-foreground">{t('portfolio.workload.inProgress')}</span></div>
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-warning/50" /><span className="text-[10px] text-muted-foreground">To Do</span></div>
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-destructive" /><span className="text-[10px] text-muted-foreground">{t('portfolio.workload.overdue')}</span></div>
 </div>
 )}
 </div>
 </div>

 {/* Timeline Health Summary */}
 {overview && (
 <div className="bg-background rounded-xl border border-border p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">{t('portfolio.timeline.title')}</h3>
 <div className="grid grid-cols-3 gap-4">
 <div className="bg-success-soft rounded-lg p-4 text-center">
 <p className="text-3xl font-bold text-success">{overview.timeline.onTime}</p>
 <p className="text-sm text-success">{t('portfolio.timeline.onTime')}</p>
 </div>
 <div className="bg-destructive-soft rounded-lg p-4 text-center">
 <p className="text-3xl font-bold text-destructive">{overview.timeline.overdue}</p>
 <p className="text-sm text-destructive">{t('portfolio.timeline.overdue')}</p>
 </div>
 <div className="bg-muted/50 rounded-lg p-4 text-center">
 <p className="text-3xl font-bold text-muted-foreground">{overview.timeline.noDeadline}</p>
 <p className="text-sm text-muted-foreground">{t('portfolio.timeline.noDeadline')}</p>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </DashboardLayout>
 );
}

// ─── KPI Cards Component ─────────────────────────────────────────────────────

function KPICards({ overview, t }: { overview: OverviewData; t: (key: string) => string }) {
 const kpis = [
 { label: t('portfolio.kpi.totalProjects'), value: overview.projects.total, sub: `${overview.projects.active} ${t('portfolio.kpi.activeProjects').toLowerCase()}`, icon: FolderKanban, color: 'bg-brand', iconBg: 'bg-brand-soft', iconColor: 'text-brand' },
 { label: t('portfolio.kpi.totalTasks'), value: overview.tasks.total, sub: `${overview.tasks.inProgress} ${t('portfolio.drilldown.inProgress').toLowerCase()}`, icon: Target, color: 'bg-info', iconBg: 'bg-info-soft', iconColor: 'text-info' },
 { label: t('portfolio.kpi.completionRate'), value: `${overview.tasks.completionRate}%`, sub: `${overview.tasks.done} ${t('portfolio.drilldown.done').toLowerCase()}`, icon: CheckCircle, color: 'bg-success', iconBg: 'bg-success-soft', iconColor: 'text-success', isGood: overview.tasks.completionRate >= 50 },
 { label: t('portfolio.kpi.overdueTasks'), value: overview.tasks.overdue, sub: null, icon: AlertTriangle, color: 'bg-destructive', iconBg: 'bg-destructive-soft', iconColor: 'text-destructive', isBad: overview.tasks.overdue > 0 },
 { label: t('portfolio.kpi.activeSprints'), value: overview.sprints.active, sub: `${overview.sprints.completed} ${t('portfolio.drilldown.completed').toLowerCase()}`, icon: Zap, color: 'bg-warning', iconBg: 'bg-warning-soft', iconColor: 'text-warning' },
 { label: t('portfolio.kpi.teamMembers'), value: overview.teamMembers, sub: null, icon: Users, color: 'bg-info', iconBg: 'bg-info-soft', iconColor: 'text-info' },
 { label: t('portfolio.kpi.storyPoints'), value: `${overview.storyPoints.completed}/${overview.storyPoints.total}`, sub: null, icon: TrendingUp, color: 'bg-success', iconBg: 'bg-success-soft', iconColor: 'text-success' },
 ];

 return (
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
 {kpis.map((kpi, i) => {
 const Icon = kpi.icon;
 return (
 <div key={i} className="bg-background rounded-xl p-4 border border-border hover:shadow-md transition-shadow">
 <div className="flex items-center justify-between mb-3">
 <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
 <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
 </div>
 {kpi.isGood !== undefined && (
 <span className={kpi.isGood ? 'text-success' : 'text-destructive'}>
 {kpi.isGood ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
 </span>
 )}
 {kpi.isBad && overview.tasks.overdue > 0 && (
 <span className="text-destructive"><AlertTriangle className="h-4 w-4" /></span>
 )}
 </div>
 <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
 {kpi.sub && <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>}
 </div>
 );
 })}
 </div>
 );
}

// ─── Project Row + Drilldown Component ───────────────────────────────────────

function ProjectRow({
 project,
 isExpanded,
 onToggle,
 drilldown,
 isLoadingDrilldown,
 onGenerateReport,
 isGeneratingReport,
 t,
}: {
 project: ProjectSummary;
 isExpanded: boolean;
 onToggle: () => void;
 drilldown?: DrilldownData;
 isLoadingDrilldown: boolean;
 onGenerateReport: () => void;
 isGeneratingReport: boolean;
 t: (key: string) => string;
}) {
 const completionColor = project.completionPct >= 70 ? 'text-success' : project.completionPct >= 40 ? 'text-warning' : 'text-destructive';
 const completionBg = project.completionPct >= 70 ? 'bg-success' : project.completionPct >= 40 ? 'bg-warning' : 'bg-destructive';
 const hc = healthColors[project.health] || healthColors.green;
 const pc = priorityColors[project.priority] || priorityColors.medium;

 const formatDate = (d: string | null) => {
 if (!d) return '—';
 return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
 };

 return (
 <>
 <tr
 className="hover:bg-muted/50 cursor-pointer transition-colors"
 onClick={onToggle}
 >
 {/* Name + Methodology + Escalation badge */}
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
 <div>
 <div className="flex items-center gap-2">
 <p className="font-medium text-foreground text-sm">{project.name}</p>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${methodologyColors[project.methodology] || 'bg-muted text-muted-foreground'}`}>
 {project.methodology}
 </span>
 {project.escalated && (
 <span className="relative group">
 <Shield className="h-3.5 w-3.5 text-destructive" />
 {project.escalationReason && (
 <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-foreground text-background text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
 {project.escalationReason}
 </span>
 )}
 </span>
 )}
 </div>
 <p className="text-xs text-muted-foreground">{project.key}</p>
 </div>
 </div>
 </td>

 {/* Health */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5">
 <div className={`w-2.5 h-2.5 rounded-full ${hc.dot}`} />
 <span className={`text-xs font-medium ${hc.text}`}>{hc.label}</span>
 </div>
 </td>

 {/* Priority */}
 <td className="px-4 py-3">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${pc.bg} ${pc.text}`}>
 {project.priority}
 </span>
 </td>

 {/* Owner */}
 <td className="px-4 py-3">
 {project.owner ? (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-brand-soft flex items-center justify-center text-[10px] font-medium text-brand shrink-0">
 {project.owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-medium text-foreground truncate">{project.owner.name}</p>
 <a
 href={`mailto:${project.owner.email}`}
 onClick={(e) => e.stopPropagation()}
 className="text-[10px] text-brand hover:underline flex items-center gap-0.5"
 >
 <Mail className="h-2.5 w-2.5" />
 Contact
 </a>
 </div>
 </div>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </td>

 {/* Completion */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-16 bg-muted rounded-full h-1.5">
 <div className={`h-1.5 rounded-full ${completionBg} transition-all`} style={{ width: `${project.completionPct}%` }} />
 </div>
 <span className={`text-sm font-medium ${completionColor}`}>{project.completionPct}%</span>
 </div>
 </td>

 {/* Timeline */}
 <td className="px-4 py-3">
 <div className="space-y-0.5">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${timelineStatusColors[project.timeline.status] || 'bg-muted text-muted-foreground'}`}>
 {t(`portfolio.projects.status.${project.timeline.status}`)}
 </span>
 <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
 <Calendar className="h-2.5 w-2.5" />
 <span>{formatDate(project.startDate)} → {formatDate(project.targetEndDate)}</span>
 </div>
 {project.timeline.daysRemaining !== null && (
 <span className="text-[10px] text-muted-foreground">
 {project.timeline.daysRemaining >= 0
 ? `${project.timeline.daysRemaining} ${t('portfolio.projects.daysLeft')}`
 : `${Math.abs(project.timeline.daysRemaining)} ${t('portfolio.projects.daysOverdue')}`}
 </span>
 )}
 </div>
 </td>

 {/* Overdue */}
 <td className="px-4 py-3">
 {project.tasks.overdue > 0 ? (
 <span className="text-sm font-medium text-destructive">{project.tasks.overdue}</span>
 ) : (
 <span className="text-sm text-muted-foreground">0</span>
 )}
 </td>

 {/* Members */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-1">
 <Users className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-sm text-muted-foreground">{project.memberCount}</span>
 </div>
 </td>

 {/* Actions */}
 <td className="px-4 py-3">
 <button
 onClick={(e) => { e.stopPropagation(); onGenerateReport(); }}
 disabled={isGeneratingReport}
 className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand bg-brand-surface hover:bg-brand-soft rounded-lg transition-colors disabled:opacity-50"
 title="Generate Report"
 >
 {isGeneratingReport ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Download className="h-3.5 w-3.5" />
 )}
 <FileText className="h-3.5 w-3.5" />
 </button>
 </td>
 </tr>

 {/* Drilldown Panel */}
 {isExpanded && (
 <tr>
 <td colSpan={9} className="bg-muted/50 px-6 py-4">
 {isLoadingDrilldown ? (
 <div className="flex items-center justify-center py-8">
 <RefreshCw className="h-5 w-5 text-brand animate-spin" />
 </div>
 ) : drilldown ? (
 <DrilldownPanel drilldown={drilldown} t={t} />
 ) : null}
 </td>
 </tr>
 )}
 </>
 );
}

// ─── Drilldown Panel ─────────────────────────────────────────────────────────

function DrilldownPanel({ drilldown, t }: { drilldown: DrilldownData; t: (key: string) => string }) {
 const { tasks, byPriority, velocityHistory, memberPerformance, recentActivity } = drilldown;

 // Donut chart
 const total = tasks.total || 1;
 const circumference = 2 * Math.PI * 35;
 const segments = [
 { label: t('portfolio.drilldown.done'), count: tasks.done, color: '#22c55e' },
 { label: t('portfolio.drilldown.inProgress'), count: tasks.inProgress, color: '#ffffff' },
 { label: t('portfolio.drilldown.todo'), count: tasks.todo, color: '#f59e0b' },
 ];
 let offset = 0;
 const donutSegs = segments.map((seg) => {
 const dash = (seg.count / total) * circumference;
 const result = { ...seg, dasharray: `${dash} ${circumference}`, dashoffset: -offset };
 offset += dash;
 return result;
 });

 // Velocity chart max
 const maxVel = Math.max(1, ...velocityHistory.map((v) => Math.max(v.planned, v.completed)));

 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Task Breakdown Donut */}
 <div className="bg-background rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3">{t('portfolio.drilldown.taskBreakdown')}</h4>
 <div className="flex items-center justify-center">
 <div className="relative w-28 h-28">
 <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
 <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="10" />
 {donutSegs.map((seg, i) => (
 <circle key={i} cx="40" cy="40" r="35" fill="none" stroke={seg.color} strokeWidth="10" strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset} />
 ))}
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center">
 <p className="text-lg font-bold text-foreground">{tasks.completionPct}%</p>
 </div>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-center gap-3 mt-3">
 {donutSegs.map((seg, i) => (
 <div key={i} className="flex items-center gap-1">
 <div className="w-2 h-2 rounded" style={{ backgroundColor: seg.color }} />
 <span className="text-[10px] text-muted-foreground">{seg.label} ({seg.count})</span>
 </div>
 ))}
 </div>
 </div>

 {/* Priority Distribution */}
 <div className="bg-background rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3">{t('portfolio.drilldown.priorityDistribution')}</h4>
 <div className="space-y-2.5">
 {[
 { key: 'critical', color: 'bg-destructive', label: t('portfolio.drilldown.critical') },
 { key: 'high', color: 'bg-warning', label: t('portfolio.drilldown.high') },
 { key: 'medium', color: 'bg-warning', label: t('portfolio.drilldown.medium') },
 { key: 'low', color: 'bg-success', label: t('portfolio.drilldown.low') },
 ].map((p) => {
 const count = byPriority[p.key] || 0;
 const pct = total > 0 ? (count / tasks.total) * 100 : 0;
 return (
 <div key={p.key}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs text-muted-foreground">{p.label}</span>
 <span className="text-xs font-medium text-foreground">{count}</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div className={`h-1.5 rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Velocity History */}
 <div className="bg-background rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3">{t('portfolio.drilldown.velocityHistory')}</h4>
 {velocityHistory.length > 0 ? (
 <div>
 <div className="flex items-end gap-1 h-24">
 {velocityHistory.map((v, i) => (
 <div key={i} className="flex-1 flex items-end gap-px h-full" title={`${v.name}: ${v.completed}/${v.planned}`}>
 <div className="flex-1 bg-brand-soft rounded-t" style={{ height: `${(v.planned / maxVel) * 100}%`, minHeight: v.planned > 0 ? '2px' : '0px' }} />
 <div className="flex-1 bg-success rounded-t" style={{ height: `${(v.completed / maxVel) * 100}%`, minHeight: v.completed > 0 ? '2px' : '0px' }} />
 </div>
 ))}
 </div>
 <div className="flex items-center gap-4 mt-2">
 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-brand-soft" /><span className="text-[10px] text-muted-foreground">{t('portfolio.drilldown.planned')}</span></div>
 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-success" /><span className="text-[10px] text-muted-foreground">{t('portfolio.drilldown.completed')}</span></div>
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">{t('portfolio.drilldown.noVelocity')}</div>
 )}
 </div>

 {/* Top Members */}
 <div className="bg-background rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3">{t('portfolio.drilldown.topMembers')}</h4>
 {memberPerformance.length > 0 ? (
 <div className="space-y-2">
 {memberPerformance.slice(0, 5).map((m) => (
 <div key={m.userId} className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-brand-soft flex items-center justify-center text-[10px] font-medium text-brand shrink-0">
 {(m.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <span className="text-xs text-foreground truncate">{m.name}</span>
 <span className="text-xs font-medium text-foreground">{m.completionRate}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1 mt-0.5">
 <div className="h-1 rounded-full bg-brand" style={{ width: `${m.completionRate}%` }} />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">{t('portfolio.drilldown.noMembers')}</div>
 )}
 </div>

 {/* Recent Activity (full width) */}
 <div className="bg-background rounded-lg p-4 border border-border md:col-span-2 lg:col-span-4">
 <h4 className="text-sm font-semibold text-foreground mb-3">{t('portfolio.drilldown.recentActivity')}</h4>
 {recentActivity.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
 {recentActivity.slice(0, 10).map((a) => {
 const actorName = a.actor?.profile?.firstName
 ? `${a.actor.profile.firstName} ${a.actor.profile?.lastName || ''}`.trim()
 : a.actor?.name || a.actor?.email || 'Unknown';
 return (
 <div key={a._id} className="flex items-start gap-2 text-xs">
 <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <span className="text-foreground">{a.description}</span>
 <span className="text-muted-foreground ms-1">— {actorName}</span>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground">{t('portfolio.drilldown.noActivity')}</p>
 )}
 </div>
 </div>
 );
}
