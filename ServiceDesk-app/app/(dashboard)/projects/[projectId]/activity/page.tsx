'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle,
  MessageSquare,
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

interface BackendActivity {
  _id: string;
  type: string;
  actor: {
    _id: string;
    email: string;
    profile?: { firstName: string; lastName: string; avatar?: string };
  } | null;
  description: string;
  metadata: Record<string, unknown>;
  taskId?: { _id: string; key: string; title: string };
  sprintId?: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
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

const mapTypeToDisplay = (type: string): string => {
  const map: Record<string, string> = {
    task_created: 'task_created',
    task_updated: 'status_change',
    task_deleted: 'task_created',
    task_moved: 'status_change',
    status_changed: 'status_change',
    assignee_changed: 'assignment',
    priority_changed: 'status_change',
    comment_added: 'comment',
    comment_updated: 'comment',
    comment_deleted: 'comment',
    sprint_created: 'task_created',
    sprint_started: 'task_completed',
    sprint_completed: 'task_completed',
    project_created: 'task_created',
    project_updated: 'status_change',
    member_added: 'assignment',
    member_removed: 'assignment',
  };
  return map[type] || 'status_change';
};

const mapBackendToItem = (a: BackendActivity): ActivityItem => {
  const actorName = a.actor?.profile
    ? `${a.actor.profile.firstName} ${a.actor.profile.lastName}`.trim()
    : a.actor?.email || 'Unknown';
  const taskTarget = a.taskId ? `${a.taskId.key}: ${a.taskId.title}` : undefined;
  return {
    id: a._id,
    type: mapTypeToDisplay(a.type),
    user: actorName,
    userAvatar: a.actor?.profile?.avatar,
    action: a.description,
    target: taskTarget,
    targetId: a.taskId?._id,
    timestamp: a.createdAt,
  };
};

const typeConfig: Record<string, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (token: string, pageNum = 1) => {
    try {
      const [projRes, actRes] = await Promise.all([
        fetch(`${API_URL}/pm/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/pm/projects/${projectId}/activity?page=${pageNum}&limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const projData = await projRes.json();
      if (projData.success) setProject(projData.data.project);

      const actData = await actRes.json();
      if (actData.success) {
        const mapped = (actData.data.activities || []).map(mapBackendToItem);
        setActivities(mapped);
        setTotalPages(actData.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
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
    fetchData(token, page);
  }, [projectId, router, fetchData, page]);

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
