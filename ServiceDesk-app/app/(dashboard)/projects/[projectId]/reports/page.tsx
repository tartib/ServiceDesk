'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 FileText,
 Download,
 Calendar,
 BarChart3,
 PieChart,
 TrendingUp,
 Clock,
 Users,
 Filter,
 Plus,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Report {
 id: string;
 name: string;
 type: 'velocity' | 'burndown' | 'sprint' | 'team' | 'custom';
 description: string;
 lastGenerated?: string;
 schedule?: 'daily' | 'weekly' | 'monthly' | 'manual';
 icon: 'bar' | 'pie' | 'line' | 'table';
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

interface BackendReport {
 _id: string;
 name: string;
 type: Report['type'];
 description: string;
 schedule: Report['schedule'];
 icon: Report['icon'];
 lastGeneratedAt?: string;
 createdAt: string;
}

const mapReport = (r: BackendReport): Report => ({
 id: r._id,
 name: r.name,
 type: r.type,
 description: r.description,
 lastGenerated: r.lastGeneratedAt || r.createdAt,
 schedule: r.schedule,
 icon: r.icon || 'bar',
});

const iconMap = {
 bar: BarChart3,
 pie: PieChart,
 line: TrendingUp,
 table: FileText,
};

export default function ReportsPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [reports, setReports] = useState<Report[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [selectedReport, setSelectedReport] = useState<Report | null>(null);
 const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, reportsRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/reports`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const reportsData = await reportsRes.json();
 if (reportsData.success) setReports((reportsData.data.reports || []).map(mapReport));
 } catch (error) {
 console.error('Failed to fetch reports:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const handleCreateReport = async () => {
 const name = prompt('Report name:');
 if (!name) return;
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/reports`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, type: 'custom', description: name, schedule: 'manual', icon: 'bar' }),
 });
 const data = await res.json();
 if (data.success) fetchData(token);
 } catch (error) { console.error('Failed to create report:', error); }
 };

 const formatDate = (dateStr: string) => {
 return new Date(dateStr).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
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
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <FileText className="h-5 w-5 text-brand" />
 <h2 className="text-lg font-semibold text-foreground">Reports</h2>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={dateRange}
 onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
 className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="week">Last 7 days</option>
 <option value="month">Last 30 days</option>
 <option value="quarter">Last 90 days</option>
 <option value="year">Last year</option>
 </select>
 <button
 onClick={handleCreateReport}
 className="flex items-center gap-2 px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="h-4 w-4" />
 Create Report
 </button>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Reports List */}
 <div className={`${selectedReport ? 'w-1/3 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
 <div className="grid grid-cols-1 gap-4">
 {reports.map((report) => {
 const Icon = iconMap[report.icon];
 return (
 <div
 key={report.id}
 onClick={() => setSelectedReport(report)}
 className={`bg-background border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
 selectedReport?.id === report.id 
 ? 'border-brand ring-2 ring-brand-border' 
 : 'border-border'
 }`}
 >
 <div className="flex items-start gap-4">
 <div className="p-3 bg-brand-surface rounded-lg">
 <Icon className="h-6 w-6 text-brand" />
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-foreground">{report.name}</h3>
 <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
 <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
 {report.lastGenerated && (
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 {formatDate(report.lastGenerated)}
 </span>
 )}
 {report.schedule && (
 <span className="px-2 py-0.5 bg-muted rounded-full capitalize">
 {report.schedule}
 </span>
 )}
 </div>
 </div>
 <button className="p-2 text-muted-foreground hover:text-brand hover:bg-brand-surface rounded-lg transition-colors">
 <Download className="h-5 w-5" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Report Preview */}
 {selectedReport && (
 <div className="flex-1 overflow-y-auto bg-background p-6">
 <div className="max-w-4xl mx-auto">
 {/* Report Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-semibold text-foreground">{selectedReport.name}</h2>
 <p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors">
 <Filter className="h-4 w-4" />
 Filter
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors">
 <Download className="h-4 w-4" />
 Export
 </button>
 </div>
 </div>

 {/* Chart Preview */}
 <div className="bg-muted/50 border border-border rounded-xl p-6 mb-6">
 {selectedReport.icon === 'bar' && (
 <div className="h-64 flex items-end justify-around gap-4">
 {[65, 80, 55, 90, 75, 85].map((value, i) => (
 <div key={i} className="flex-1 flex flex-col items-center">
 <div
 className="w-full bg-brand rounded-t transition-all hover:bg-brand-strong"
 style={{ height: `${(value / 100) * 200}px` }}
 />
 <span className="text-xs text-muted-foreground mt-2">Sprint {i + 1}</span>
 </div>
 ))}
 </div>
 )}
 {selectedReport.icon === 'line' && (
 <div className="h-64 relative">
 <svg viewBox="0 0 400 200" className="w-full h-full">
 <polyline
 points="0,150 70,120 140,100 210,80 280,60 350,40 400,30"
 fill="none"
 stroke="#ffffff"
 strokeWidth="3"
 />
 <polyline
 points="0,180 70,160 140,140 210,120 280,100 350,80 400,60"
 fill="none"
 stroke="#10b981"
 strokeWidth="3"
 strokeDasharray="5,5"
 />
 </svg>
 </div>
 )}
 {selectedReport.icon === 'pie' && (
 <div className="h-64 flex items-center justify-center">
 <div className="relative w-48 h-48">
 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
 <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
 <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeWidth="20" strokeDasharray="150 251.2" />
 <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="60 251.2" strokeDashoffset="-150" />
 <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="41.2 251.2" strokeDashoffset="-210" />
 </svg>
 </div>
 </div>
 )}
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-4 gap-4 mb-6">
 <div className="bg-background border border-border rounded-lg p-4">
 <p className="text-sm text-muted-foreground">Total Tasks</p>
 <p className="text-2xl font-bold text-foreground mt-1">156</p>
 </div>
 <div className="bg-background border border-border rounded-lg p-4">
 <p className="text-sm text-muted-foreground">Completed</p>
 <p className="text-2xl font-bold text-success mt-1">124</p>
 </div>
 <div className="bg-background border border-border rounded-lg p-4">
 <p className="text-sm text-muted-foreground">In Progress</p>
 <p className="text-2xl font-bold text-brand mt-1">22</p>
 </div>
 <div className="bg-background border border-border rounded-lg p-4">
 <p className="text-sm text-muted-foreground">Avg. Velocity</p>
 <p className="text-2xl font-bold text-info mt-1">32 pts</p>
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-background border border-border rounded-xl overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted/50">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sprint</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Planned</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Completed</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Velocity</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Completion</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {[
 { sprint: 'Sprint 6', planned: 40, completed: 38, velocity: 38 },
 { sprint: 'Sprint 5', planned: 35, completed: 35, velocity: 35 },
 { sprint: 'Sprint 4', planned: 42, completed: 36, velocity: 36 },
 { sprint: 'Sprint 3', planned: 38, completed: 32, velocity: 32 },
 { sprint: 'Sprint 2', planned: 30, completed: 28, velocity: 28 },
 ].map((row, i) => (
 <tr key={i} className="hover:bg-muted/50">
 <td className="px-4 py-3 text-sm font-medium text-foreground">{row.sprint}</td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{row.planned} pts</td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{row.completed} pts</td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{row.velocity} pts</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-24 bg-muted rounded-full h-2">
 <div
 className="h-2 rounded-full bg-success"
 style={{ width: `${(row.completed / row.planned) * 100}%` }}
 />
 </div>
 <span className="text-sm text-muted-foreground">
 {Math.round((row.completed / row.planned) * 100)}%
 </span>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
