'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 ChevronLeft,
 ChevronRight,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface GanttTask {
 id: string;
 name: string;
 key?: string;
 startDate: string;
 endDate: string;
 progress: number;
 assignee?: string;
 color?: string;
 statusCategory?: string;
}

interface BackendTask {
 _id: string;
 key: string;
 title: string;
 startDate?: string;
 dueDate?: string;
 status: { name: string; category: string };
 assignee?: { profile?: { firstName: string; lastName: string } };
 storyPoints?: number;
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

const statusColorMap: Record<string, string> = {
 todo: '#94a3b8',
 in_progress: '#ffffff',
 review: '#8b5cf6',
 done: '#10b981',
};

const mapTaskToGantt = (t: BackendTask): GanttTask | null => {
 if (!t.startDate && !t.dueDate) return null;
 const now = new Date().toISOString().split('T')[0];
 const start = t.startDate || t.dueDate || now;
 const end = t.dueDate || t.startDate || now;
 const assignee = t.assignee?.profile
 ? `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}`.trim()
 : undefined;
 const progress = t.status.category === 'done' ? 100 : t.status.category === 'in_progress' ? 50 : 0;
 return {
 id: t._id,
 name: `${t.key}: ${t.title}`,
 key: t.key,
 startDate: start,
 endDate: end,
 progress,
 assignee,
 color: statusColorMap[t.status.category] || '#94a3b8',
 statusCategory: t.status.category,
 };
};

export default function GanttPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [tasks, setTasks] = useState<GanttTask[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');
 const [startDate, setStartDate] = useState(new Date());
 const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
 const [editStart, setEditStart] = useState('');
 const [editEnd, setEditEnd] = useState('');
 const [saving, setSaving] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, taskRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 }),
 fetch(`${API_URL}/pm/projects/${projectId}/tasks?limit=200`, {
 headers: { Authorization: `Bearer ${token}` },
 }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);

 const taskData = await taskRes.json();
 if (taskData.success) {
 const rawTasks: BackendTask[] = taskData.data.tasks || taskData.data || [];
 const ganttItems = rawTasks.map(mapTaskToGantt).filter(Boolean) as GanttTask[];
 ganttItems.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
 setTasks(ganttItems);
 if (ganttItems.length > 0) {
 const earliest = new Date(ganttItems[0].startDate);
 earliest.setDate(earliest.getDate() - 3);
 setStartDate(earliest);
 }
 }
 } catch (error) {
 console.error('Failed to fetch gantt data:', error);
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

 const openEditModal = (task: GanttTask) => {
 setEditingTask(task);
 setEditStart(task.startDate);
 setEditEnd(task.endDate);
 };

 const handleSaveDates = async () => {
 if (!editingTask) return;
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 setSaving(true);
 try {
 const res = await fetch(`${API_URL}/pm/tasks/${editingTask.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ startDate: editStart, dueDate: editEnd }),
 });
 const data = await res.json();
 if (data.success) {
 setTasks(prev => prev.map(t =>
 t.id === editingTask.id ? { ...t, startDate: editStart, endDate: editEnd } : t
 ));
 setEditingTask(null);
 }
 } catch (err) {
 console.error('Failed to update task dates:', err);
 } finally {
 setSaving(false);
 }
 };

 const getDaysBetween = (start: Date, end: Date) => {
 return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
 };

 const getColumnWidth = () => {
 switch (zoom) {
 case 'day': return 40;
 case 'week': return 120;
 case 'month': return 200;
 }
 };

 const getDateRange = () => {
 const dates: Date[] = [];
 let endDate: Date;
 if (tasks.length > 0) {
 const latest = tasks.reduce((max, t) => {
 const d = new Date(t.endDate);
 return d > max ? d : max;
 }, new Date(tasks[0].endDate));
 endDate = new Date(latest);
 endDate.setDate(endDate.getDate() + 14);
 } else {
 endDate = new Date(startDate);
 endDate.setMonth(endDate.getMonth() + 3);
 }
 const current = new Date(startDate);
 
 while (current <= endDate) {
 dates.push(new Date(current));
 if (zoom === 'day') {
 current.setDate(current.getDate() + 1);
 } else if (zoom === 'week') {
 current.setDate(current.getDate() + 7);
 } else {
 current.setMonth(current.getMonth() + 1);
 }
 }
 return dates;
 };

 const getTaskPosition = (task: GanttTask) => {
 const taskStart = new Date(task.startDate);
 const taskEnd = new Date(task.endDate);
 const daysFromStart = getDaysBetween(startDate, taskStart);
 const duration = getDaysBetween(taskStart, taskEnd) + 1;
 
 const dayWidth = getColumnWidth() / (zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30);
 
 return {
 left: daysFromStart * dayWidth,
 width: Math.max(duration * dayWidth, 30),
 };
 };

 const formatDateHeader = (date: Date) => {
 if (zoom === 'day') {
 return date.toLocaleDateString('en-US', { day: 'numeric' });
 } else if (zoom === 'week') {
 return `Week ${Math.ceil(date.getDate() / 7)} - ${date.toLocaleDateString('en-US', { month: 'short' })}`;
 } else {
 return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
 }
 };

 const navigateTimeline = (direction: 'prev' | 'next') => {
 const newDate = new Date(startDate);
 if (zoom === 'day') {
 newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
 } else if (zoom === 'week') {
 newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28));
 } else {
 newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
 }
 setStartDate(newDate);
 };

 const dates = getDateRange();
 const columnWidth = getColumnWidth();

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
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <h2 className="text-lg font-semibold text-foreground">Gantt Chart</h2>
 <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
 <button
 onClick={() => setZoom('day')}
 className={`px-3 py-1 text-sm rounded-md transition-colors ${
 zoom === 'day' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Day
 </button>
 <button
 onClick={() => setZoom('week')}
 className={`px-3 py-1 text-sm rounded-md transition-colors ${
 zoom === 'week' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Week
 </button>
 <button
 onClick={() => setZoom('month')}
 className={`px-3 py-1 text-sm rounded-md transition-colors ${
 zoom === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Month
 </button>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigateTimeline('prev')}
 className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <ChevronLeft className="h-5 w-5" />
 </button>
 <button
 onClick={() => setStartDate(new Date())}
 className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 Today
 </button>
 <button
 onClick={() => navigateTimeline('next')}
 className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <ChevronRight className="h-5 w-5" />
 </button>
 </div>
 </div>
 </div>

 {/* Gantt Chart */}
 <div className="flex-1 overflow-hidden flex">
 {/* Task List */}
 <div className="w-72 border-r border-border bg-background flex-shrink-0 overflow-y-auto">
 {/* Header */}
 <div className="h-12 border-b border-border px-4 flex items-center bg-muted/50">
 <span className="text-sm font-medium text-foreground">Task Name</span>
 </div>
 
 {/* Tasks */}
 <div>
 {tasks.map((task) => (
 <div
 key={task.id}
 className="h-10 border-b border-border px-4 flex items-center gap-2 hover:bg-muted/50"
 >
 <div
 className="w-2 h-2 rounded-full flex-shrink-0"
 style={{ backgroundColor: task.color || '#94a3b8' }}
 />
 <span className="text-sm truncate text-foreground">
 {task.name}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Timeline */}
 <div className="flex-1 overflow-x-auto" ref={scrollRef}>
 <div style={{ minWidth: dates.length * columnWidth }}>
 {/* Date Headers */}
 <div className="h-12 border-b border-border flex bg-muted/50 sticky top-0">
 {dates.map((date, i) => (
 <div
 key={i}
 className="border-r border-border flex items-center justify-center text-sm text-muted-foreground"
 style={{ width: columnWidth }}
 >
 {formatDateHeader(date)}
 </div>
 ))}
 </div>

 {/* Task Bars */}
 <div className="relative">
 {/* Grid Lines */}
 <div className="absolute inset-0 flex">
 {dates.map((_, i) => (
 <div
 key={i}
 className="border-r border-border"
 style={{ width: columnWidth }}
 />
 ))}
 </div>

 {/* Tasks */}
 {tasks.map((task) => {
 const position = getTaskPosition(task);
 
 return (
 <div key={task.id} className="h-10 relative border-b border-border">
 <div
 className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer group"
 style={{
 left: position.left,
 width: position.width,
 backgroundColor: task.color || '#94a3b8',
 }}
 title={`${task.name} (${task.progress}%)`}
 onClick={() => openEditModal(task)}
 >
 {/* Progress */}
 <div
 className="absolute inset-y-0 left-0 rounded-l opacity-80"
 style={{
 width: `${task.progress}%`,
 backgroundColor: 'rgba(0,0,0,0.2)',
 }}
 />
 
 {/* Label */}
 {position.width > 60 && (
 <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
 {task.name}
 </span>
 )}

 {/* Hover tooltip */}
 <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
 <div className="bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap">
 {task.name} - {task.progress}%
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>

 {/* Legend */}
 <div className="bg-background border-t border-border px-4 py-2">
 <div className="flex items-center gap-6 text-sm">
 <div className="flex items-center gap-2">
 <div className="w-4 h-3 rounded" style={{ backgroundColor: '#94a3b8' }} />
 <span className="text-muted-foreground">To Do</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-3 rounded" style={{ backgroundColor: '#ffffff' }} />
 <span className="text-muted-foreground">In Progress</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }} />
 <span className="text-muted-foreground">Review</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
 <span className="text-muted-foreground">Done</span>
 </div>
 </div>
 </div>

 {/* Edit Dates Modal */}
 {editingTask && (
 <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
 <div className="bg-background rounded-xl shadow-xl p-6 w-80">
 <h3 className="text-base font-semibold text-foreground mb-4">Edit Task Dates</h3>
 <p className="text-sm text-muted-foreground mb-4 truncate">{editingTask.name}</p>
 <div className="space-y-3 mb-6">
 <div>
 <label className="block text-xs font-medium text-foreground mb-1">Start Date</label>
 <input
 type="date"
 value={editStart}
 onChange={(e) => setEditStart(e.target.value)}
 className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-foreground mb-1">Due Date</label>
 <input
 type="date"
 value={editEnd}
 onChange={(e) => setEditEnd(e.target.value)}
 className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setEditingTask(null)}
 className="flex-1 px-4 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleSaveDates}
 disabled={saving}
 className="flex-1 px-4 py-2 text-sm text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50"
 >
 {saving ? 'Saving…' : 'Save'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
