'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  LayoutGrid,
  X,
  User,
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
  dueDate?: string;
  startDate?: string;
  assignee?: { profile: { firstName: string; lastName: string } };
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

export default function CalendarPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showUnscheduled, setShowUnscheduled] = useState(true);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) { console.error('Failed to fetch project:', error); }
  }, [projectId]);

  const fetchTasks = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTasks(data.data.tasks || []);
    } catch (error) { console.error('Failed to fetch tasks:', error); }
    finally { setIsLoading(false); }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchProject(token);
    fetchTasks(token);
  }, [projectId, router, fetchProject, fetchTasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Start week on Monday (1) instead of Sunday (0)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;
    return { daysInMonth, startingDay };
  };

  const getTasksForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => {
      if (!task.dueDate && !task.startDate) return false;
      const taskStart = task.startDate ? task.startDate.split('T')[0] : task.dueDate?.split('T')[0];
      const taskEnd = task.dueDate ? task.dueDate.split('T')[0] : taskStart;
      return dateStr >= (taskStart || '') && dateStr <= (taskEnd || '');
    });
  };

  const unscheduledTasks = tasks.filter(task => !task.dueDate && !task.startDate);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'idea': 'bg-gray-200 text-gray-700',
      'todo': 'bg-gray-200 text-gray-700',
      'to do': 'bg-gray-200 text-gray-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'in progress': 'bg-blue-100 text-blue-700',
      'done': 'bg-green-100 text-green-700',
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-200 text-gray-700';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      epic: '⚡',
      story: '📖',
      task: '✓',
      bug: '🐛',
    };
    return icons[type] || '📖';
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });

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
      <div className="bg-white px-2 sm:px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('projects.common.search')} 
            className="w-full sm:w-28 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 ltr:pl-9 rtl:pr-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" 
          />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm transition-colors">
            {t('projects.calendar.assignee') || 'Assignee'} <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm transition-colors">
            {t('projects.calendar.type') || 'Type'} <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm transition-colors">
            {t('projects.summary.status') || 'Status'} <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <button className="sm:hidden flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm">
          <Filter className="h-4 w-4" /> {t('projects.common.filter')}
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white px-2 sm:px-4 py-2 flex flex-wrap items-center gap-2 sm:gap-4 border-b border-gray-200">
        <button 
          onClick={goToToday} 
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded-lg text-sm transition-colors"
        >
          {t('projects.calendar.today')}
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={prevMonth} 
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-gray-900 font-medium min-w-[80px] sm:min-w-[100px] text-center text-sm sm:text-base">
            {monthYear}
          </span>
          <button 
            onClick={nextMonth} 
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-sm transition-colors">
            {t('projects.calendar.monthView') || 'Month'} <ChevronDown className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button className="p-1.5 bg-blue-600 text-white rounded-lg"><LayoutGrid className="h-4 w-4" /></button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Filter className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="min-w-[320px] sm:min-w-[500px] lg:min-w-[700px]">
            {/* Week Days Header */}
            <div className="grid grid-cols-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              {[
                t('projects.calendar.mon') || 'Mon',
                t('projects.calendar.tue') || 'Tue', 
                t('projects.calendar.wed') || 'Wed',
                t('projects.calendar.thu') || 'Thu',
                t('projects.calendar.fri') || 'Fri'
              ].map((day) => (
                <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Weeks */}
            {(() => {
              const weeks = [];
              let dayCounter = 1 - startingDay;
              
              while (dayCounter <= daysInMonth) {
                const week = [];
                for (let i = 0; i < 5; i++) { // Mon-Fri only
                  const day = dayCounter + i;
                  const isCurrentMonth = day > 0 && day <= daysInMonth;
                  const isToday = isCurrentMonth && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                  const dayTasks = isCurrentMonth ? getTasksForDate(day) : [];
                  
                  week.push(
                    <div key={`day-${dayCounter}-${i}`} className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-gray-200 last:border-r-0 ${!isCurrentMonth ? 'bg-gray-50' : ''}`}>
                      {isCurrentMonth && (
                        <>
                          <div className={`text-xs sm:text-sm mb-1 sm:mb-2 ${isToday ? 'w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold' : 'text-gray-500'}`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div 
                                key={task._id} 
                                className="text-xs p-1 sm:p-1.5 bg-purple-100 text-purple-800 rounded flex items-center gap-1 cursor-pointer hover:bg-purple-200 transition-colors"
                              >
                                <span className="hidden sm:inline">{getTypeIcon(task.type)}</span>
                                <span className="truncate text-[10px] sm:text-xs">
                                  <span className="hidden sm:inline">{task.key} </span>
                                  {task.title}
                                </span>
                                {task.assignee && (
                                  <div className="hidden sm:flex w-5 h-5 rounded-full bg-purple-500 items-center justify-center text-xs text-white ml-auto shrink-0">
                                    {task.assignee.profile.firstName[0]}
                                  </div>
                                )}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-[10px] sm:text-xs text-gray-400">+{dayTasks.length - 2}</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                weeks.push(<div key={`week-${dayCounter}`} className="grid grid-cols-5">{week}</div>);
                dayCounter += 7;
              }
              return weeks;
            })()}
          </div>
        </div>

        {/* Unscheduled Work Panel */}
        {showUnscheduled && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col max-h-[300px] lg:max-h-none">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-gray-900 font-medium text-sm sm:text-base">{t('projects.calendar.unscheduledWork') || 'Unscheduled work'}</h3>
              <button 
                onClick={() => setShowUnscheduled(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 hidden sm:block">
              {t('projects.calendar.dragInstruction') || 'Drag each work item onto the calendar to set a due date.'}
            </p>
            
            <div className="px-3 sm:px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t('projects.calendar.searchUnscheduled') || 'Search unscheduled...'} 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-sm">
              <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                {t('projects.calendar.mostRecent') || 'Most recent'} <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                <Filter className="h-4 w-4" /> Filters
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-2 pb-4">
              {unscheduledTasks.map((task) => (
                <div key={task._id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 cursor-move hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 text-sm font-medium truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-green-600">{getTypeIcon(task.type)}</span>
                        <span className="text-xs text-blue-600">{task.key}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusBadge(task.status?.name || 'todo')}`}>
                          {task.status?.name?.toUpperCase() || 'TO DO'}
                        </span>
                      </div>
                    </div>
                    {task.assignee ? (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white shrink-0">
                        {task.assignee.profile.firstName[0]}{task.assignee.profile.lastName[0]}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {unscheduledTasks.length === 0 && (
                <p className="text-gray-400 text-center py-4 sm:py-8 text-sm">{t('projects.calendar.noUnscheduled') || 'No unscheduled items'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
