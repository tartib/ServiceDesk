'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus, ChevronDown, X, AlertTriangle } from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  SprintSection,
  TaskCard,
  LoadingState,
  TaskDetailPanel,
  QuickCreateTask,
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
  storyPoints?: number;
  assignee?: {
    _id: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
  };
  sprint?: { _id: string; name: string };
  team?: { _id: string; name: string };
  labels?: string[];
  dueDate?: string;
  startDate?: string;
  parent?: { _id: string; key: string; title: string };
  reporter?: {
    _id: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
  };
  description?: string;
}

interface Sprint {
  _id: string;
  name: string;
  number: number;
  status: 'planning' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  stats?: { totalTasks: number; completedTasks: number; totalPoints: number; completedPoints: number };
}

interface TeamData {
  _id: string;
  name: string;
  description?: string;
  members: Array<{ userId: string; role: string }>;
}

interface TeamResponse {
  team?: TeamData;
  _id?: string;
  name?: string;
  description?: string;
  members?: Array<{ userId: string; role: string }>;
}

export default function BacklogPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedIssue = searchParams?.get('selectedIssue');
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<{ name: string; key: string; organization?: string; organizationId?: string } | null>(null);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [sprintTasks, setSprintTasks] = useState<Record<string, Task[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [newSprintData, setNewSprintData] = useState({ name: '', startDate: '', endDate: '', goal: '' });
  
  // Task Detail Panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<Array<{
    _id: string;
    name?: string;
    email?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
  }>>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Array<{
    _id: string;
    name: string;
    description?: string;
    members: Array<{ userId: string; role: string }>;
  }>>([]);
  
  // US2: Complete Sprint Modal
  const [showCompleteSprintModal, setShowCompleteSprintModal] = useState(false);
  const [completingSprintId, setCompletingSprintId] = useState<string | null>(null);
  const [incompleteTasksDestination, setIncompleteTasksDestination] = useState<'backlog' | 'next'>('backlog');
  
  // US6: Selected tasks for bulk operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // US7: Delete Sprint Confirmation
  const [showDeleteSprintModal, setShowDeleteSprintModal] = useState(false);
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null);
  
  // Create Task in Backlog
  const [showCreateBacklogTask, setShowCreateBacklogTask] = useState(false);

  const fetchData = useCallback(async (token: string) => {
    try {
      const [projectRes, sprintsRes, backlogRes, membersRes, teamsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/backlog`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const projectData = await projectRes.json();
      const sprintsData = await sprintsRes.json();
      const backlogData = await backlogRes.json();
      const membersData = await membersRes.json();
      const teamsData = await teamsRes.json();
      
      if (projectData.success) setProject(projectData.data.project);
      if (sprintsData.success) {
        setSprints(sprintsData.data.sprints || []);
        setAllSprints(sprintsData.data.sprints || []);
      }
      if (backlogData.success) setBacklogTasks(backlogData.data.tasks || []);
      if (membersData.success) {
        console.log('📋 Members API Response:', membersData);
        const members = membersData.data?.members || [];
        console.log('👥 Raw members array:', members);
        
        const mappedMembers = members
          .map((m: { user?: { _id: string; profile: { firstName: string; lastName: string; avatar?: string } }; _id: string; profile?: { firstName: string; lastName: string; avatar?: string } }) => {
            // Handle both nested user structure and direct structure
            const userId = m.user?._id || m._id;
            const userProfile = m.user?.profile || m.profile;
            
            if (!userId || !userProfile) {
              console.warn('⚠️ Skipping member with missing data:', m);
              return null;
            }
            
            return {
              _id: userId,
              profile: userProfile
            };
          })
          .filter((m: { _id: string; profile: { firstName: string; lastName: string; avatar?: string } } | null): m is { _id: string; profile: { firstName: string; lastName: string; avatar?: string } } => m !== null);
        
        console.log('✅ Mapped members:', mappedMembers);
        setProjectMembers(mappedMembers);
      } else {
        console.error('❌ Members API failed:', membersData);
      }
      if (teamsData.success) {
        const teamsArray = teamsData.data?.teams || [];
        const extractedTeams = teamsArray.map((item: TeamResponse) => 
          'team' in item ? item.team : item
        ).filter((team: TeamData | undefined): team is TeamData => Boolean(team && team._id && team.name));
        setTeams(extractedTeams);
      }
    } catch (error) { console.error('Failed to fetch data:', error); }
    finally { setIsLoading(false); }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [projectId, router, fetchData]);

  // Fetch task detail when selectedIssue changes
  useEffect(() => {
    if (selectedIssue) {
      const allTasks = [...backlogTasks, ...Object.values(sprintTasks).flat()];
      const task = allTasks.find(t => t.key === selectedIssue);
      if (task) {
        setSelectedTask(task);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          fetch(`http://localhost:5000/api/v1/pm/tasks/${task._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) setTaskDetail(data.data.task);
            })
            .catch(error => console.error('Failed to fetch task detail:', error));
        }
      }
    } else {
      setSelectedTask(null);
      setTaskDetail(null);
    }
  }, [selectedIssue, backlogTasks, sprintTasks]);

  const fetchSprintTasks = async (sprintId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSprintTasks(prev => ({ ...prev, [sprintId]: data.data.tasks || [] }));
    } catch (error) { console.error('Failed to fetch sprint tasks:', error); }
  };

  const toggleSprint = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) { newExpanded.delete(sprintId); }
    else { newExpanded.add(sprintId); if (!sprintTasks[sprintId]) fetchSprintTasks(sprintId); }
    setExpandedSprints(newExpanded);
  };

  const handleCreateSprint = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !newSprintData.startDate || !newSprintData.endDate) {
      console.error('❌ Create sprint: missing token or dates', { token: !!token, startDate: newSprintData.startDate, endDate: newSprintData.endDate });
      return;
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const orgId = project?.organizationId || project?.organization;
    if (orgId) headers['X-Organization-ID'] = orgId;
    try {
      console.log('🚀 Creating sprint:', newSprintData);
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newSprintData),
      });
      const data = await res.json();
      console.log('📋 Create sprint response:', data);
      if (data.success) {
        setShowNewSprintModal(false);
        setNewSprintData({ name: '', startDate: '', endDate: '', goal: '' });
        fetchData(token);
      } else {
        console.error('❌ Create sprint failed:', data.error || data.errors);
        alert(data.error || 'Failed to create sprint');
      }
    } catch (error) {
      console.error('❌ Failed to create sprint:', error);
      alert('Failed to create sprint. Check console for details.');
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/sprints/${sprintId}/start`, { method: 'POST', headers });
      fetchData(token);
    } catch (error) { console.error('Failed to start sprint:', error); }
  };

  const handleMoveToSprint = async (taskId: string, sprintId: string | null) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/move`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sprintId }),
      });
      fetchData(token);
      if (sprintId) fetchSprintTasks(sprintId);
    } catch (error) { console.error('Failed to move task:', error); }
  };

  // US2: Complete Sprint Handler
  const handleCompleteSprint = async () => {
    if (!completingSprintId) return;
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/sprints/${completingSprintId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ moveIncompleteTo: incompleteTasksDestination }),
      });
      setShowCompleteSprintModal(false);
      setCompletingSprintId(null);
      fetchData(token);
    } catch (error) { console.error('Failed to complete sprint:', error); }
  };

  // US4: Create Task in Sprint
  const handleCreateTaskInSprint = async (sprintId: string, summary: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !summary.trim()) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: summary, sprintId, type: 'task' }),
      });
      fetchSprintTasks(sprintId);
    } catch (error) { console.error('Failed to create task:', error); }
  };

  // US6: Task Selection Handler
  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(taskId);
      else newSet.delete(taskId);
      return newSet;
    });
  };

  // US7: Rename Sprint Handler
  const handleRenameSprint = async (sprintId: string, newName: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/sprints/${sprintId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: newName }),
      });
      fetchData(token);
    } catch (error) { console.error('Failed to rename sprint:', error); }
  };

  // US7: Delete Sprint Handler
  const handleDeleteSprint = async () => {
    if (!deletingSprintId) return;
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (project?.organization) headers['X-Organization-ID'] = project.organization;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/sprints/${deletingSprintId}`, {
        method: 'DELETE',
        headers,
      });
      setShowDeleteSprintModal(false);
      setDeletingSprintId(null);
      fetchData(token);
    } catch (error) { console.error('Failed to delete sprint:', error); }
  };

  // Create Task in Backlog Handler
  const handleTaskCreated = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      fetchData(token);
      setShowCreateBacklogTask(false);
    }
  };

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
        searchPlaceholder={t('projects.backlog.title')}
        members={projectMembers}
        showStats
        showBranch
      />

      {/* Backlog + Detail Panel Container */}
      <div className="flex-1 flex min-h-0">
        {/* Backlog Content */}
        <div className="flex-1 px-2 sm:px-4 py-2 space-y-2 overflow-y-auto">
        {/* Sprints */}
        {sprints.map((sprint) => (
          <SprintSection
            key={sprint._id}
            id={sprint._id}
            name={sprint.name}
            startDate={sprint.startDate}
            endDate={sprint.endDate}
            status={sprint.status}
            stats={sprint.stats}
            tasks={sprintTasks[sprint._id] || []}
            isExpanded={expandedSprints.has(sprint._id)}
            onToggle={() => toggleSprint(sprint._id)}
            onStartSprint={() => handleStartSprint(sprint._id)}
            onCompleteSprint={() => { setCompletingSprintId(sprint._id); setShowCompleteSprintModal(true); }}
            onTaskClick={(task) => router.push(`/projects/${projectId}/backlog?selectedIssue=${task.key}`)}
            onCreateTask={(summary) => handleCreateTaskInSprint(sprint._id, summary)}
            onTaskSelect={handleTaskSelect}
            selectedTasks={selectedTasks}
            onRenameSprint={(newName) => handleRenameSprint(sprint._id, newName)}
            onDeleteSprint={() => { setDeletingSprintId(sprint._id); setShowDeleteSprintModal(true); }}
            onMoveWorkItems={() => {}}
            onReorderSprint={() => {}}
          />
        ))}

        {/* Backlog Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2.5 gap-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 bg-white" />
              <ChevronDown className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">{t('projects.backlog.title')}</span>
              <span className="text-gray-500 text-sm">({backlogTasks.length} {t('projects.common.items') || 'items'})</span>
            </div>
            <button 
              onClick={() => setShowNewSprintModal(true)} 
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg text-sm transition-colors"
            >
              {t('projects.backlog.createSprint')}
            </button>
          </div>
          <div className="border-t border-gray-200">
            {backlogTasks.length === 0 ? (
              <div className="px-3 py-8 text-gray-400 text-sm text-center">{t('projects.backlog.noItems') || 'No items in backlog'}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {backlogTasks.map((task) => (
                  <div key={task._id} className="group">
                    <TaskCard
                      taskKey={task.key}
                      title={task.title}
                      type={task.type}
                      priority={task.priority}
                      status={task.status}
                      assignee={task.assignee}
                      onClick={() => router.push(`/projects/${projectId}/backlog?selectedIssue=${task.key}`)}
                      variant="list"
                      showStatus
                    />
                    {/* Move to Sprint - Mobile friendly */}
                    <div className="px-3 pb-2 sm:hidden">
                      <select 
                        onChange={(e) => { if (e.target.value) handleMoveToSprint(task._id, e.target.value); }} 
                        className="w-full text-xs bg-gray-50 text-gray-900 rounded-lg px-3 py-2 border border-gray-300"
                      >
                        <option value="">{t('projects.backlog.moveToSprint') || 'Move to sprint...'}</option>
                        {sprints.filter(s => s.status !== 'completed').map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Create button */}
            <div className="border-t border-gray-100">
              {showCreateBacklogTask ? (
                <div className="p-3">
                  <QuickCreateTask
                    projectId={projectId}
                    organizationId={project?.organization}
                    teamMembers={projectMembers}
                    onTaskCreated={handleTaskCreated}
                    onCancel={() => setShowCreateBacklogTask(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateBacklogTask(true)}
                  className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 w-full text-sm transition-colors"
                  aria-label={t('projects.backlog.createTask') || 'Create task'}
                >
                  <Plus className="h-4 w-4" />{t('projects.common.create')}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Task Detail Panel */}
        {selectedIssue && selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            taskDetail={taskDetail}
            projectId={projectId}
            onClose={() => router.push(`/projects/${projectId}/backlog`)}
            onTaskUpdate={() => {
              const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
              if (token) {
                fetchData(token);
                // Refetch task detail to show updated info (sprint, type, etc.)
                if (selectedTask) {
                  fetch(`http://localhost:5000/api/v1/pm/tasks/${selectedTask._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        setTaskDetail(data.data.task);
                        setSelectedTask(data.data.task); // Update selectedTask to reflect changes
                      }
                    })
                    .catch(error => console.error('Failed to fetch task detail:', error));
                }
              }
            }}
            teamMembers={projectMembers}
            sprints={allSprints}
            availableLabels={[]}
            availableTeams={teams}
          />
        )}
      </div>

      {/* Create Sprint Modal */}
      {showNewSprintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t('projects.backlog.createSprint')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('projects.sprints.sprintName')}</label>
                <input 
                  type="text" 
                  value={newSprintData.name} 
                  onChange={(e) => setNewSprintData({ ...newSprintData, name: e.target.value })} 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder={t('projects.sprints.sprintName')} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">{t('projects.sprints.startDate')}</label>
                  <input 
                    type="date" 
                    value={newSprintData.startDate} 
                    onChange={(e) => setNewSprintData({ ...newSprintData, startDate: e.target.value })} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">{t('projects.sprints.endDate')}</label>
                  <input 
                    type="date" 
                    value={newSprintData.endDate} 
                    onChange={(e) => setNewSprintData({ ...newSprintData, endDate: e.target.value })} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('projects.backlog.sprintGoal')}</label>
                <textarea 
                  value={newSprintData.goal} 
                  onChange={(e) => setNewSprintData({ ...newSprintData, goal: e.target.value })} 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  rows={2} 
                  placeholder={t('projects.backlog.goalPlaceholder') || 'What do we want to achieve?'} 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowNewSprintModal(false)} 
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('projects.common.cancel')}
                </button>
                <button 
                  onClick={handleCreateSprint} 
                  disabled={!newSprintData.startDate || !newSprintData.endDate} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('projects.common.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* US2: Complete Sprint Modal */}
      {showCompleteSprintModal && completingSprintId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {t('projects.backlog.completeSprint') || 'Complete Sprint'}
              </h2>
              <button 
                onClick={() => { setShowCompleteSprintModal(false); setCompletingSprintId(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">
                    {t('projects.sprints.completeSprintWarning') || 'Completing this sprint will close it. Any incomplete tasks will be moved based on your selection below.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('projects.sprints.moveIncompleteTasks') || 'Move incomplete tasks to:'}
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    incompleteTasksDestination === 'backlog' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="destination"
                      value="backlog"
                      checked={incompleteTasksDestination === 'backlog'}
                      onChange={() => setIncompleteTasksDestination('backlog')}
                    />
                    <span className="text-gray-900">{t('projects.backlog.title') || 'Backlog'}</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    incompleteTasksDestination === 'next' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="destination"
                      value="next"
                      checked={incompleteTasksDestination === 'next'}
                      onChange={() => setIncompleteTasksDestination('next')}
                    />
                    <span className="text-gray-900">{t('projects.sprints.nextSprint') || 'Next Sprint'}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowCompleteSprintModal(false); setCompletingSprintId(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('projects.common.cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handleCompleteSprint}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('projects.backlog.completeSprint') || 'Complete Sprint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* US7: Delete Sprint Confirmation Modal */}
      {showDeleteSprintModal && deletingSprintId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-red-600">
                {t('projects.sprints.deleteSprint') || 'Delete Sprint'}
              </h2>
              <button 
                onClick={() => { setShowDeleteSprintModal(false); setDeletingSprintId(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">
                    {t('projects.sprints.deleteSprintWarning') || 'Are you sure you want to delete this sprint? Tasks in this sprint will be moved to the backlog.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowDeleteSprintModal(false); setDeletingSprintId(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('projects.common.cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handleDeleteSprint}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('projects.common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
