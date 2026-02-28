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
  in_progress: '#3b82f6',
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'waterfall'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Gantt Chart</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setZoom('day')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  zoom === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setZoom('week')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  zoom === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setZoom('month')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  zoom === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTimeline('prev')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setStartDate(new Date())}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateTimeline('next')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden flex">
        {/* Task List */}
        <div className="w-72 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="h-12 border-b border-gray-200 px-4 flex items-center bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Task Name</span>
          </div>
          
          {/* Tasks */}
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="h-10 border-b border-gray-100 px-4 flex items-center gap-2 hover:bg-gray-50"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color || '#94a3b8' }}
                />
                <span className="text-sm truncate text-gray-700">
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
            <div className="h-12 border-b border-gray-200 flex bg-gray-50 sticky top-0">
              {dates.map((date, i) => (
                <div
                  key={i}
                  className="border-r border-gray-200 flex items-center justify-center text-sm text-gray-600"
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
                    className="border-r border-gray-100"
                    style={{ width: columnWidth }}
                  />
                ))}
              </div>

              {/* Tasks */}
              {tasks.map((task) => {
                const position = getTaskPosition(task);
                
                return (
                  <div key={task.id} className="h-10 relative border-b border-gray-100">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer group"
                      style={{
                        left: position.left,
                        width: position.width,
                        backgroundColor: task.color || '#94a3b8',
                      }}
                      title={`${task.name} (${task.progress}%)`}
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
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
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
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#94a3b8' }} />
            <span className="text-gray-600">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }} />
            <span className="text-gray-600">Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-gray-600">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
