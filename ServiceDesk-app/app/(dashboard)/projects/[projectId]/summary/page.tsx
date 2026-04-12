'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 Filter,
 CheckCircle,
 Edit3,
 PlusSquare,
 Clock,
 Expand,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface Task {
 _id: string;
 key: string;
 title: string;
 type: string;
 status: { id: string; name: string; category: string };
 priority: string;
 createdAt: string;
 updatedAt: string;
 dueDate?: string;
 assignee?: { profile: { firstName: string; lastName: string } };
}

interface Project {
 _id: string;
 name: string;
 key: string;
}


export default function ProjectSummaryPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);
 const { t } = useLanguage();

 const [project, setProject] = useState<Project | null>(null);
 const [tasks, setTasks] = useState<Task[]>([]);
 const [activities, setActivities] = useState<{ _id: string; type: string; description: string; createdAt: string; actor?: { profile?: { firstName?: string; lastName?: string }; email?: string } }[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const fetchProject = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) setProject(data.data.project);
 } catch (error) { console.error('Failed to fetch project:', error); }
 }, [projectId]);

 const fetchTasks = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/tasks`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) setTasks(data.data.tasks || []);
 } catch (error) { console.error('Failed to fetch tasks:', error); }
 finally { setIsLoading(false); }
 }, [projectId]);

 const fetchActivities = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/activities?limit=5`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) setActivities(data.data.activities || []);
 } catch (error) { console.error('Failed to fetch activities:', error); }
 }, [projectId]);

 useEffect(() => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) { router.push('/login'); return; }
 fetchProject(token);
 fetchTasks(token);
 fetchActivities(token);
 }, [projectId, router, fetchProject, fetchTasks, fetchActivities]);

 // Calculate stats
 const stats = useMemo(() => {
 const now = new Date();
 const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

 const completed = tasks.filter(t => 
 t.status.category === 'done' && 
 new Date(t.updatedAt) >= sevenDaysAgo
 ).length;

 const updated = tasks.filter(t => 
 new Date(t.updatedAt) >= sevenDaysAgo
 ).length;

 const created = tasks.filter(t => 
 new Date(t.createdAt) >= sevenDaysAgo
 ).length;

 const dueSoon = tasks.filter(t => 
 t.dueDate && 
 new Date(t.dueDate) >= now && 
 new Date(t.dueDate) <= sevenDaysFromNow &&
 t.status.category !== 'done'
 ).length;

 return { completed, updated, created, dueSoon };
 }, [tasks]);

 // Status overview data
 const statusOverview = useMemo(() => {
 const statusCounts: Record<string, number> = {};
 tasks.forEach(task => {
 const statusName = task.status.name || 'Unknown';
 statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
 });

 const colors: Record<string, string> = {
 'To Do': '#84cc16',
 'Idea': '#e879f9',
 'Done': '#ffffff',
 'In Progress': '#f97316',
 'Testing (Ready for review)': '#0ea5e9',
 'Backlog': '#6b7280',
 'Ready': '#ffffff',
 'In Review': '#8b5cf6',
 };

 return Object.entries(statusCounts).map(([name, count]) => ({
 name,
 count,
 color: colors[name] || '#6b7280',
 }));
 }, [tasks]);

 const totalTasks = tasks.length;

 const recentActivity = useMemo(() => activities, [activities]);

 if (isLoading) {
 return <LoadingState />;
 }

 // Calculate donut chart segments
 const calculateDonutSegments = () => {
 if (totalTasks === 0) return [];
 
 let currentAngle = 0;
 return statusOverview.map(status => {
 const percentage = (status.count / totalTasks) * 100;
 const angle = (percentage / 100) * 360;
 const segment = {
 ...status,
 percentage,
 startAngle: currentAngle,
 endAngle: currentAngle + angle,
 };
 currentAngle += angle;
 return segment;
 });
 };

 const segments = calculateDonutSegments();

 // SVG donut chart path generator
 const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
 const start = polarToCartesian(x, y, radius, endAngle);
 const end = polarToCartesian(x, y, radius, startAngle);
 const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
 return [
 "M", start.x, start.y,
 "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
 ].join(" ");
 };

 const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
 const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
 return {
 x: centerX + (radius * Math.cos(angleInRadians)),
 y: centerY + (radius * Math.sin(angleInRadians))
 };
 };

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Filter Bar */}
 <div className="bg-background px-2 sm:px-4 py-3 border-b border-border">
 <button className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-border rounded-lg text-sm transition-colors">
 <Filter className="h-4 w-4" /> {t('projects.common.filter')}
 </button>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto p-3 sm:p-6">
 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
 <div className="bg-background rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow border border-border">
 <div className="w-10 h-10 bg-success-soft rounded-lg flex items-center justify-center shrink-0">
 <CheckCircle className="h-5 w-5 text-success" />
 </div>
 <div className="min-w-0">
 <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.completed} <span className="text-base sm:text-lg font-medium">{t('projects.summary.completedTasks')}</span></div>
 <div className="text-xs sm:text-sm text-muted-foreground">{t('projects.summary.last7Days') || 'in the last 7 days'}</div>
 </div>
 </div>

 <div className="bg-background rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow border border-border">
 <div className="w-10 h-10 bg-info-soft rounded-lg flex items-center justify-center shrink-0">
 <Edit3 className="h-5 w-5 text-info" />
 </div>
 <div className="min-w-0">
 <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.updated} <span className="text-base sm:text-lg font-medium">{t('projects.summary.updated') || 'updated'}</span></div>
 <div className="text-xs sm:text-sm text-muted-foreground">{t('projects.summary.last7Days') || 'in the last 7 days'}</div>
 </div>
 </div>

 <div className="bg-background rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow border border-border">
 <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center shrink-0">
 <PlusSquare className="h-5 w-5 text-brand" />
 </div>
 <div className="min-w-0">
 <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.created} <span className="text-base sm:text-lg font-medium">{t('projects.summary.created') || 'created'}</span></div>
 <div className="text-xs sm:text-sm text-muted-foreground">{t('projects.summary.last7Days') || 'in the last 7 days'}</div>
 </div>
 </div>

 <div className="bg-background rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow border border-border">
 <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center shrink-0">
 <Clock className="h-5 w-5 text-warning" />
 </div>
 <div className="min-w-0">
 <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.dueSoon} <span className="text-base sm:text-lg font-medium">{t('projects.summary.dueSoon') || 'due soon'}</span></div>
 <div className="text-xs sm:text-sm text-muted-foreground">{t('projects.summary.next7Days') || 'in the next 7 days'}</div>
 </div>
 </div>
 </div>

 {/* Status Overview */}
 <div className="bg-background rounded-lg p-4 sm:p-6 mb-6 border border-border">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('projects.summary.status')}</h2>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
 {t('projects.summary.statusDescription') || 'Get a snapshot of the status of your work items.'}{' '}
 <Link href={`/projects/${projectId}/board`} className="text-brand hover:underline">{t('projects.summary.viewAll') || 'View all work items'}</Link>
 </p>

 <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">
 {/* Donut Chart */}
 <div className="relative">
 <svg width="200" height="200" viewBox="0 0 240 240" className="sm:w-[240px] sm:h-[240px]">
 {segments.map((segment, index) => (
 <path
 key={index}
 d={describeArc(120, 120, 90, segment.startAngle, segment.endAngle - 0.5)}
 fill="none"
 stroke={segment.color}
 strokeWidth="35"
 strokeLinecap="butt"
 />
 ))}
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <div className="text-3xl sm:text-4xl font-bold text-foreground">{totalTasks}</div>
 <div className="text-xs sm:text-sm text-muted-foreground">{t('projects.summary.totalItems') || 'Total items'}</div>
 </div>
 </div>

 {/* Legend */}
 <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
 {statusOverview.map((status, index) => (
 <div key={index} className="flex items-center gap-2 sm:gap-3">
 <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: status.color }}></div>
 <span className="text-xs sm:text-sm text-foreground">{status.name}: {status.count}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Recent Activity */}
 <div className="bg-background rounded-lg p-4 sm:p-6 border border-border">
 <div className="flex items-center justify-between mb-2">
 <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('projects.summary.recentActivity')}</h2>
 <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded transition-colors">
 <Expand className="h-4 w-4" />
 </button>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t('projects.summary.activityDescription') || 'Stay up to date with what\'s happening across the space.'}</p>

 <div className="space-y-2 sm:space-y-3">
 {recentActivity.map((activity) => {
 const firstName = activity.actor?.profile?.firstName || '';
 const lastName = activity.actor?.profile?.lastName || '';
 const initials = firstName && lastName
 ? `${firstName[0]}${lastName[0]}`.toUpperCase()
 : (activity.actor?.email?.[0] || '?').toUpperCase();
 return (
 <div key={activity._id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-info flex items-center justify-center text-xs text-white shrink-0">
 {initials}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-foreground text-xs sm:text-sm truncate">{activity.description}</div>
 <div className="text-[10px] sm:text-xs text-muted-foreground">
 {new Date(activity.createdAt).toLocaleDateString()}
 </div>
 </div>
 </div>
 );
 })}
 {recentActivity.length === 0 && (
 <p className="text-muted-foreground text-center py-4 text-sm">{t('projects.summary.noActivity') || 'No recent activity'}</p>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
