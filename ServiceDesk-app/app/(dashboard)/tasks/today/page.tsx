'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskCard from '@/components/tasks/TaskCard';
import { useTodayTasks } from '@/hooks/useTasks';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Task } from '@/types';

export default function TodayTasksPage() {
  const router = useRouter();
  const { data: tasks, isLoading } = useTodayTasks();
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'late'>('all');

  // Ensure we always have an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = filter === 'all' 
    ? tasksArray 
    : tasksArray.filter((t: Task) => t.status === filter);

  const statusCounts = {
    all: tasksArray.length,
    scheduled: tasksArray.filter((t: Task) => t.status === 'scheduled').length,
    in_progress: tasksArray.filter((t: Task) => t.status === 'in_progress').length,
    completed: tasksArray.filter((t: Task) => t.status === 'completed').length,
    late: tasksArray.filter((t: Task) => t.status === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Today&apos;s Tasks</h1>
          <p className="text-gray-500 mt-1">All tasks scheduled for today</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({statusCounts.all})
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilter('scheduled')}
          >
            Scheduled ({statusCounts.scheduled})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress ({statusCounts.in_progress})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed ({statusCounts.completed})
          </Button>
          <Button
            variant={filter === 'late' ? 'default' : 'outline'}
            onClick={() => setFilter('late')}
          >
            Late ({statusCounts.late})
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTasks.length > 0 ? (
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
              {filter === 'all' ? 'No tasks for today' : `No ${filter.replace('_', ' ')} tasks`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
