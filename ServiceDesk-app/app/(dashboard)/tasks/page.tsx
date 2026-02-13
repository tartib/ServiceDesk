'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskKanbanJira from '@/components/dashboard/TaskKanbanJira';
import TaskCard from '@/components/tasks/TaskCard';
import TaskCalendar from '@/components/tasks/TaskCalendar';
import { useAllTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutGrid, List, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AllTasksPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { data: tasks, isLoading } = useAllTasks();
  const { data: categories } = useCategories(true); // Get only active categories
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'calendar'>('kanban');

  // Ensure we always have an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Create productId to category mapping


  // Apply filters
  const filteredTasks = tasksArray.filter((task: Task) => {
    const matchesSearch = task.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status
  const scheduledTasks = filteredTasks.filter(t => t.status === 'scheduled');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const overdueTasks = filteredTasks.filter(t => t.status === 'overdue');
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');

  return (
    <DashboardLayout allowedRoles={['supervisor', 'manager']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('tasks.allTasks')}</h1>
            <p className="text-gray-500 mt-1">{t('tasks.manageAllTasks')}</p>
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

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={t('tasks.searchByProduct')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{t('tasks.filterByStatus')}:</span>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                {t('common.all')} ({tasksArray.length})
              </Badge>
            <Badge
              variant={statusFilter === 'scheduled' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('scheduled')}
            >
              {t('tasks.scheduled')} ({scheduledTasks.length})
            </Badge>
            <Badge
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              className="cursor-pointer bg-blue-100 text-blue-800"
              onClick={() => setStatusFilter('in_progress')}
            >
              {t('tasks.inProgress')} ({inProgressTasks.length})
            </Badge>
            <Badge
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              className="cursor-pointer bg-green-100 text-green-800"
              onClick={() => setStatusFilter('completed')}
            >
              {t('tasks.completed')} ({completedTasks.length})
            </Badge>
            <Badge
              variant={statusFilter === 'overdue' ? 'default' : 'outline'}
              className="cursor-pointer bg-red-100 text-red-800"
              onClick={() => setStatusFilter('overdue')}
            >
              {t('tasks.overdue')} ({overdueTasks.length})
            </Badge>
            <Badge
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              className="cursor-pointer bg-gray-100 text-gray-800"
              onClick={() => setStatusFilter('pending')}
            >
              {t('tasks.pending')} ({pendingTasks.length})
            </Badge>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{t('tasks.filterByCategory')}:</span>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setCategoryFilter('all')}
              >
                {t('common.all')}
              </Badge>
      
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {viewMode === 'kanban' ? (
              filteredTasks.length > 0 || statusFilter !== 'all' ? (
                <TaskKanbanJira tasks={filteredTasks} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('tasks.noTasks')}</p>
                </div>
              )
            ) : viewMode === 'calendar' ? (
              <TaskCalendar
                tasks={filteredTasks}
                onTaskClick={(task) => router.push(`/tasks/${task.id}`)}
              />
            ) : (
              filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((task: Task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchTerm || statusFilter !== 'all' 
                      ? t('tasks.noTasksMatch')
                      : t('tasks.noTasks')}
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
