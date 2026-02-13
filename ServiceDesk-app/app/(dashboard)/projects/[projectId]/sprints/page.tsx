'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Zap,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  Pause,
  BarChart3,
  Users,
  ChevronRight,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    completedPoints: number;
  };
  progress: number;
  velocity?: number;
  team: string[];
}

interface Project {
  _id: string;
  name: string;
  key: string;
  organization?: string | { _id: string };
}



export default function SprintsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [newSprintData, setNewSprintData] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId]);

  const fetchSprints = useCallback(async (token: string, org?: string) => {
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (org) headers['X-Organization-ID'] = org;
      
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        const sprintData = data.data?.sprints || data.data || [];
        // Map API response to Sprint interface
        const mappedSprints: Sprint[] = sprintData.map((s: { _id?: string; id?: string; name: string; goal?: string; startDate: string; endDate: string; status: string; stats?: { totalTasks: number; completedTasks: number; totalPoints: number; completedPoints: number }; progress?: number; velocity?: number | { planned?: number; completed?: number }; team?: string[] }) => ({
          id: s._id || s.id,
          name: s.name,
          goal: s.goal,
          startDate: s.startDate,
          endDate: s.endDate,
          status: s.status as Sprint['status'],
          stats: s.stats || { totalTasks: 0, completedTasks: 0, totalPoints: 0, completedPoints: 0 },
          progress: s.progress || 0,
          velocity: typeof s.velocity === 'number' ? s.velocity : (s.velocity?.completed ?? s.velocity?.planned),
          team: s.team || [],
        }));
        setSprints(mappedSprints);
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
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

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !project) return;
    const orgId = typeof project.organization === 'string' ? project.organization : project.organization?._id;
    if (orgId) localStorage.setItem('organizationId', orgId);
    fetchSprints(token, orgId);
  }, [project, fetchSprints]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getAverageVelocity = () => {
    const completedSprints = sprints.filter(s => s.status === 'completed' && s.velocity);
    if (completedSprints.length === 0) return 0;
    return Math.round(completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0) / completedSprints.length);
  };

  const handleCreateSprint = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !newSprintData.startDate || !newSprintData.endDate) return;
    setIsCreating(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const orgId = typeof project?.organization === 'string' ? project.organization : project?.organization?._id;
      if (orgId) headers['X-Organization-ID'] = orgId;
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newSprintData),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewSprintModal(false);
        setNewSprintData({ name: '', goal: '', startDate: '', endDate: '' });
        fetchSprints(token, orgId);
      } else {
        alert(data.error || 'Failed to create sprint');
      }
    } catch (error) {
      console.error('Failed to create sprint:', error);
      alert('Failed to create sprint');
    } finally {
      setIsCreating(false);
    }
  };

  const activeSprint = sprints.find(s => s.status === 'active');

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
      <ProjectToolbar
        searchPlaceholder={t('projects.sprints.title')}
        primaryAction={{
          label: t('projects.backlog.createSprint'),
          onClick: () => setShowNewSprintModal(true),
        }}
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">{t('projects.sprints.velocity')}: <span className="font-semibold">{getAverageVelocity()} pts</span></span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">{sprints.filter(s => s.status === 'completed').length} {t('projects.summary.completedTasks')}</span>
          </div>
          {activeSprint && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">
                {getDaysRemaining(activeSprint.endDate)} {t('projects.sprints.daysLeft') || 'days left in'} {activeSprint.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sprints List */}
        <div className={`${selectedSprint ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          <div className="space-y-4">
            {sprints.map((sprint) => {
              const statusConfig = {
                planning: { label: t('projects.sprints.planning') || 'Planning', color: 'bg-gray-100 text-gray-700', icon: Calendar },
                active: { label: t('projects.sprints.active') || 'Active', color: 'bg-green-100 text-green-700', icon: Play },
                completed: { label: t('projects.board.columns.done'), color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
                cancelled: { label: t('projects.sprints.cancelled') || 'Cancelled', color: 'bg-red-100 text-red-700', icon: Pause },
              };
              const StatusIcon = statusConfig[sprint.status].icon;

              return (
                <div
                  key={sprint.id}
                  onClick={() => setSelectedSprint(sprint)}
                  className={`bg-white border rounded-xl p-5 cursor-pointer transition-all ${
                    selectedSprint?.id === sprint.id 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  } ${sprint.status === 'active' ? 'ring-2 ring-green-100 border-green-300' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[sprint.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[sprint.status].label}
                        </span>
                      </div>
                      {sprint.goal && (
                        <p className="text-sm text-gray-500">{sprint.goal}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </span>
                    {sprint.team.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {sprint.team.length} {t('projects.team.members')}
                      </span>
                    )}
                  </div>

                  {/* Progress - always show */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {sprint.stats.completedTasks} / {sprint.stats.totalTasks} {t('projects.summary.tasks') || 'tasks'}
                      </span>
                      <span className="font-medium text-gray-900">{sprint.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          sprint.status === 'completed' ? 'bg-blue-500' :
                          sprint.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                    {sprint.stats.totalPoints > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {sprint.stats.completedPoints} / {sprint.stats.totalPoints} {t('projects.sprints.points') || 'points'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sprint Detail Panel */}
        {selectedSprint && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedSprint.name}</h2>
                  {selectedSprint.goal && (
                    <p className="text-gray-600 mt-1">{selectedSprint.goal}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedSprint.status === 'planning' ? 'bg-gray-100 text-gray-700' :
                  selectedSprint.status === 'active' ? 'bg-green-100 text-green-700' :
                  selectedSprint.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedSprint.status === 'planning' ? t('projects.sprints.planning') || 'Planning' :
                   selectedSprint.status === 'active' ? t('projects.sprints.active') || 'Active' :
                   selectedSprint.status === 'completed' ? t('projects.board.columns.done') :
                   t('projects.sprints.cancelled') || 'Cancelled'}
                </span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">{t('projects.sprints.startDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedSprint.startDate)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('projects.sprints.endDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedSprint.endDate)}</p>
                </div>
                {selectedSprint.status === 'active' && (
                  <div className="ml-auto">
                    <p className="text-xs text-gray-500">{t('projects.sprints.remaining') || 'Remaining'}</p>
                    <p className="font-medium text-green-600">{getDaysRemaining(selectedSprint.endDate)} {t('projects.sprints.days') || 'days'}</p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{selectedSprint.stats.totalPoints}</p>
                  <p className="text-sm text-blue-700">{t('projects.sprints.totalPoints') || 'Total Points'}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{selectedSprint.stats.completedPoints}</p>
                  <p className="text-sm text-green-700">{t('projects.summary.completedTasks')}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-600">{selectedSprint.stats.totalTasks}</p>
                  <p className="text-sm text-purple-700">{t('projects.summary.totalTasks')}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-600">{typeof selectedSprint.velocity === 'number' ? selectedSprint.velocity : '-'}</p>
                  <p className="text-sm text-yellow-700">{t('projects.sprints.velocity')}</p>
                </div>
              </div>

              {/* Team */}
              {selectedSprint.team.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('projects.summary.teamMembers')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSprint.team.map((member, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs font-medium text-purple-700">
                          {member[0]}
                        </div>
                        <span className="text-sm text-gray-700">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {selectedSprint.status === 'planning' && (
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    {t('projects.backlog.startSprint')}
                  </button>
                )}
                {selectedSprint.status === 'active' && (
                  <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {t('projects.backlog.completeSprint')}
                  </button>
                )}
                <button className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  {t('projects.common.edit')}
                </button>
                <button
                  onClick={() => router.push(`/projects/${projectId}/board`)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('projects.board.viewBoard') || 'View Board'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Sprint Modal */}
      {showNewSprintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.backlog.createSprint')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.sprints.sprintName')}</label>
                <input
                  type="text"
                  value={newSprintData.name}
                  onChange={(e) => setNewSprintData({ ...newSprintData, name: e.target.value })}
                  placeholder={t('projects.sprints.sprintName')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.backlog.sprintGoal')}</label>
                <textarea
                  value={newSprintData.goal}
                  onChange={(e) => setNewSprintData({ ...newSprintData, goal: e.target.value })}
                  placeholder={t('projects.backlog.goalPlaceholder') || 'What do you want to achieve in this sprint?'}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.sprints.startDate')}</label>
                  <input
                    type="date"
                    value={newSprintData.startDate}
                    onChange={(e) => setNewSprintData({ ...newSprintData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.sprints.endDate')}</label>
                  <input
                    type="date"
                    value={newSprintData.endDate}
                    onChange={(e) => setNewSprintData({ ...newSprintData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowNewSprintModal(false); setNewSprintData({ name: '', goal: '', startDate: '', endDate: '' }); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('projects.common.cancel')}
                </button>
                <button
                  onClick={handleCreateSprint}
                  disabled={!newSprintData.startDate || !newSprintData.endDate || isCreating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (t('projects.common.creating') || 'Creating...') : t('projects.backlog.createSprint')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
