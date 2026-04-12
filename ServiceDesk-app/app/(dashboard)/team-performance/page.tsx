'use client';

import { API_URL } from '@/lib/api/config';
import { getOrganizationId } from '@/lib/api/organization-context';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
 Trophy,
 Users,
 Target,
 Zap,
 CheckCircle,
 Search,
 RefreshCw,
 ChevronDown,
 ChevronRight,
 AlertTriangle,
 TrendingUp,
 Clock,
 X,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const API = API_URL;

function getHeaders(): Record<string, string> {
 const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') : null;
 const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
 const orgId = getOrganizationId();
 if (orgId) headers['X-Organization-ID'] = orgId;
 return headers;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Summary {
 totalUsers: number;
 avgScore: number;
 totalPoints: number;
 totalTasksDone: number;
 totalGoalsAchieved: number;
}

interface UserPerf {
 _id: string;
 name: string;
 email: string;
 role: string;
 avatar: string | null;
 points: number;
 tasks: { done: number; open: number; inProgress: number; late: number };
 goals: { assigned: number; achieved: number; atRisk: number };
 score: number;
}

interface Pagination {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
}

interface DrilldownData {
 user: { _id: string; name: string; email: string; role: string; avatar: string | null };
 points: { earned: number; spent: number; bonus: number; penalty: number; byCategory: Record<string, number> };
 tasks: { total: number; done: number; late: number; open: number; inProgress: number; byPriority: Record<string, number> };
 goals: { _id: string; title: string; targetValue: number; currentValue: number; progressPct: number; status: string; dueDate: string | null; unit: string | null }[];
 projects: { _id: string; name: string; key: string; role: string; joinDate: string | null; tasks: { total: number; done: number }; points: number; goals: { total: number; achieved: number } }[];
 recentPoints: { _id: string; amount: number; type: string; category: string | null; description: string | null; createdAt: string }[];
}

// ─── Score color helpers ─────────────────────────────────────────────────────

function scoreColor(s: number) {
 if (s >= 70) return 'text-success';
 if (s >= 40) return 'text-warning';
 return 'text-destructive';
}

function scoreBg(s: number) {
 if (s >= 70) return 'bg-success';
 if (s >= 40) return 'bg-warning';
 return 'bg-destructive';
}

const goalStatusColors: Record<string, string> = {
 not_started: 'bg-muted text-muted-foreground',
 in_progress: 'bg-brand-soft text-brand',
 achieved: 'bg-success-soft text-success',
 at_risk: 'bg-warning-soft text-warning',
 missed: 'bg-destructive-soft text-destructive',
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TeamPerformancePage() {
 const router = useRouter();
 const [summary, setSummary] = useState<Summary | null>(null);
 const [users, setUsers] = useState<UserPerf[]>([]);
 const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // Filters
 const [search, setSearch] = useState('');
 const [sortField, setSortField] = useState('score');
 const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
 const [pageSize, setPageSize] = useState(25);

 // Drilldown
 const [expandedUser, setExpandedUser] = useState<string | null>(null);
 const [drilldownData, setDrilldownData] = useState<Record<string, DrilldownData>>({});
 const [drilldownLoading, setDrilldownLoading] = useState<string | null>(null);

 const fetchData = useCallback(async (page = 1) => {
 setIsLoading(true);
 setError(null);
 const headers = getHeaders();
 if (!headers.Authorization || headers.Authorization === 'Bearer null') {
 router.push('/login');
 return;
 }

 try {
 const params = new URLSearchParams({
 page: String(page),
 limit: String(pageSize),
 sort: sortField,
 sortDir,
 });
 if (search) params.set('q', search);

 const res = await fetch(`${API}/pm/team-performance/users?${params}`, { headers });
 const data = await res.json();
 if (data.success) {
 setSummary(data.data.summary);
 setUsers(data.data.users);
 setPagination(data.pagination);
 } else {
 setError(data.error || 'Failed to load data');
 }
 } catch {
 setError('Failed to load team performance data');
 } finally {
 setIsLoading(false);
 }
 }, [search, sortField, sortDir, pageSize, router]);

 useEffect(() => {
 fetchData(1);
 }, [fetchData]);

 const handleSort = useCallback((field: string) => {
 if (sortField === field) {
 setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
 } else {
 setSortField(field);
 setSortDir('desc');
 }
 }, [sortField]);

 const toggleDrilldown = useCallback(async (userId: string) => {
 if (expandedUser === userId) {
 setExpandedUser(null);
 return;
 }
 setExpandedUser(userId);
 if (drilldownData[userId]) return;

 setDrilldownLoading(userId);
 try {
 const res = await fetch(`${API}/pm/team-performance/users/${userId}`, { headers: getHeaders() });
 const data = await res.json();
 if (data.success) {
 setDrilldownData((prev) => ({ ...prev, [userId]: data.data }));
 }
 } catch {
 // silently fail
 } finally {
 setDrilldownLoading(null);
 }
 }, [expandedUser, drilldownData]);

 const sortArrow = (field: string) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

 return (
 <DashboardLayout>
 <div className="h-full flex flex-col bg-muted/50">
 {/* Header */}
 <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-info-soft rounded-lg">
 <Trophy className="h-5 w-5 text-info" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground">Team Performance</h1>
 <p className="text-sm text-muted-foreground">Track team members&apos; points, tasks, and goals</p>
 </div>
 </div>
 <button onClick={() => fetchData(pagination.page)} className="p-2 hover:bg-accent rounded-lg transition-colors">
 <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* Error Banner */}
 {error && (
 <div className="bg-destructive-soft border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-destructive" />
 <span className="text-sm text-destructive">{error}</span>
 </div>
 <button onClick={() => fetchData(1)} className="text-sm text-destructive hover:underline">Retry</button>
 </div>
 )}

 {/* Summary Cards */}
 {summary && (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {[
 { label: 'Team Members', value: summary.totalUsers, icon: Users, color: 'text-brand', bg: 'bg-brand-surface' },
 { label: 'Avg Score', value: `${summary.avgScore}%`, icon: TrendingUp, color: 'text-info', bg: 'bg-info-soft' },
 { label: 'Total Points', value: summary.totalPoints.toLocaleString(), icon: Zap, color: 'text-warning', bg: 'bg-warning-soft' },
 { label: 'Tasks Done', value: summary.totalTasksDone, icon: CheckCircle, color: 'text-success', bg: 'bg-success-soft' },
 { label: 'Goals Achieved', value: summary.totalGoalsAchieved, icon: Target, color: 'text-info', bg: 'bg-info-soft' },
 ].map((card) => (
 <div key={card.label} className="bg-card rounded-xl border border-border p-4">
 <div className="flex items-center gap-2 mb-2">
 <div className={`p-1.5 rounded-lg ${card.bg}`}>
 <card.icon className={`h-4 w-4 ${card.color}`} />
 </div>
 <span className="text-xs text-muted-foreground">{card.label}</span>
 </div>
 <p className="text-2xl font-bold text-foreground">{card.value}</p>
 </div>
 ))}
 </div>
 )}

 {/* Filters */}
 <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name or email..."
 className="w-full pl-9 pr-8 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
 />
 {search && (
 <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
 <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
 </button>
 )}
 </div>
 <select
 value={pageSize}
 onChange={(e) => setPageSize(Number(e.target.value))}
 className="text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-info"
 >
 <option value={25}>25 rows</option>
 <option value={50}>50 rows</option>
 <option value={100}>100 rows</option>
 </select>
 </div>

 {/* Users Table */}
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 {isLoading && users.length === 0 ? (
 <div className="flex items-center justify-center py-16">
 <RefreshCw className="h-6 w-6 text-info animate-spin" />
 </div>
 ) : users.length > 0 ? (
 <>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-muted text-xs text-muted-foreground uppercase tracking-wider">
 <th className="px-4 py-3 text-start font-medium w-8">#</th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
 Name{sortArrow('name')}
 </th>
 <th className="px-4 py-3 text-start font-medium">Role</th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('points')}>
 Points{sortArrow('points')}
 </th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('tasksDone')}>
 Tasks Done{sortArrow('tasksDone')}
 </th>
 <th className="px-4 py-3 text-start font-medium">Open / Late</th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('goalsAchieved')}>
 Goals{sortArrow('goalsAchieved')}
 </th>
 <th className="px-4 py-3 text-start font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('score')}>
 Score{sortArrow('score')}
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {users.map((u, idx) => (
 <UserRow
 key={u._id}
 user={u}
 rank={(pagination.page - 1) * pagination.limit + idx + 1}
 isExpanded={expandedUser === u._id}
 onToggle={() => toggleDrilldown(u._id)}
 drilldown={drilldownData[u._id]}
 isLoadingDrilldown={drilldownLoading === u._id}
 />
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {pagination.totalPages > 1 && (
 <div className="px-6 py-3 border-t border-border flex items-center justify-between">
 <span className="text-sm text-muted-foreground">
 Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
 </span>
 <div className="flex gap-1">
 {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
 <button
 key={p}
 onClick={() => fetchData(p)}
 className={`px-3 py-1 text-sm rounded ${p === pagination.page ? 'bg-info text-white' : 'text-muted-foreground hover:bg-accent'}`}
 >
 {p}
 </button>
 ))}
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="px-6 py-16 text-center text-muted-foreground">
 <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
 <p>No users found</p>
 {search && (
 <button onClick={() => setSearch('')} className="mt-2 text-sm text-info hover:underline">
 Reset filters
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}

// ─── User Row Component ─────────────────────────────────────────────────────

function UserRow({
 user,
 rank,
 isExpanded,
 onToggle,
 drilldown,
 isLoadingDrilldown,
}: {
 user: UserPerf;
 rank: number;
 isExpanded: boolean;
 onToggle: () => void;
 drilldown?: DrilldownData;
 isLoadingDrilldown: boolean;
}) {
 return (
 <>
 <tr className="hover:bg-accent cursor-pointer transition-colors" onClick={onToggle}>
 <td className="px-4 py-3 text-sm text-muted-foreground font-medium">{rank}</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2.5">
 {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
 <div className="w-8 h-8 rounded-full bg-info-soft flex items-center justify-center text-xs font-medium text-info shrink-0">
 {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="font-medium text-foreground text-sm truncate">{user.name}</p>
 <p className="text-xs text-muted-foreground truncate">{user.email}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground capitalize">
 {user.role.replace(/_/g, ' ')}
 </span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1">
 <Zap className="h-3.5 w-3.5 text-warning" />
 <span className="text-sm font-medium text-foreground">{user.points.toLocaleString()}</span>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className="text-sm font-medium text-success">{user.tasks.done}</span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2 text-xs">
 <span className="text-muted-foreground">{user.tasks.open + user.tasks.inProgress}</span>
 {user.tasks.late > 0 && (
 <span className="text-destructive font-medium flex items-center gap-0.5">
 <Clock className="h-3 w-3" />
 {user.tasks.late}
 </span>
 )}
 </div>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5 text-xs">
 <span className="text-success font-medium">{user.goals.achieved}</span>
 <span className="text-muted-foreground/50">/</span>
 <span className="text-muted-foreground">{user.goals.assigned}</span>
 {user.goals.atRisk > 0 && (
 <span className="text-warning font-medium ms-1">({user.goals.atRisk} at risk)</span>
 )}
 </div>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-12 bg-muted rounded-full h-1.5">
 <div className={`h-1.5 rounded-full ${scoreBg(user.score)} transition-all`} style={{ width: `${user.score}%` }} />
 </div>
 <span className={`text-sm font-bold ${scoreColor(user.score)}`}>{user.score}</span>
 </div>
 </td>
 </tr>

 {/* Drilldown */}
 {isExpanded && (
 <tr>
 <td colSpan={8} className="bg-muted px-6 py-4">
 {isLoadingDrilldown ? (
 <div className="flex items-center justify-center py-8">
 <RefreshCw className="h-5 w-5 text-info animate-spin" />
 </div>
 ) : drilldown ? (
 <DrilldownPanel data={drilldown} />
 ) : null}
 </td>
 </tr>
 )}
 </>
 );
}

// ─── Drilldown Panel ─────────────────────────────────────────────────────────

function DrilldownPanel({ data }: { data: DrilldownData }) {
 const { points, tasks, goals } = data;
 const netPoints = points.earned + points.bonus - points.spent - points.penalty;

 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Points Breakdown */}
 <div className="bg-card rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
 <Zap className="h-4 w-4 text-warning" /> Points Breakdown
 </h4>
 <div className="space-y-2">
 {[
 { label: 'Earned', value: points.earned, color: 'text-success' },
 { label: 'Bonus', value: points.bonus, color: 'text-brand' },
 { label: 'Spent', value: points.spent, color: 'text-warning' },
 { label: 'Penalty', value: points.penalty, color: 'text-destructive' },
 ].map((row) => (
 <div key={row.label} className="flex justify-between text-sm">
 <span className="text-muted-foreground">{row.label}</span>
 <span className={`font-medium ${row.color}`}>{row.value.toLocaleString()}</span>
 </div>
 ))}
 <div className="border-t pt-2 flex justify-between text-sm font-bold">
 <span className="text-foreground">Net</span>
 <span className={netPoints >= 0 ? 'text-success' : 'text-destructive'}>{netPoints.toLocaleString()}</span>
 </div>
 </div>
 {Object.keys(points.byCategory).length > 0 && (
 <div className="mt-3 pt-3 border-t">
 <p className="text-xs text-muted-foreground mb-2">By Category</p>
 {Object.entries(points.byCategory).map(([cat, val]) => (
 <div key={cat} className="flex justify-between text-xs mb-1">
 <span className="text-muted-foreground capitalize">{cat.replace(/_/g, ' ')}</span>
 <span className="font-medium text-foreground">{val}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Tasks Summary */}
 <div className="bg-card rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
 <CheckCircle className="h-4 w-4 text-success" /> Tasks Summary
 </h4>
 <div className="grid grid-cols-2 gap-3 mb-3">
 {[
 { label: 'Done', value: tasks.done, color: 'text-success bg-success-soft' },
 { label: 'In Progress', value: tasks.inProgress, color: 'text-brand bg-brand-surface' },
 { label: 'Open', value: tasks.open, color: 'text-muted-foreground bg-muted/50' },
 { label: 'Late', value: tasks.late, color: 'text-destructive bg-destructive-soft' },
 ].map((s) => (
 <div key={s.label} className={`rounded-lg p-2.5 text-center ${s.color}`}>
 <p className="text-lg font-bold">{s.value}</p>
 <p className="text-[10px] uppercase tracking-wider">{s.label}</p>
 </div>
 ))}
 </div>
 {Object.keys(tasks.byPriority).length > 0 && (
 <div className="pt-2 border-t">
 <p className="text-xs text-muted-foreground mb-2">Done by Priority</p>
 {Object.entries(tasks.byPriority).map(([pri, count]) => (
 <div key={pri} className="flex justify-between text-xs mb-1">
 <span className="text-muted-foreground capitalize">{pri}</span>
 <span className="font-medium text-foreground">{count as number}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Goals */}
 <div className="bg-card rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
 <Target className="h-4 w-4 text-info" /> Goals ({goals.length})
 </h4>
 {goals.length > 0 ? (
 <div className="space-y-3 max-h-64 overflow-y-auto">
 {goals.map((g) => (
 <div key={g._id} className="border border-border rounded-lg p-2.5">
 <div className="flex items-start justify-between mb-1.5">
 <p className="text-xs font-medium text-foreground truncate flex-1">{g.title}</p>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ms-2 ${goalStatusColors[g.status] || 'bg-muted text-muted-foreground'}`}>
 {g.status.replace(/_/g, ' ')}
 </span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5 mb-1">
 <div
 className={`h-1.5 rounded-full transition-all ${g.progressPct >= 100 ? 'bg-success' : g.progressPct >= 50 ? 'bg-brand' : 'bg-warning'}`}
 style={{ width: `${Math.min(100, g.progressPct)}%` }}
 />
 </div>
 <div className="flex justify-between text-[10px] text-muted-foreground">
 <span>{g.currentValue}/{g.targetValue} {g.unit || ''}</span>
 <span>{g.progressPct}%</span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground text-center py-4">No goals assigned</p>
 )}
 </div>

 {/* Projects */}
 <div className="bg-card rounded-lg p-4 border border-border">
 <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
 <Users className="h-4 w-4 text-brand" /> Projects ({data.projects?.length || 0})
 </h4>
 {data.projects && data.projects.length > 0 ? (
 <div className="space-y-3 max-h-64 overflow-y-auto">
 {data.projects.map((p) => (
 <div key={p._id} className="border border-border rounded-lg p-2.5">
 <div className="flex items-start justify-between mb-1.5">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
 <p className="text-[10px] text-muted-foreground">{p.key}</p>
 </div>
 <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ms-2 bg-muted text-muted-foreground capitalize">
 {p.role}
 </span>
 </div>
 <div className="grid grid-cols-3 gap-2 text-center mt-2">
 <div className="bg-muted/50 rounded p-1">
 <p className="text-xs font-medium text-foreground">{p.tasks?.done || 0}/{p.tasks?.total || 0}</p>
 <p className="text-[9px] text-muted-foreground">Tasks</p>
 </div>
 <div className="bg-muted/50 rounded p-1">
 <p className="text-xs font-medium text-warning">{p.points || 0}</p>
 <p className="text-[9px] text-muted-foreground">Points</p>
 </div>
 <div className="bg-muted/50 rounded p-1">
 <p className="text-xs font-medium text-info">{p.goals?.achieved || 0}/{p.goals?.total || 0}</p>
 <p className="text-[9px] text-muted-foreground">Goals</p>
 </div>
 </div>
 {p.joinDate && (
 <p className="text-[10px] text-muted-foreground mt-1.5">
 Joined: {new Date(p.joinDate).toLocaleDateString()}
 </p>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground text-center py-4">No projects assigned</p>
 )}
 </div>
 </div>
 );
}
