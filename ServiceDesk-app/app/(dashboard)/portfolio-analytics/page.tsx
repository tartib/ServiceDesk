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

interface ProjectSummary {
  _id: string;
  name: string;
  key: string;
  methodology: string;
  status: string;
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
  scrum: 'bg-blue-100 text-blue-700',
  kanban: 'bg-purple-100 text-purple-700',
  waterfall: 'bg-teal-100 text-teal-700',
  itil: 'bg-orange-100 text-orange-700',
  lean: 'bg-green-100 text-green-700',
  okr: 'bg-indigo-100 text-indigo-700',
};

const timelineStatusColors: Record<string, string> = {
  on_track: 'bg-green-100 text-green-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  no_deadline: 'bg-gray-100 text-gray-500',
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
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">{t('portfolio.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('portfolio.title')}</h1>
                <p className="text-sm text-gray-500">{t('portfolio.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Realtime indicator */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {isConnected ? t('portfolio.connected') : t('portfolio.disconnected')}
              </div>
              <span className="text-xs text-gray-400">
                {t('portfolio.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={() => { setIsLoading(true); fetchAllData(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('portfolio.refresh')}
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          {overview && <KPICards overview={overview} t={t} />}

          {/* Project Health Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{t('portfolio.projects.title')}</h2>
            </div>
            {sortedProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3 text-start font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                        {t('portfolio.projects.name')} {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.methodology')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.tasks')}</th>
                      <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('completionPct')}>
                        {t('portfolio.projects.completion')} {sortField === 'completionPct' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('velocity')}>
                        {t('portfolio.projects.velocity')} {sortField === 'velocity' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('overdue')}>
                        {t('portfolio.projects.overdue')} {sortField === 'overdue' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.timeline')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('portfolio.projects.members')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedProjects.map((project) => (
                      <ProjectRow
                        key={project._id}
                        project={project}
                        isExpanded={expandedProject === project._id}
                        onToggle={() => toggleDrilldown(project._id)}
                        drilldown={drilldownData[project._id]}
                        isLoadingDrilldown={drilldownLoading === project._id}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                <FolderKanban className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>{t('portfolio.projects.noProjects')}</p>
              </div>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trends */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('portfolio.trends.title')}</h3>
              {trends.length > 0 ? (
                <div>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span className="text-xs text-gray-500">{t('portfolio.trends.created')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-xs text-gray-500">{t('portfolio.trends.completed')}</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-48">
                    {trends.map((point, i) => (
                      <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                        <div
                          className="flex-1 bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                          style={{ height: `${(point.created / maxTrend) * 100}%`, minHeight: point.created > 0 ? '4px' : '0px' }}
                          title={`${t('portfolio.trends.created')}: ${point.created}`}
                        />
                        <div
                          className="flex-1 bg-green-400 rounded-t transition-all hover:bg-green-500"
                          style={{ height: `${(point.completed / maxTrend) * 100}%`, minHeight: point.completed > 0 ? '4px' : '0px' }}
                          title={`${t('portfolio.trends.completed')}: ${point.completed}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{trends[0]?.week}</span>
                    <span className="text-[10px] text-gray-400">{trends[trends.length - 1]?.week}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <p>{t('portfolio.trends.noTrends')}</p>
                </div>
              )}
            </div>

            {/* Team Workload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('portfolio.workload.title')}</h3>
              {workload.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {workload.slice(0, 10).map((member) => {
                    const total = member.total || 1;
                    return (
                      <div key={member._id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                          {(member.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 truncate">{member.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">{member.total} {t('portfolio.workload.assigned')}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
                            <div className="bg-green-500 h-2" style={{ width: `${(member.done / total) * 100}%` }} />
                            <div className="bg-blue-500 h-2" style={{ width: `${(member.inProgress / total) * 100}%` }} />
                            <div className="bg-yellow-400 h-2" style={{ width: `${(member.todo / total) * 100}%` }} />
                            {member.overdue > 0 && (
                              <div className="bg-red-500 h-2" style={{ width: `${(member.overdue / total) * 100}%` }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <p>{t('portfolio.workload.noMembers')}</p>
                </div>
              )}
              {workload.length > 0 && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-green-500" /><span className="text-[10px] text-gray-400">{t('portfolio.workload.completed')}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500" /><span className="text-[10px] text-gray-400">{t('portfolio.workload.inProgress')}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-yellow-400" /><span className="text-[10px] text-gray-400">To Do</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500" /><span className="text-[10px] text-gray-400">{t('portfolio.workload.overdue')}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Health Summary */}
          {overview && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('portfolio.timeline.title')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{overview.timeline.onTime}</p>
                  <p className="text-sm text-green-600">{t('portfolio.timeline.onTime')}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">{overview.timeline.overdue}</p>
                  <p className="text-sm text-red-600">{t('portfolio.timeline.overdue')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{overview.timeline.noDeadline}</p>
                  <p className="text-sm text-gray-500">{t('portfolio.timeline.noDeadline')}</p>
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
    { label: t('portfolio.kpi.totalProjects'), value: overview.projects.total, sub: `${overview.projects.active} ${t('portfolio.kpi.activeProjects').toLowerCase()}`, icon: FolderKanban, color: 'bg-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: t('portfolio.kpi.totalTasks'), value: overview.tasks.total, sub: `${overview.tasks.inProgress} ${t('portfolio.drilldown.inProgress').toLowerCase()}`, icon: Target, color: 'bg-purple-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: t('portfolio.kpi.completionRate'), value: `${overview.tasks.completionRate}%`, sub: `${overview.tasks.done} ${t('portfolio.drilldown.done').toLowerCase()}`, icon: CheckCircle, color: 'bg-green-500', iconBg: 'bg-green-100', iconColor: 'text-green-600', isGood: overview.tasks.completionRate >= 50 },
    { label: t('portfolio.kpi.overdueTasks'), value: overview.tasks.overdue, sub: null, icon: AlertTriangle, color: 'bg-red-500', iconBg: 'bg-red-100', iconColor: 'text-red-600', isBad: overview.tasks.overdue > 0 },
    { label: t('portfolio.kpi.activeSprints'), value: overview.sprints.active, sub: `${overview.sprints.completed} ${t('portfolio.drilldown.completed').toLowerCase()}`, icon: Zap, color: 'bg-orange-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: t('portfolio.kpi.teamMembers'), value: overview.teamMembers, sub: null, icon: Users, color: 'bg-indigo-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { label: t('portfolio.kpi.storyPoints'), value: `${overview.storyPoints.completed}/${overview.storyPoints.total}`, sub: null, icon: TrendingUp, color: 'bg-teal-500', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
              {kpi.isGood !== undefined && (
                <span className={kpi.isGood ? 'text-green-500' : 'text-red-500'}>
                  {kpi.isGood ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
              )}
              {kpi.isBad && overview.tasks.overdue > 0 && (
                <span className="text-red-500"><AlertTriangle className="h-4 w-4" /></span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            {kpi.sub && <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>}
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
  t,
}: {
  project: ProjectSummary;
  isExpanded: boolean;
  onToggle: () => void;
  drilldown?: DrilldownData;
  isLoadingDrilldown: boolean;
  t: (key: string) => string;
}) {
  const completionColor = project.completionPct >= 70 ? 'text-green-600' : project.completionPct >= 40 ? 'text-yellow-600' : 'text-red-600';
  const completionBg = project.completionPct >= 70 ? 'bg-green-500' : project.completionPct >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div>
              <p className="font-medium text-gray-900 text-sm">{project.name}</p>
              <p className="text-xs text-gray-400">{project.key}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodologyColors[project.methodology] || 'bg-gray-100 text-gray-600'}`}>
            {project.methodology}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-600 font-medium">{project.tasks.done}</span>
            <span className="text-gray-300">/</span>
            <span className="text-blue-600">{project.tasks.inProgress}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">{project.tasks.todo}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${completionBg} transition-all`} style={{ width: `${project.completionPct}%` }} />
            </div>
            <span className={`text-sm font-medium ${completionColor}`}>{project.completionPct}%</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-700">{project.velocity} {t('portfolio.projects.pts')}</span>
        </td>
        <td className="px-4 py-3">
          {project.tasks.overdue > 0 ? (
            <span className="text-sm font-medium text-red-600">{project.tasks.overdue}</span>
          ) : (
            <span className="text-sm text-gray-400">0</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${timelineStatusColors[project.timeline.status] || 'bg-gray-100 text-gray-500'}`}>
            {t(`portfolio.projects.status.${project.timeline.status}`)}
          </span>
          {project.timeline.daysRemaining !== null && (
            <span className="text-[10px] text-gray-400 ms-1">
              {project.timeline.daysRemaining >= 0
                ? `${project.timeline.daysRemaining} ${t('portfolio.projects.daysLeft')}`
                : `${Math.abs(project.timeline.daysRemaining)} ${t('portfolio.projects.daysOverdue')}`}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-600">{project.memberCount}</span>
          </div>
        </td>
      </tr>

      {/* Drilldown Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-4">
            {isLoadingDrilldown ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
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
    { label: t('portfolio.drilldown.inProgress'), count: tasks.inProgress, color: '#3b82f6' },
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
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('portfolio.drilldown.taskBreakdown')}</h4>
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
                <p className="text-lg font-bold text-gray-900">{tasks.completionPct}%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          {donutSegs.map((seg, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-gray-500">{seg.label} ({seg.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('portfolio.drilldown.priorityDistribution')}</h4>
        <div className="space-y-2.5">
          {[
            { key: 'critical', color: 'bg-red-500', label: t('portfolio.drilldown.critical') },
            { key: 'high', color: 'bg-orange-500', label: t('portfolio.drilldown.high') },
            { key: 'medium', color: 'bg-yellow-500', label: t('portfolio.drilldown.medium') },
            { key: 'low', color: 'bg-green-500', label: t('portfolio.drilldown.low') },
          ].map((p) => {
            const count = byPriority[p.key] || 0;
            const pct = total > 0 ? (count / tasks.total) * 100 : 0;
            return (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{p.label}</span>
                  <span className="text-xs font-medium text-gray-700">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Velocity History */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('portfolio.drilldown.velocityHistory')}</h4>
        {velocityHistory.length > 0 ? (
          <div>
            <div className="flex items-end gap-1 h-24">
              {velocityHistory.map((v, i) => (
                <div key={i} className="flex-1 flex items-end gap-px h-full" title={`${v.name}: ${v.completed}/${v.planned}`}>
                  <div className="flex-1 bg-blue-300 rounded-t" style={{ height: `${(v.planned / maxVel) * 100}%`, minHeight: v.planned > 0 ? '2px' : '0px' }} />
                  <div className="flex-1 bg-green-500 rounded-t" style={{ height: `${(v.completed / maxVel) * 100}%`, minHeight: v.completed > 0 ? '2px' : '0px' }} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-300" /><span className="text-[10px] text-gray-400">{t('portfolio.drilldown.planned')}</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500" /><span className="text-[10px] text-gray-400">{t('portfolio.drilldown.completed')}</span></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400 text-xs">{t('portfolio.drilldown.noVelocity')}</div>
        )}
      </div>

      {/* Top Members */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('portfolio.drilldown.topMembers')}</h4>
        {memberPerformance.length > 0 ? (
          <div className="space-y-2">
            {memberPerformance.slice(0, 5).map((m) => (
              <div key={m.userId} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700 shrink-0">
                  {(m.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700 truncate">{m.name}</span>
                    <span className="text-xs font-medium text-gray-900">{m.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                    <div className="h-1 rounded-full bg-blue-500" style={{ width: `${m.completionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400 text-xs">{t('portfolio.drilldown.noMembers')}</div>
        )}
      </div>

      {/* Recent Activity (full width) */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2 lg:col-span-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('portfolio.drilldown.recentActivity')}</h4>
        {recentActivity.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {recentActivity.slice(0, 10).map((a) => {
              const actorName = a.actor?.profile?.firstName
                ? `${a.actor.profile.firstName} ${a.actor.profile?.lastName || ''}`.trim()
                : a.actor?.name || a.actor?.email || 'Unknown';
              return (
                <div key={a._id} className="flex items-start gap-2 text-xs">
                  <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-700">{a.description}</span>
                    <span className="text-gray-400 ms-1">— {actorName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">{t('portfolio.drilldown.noActivity')}</p>
        )}
      </div>
    </div>
  );
}
