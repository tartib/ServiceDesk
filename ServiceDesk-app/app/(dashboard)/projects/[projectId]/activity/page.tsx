'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle,
  MessageSquare,
  GitCommit,
  FileText,
  User,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'task_created' | 'comment' | 'status_change' | 'assignment' | 'file_upload';
  user: string;
  userAvatar?: string;
  action: string;
  target?: string;
  targetId?: string;
  details?: string;
  timestamp: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultActivities: ActivityItem[] = [
  { id: 'a1', type: 'task_completed', user: 'Sarah Johnson', action: 'completed', target: 'PROJ-101: User authentication flow', timestamp: '2024-01-15T14:30:00Z' },
  { id: 'a2', type: 'comment', user: 'Mike Chen', action: 'commented on', target: 'PROJ-102: Dashboard redesign', details: 'Looking good! Just need to fix the mobile layout.', timestamp: '2024-01-15T14:15:00Z' },
  { id: 'a3', type: 'status_change', user: 'Emily Davis', action: 'moved', target: 'PROJ-103: Fix login timeout', details: 'from "In Progress" to "Review"', timestamp: '2024-01-15T13:45:00Z' },
  { id: 'a4', type: 'assignment', user: 'John Doe', action: 'was assigned to', target: 'PROJ-104: API rate limiting', timestamp: '2024-01-15T13:30:00Z' },
  { id: 'a5', type: 'task_created', user: 'Sarah Johnson', action: 'created', target: 'PROJ-105: Email notifications', timestamp: '2024-01-15T12:00:00Z' },
  { id: 'a6', type: 'file_upload', user: 'Emily Davis', action: 'uploaded', target: 'design-mockup-v2.fig', details: 'to PROJ-102', timestamp: '2024-01-15T11:30:00Z' },
  { id: 'a7', type: 'task_completed', user: 'Mike Chen', action: 'completed', target: 'PROJ-098: Database optimization', timestamp: '2024-01-15T10:45:00Z' },
  { id: 'a8', type: 'comment', user: 'John Doe', action: 'commented on', target: 'PROJ-101: User authentication flow', details: 'Great work on the OAuth integration!', timestamp: '2024-01-15T10:30:00Z' },
  { id: 'a9', type: 'status_change', user: 'Sarah Johnson', action: 'moved', target: 'PROJ-099: Performance testing', details: 'from "Review" to "Done"', timestamp: '2024-01-14T17:00:00Z' },
  { id: 'a10', type: 'assignment', user: 'Emily Davis', action: 'was assigned to', target: 'PROJ-106: Mobile responsive fixes', timestamp: '2024-01-14T16:30:00Z' },
];

const typeConfig = {
  task_completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
  task_created: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  comment: { icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  status_change: { icon: RefreshCw, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  assignment: { icon: User, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  file_upload: { icon: FileText, color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [activities] = useState<ActivityItem[]>(defaultActivities);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const filteredActivities = filterType === 'all' 
    ? activities 
    : activities.filter(a => a.type === filterType);

  const groupedActivities = groupByDate(filteredActivities);

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
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('projects.activity.title') || 'Activity Feed'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('projects.activity.allActivity') || 'All Activity'}</option>
              <option value="task_completed">{t('projects.activity.completedTasks') || 'Completed Tasks'}</option>
              <option value="task_created">{t('projects.activity.createdTasks') || 'Created Tasks'}</option>
              <option value="comment">{t('projects.activity.comments') || 'Comments'}</option>
              <option value="status_change">{t('projects.activity.statusChanges') || 'Status Changes'}</option>
              <option value="assignment">{t('projects.activity.assignments') || 'Assignments'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date} className="mb-8">
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500">{date}</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Activities */}
              <div className="space-y-4">
                {items.map((activity) => {
                  const config = typeConfig[activity.type];
                  const Icon = config.icon;

                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">{activity.user}</span>
                            {' '}{activity.action}{' '}
                            {activity.target && (
                              <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                                {activity.target}
                              </span>
                            )}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.type === 'comment' ? (
                              <span className="italic">&quot;{activity.details}&quot;</span>
                            ) : (
                              activity.details
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('projects.activity.noActivity') || 'No activity found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
