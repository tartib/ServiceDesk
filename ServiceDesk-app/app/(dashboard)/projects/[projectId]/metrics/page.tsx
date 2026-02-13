'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
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
  avgTime: number; // hours
  minTime: number;
  maxTime: number;
  itemsCount: number;
}

interface ThroughputData {
  week: string;
  completed: number;
  started: number;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const cycleTimeData: CycleTimeData[] = [
  { column: 'To Do', avgTime: 24, minTime: 2, maxTime: 72, itemsCount: 8 },
  { column: 'In Progress', avgTime: 48, minTime: 8, maxTime: 120, itemsCount: 5 },
  { column: 'Review', avgTime: 12, minTime: 2, maxTime: 36, itemsCount: 3 },
  { column: 'Testing', avgTime: 18, minTime: 4, maxTime: 48, itemsCount: 4 },
  { column: 'Done', avgTime: 0, minTime: 0, maxTime: 0, itemsCount: 45 },
];

const throughputData: ThroughputData[] = [
  { week: 'Week 1', completed: 8, started: 10 },
  { week: 'Week 2', completed: 12, started: 9 },
  { week: 'Week 3', completed: 10, started: 14 },
  { week: 'Week 4', completed: 15, started: 11 },
];

const wipData = [
  { column: 'To Do', count: 8, limit: 15 },
  { column: 'In Progress', count: 5, limit: 5 },
  { column: 'Review', count: 3, limit: 4 },
  { column: 'Testing', count: 4, limit: 4 },
];

export default function MetricsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

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

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getTotalCycleTime = () => {
    return cycleTimeData.reduce((sum, d) => sum + d.avgTime, 0);
  };

  const getAvgThroughput = () => {
    return Math.round(throughputData.reduce((sum, d) => sum + d.completed, 0) / throughputData.length);
  };

  const getWipStatus = () => {
    const atLimit = wipData.filter(w => w.count >= w.limit).length;
    return atLimit;
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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'kanban'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Kanban Metrics</h2>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Avg Cycle Time</span>
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatTime(getTotalCycleTime())}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-green-500" />
              -8h vs last period
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Avg Throughput</span>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{getAvgThroughput()}/week</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              +2 vs last period
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">WIP Items</span>
              <div className="p-2 rounded-lg bg-purple-100">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{wipData.reduce((sum, w) => sum + w.count, 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Across all columns</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">WIP Limits Hit</span>
              <div className={`p-2 rounded-lg ${getWipStatus() > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${getWipStatus() > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${getWipStatus() > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {getWipStatus()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Columns at limit</p>
          </div>
        </div>

        {/* Cycle Time by Column */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Cycle Time by Column</h3>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-2">
              {cycleTimeData.filter(d => d.column !== 'Done').map((data, i, arr) => (
                <div key={data.column} className="flex-1 flex items-end gap-2">
                  {/* Column */}
                  <div className="flex-1">
                    <div className="text-center mb-2">
                      <p className="text-2xl font-bold text-gray-900">{formatTime(data.avgTime)}</p>
                      <p className="text-xs text-gray-500">avg</p>
                    </div>
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max((data.avgTime / 50) * 150, 20)}px` }}
                    />
                    <div className="text-center mt-2">
                      <p className="text-sm font-medium text-gray-900">{data.column}</p>
                      <p className="text-xs text-gray-500">{data.itemsCount} items</p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  {i < arr.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-300 mb-8" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Weekly Throughput</h3>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-around gap-4 h-48">
                {throughputData.map((data) => (
                  <div key={data.week} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex gap-1 items-end justify-center h-36">
                      <div
                        className="w-8 bg-green-500 rounded-t"
                        style={{ height: `${(data.completed / 20) * 100}%` }}
                        title={`Completed: ${data.completed}`}
                      />
                      <div
                        className="w-8 bg-blue-500 rounded-t"
                        style={{ height: `${(data.started / 20) * 100}%` }}
                        title={`Started: ${data.started}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{data.week}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-sm text-gray-600">Started</span>
                </div>
              </div>
            </div>
          </div>

          {/* WIP Limits */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">WIP Limits</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {wipData.map((data) => {
                  const percentage = (data.count / data.limit) * 100;
                  const isAtLimit = data.count >= data.limit;
                  
                  return (
                    <div key={data.column}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{data.column}</span>
                        <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-600'}`}>
                          {data.count} / {data.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            isAtLimit ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
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
        <div className="bg-white rounded-xl border border-gray-200 mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Cumulative Flow (Last 4 Weeks)</h3>
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
                  fill="#3b82f6"
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
                <div className="w-3 h-3 rounded bg-gray-400" />
                <span className="text-sm text-gray-600">To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-sm text-gray-600">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-sm text-gray-600">Testing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-sm text-gray-600">Done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
