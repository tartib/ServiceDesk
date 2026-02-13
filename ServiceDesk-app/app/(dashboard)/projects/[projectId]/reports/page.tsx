'use client';

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

const defaultReports: Report[] = [
  { id: 'r1', name: 'Sprint Velocity', type: 'velocity', description: 'Track team velocity across sprints', lastGenerated: '2024-01-15', schedule: 'weekly', icon: 'bar' },
  { id: 'r2', name: 'Burndown Chart', type: 'burndown', description: 'Sprint progress and remaining work', lastGenerated: '2024-01-15', schedule: 'daily', icon: 'line' },
  { id: 'r3', name: 'Sprint Summary', type: 'sprint', description: 'Completed vs planned work per sprint', lastGenerated: '2024-01-14', schedule: 'weekly', icon: 'pie' },
  { id: 'r4', name: 'Team Workload', type: 'team', description: 'Work distribution across team members', lastGenerated: '2024-01-15', schedule: 'weekly', icon: 'bar' },
  { id: 'r5', name: 'Cycle Time Analysis', type: 'custom', description: 'Time from start to completion', lastGenerated: '2024-01-12', schedule: 'monthly', icon: 'line' },
  { id: 'r6', name: 'Issue Type Distribution', type: 'custom', description: 'Breakdown by issue type', lastGenerated: '2024-01-10', schedule: 'manual', icon: 'pie' },
];

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
  const [reports] = useState<Report[]>(defaultReports);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
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
    fetchProject(token);
  }, [projectId, router, fetchProject]);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Create Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Reports List */}
        <div className={`${selectedReport ? 'w-1/3 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => {
              const Icon = iconMap[report.icon];
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedReport?.id === report.id 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {report.lastGenerated && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(report.lastGenerated)}
                          </span>
                        )}
                        {report.schedule && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                            {report.schedule}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
          <div className="flex-1 overflow-y-auto bg-white p-6">
            <div className="max-w-4xl mx-auto">
              {/* Report Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedReport.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Chart Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                {selectedReport.icon === 'bar' && (
                  <div className="h-64 flex items-end justify-around gap-4">
                    {[65, 80, 55, 90, 75, 85].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${(value / 100) * 200}px` }}
                        />
                        <span className="text-xs text-gray-500 mt-2">Sprint {i + 1}</span>
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
                        stroke="#3b82f6"
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
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="150 251.2" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="60 251.2" strokeDashoffset="-150" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="41.2 251.2" strokeDashoffset="-210" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">124</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">22</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Avg. Velocity</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">32 pts</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sprint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Velocity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { sprint: 'Sprint 6', planned: 40, completed: 38, velocity: 38 },
                      { sprint: 'Sprint 5', planned: 35, completed: 35, velocity: 35 },
                      { sprint: 'Sprint 4', planned: 42, completed: 36, velocity: 36 },
                      { sprint: 'Sprint 3', planned: 38, completed: 32, velocity: 32 },
                      { sprint: 'Sprint 2', planned: 30, completed: 28, velocity: 28 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.sprint}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.planned} pts</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.completed} pts</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.velocity} pts</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${(row.completed / row.planned) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
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
