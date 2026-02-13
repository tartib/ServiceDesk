'use client';

import { useMemo } from 'react';

interface Task {
  _id: string;
  key: string;
  title: string;
  type: string;
  status: {
    id: string;
    name: string;
    category: string;
  };
  priority: string;
  assignee?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  storyPoints?: number;
}

type GroupBy = 'status' | 'assignee' | 'type' | 'priority';

interface GroupedTasks {
  [groupKey: string]: Task[];
}

export function useTaskGrouping(tasks: Task[], groupBy: GroupBy): GroupedTasks {
  return useMemo(() => {
    const grouped: GroupedTasks = {};

    switch (groupBy) {
      case 'status':
        tasks.forEach((task) => {
          const key = task.status.id;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(task);
        });
        break;

      case 'assignee':
        tasks.forEach((task) => {
          const key = task.assignee
            ? `${task.assignee.profile.firstName} ${task.assignee.profile.lastName}`
            : 'Unassigned';
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(task);
        });
        break;

      case 'type':
        tasks.forEach((task) => {
          const key = task.type;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(task);
        });
        break;

      case 'priority':
        tasks.forEach((task) => {
          const key = task.priority || 'No Priority';
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(task);
        });
        break;

      default:
        grouped['all'] = tasks;
    }

    return grouped;
  }, [tasks, groupBy]);
}
