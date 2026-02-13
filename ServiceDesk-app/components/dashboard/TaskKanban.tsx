'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import TaskCard from '@/components/tasks/TaskCard';
import { Task } from '@/types';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, CheckCircle, AlertTriangle, Pause } from 'lucide-react';

interface TaskKanbanProps {
  tasks: Task[];
}

export default function TaskKanban({ tasks }: TaskKanbanProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // Group tasks by status (map 'late' from backend to 'overdue' for UI)
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.status === 'late' || t.status === 'overdue');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const columns = [
    {
      id: 'overdue',
      title: t('tasks.overdue') || 'Overdue',
      tasks: overdueTasks,
      icon: AlertTriangle,
      color: 'border-t-4 border-t-red-500 shadow-md',
      headerColor: 'text-red-700 bg-gradient-to-r from-red-50 to-red-100',
      count: overdueTasks.length,
    },
    {
      id: 'pending',
      title: t('tasks.pending') || 'Pending',
      tasks: pendingTasks,
      icon: Pause,
      color: 'border-t-4 border-t-gray-400 shadow-sm',
      headerColor: 'text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100',
      count: pendingTasks.length,
    },
    {
      id: 'scheduled',
      title: t('tasks.scheduled'),
      tasks: scheduledTasks,
      icon: Calendar,
      color: 'border-t-4 border-t-purple-500 shadow-sm',
      headerColor: 'text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100',
      count: scheduledTasks.length,
    },
    {
      id: 'in_progress',
      title: t('tasks.inProgress'),
      tasks: inProgressTasks,
      icon: Clock,
      color: 'border-t-4 border-t-blue-500 shadow-sm',
      headerColor: 'text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100',
      count: inProgressTasks.length,
    },
    {
      id: 'completed',
      title: t('tasks.completed'),
      tasks: completedTasks,
      icon: CheckCircle,
      color: 'border-t-4 border-t-green-500 shadow-sm',
      headerColor: 'text-green-700 bg-gradient-to-r from-green-50 to-green-100',
      count: completedTasks.length,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {columns.map((column) => {
        const Icon = column.icon;
        return (
          <Card key={column.id} className={`${column.color} flex flex-col h-full hover:shadow-xl transition-shadow duration-300`}>
            <CardHeader className={`${column.headerColor} rounded-t-lg`}>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span>{column.title}</span>
                </div>
                <span className="text-sm font-bold bg-white px-2.5 py-1 rounded-full shadow-sm">
                  {column.count}
                </span>
              </CardTitle>
            </CardHeader>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {column.tasks.length > 0 ? (
                column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {t('tasks.noTasks')}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
