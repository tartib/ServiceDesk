'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 Clock,
 TrendingUp,
 TrendingDown,
 Activity,
 Layers,
 ArrowRight,
 AlertTriangle,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface CycleTimeData {
 column: string;
 avgTime: number;
 minTime: number;
 maxTime: number;
 itemsCount: number;
}

interface ThroughputData {
 week: string;
 completed: number;
 started: number;
}

interface WipData {
 column: string;
 count: number;
 limit: number;
}

interface BackendTask {
 _id: string;
 status: { name: string; category: string };
 createdAt: string;
 updatedAt: string;
 completedAt?: string;
 startDate?: string;
 dueDate?: string;
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

const computeMetrics = (tasks: BackendTask[]) => {
 const statusGroups: Record<string, BackendTask[]> = {};
 tasks.forEach(t => {
 const cat = t.status.category || 'todo';
 if (!statusGroups[cat]) statusGroups[cat] = [];
 statusGroups[cat].push(t);
 });

 const columnOrder = ['todo', 'in_progress', 'review', 'done'];
 const columnLabels: Record<string, string> = {
 todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
 };

 const cycleTime: CycleTimeData[] = columnOrder.map(cat => {
 const items = statusGroups[cat] || [];
 if (items.length === 0 || cat === 'done') {
 return { column: columnLabels[cat] || cat, avgTime: 0, minTime: 0, maxTime: 0, itemsCount: items.length };
 }
 const now = Date.now();
 const ages = items.map(t => (now - new Date(t.updatedAt || t.createdAt).getTime()) / (1000 * 60 * 60));
 return {
 column: columnLabels[cat] || cat,
 avgTime: Math.round(ages.reduce((s, a) => s + a, 0) / ages.length),
 minTime: Math.round(Math.min(...ages)),
 maxTime: Math.round(Math.max(...ages)),
 itemsCount: items.length,
 };
 });

 const now = new Date();
 const throughput: ThroughputData[] = [];
 for (let w = 3; w >= 0; w--) {
 const weekStart = new Date(now);
 weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
 const weekEnd = new Date(now);
 weekEnd.setDate(weekEnd.getDate() - w * 7);
 const completed = tasks.filter(t => {
 if (!t.completedAt) return false;
 const d = new Date(t.completedAt);
 return d >= weekStart && d < weekEnd;
 }).length;
 const started = tasks.filter(t => {
 const d = new Date(t.createdAt);
 return d >= weekStart && d < weekEnd;
 }).length;
 throughput.push({ week: `Week ${4 - w}`, completed, started });
 }

 const wip: WipData[] = ['todo', 'in_progress', 'review'].map(cat => ({
 column: columnLabels[cat] || cat,
 count: (statusGroups[cat] || []).length,
 limit: cat === 'todo' ? 15 : cat === 'in_progress' ? 5 : 4,
 }));

 return { cycleTime, throughput, wip };
};

export default function MetricsPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
 const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData[]>([]);
 const [throughputData, setThroughputData] = useState<ThroughputData[]>([]);
 const [wipData, setWipData] = useState<WipData[]>([]);

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, taskRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 }),
 fetch(`${API_URL}/pm/projects/${projectId}/tasks?limit=500`, {
 headers: { Authorization: `Bearer ${token}` },
 }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);

 const taskData = await taskRes.json();
 if (taskData.success) {
 const rawTasks: BackendTask[] = taskData.data.tasks || taskData.data || [];
 const metrics = computeMetrics(rawTasks);
 setCycleTimeData(metrics.cycleTime);
 setThroughputData(metrics.throughput);
 setWipData(metrics.wip);
 }
 } catch (error) {
 console.error('Failed to fetch metrics:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) {
 router.push('/login');
 return;
 }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const formatTime = (hours: number) => {
 if (hours < 24) return `${hours}h`;
 return `${(hours / 24).toFixed(1)}d`;
 };

 const getTotalCycleTime = () => {
 return cycleTimeData.reduce((sum, d) => sum + d.avgTime, 0);
 };

 const getAvgThroughput = () => {
 if (throughputData.length === 0) return 0;
 return Math.round(throughputData.reduce((sum, d) => sum + d.completed, 0) / throughputData.length);
 };

 const getWipStatus = () => {
 return wipData.filter(w => w.count >= w.limit).length;
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
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'kanban'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Activity className="h-5 w-5 text-brand" />
 <h2 className="text-lg font-semibold text-foreground">Kanban Metrics</h2>
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
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Key Metrics */}
 <div className="grid grid-cols-4 gap-4 mb-8">
 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Avg Cycle Time</span>
 <div className="p-2 rounded-lg bg-brand-soft">
 <Clock className="h-5 w-5 text-brand" />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground">{formatTime(getTotalCycleTime())}</p>
 <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
 <TrendingDown className="h-4 w-4 text-success" />
 -8h vs last period
 </p>
 </div>

 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Avg Throughput</span>
 <div className="p-2 rounded-lg bg-success-soft">
 <TrendingUp className="h-5 w-5 text-success" />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground">{getAvgThroughput()}/week</p>
 <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
 <TrendingUp className="h-4 w-4 text-success" />
 +2 vs last period
 </p>
 </div>

 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">WIP Items</span>
 <div className="p-2 rounded-lg bg-info-soft">
 <Layers className="h-5 w-5 text-info" />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground">{wipData.reduce((sum, w) => sum + w.count, 0)}</p>
 <p className="text-sm text-muted-foreground mt-1">Across all columns</p>
 </div>

 <div className="bg-background rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">WIP Limits Hit</span>
 <div className={`p-2 rounded-lg ${getWipStatus() > 0 ? 'bg-destructive-soft' : 'bg-success-soft'}`}>
 <AlertTriangle className={`h-5 w-5 ${getWipStatus() > 0 ? 'text-destructive' : 'text-success'}`} />
 </div>
 </div>
 <p className={`text-3xl font-bold ${getWipStatus() > 0 ? 'text-destructive' : 'text-success'}`}>
 {getWipStatus()}
 </p>
 <p className="text-sm text-muted-foreground mt-1">Columns at limit</p>
 </div>
 </div>

 {/* Cycle Time by Column */}
 <div className="bg-background rounded-xl border border-border mb-8">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">Cycle Time by Column</h3>
 </div>
 <div className="p-6">
 <div className="flex items-end gap-2">
 {cycleTimeData.filter(d => d.column !== 'Done').map((data, i, arr) => (
 <div key={data.column} className="flex-1 flex items-end gap-2">
 {/* Column */}
 <div className="flex-1">
 <div className="text-center mb-2">
 <p className="text-2xl font-bold text-foreground">{formatTime(data.avgTime)}</p>
 <p className="text-xs text-muted-foreground">avg</p>
 </div>
 <div
 className="w-full bg-brand rounded-t-lg transition-all"
 style={{ height: `${Math.max((data.avgTime / 50) * 150, 20)}px` }}
 />
 <div className="text-center mt-2">
 <p className="text-sm font-medium text-foreground">{data.column}</p>
 <p className="text-xs text-muted-foreground">{data.itemsCount} items</p>
 </div>
 </div>
 
 {/* Arrow */}
 {i < arr.length - 1 && (
 <ArrowRight className="h-5 w-5 text-muted-foreground mb-8" />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 {/* Throughput Chart */}
 <div className="bg-background rounded-xl border border-border">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">Weekly Throughput</h3>
 </div>
 <div className="p-6">
 <div className="flex items-end justify-around gap-4 h-48">
 {throughputData.map((data) => (
 <div key={data.week} className="flex-1 flex flex-col items-center">
 <div className="w-full flex gap-1 items-end justify-center h-36">
 <div
 className="w-8 bg-success rounded-t"
 style={{ height: `${(data.completed / 20) * 100}%` }}
 title={`Completed: ${data.completed}`}
 />
 <div
 className="w-8 bg-brand rounded-t"
 style={{ height: `${(data.started / 20) * 100}%` }}
 title={`Started: ${data.started}`}
 />
 </div>
 <span className="text-xs text-muted-foreground mt-2">{data.week}</span>
 </div>
 ))}
 </div>
 <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-success" />
 <span className="text-sm text-muted-foreground">Completed</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-brand" />
 <span className="text-sm text-muted-foreground">Started</span>
 </div>
 </div>
 </div>
 </div>

 {/* WIP Limits */}
 <div className="bg-background rounded-xl border border-border">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">WIP Limits</h3>
 </div>
 <div className="p-6">
 <div className="space-y-4">
 {wipData.map((data) => {
 const percentage = (data.count / data.limit) * 100;
 const isAtLimit = data.count >= data.limit;
 
 return (
 <div key={data.column}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium text-foreground">{data.column}</span>
 <span className={`text-sm font-medium ${isAtLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
 {data.count} / {data.limit}
 </span>
 </div>
 <div className="w-full bg-muted rounded-full h-3">
 <div
 className={`h-3 rounded-full transition-all ${
 isAtLimit ? 'bg-destructive' : percentage >= 80 ? 'bg-warning' : 'bg-success'
 }`}
 style={{ width: `${Math.min(percentage, 100)}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>

 {/* Cumulative Flow Diagram (Simplified) */}
 <div className="bg-background rounded-xl border border-border mt-6">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">Cumulative Flow (Last 4 Weeks)</h3>
 </div>
 <div className="p-6">
 <div className="relative h-48">
 {/* Simplified stacked area representation */}
 <svg viewBox="0 0 400 150" className="w-full h-full">
 {/* Done - Green */}
 <path
 d="M0,150 L0,100 L100,90 L200,70 L300,50 L400,30 L400,150 Z"
 fill="#22c55e"
 opacity="0.8"
 />
 {/* Testing - Yellow */}
 <path
 d="M0,100 L0,85 L100,78 L200,60 L300,42 L400,25 L400,30 L300,50 L200,70 L100,90 Z"
 fill="#eab308"
 opacity="0.8"
 />
 {/* Review - Purple */}
 <path
 d="M0,85 L0,70 L100,65 L200,50 L300,35 L400,20 L400,25 L300,42 L200,60 L100,78 Z"
 fill="#a855f7"
 opacity="0.8"
 />
 {/* In Progress - Blue */}
 <path
 d="M0,70 L0,50 L100,48 L200,38 L300,28 L400,15 L400,20 L300,35 L200,50 L100,65 Z"
 fill="#ffffff"
 opacity="0.8"
 />
 {/* To Do - Gray */}
 <path
 d="M0,50 L0,30 L100,32 L200,28 L300,22 L400,10 L400,15 L300,28 L200,38 L100,48 Z"
 fill="#9ca3af"
 opacity="0.8"
 />
 </svg>
 </div>
 <div className="flex items-center justify-center gap-6 mt-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-muted-foreground/30" />
 <span className="text-sm text-muted-foreground">To Do</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-brand" />
 <span className="text-sm text-muted-foreground">In Progress</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-info" />
 <span className="text-sm text-muted-foreground">Review</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-warning" />
 <span className="text-sm text-muted-foreground">Testing</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded bg-success" />
 <span className="text-sm text-muted-foreground">Done</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
