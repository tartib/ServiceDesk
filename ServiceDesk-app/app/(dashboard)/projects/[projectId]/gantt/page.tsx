'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  Flag,
  Link2,
  MoreHorizontal,
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
  phase?: string;
  startDate: string;
  endDate: string;
  progress: number;
  assignee?: string;
  dependencies?: string[];
  milestone?: boolean;
  color?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultTasks: GanttTask[] = [
  {
    id: 'phase1',
    name: 'Requirements',
    startDate: '2024-01-01',
    endDate: '2024-01-21',
    progress: 100,
    color: '#3b82f6',
  },
  {
    id: 'task1',
    name: 'Gather Requirements',
    phase: 'phase1',
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    progress: 100,
    assignee: 'Sarah Johnson',
  },
  {
    id: 'task2',
    name: 'Document Specifications',
    phase: 'phase1',
    startDate: '2024-01-08',
    endDate: '2024-01-18',
    progress: 100,
    assignee: 'Mike Chen',
    dependencies: ['task1'],
  },
  {
    id: 'milestone1',
    name: 'Requirements Sign-off',
    startDate: '2024-01-21',
    endDate: '2024-01-21',
    progress: 100,
    milestone: true,
    dependencies: ['task2'],
  },
  {
    id: 'phase2',
    name: 'Design',
    startDate: '2024-01-22',
    endDate: '2024-02-11',
    progress: 75,
    color: '#8b5cf6',
  },
  {
    id: 'task3',
    name: 'System Architecture',
    phase: 'phase2',
    startDate: '2024-01-22',
    endDate: '2024-02-02',
    progress: 100,
    assignee: 'Tech Lead',
    dependencies: ['milestone1'],
  },
  {
    id: 'task4',
    name: 'UI/UX Design',
    phase: 'phase2',
    startDate: '2024-01-25',
    endDate: '2024-02-08',
    progress: 60,
    assignee: 'Emily Davis',
  },
  {
    id: 'milestone2',
    name: 'Design Review',
    startDate: '2024-02-11',
    endDate: '2024-02-11',
    progress: 0,
    milestone: true,
    dependencies: ['task3', 'task4'],
  },
  {
    id: 'phase3',
    name: 'Development',
    startDate: '2024-02-12',
    endDate: '2024-03-24',
    progress: 30,
    color: '#10b981',
  },
  {
    id: 'task5',
    name: 'Backend Development',
    phase: 'phase3',
    startDate: '2024-02-12',
    endDate: '2024-03-10',
    progress: 45,
    assignee: 'Dev Team',
    dependencies: ['milestone2'],
  },
  {
    id: 'task6',
    name: 'Frontend Development',
    phase: 'phase3',
    startDate: '2024-02-19',
    endDate: '2024-03-17',
    progress: 25,
    assignee: 'Frontend Team',
    dependencies: ['task4'],
  },
  {
    id: 'task7',
    name: 'Integration',
    phase: 'phase3',
    startDate: '2024-03-11',
    endDate: '2024-03-24',
    progress: 0,
    assignee: 'Dev Team',
    dependencies: ['task5', 'task6'],
  },
  {
    id: 'phase4',
    name: 'Testing',
    startDate: '2024-03-25',
    endDate: '2024-04-14',
    progress: 0,
    color: '#f59e0b',
  },
  {
    id: 'task8',
    name: 'QA Testing',
    phase: 'phase4',
    startDate: '2024-03-25',
    endDate: '2024-04-07',
    progress: 0,
    assignee: 'QA Team',
    dependencies: ['task7'],
  },
  {
    id: 'task9',
    name: 'UAT',
    phase: 'phase4',
    startDate: '2024-04-01',
    endDate: '2024-04-14',
    progress: 0,
    assignee: 'Business Team',
    dependencies: ['task8'],
  },
  {
    id: 'milestone3',
    name: 'Go Live',
    startDate: '2024-04-15',
    endDate: '2024-04-15',
    progress: 0,
    milestone: true,
    dependencies: ['task9'],
  },
];

export default function GanttPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks] = useState<GanttTask[]>(defaultTasks);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');
  const [startDate, setStartDate] = useState(new Date('2024-01-01'));
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const endDate = new Date('2024-05-01');
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
      width: Math.max(duration * dayWidth, task.milestone ? 20 : 30),
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
              onClick={() => setStartDate(new Date('2024-01-01'))}
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
                className={`h-10 border-b border-gray-100 px-4 flex items-center gap-2 hover:bg-gray-50 ${
                  task.phase ? 'pl-8' : ''
                } ${task.milestone ? 'bg-yellow-50' : ''} ${!task.phase && !task.milestone ? 'bg-blue-50/50 font-medium' : ''}`}
              >
                {task.milestone ? (
                  <Flag className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                ) : task.dependencies?.length ? (
                  <Link2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                ) : null}
                <span className={`text-sm truncate ${task.milestone ? 'text-yellow-700' : 'text-gray-700'}`}>
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
                    {task.milestone ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-500 rotate-45 cursor-pointer hover:bg-yellow-600 transition-colors"
                        style={{ left: position.left }}
                        title={task.name}
                      />
                    ) : (
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
                    )}
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
            <div className="w-4 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Requirements</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-purple-500" />
            <span className="text-gray-600">Design</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-yellow-500" />
            <span className="text-gray-600">Testing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rotate-45" />
            <span className="text-gray-600">Milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
