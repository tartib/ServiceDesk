'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskKanbanJira from '@/components/dashboard/TaskKanbanJira';
import TaskCard from '@/components/tasks/TaskCard';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import { useMyTasks } from '@/hooks/useTasks';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutGrid, List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

export default function MyTasksPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'calendar'>('kanban');
  const { data: tasks, isLoading } = useMyTasks();

  // Ensure we always have an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];

  const groupedTasks = {
    inProgress: tasksArray.filter((task: Task) => task.status === 'in_progress'),
    scheduled: tasksArray.filter((task: Task) => task.status === 'scheduled'),
    completed: tasksArray.filter((task: Task) => task.status === 'completed' || task.status === 'done'),
    overdue: tasksArray.filter((task: Task) => task.status === 'overdue' || task.status === 'late'),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('tasks.myTasks')}</h1>
            <p className="text-gray-500 mt-1">{t('tasks.tasksAssignedToYou')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {t('dashboard.kanbanView')}
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              {t('dashboard.listView')}
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {t('dashboard.calendarView')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : tasksArray.length > 0 ? (
          viewMode === 'kanban' ? (
            <TaskKanbanJira tasks={tasksArray} />
          ) : viewMode === 'calendar' ? (
            <TaskCalendar 
              tasks={tasksArray} 
              onTaskClick={(task) => router.push(`/tasks/${task._id || task.id}`)}
            />
          ) : (
          <div className="space-y-6">
            {/* In Progress Tasks */}
            {groupedTasks.inProgress.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('tasks.inProgress')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.inProgress.map((task: Task) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      onClick={() => router.push(`/tasks/${task._id || task.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {groupedTasks.overdue.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-red-600">{t('tasks.overdueTasks')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.overdue.map((task: Task) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      onClick={() => router.push(`/tasks/${task._id || task.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Tasks */}
            {groupedTasks.scheduled.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('tasks.scheduled')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.scheduled.map((task: Task) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      onClick={() => router.push(`/tasks/${task._id || task.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {groupedTasks.completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('tasks.completed')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.completed.map((task: Task) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      showActions={false}
                      onClick={() => router.push(`/tasks/${task._id || task.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('tasks.noTasksAssigned')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
