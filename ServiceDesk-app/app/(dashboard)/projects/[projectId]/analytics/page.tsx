'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  Clock,
  Target,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Timer,
  AlertCircle,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

const API = 'http://localhost:5000/api/v1';

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface Task {
  _id: string;
  title: string;
  status: { id: string; name: string; category: string };
  priority: string;
  type: string;
  storyPoints?: number;
  assignee?: {
    _id: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  sprintId?: string | { _id: string; name?: string; status?: string };
}

interface SprintData {
  _id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  stats?: { totalTasks: number; completedTasks: number; totalPoints: number; completedPoints: number };
  velocity?: number | { planned?: number; completed?: number };
}

interface MemberData {
  userId: {
    _id: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
  };
  role: string;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { methodology } = useMethodology(projectId);
  const isScrum = methodology === 'scrum';

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<SprintData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const fetches = [
        fetch(`${API}/pm/projects/${projectId}`, { headers }),
        fetch(`${API}/pm/projects/${projectId}/tasks?limit=500`, { headers }),
        fetch(`${API}/pm/projects/${projectId}/members`, { headers }),
      ];
      if (isScrum) {
        fetches.push(fetch(`${API}/pm/projects/${projectId}/sprints`, { headers }));
      }

      const responses = await Promise.all(fetches);
      const [projData, taskData, memberData] = await Promise.all(
        responses.slice(0, 3).map(r => r.json())
      );

      if (projData.success) setProject(projData.data.project);
      if (taskData.success) setTasks(taskData.data.tasks || taskData.data || []);
      if (memberData.success) setMembers(memberData.data.members || []);

      if (isScrum && responses[3]) {
        const sprintData = await responses[3].json();
        if (sprintData.success) setSprints(sprintData.data.sprints || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router, isScrum]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Default to active sprint on first load only (Scrum only)
  const hasInitializedSprints = useRef(false);
  useEffect(() => {
    if (isScrum && sprints.length > 0 && !hasInitializedSprints.current) {
      hasInitializedSprints.current = true;
      const active = sprints.find(s => s.status === 'active');
      if (active) setSelectedSprintIds([active._id]);
    }
  }, [isScrum, sprints]);

  // Toggle sprint selection
  const toggleSprint = (id: string) => {
    setSelectedSprintIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Helper to extract sprint ID (handles both populated object and plain string)
  const getSprintId = (task: Task): string | null => {
    if (!task.sprintId) return null;
    if (typeof task.sprintId === 'object') return task.sprintId._id;
    return task.sprintId;
  };

  // Filter tasks by selected sprints
  const filteredTasks = useMemo(() => {
    if (selectedSprintIds.length === 0) return tasks;
    return tasks.filter(t => {
      const sid = getSprintId(t);
      return sid && selectedSprintIds.includes(sid);
    });
  }, [tasks, selectedSprintIds]);

  // Compute metrics
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status.category === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status.category === 'in_progress').length;
    const todo = filteredTasks.filter(t => t.status.category === 'todo').length;
    const totalPoints = filteredTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
    const completedPoints = filteredTasks.filter(t => t.status.category === 'done').reduce((s, t) => s + (t.storyPoints || 0), 0);

    const activeSprint = sprints.find(s => s.status === 'active');
    const completedSprints = sprints.filter(s => s.status === 'completed');

    // Velocity from last completed sprint
    const lastSprint = completedSprints[completedSprints.length - 1];
    const velocity = lastSprint?.stats?.completedPoints || 0;

    // Sprint progress
    let sprintProgress = 0;
    if (activeSprint?.stats) {
      const { totalTasks, completedTasks } = activeSprint.stats;
      sprintProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    // Days remaining in active sprint
    let sprintDaysLeft = 0;
    if (activeSprint) {
      sprintDaysLeft = Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    // Tasks completed in period
    const daysMap = { week: 7, month: 30, quarter: 90 };
    const cutoff = new Date(Date.now() - daysMap[timeRange] * 24 * 60 * 60 * 1000);
    const completedInPeriod = filteredTasks.filter(t => t.status.category === 'done' && t.completedAt && new Date(t.completedAt) >= cutoff).length;
    const createdInPeriod = filteredTasks.filter(t => new Date(t.createdAt) >= cutoff).length;

    // Priority breakdown
    const byPriority = {
      critical: filteredTasks.filter(t => t.priority === 'critical').length,
      high: filteredTasks.filter(t => t.priority === 'high').length,
      medium: filteredTasks.filter(t => t.priority === 'medium').length,
      low: filteredTasks.filter(t => t.priority === 'low').length,
    };

    // Type breakdown
    const byType: Record<string, number> = {};
    filteredTasks.forEach(t => { byType[t.type] = (byType[t.type] || 0) + 1; });

    return {
      total, done, inProgress, todo, totalPoints, completedPoints,
      velocity, sprintProgress, sprintDaysLeft, activeSprint,
      completedInPeriod, createdInPeriod, byPriority, byType,
      memberCount: members.length,
      completedSprints: completedSprints.length,
    };
  }, [filteredTasks, sprints, members, timeRange]);

  // Chart data: per-sprint when sprints selected, otherwise last 4 weeks
  const chartData = useMemo(() => {
    if (selectedSprintIds.length > 0) {
      // Per-sprint bars
      return selectedSprintIds.map(sid => {
        const sprint = sprints.find(s => s._id === sid);
        const sprintTasks = tasks.filter(t => getSprintId(t) === sid);
        const completed = sprintTasks.filter(t => t.status.category === 'done').length;
        const created = sprintTasks.length;
        return { label: sprint?.name || 'Sprint', completed, created };
      });
    }
    // Fallback: last 4 weeks
    const weeks: { label: string; completed: number; created: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const completed = filteredTasks.filter(t =>
        t.status.category === 'done' && t.completedAt &&
        new Date(t.completedAt) >= weekStart && new Date(t.completedAt) < weekEnd
      ).length;
      const created = filteredTasks.filter(t =>
        new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
      ).length;
      weeks.push({ label: `Week ${4 - i}`, completed, created });
    }
    return weeks;
  }, [filteredTasks, tasks, sprints, selectedSprintIds]);

  const maxChartVal = Math.max(1, ...chartData.map(w => Math.max(w.completed, w.created)));

  // Team performance
  const teamPerformance = useMemo(() => {
    const now = new Date();
    const memberMap: Record<string, {
      name: string; initials: string; tasks: number; points: number; completed: number;
      completedPoints: number; inProgress: number; overdue: number;
      earliestTask: Date | null;
    }> = {};
    filteredTasks.forEach(t => {
      if (!t.assignee) return;
      const id = t.assignee._id;
      if (!memberMap[id]) {
        const p = t.assignee.profile;
        const first = p?.firstName || '';
        const last = p?.lastName || '';
        const name = (first + ' ' + last).trim() || t.assignee.name || t.assignee.email || 'Unknown';
        const initials = (first[0] || '') + (last[0] || '') || name.slice(0, 2).toUpperCase();
        memberMap[id] = { name, initials, tasks: 0, points: 0, completed: 0, completedPoints: 0, inProgress: 0, overdue: 0, earliestTask: null };
      }
      memberMap[id].tasks++;
      memberMap[id].points += t.storyPoints || 0;
      if (t.status.category === 'done') {
        memberMap[id].completed++;
        memberMap[id].completedPoints += t.storyPoints || 0;
      }
      if (t.status.category === 'in_progress') memberMap[id].inProgress++;
      if (t.dueDate && new Date(t.dueDate) < now && t.status.category !== 'done') memberMap[id].overdue++;
      const created = new Date(t.createdAt);
      if (!memberMap[id].earliestTask || created < memberMap[id].earliestTask!) memberMap[id].earliestTask = created;
    });

    return Object.values(memberMap).map(m => {
      const completionRate = m.tasks > 0 ? Math.round((m.completed / m.tasks) * 100) : 0;
      const estimatedHours = m.completedPoints * 4;
      const weeksActive = m.earliestTask ? Math.max(1, Math.ceil((now.getTime() - m.earliestTask.getTime()) / (7 * 24 * 60 * 60 * 1000))) : 1;
      const avgPerWeek = Math.round((m.completed / weeksActive) * 10) / 10;
      return { ...m, completionRate, estimatedHours, avgPerWeek };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredTasks]);

  // Donut chart segments
  const donutSegments = useMemo(() => {
    const total = stats.total || 1;
    const circumference = 2 * Math.PI * 40; // ~251.2
    const segments = [
      { label: 'Done', count: stats.done, color: '#22c55e', pct: Math.round((stats.done / total) * 100) },
      { label: 'In Progress', count: stats.inProgress, color: '#3b82f6', pct: Math.round((stats.inProgress / total) * 100) },
      { label: 'To Do', count: stats.todo, color: '#f59e0b', pct: Math.round((stats.todo / total) * 100) },
    ];
    let offset = 0;
    return segments.map(seg => {
      const dash = (seg.count / total) * circumference;
      const result = { ...seg, dasharray: `${dash} ${circumference}`, dashoffset: -offset };
      offset += dash;
      return result;
    });
  }, [stats]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectHeader projectKey={project?.key} projectName={project?.name} projectId={projectId} />
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Sprint Filter (Scrum only) */}
        {isScrum && sprints.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sprints:</span>
            <button
              onClick={() => setSelectedSprintIds([])}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSprintIds.length === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {sprints.map((sprint) => {
              const isSelected = selectedSprintIds.includes(sprint._id);
              const statusDot = sprint.status === 'active' ? 'bg-green-400' : sprint.status === 'completed' ? 'bg-gray-400' : 'bg-blue-400';
              return (
                <button
                  key={sprint._id}
                  onClick={() => toggleSprint(sprint._id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : statusDot}`} />
                  {sprint.name}
                </button>
              );
            })}
            {selectedSprintIds.length > 0 && (
              <span className="text-xs text-gray-400 ms-1">
                {filteredTasks.length} tasks
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'bg-gray-500' },
            { label: 'Completed', value: stats.done, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-blue-500' },
            { label: 'To Do', value: stats.todo, icon: AlertTriangle, color: 'bg-yellow-500' },
            { label: 'Team Members', value: stats.memberCount, icon: Users, color: 'bg-purple-500' },
            ...(methodology === 'scrum' ? [
              { label: 'Velocity', value: `${stats.velocity} pts`, icon: Zap, color: 'bg-orange-500' },
            ] : [
              { label: 'Story Points', value: `${stats.completedPoints}/${stats.totalPoints}`, icon: Target, color: 'bg-orange-500' },
            ]),
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.label}</p>
              </div>
            );
          })}
        </div>

        {/* Sprint Info (if scrum) */}
        {methodology === 'scrum' && stats.activeSprint && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Active Sprint: {stats.activeSprint.name}</h3>
              <span className="text-sm text-gray-500">{stats.sprintDaysLeft} days remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${stats.sprintProgress}%` }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">{stats.sprintProgress}% complete</p>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Completion Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Task Completion Trend</h3>
            <div className="h-64 flex items-end justify-around gap-4">
              {chartData.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end justify-center h-48">
                    <div
                      className="w-8 bg-green-500 rounded-t transition-all"
                      style={{ height: `${(week.completed / maxChartVal) * 100}%`, minHeight: week.completed > 0 ? '8px' : '0' }}
                      title={`Completed: ${week.completed}`}
                    />
                    <div
                      className="w-8 bg-blue-500 rounded-t transition-all"
                      style={{ height: `${(week.created / maxChartVal) * 100}%`, minHeight: week.created > 0 ? '8px' : '0' }}
                      title={`Created: ${week.created}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{week.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-sm text-gray-600">Created</span>
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Task Distribution</h3>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  {donutSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="20"
                      strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm text-gray-600">{seg.label} ({seg.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Breakdown + Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Critical', count: stats.byPriority.critical, color: 'bg-red-500' },
                { label: 'High', count: stats.byPriority.high, color: 'bg-orange-500' },
                { label: 'Medium', count: stats.byPriority.medium, color: 'bg-yellow-500' },
                { label: 'Low', count: stats.byPriority.low, color: 'bg-green-500' },
              ].map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{p.label}</span>
                    <span className="text-sm text-gray-500">{p.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${stats.total > 0 ? (p.count / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Task Types</h3>
            <div className="space-y-3">
              {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count], i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Performance */}
        {teamPerformance.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Team Performance</h3>
              <span className="text-sm text-gray-500">{teamPerformance.length} members</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teamPerformance.map((member, i) => {
                const rateColor = member.completionRate >= 75 ? 'text-green-600' : member.completionRate >= 40 ? 'text-yellow-600' : 'text-red-500';
                const rateBg = member.completionRate >= 75 ? 'bg-green-500' : member.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500';
                const ringColor = member.completionRate >= 75 ? '#22c55e' : member.completionRate >= 40 ? '#eab308' : '#ef4444';
                const circumference = 2 * Math.PI * 18;
                const strokeDash = (member.completionRate / 100) * circumference;

                return (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <svg width="48" height="48" className="-rotate-90">
                          <circle cx="24" cy="24" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                          <circle cx="24" cy="24" r="18" fill="none" stroke={ringColor} strokeWidth="4"
                            strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-gray-700">{member.initials}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className={`text-sm font-medium ${rateColor}`}>{member.completionRate}% completion</p>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-[11px] text-gray-500">Completed</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{member.completed}<span className="text-sm font-normal text-gray-400">/{member.tasks}</span></p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Target className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-[11px] text-gray-500">Points</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{member.completedPoints}<span className="text-sm font-normal text-gray-400">/{member.points}</span></p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Timer className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-[11px] text-gray-500">Est. Hours</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{member.estimatedHours}<span className="text-sm font-normal text-gray-400">h</span></p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="text-[11px] text-gray-500">Avg/Week</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{member.avgPerWeek}</p>
                      </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs text-gray-600">{member.inProgress} active</span>
                      </div>
                      {member.overdue > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs text-red-600">{member.overdue} overdue</span>
                        </div>
                      )}
                      <div className="flex-1" />
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${rateBg}`} style={{ width: `${member.completionRate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sprint History (if scrum) */}
        {methodology === 'scrum' && sprints.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Sprint History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Sprint</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Tasks</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Points</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {sprints.map((sprint) => (
                    <tr key={sprint._id} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-900">{sprint.name}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sprint.status === 'active' ? 'bg-green-100 text-green-700' :
                          sprint.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {sprint.status}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {sprint.stats ? `${sprint.stats.completedTasks}/${sprint.stats.totalTasks}` : '-'}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {sprint.stats ? `${sprint.stats.completedPoints}/${sprint.stats.totalPoints}` : '-'}
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
