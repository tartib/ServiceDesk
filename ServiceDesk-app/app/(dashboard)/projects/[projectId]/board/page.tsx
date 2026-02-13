'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Settings,
  MoreHorizontal,
  User,
  ChevronDown,
  Users,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
  TaskDetailPanel,
  StatusManagementModal,
  AddStatusModal,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DraggableTaskCard } from '@/components/projects/DraggableTaskCard';
import { DroppableColumn } from '@/components/projects/DroppableColumn';
import { SprintHeader } from '@/components/projects/SprintHeader';
import { CompleteSprintModal } from '@/components/projects/CompleteSprintModal';

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

interface Project {
  _id: string;
  name: string;
  key: string;
  organization?: string;
  methodology: {
    code: string;
  };
}

interface WorkflowStatus {
  id: string;
  name: string;
  category: string;
  color: string;
}

interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
}

const defaultStatuses: WorkflowStatus[] = [
  { id: 'backlog', name: 'Backlog', category: 'todo', color: '#6B7280' },
  { id: 'ready', name: 'Ready', category: 'todo', color: '#3B82F6' },
  { id: 'in-progress', name: 'In Progress', category: 'in_progress', color: '#F59E0B' },
  { id: 'in-review', name: 'In Review', category: 'in_progress', color: '#8B5CF6' },
  { id: 'done', name: 'Done', category: 'done', color: '#10B981' },
];

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const selectedIssue = searchParams.get('selectedIssue');
  const { t } = useLanguage();
  
  const { methodology } = useMethodology(projectId);
  const isScrum = methodology === 'scrum';

  const [project, setProject] = useState<Project | null>(null);
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, Task[]>>({});
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>(defaultStatuses);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusManagementModal, setShowStatusManagementModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('epic');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('idea');
  const [newTaskAssignee, setNewTaskAssignee] = useState('automatic');
  const [newTaskLabels, setNewTaskLabels] = useState<string[]>([]);
  const [newTaskParent, setNewTaskParent] = useState('');
  const [newTaskTeam, setNewTaskTeam] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskSprint, setNewTaskSprint] = useState('');
  const [newTaskStoryPoints, setNewTaskStoryPoints] = useState('');
  const [newTaskFlagged, setNewTaskFlagged] = useState(false);
  const [newTaskColor, setNewTaskColor] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [showCompleteSprintModal, setShowCompleteSprintModal] = useState(false);
  const [selectedAssigneeFilters, setSelectedAssigneeFilters] = useState<string[]>([]);
  const [showAssigneeList, setShowAssigneeList] = useState(true);
  const [projectMembers, setProjectMembers] = useState<Array<{
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  }>>([]);
  const [teams, setTeams] = useState<Array<{
    _id: string;
    name: string;
    description?: string;
    members: Array<{ userId: string; role: string }>;
  }>>([]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top });
  };
  const hideTooltip = () => setTooltip(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNewTaskModal) {
        setShowNewTaskModal(false);
        setShowTypeDropdown(false);
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showNewTaskModal]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const workTypes = [
    { id: 'epic', name: 'Epic', icon: '⚡', color: 'text-purple-400' },
    { id: 'feature', name: 'Feature', icon: '📦', color: 'text-orange-400' },
    { id: 'task', name: 'Task', icon: '✓', color: 'text-blue-400' },
    { id: 'story', name: 'Story', icon: '📖', color: 'text-green-400' },
    { id: 'bug', name: 'Bug', icon: '🐛', color: 'text-red-400' },
  ];

  const taskStatuses = [
    { id: 'idea', name: 'Idea', color: 'bg-slate-500' },
    { id: 'todo', name: 'To Do', color: 'bg-blue-500' },
    { id: 'in_progress', name: 'In Progress', color: 'bg-yellow-500' },
    { id: 'done', name: 'Done', color: 'bg-green-500' },
  ];

  const issueColors = [
    { id: '', name: 'None', color: 'bg-transparent' },
    { id: 'dark-yellow', name: 'Dark yellow', color: 'bg-yellow-600' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'green', name: 'Green', color: 'bg-green-500' },
    { id: 'red', name: 'Red', color: 'bg-red-500' },
    { id: 'purple', name: 'Purple', color: 'bg-purple-500' },
  ];

  const fetchProject = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const projectData = data.data.project;
        setProject({
          ...projectData,
          organization: projectData.organization || projectData.organizationId
        });
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId]);

  const fetchTeams = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const teamsData = data.data?.teams || [];
        const extractedTeams = teamsData.map((item: { team?: { _id: string; name: string; description?: string; members: Array<{ userId: string; role: string }> }; role?: string } | { _id: string; name: string; description?: string; members: Array<{ userId: string; role: string }> }) => 
          'team' in item ? item.team : item
        ).filter((team: { _id: string; name: string } | undefined): team is { _id: string; name: string; description?: string; members: Array<{ userId: string; role: string }> } => 
          Boolean(team && team._id && team.name)
        );
        setTeams(extractedTeams);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  }, [projectId]);

  const fetchSprints = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAllSprints(data.data.sprints || []);
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    }
  }, [projectId]);

  // TODO: Uncomment when backend route is implemented
  // const fetchWorkflowStatuses = useCallback(async (token: string) => {
  //   try {
  //     const headers: Record<string, string> = {
  //       Authorization: `Bearer ${token}`,
  //     };
  //     if (project?.organization) {
  //       headers['X-Organization-ID'] = project.organization;
  //     }

  //     const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/workflow/statuses`, {
  //       headers,
  //     });
  //     const data = await response.json();
  //     if (data.success && data.data.statuses) {
  //       // Map backend statuses to frontend format
  //       const mappedStatuses = data.data.statuses.map((s: { id: string; name: string; category: string; color: string }) => ({
  //         id: s.id,
  //         name: s.name,
  //         category: s.category.toLowerCase().replace('_', '_'),
  //         color: s.color,
  //       }));
  //       setStatuses(mappedStatuses);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch workflow statuses:', error);
  //     // Keep default statuses on error
  //   }
  // }, [projectId, project?.organization]);

  const fetchBoardTasks = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/board`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('📋 Board API response:', { 
        success: data.success, 
        columns: data.data?.board?.columns?.map((c: { statusId: string; name: string }) => c.name),
        activeSprint: data.data?.activeSprint?.name,
        taskCount: Object.values(data.data?.tasksByStatus || {}).flat().length,
      });
      if (data.success) {
        setTasksByStatus(data.data.tasksByStatus || {});
        if (data.data.activeSprint) {
          setActiveSprint(data.data.activeSprint);
        }
        
        // Update statuses from board columns (backend auto-syncs workflow to board)
        if (data.data.board?.columns) {
          const inferCategory = (name: string, statusId: string): string => {
            const lower = (name || statusId).toLowerCase();
            if (lower === 'done' || lower === 'completed' || lower === 'closed') return 'done';
            if (lower.includes('progress') || lower.includes('review') || lower.includes('testing') || lower.includes('active')) return 'in_progress';
            return 'todo';
          };
          const inferColor = (category: string): string => {
            if (category === 'done') return '#10B981';
            if (category === 'in_progress') return '#F59E0B';
            return '#6B7280';
          };
          const boardStatuses = data.data.board.columns
            .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
            .map((col: { statusId: string; name: string; category?: string; color?: string }) => {
              const category = col.category || inferCategory(col.name, col.statusId);
              return {
                id: col.statusId,
                name: col.name,
                category,
                color: col.color || inferColor(category),
              };
            });
          setStatuses(boardStatuses);
        }
        
        // Flatten all tasks for lookup
        const all: Task[] = [];
        Object.values(data.data.tasksByStatus || {}).forEach((tasks: unknown) => {
          all.push(...(tasks as Task[]));
        });
        setAllTasks(all);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch task detail when selectedIssue changes
  const fetchTaskDetail = useCallback(async (taskKey: string, token: string) => {
    try {
      // Find task ID from allTasks by key
      const task = allTasks.find(t => t.key === taskKey);
      if (task) {
        setSelectedTask(task);
        // Fetch full task details
        const res = await fetch(`http://localhost:5000/api/v1/pm/tasks/${task._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setTaskDetail(data.data.task);
        }
      }
    } catch (error) {
      console.error('Failed to fetch task detail:', error);
    }
  }, [allTasks]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProject(token);
    // fetchWorkflowStatuses(token); // TODO: Enable when backend route exists
    fetchBoardTasks(token);
    fetchTeams(token);
    if (isScrum) fetchSprints(token);
  }, [projectId, router, fetchProject, fetchBoardTasks, fetchTeams, fetchSprints, isScrum]);

  // Fallback: detect active sprint from allSprints if board endpoint didn't return one
  useEffect(() => {
    if (isScrum && !activeSprint && allSprints.length > 0) {
      const active = allSprints.find(s => s.status === 'active');
      if (active) setActiveSprint(active);
    }
  }, [isScrum, activeSprint, allSprints]);

  // Handle selectedIssue from URL
  useEffect(() => {
    if (selectedIssue && allTasks.length > 0) {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        fetchTaskDetail(selectedIssue, token);
      }
    } else {
      setSelectedTask(null);
      setTaskDetail(null);
    }
  }, [selectedIssue, allTasks, fetchTaskDetail]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          type: newTaskType,
          description: newTaskDescription,
          status: newTaskStatus,
          assignee: newTaskAssignee === 'me' ? 'current-user' : newTaskAssignee === 'automatic' ? null : newTaskAssignee,
          dueDate: newTaskDueDate || null,
          startDate: newTaskStartDate || null,
          storyPoints: newTaskStoryPoints ? parseInt(newTaskStoryPoints) : null,
          flagged: newTaskFlagged,
          color: newTaskColor || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }
      
      if (data.success) {
        toast.success(t('projects.board.taskCreated') || 'Task created successfully!');
        
        // Reset form
        setNewTaskTitle('');
        setNewTaskType('epic');
        setNewTaskDescription('');
        setNewTaskStatus('idea');
        setNewTaskAssignee('automatic');
        setNewTaskDueDate('');
        setNewTaskStartDate('');
        setNewTaskStoryPoints('');
        setNewTaskFlagged(false);
        setNewTaskColor('');
        
        if (!createAnother) {
          setShowNewTaskModal(false);
        }
        
        fetchBoardTasks(token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      console.error('Failed to create task:', error);
      toast.error(errorMessage || t('projects.board.taskCreateFailed') || 'Failed to create task');
    }
  };

  const handleMoveTask = async (taskId: string, newStatusId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    const previousTasksByStatus = { ...tasksByStatus };
    
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;

    const oldStatusId = task.status.id;
    
    const optimisticUpdate = () => {
      const updated = { ...tasksByStatus };
      
      if (updated[oldStatusId]) {
        updated[oldStatusId] = updated[oldStatusId].filter(t => t._id !== taskId);
      }
      
      // Find the target status to get correct name and category
      const targetStatus = statuses.find(s => s.id === newStatusId);
      const updatedTask = {
        ...task,
        status: {
          id: newStatusId,
          name: targetStatus?.name || task.status.name,
          category: targetStatus?.category || task.status.category,
        },
      };
      if (!updated[newStatusId]) {
        updated[newStatusId] = [];
      }
      updated[newStatusId] = [...updated[newStatusId], updatedTask];
      
      setTasksByStatus(updated);
      
      const all: Task[] = [];
      Object.values(updated).forEach((tasks: Task[]) => {
        all.push(...tasks);
      });
      setAllTasks(all);
    };

    optimisticUpdate();

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setTasksByStatus(previousTasksByStatus);
        const all: Task[] = [];
        Object.values(previousTasksByStatus).forEach((tasks: Task[]) => {
          all.push(...tasks);
        });
        setAllTasks(all);
        
        throw new Error(data.error || data.message || 'Failed to move task');
      }

      if (data.success) {
        fetchBoardTasks(token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      console.error('Move task error:', error);
      toast.error(errorMessage);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatusId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      if (data.success) {
        toast.success(t('projects.board.statusUpdated') || 'Status updated successfully!');
        fetchBoardTasks(token);
        if (selectedTask && selectedTask._id === taskId) {
          fetchTaskDetail(selectedTask.key, token);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      console.error('Failed to update status:', error);
      toast.error(errorMessage);
    }
  };

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignee: userId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task');
      }

      if (data.success) {
        toast.success(t('projects.board.taskAssigned') || 'Task assigned successfully!');
        fetchBoardTasks(token);
        if (selectedTask && selectedTask._id === taskId) {
          fetchTaskDetail(selectedTask.key, token);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign task';
      console.error('Failed to assign task:', error);
      toast.error(errorMessage);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-500',
      low: 'text-green-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      epic: '⚡',
      story: '📖',
      task: '✓',
      bug: '🐛',
      subtask: '📎',
    };
    return icons[type] || '✓';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatusId = over.id as string;

    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.status.id !== newStatusId) {
      await handleMoveTask(taskId, newStatusId);
    }
  };

  const activeTask = activeId ? allTasks.find(t => t._id === activeId) : null;

  // Fetch project members for assignee filter
  const fetchProjectMembers = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success && data.data?.members) {
        const members = data.data.members.map((m: { userId: { _id: string; name?: string; email?: string; profile?: { firstName: string; lastName: string; avatar?: string } } }) => {
          // Handle both formats: profile object or flat name field
          if (m.userId.profile) {
            return {
              _id: m.userId._id,
              profile: m.userId.profile,
            };
          }
          // Parse name into firstName/lastName
          const nameParts = (m.userId.name || '').split(' ');
          return {
            _id: m.userId._id,
            profile: {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            },
          };
        });
        setProjectMembers(members);
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectMembers();
  }, [fetchProjectMembers]);

  const filteredTasksByStatus = Object.entries(tasksByStatus).reduce((acc, [statusId, tasks]) => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.key.toLowerCase().includes(query)
      );
    }
    
    // Apply assignee filter
    if (selectedAssigneeFilters.length > 0) {
      filtered = filtered.filter(task => {
        // Check for unassigned
        if (selectedAssigneeFilters.includes('unassigned')) {
          if (!task.assignee) return true;
        }
        // Check for specific assignees
        if (task.assignee && selectedAssigneeFilters.includes(task.assignee._id)) {
          return true;
        }
        // If only unassigned is selected and task has assignee, exclude it
        if (selectedAssigneeFilters.length === 1 && selectedAssigneeFilters.includes('unassigned') && task.assignee) {
          return false;
        }
        // If no assignee filters match (and unassigned wasn't the match)
        return selectedAssigneeFilters.includes('unassigned') ? false : false;
      });
    }
    
    acc[statusId] = filtered;
    return acc;
  }, {} as Record<string, Task[]>);

  const handleCompleteSprint = async (moveToBacklog: boolean) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !activeSprint) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/sprints/${activeSprint._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moveToBacklog }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t('projects.board.sprintCompleted') || 'Sprint completed successfully!');
        fetchBoardTasks(token);
        setShowCompleteSprintModal(false);
      }
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      toast.error(t('projects.board.sprintCompleteFailed') || 'Failed to complete sprint');
    }
  };

  const incompleteTasks = allTasks.filter(task => 
    task.status.category !== 'done'
  );

  const completedTasksCount = allTasks.filter(task => 
    task.status.category === 'done'
  ).length;

  // Weighted progress: each stage contributes equally to 100%
  // e.g. 5 columns → Backlog=0%, Ready=25%, In Progress=50%, In Review=75%, Done=100%
  const weightedProgress = (() => {
    if (allTasks.length === 0 || statuses.length <= 1) return 0;
    const stageCount = statuses.length;
    const statusIndexMap = new Map(statuses.map((s, i) => [s.id, i]));
    let totalWeight = 0;
    for (const task of allTasks) {
      const idx = statusIndexMap.get(task.status.id) ?? 0;
      totalWeight += idx / (stageCount - 1);
    }
    return Math.round((totalWeight / allTasks.length) * 100);
  })();

  // Status Management Functions
  const handleAddStatus = async (name: string, category: 'todo' | 'in_progress' | 'done', color: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    if (!project?.organization) {
      toast.error('Organization context required. Please refresh the page.');
      return;
    }

    const statusId = name.toLowerCase().replace(/\s+/g, '-');
    
    // Convert category to uppercase format
    const categoryMap = {
      'todo': 'TODO',
      'in_progress': 'IN_PROGRESS',
      'done': 'DONE'
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Organization-ID': project.organization,
      };

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/workflow/statuses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: statusId,
          name,
          category: categoryMap[category],
          color,
          isInitial: false,
          isFinal: category === 'done'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create status');
      }

      if (data.success) {
        toast.success(t('projects.board.statusCreated') || 'Status created!');
        // Refetch board to get updated columns (backend auto-syncs workflow to board)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          await fetchBoardTasks(token);
        }
      }
    } catch (error) {
      console.error('Failed to create status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create status');
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    if (!project?.organization) {
      toast.error('Organization context required. Please refresh the page.');
      return;
    }

    // Check if status has tasks
    const tasksInStatus = tasksByStatus[statusId] || [];
    if (tasksInStatus.length > 0) {
      toast.error(t('projects.board.cannotDeleteStatusWithTasks') || 'Cannot delete status with tasks');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Organization-ID': project.organization,
      };

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/workflow/statuses/${statusId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete status');
      }

      if (data.success) {
        toast.success(t('projects.board.statusDeleted') || 'Status deleted!');
        // Refetch board to get updated columns (backend auto-syncs workflow to board)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          await fetchBoardTasks(token);
        }
      }
    } catch (error) {
      console.error('Failed to delete status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete status');
    }
  };

  const handleStatusesReorder = async (newStatuses: WorkflowStatus[]) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    if (!project?.organization) {
      toast.error('Organization context required. Please refresh the page.');
      return;
    }

    // Update local state immediately for better UX
    setStatuses(newStatuses);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Organization-ID': project.organization,
      };

      // Create array of status IDs in new order
      const statusOrder = newStatuses.map(s => s.id);

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/workflow/statuses/reorder`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ statusOrder }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reorder statuses');
      }

      if (data.success) {
        toast.success(t('projects.board.statusesReordered') || 'Statuses reordered!');
        // Refetch board to get updated columns (backend auto-syncs workflow to board)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          await fetchBoardTasks(token);
        }
      }
    } catch (error) {
      console.error('Failed to reorder statuses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reorder statuses');
      // Optionally: revert to original order on error
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader projectKey={project?.key} projectName={project?.name} projectId={projectId} />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Board Toolbar */}
      <ProjectToolbar
        searchPlaceholder={t('projects.board.searchPlaceholder') || 'Search board...'}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        showAssigneeFilter={true}
        assignees={projectMembers}
        selectedAssignees={selectedAssigneeFilters}
        onAssigneeFilterChange={setSelectedAssigneeFilters}
        rightActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssigneeList(!showAssigneeList)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded transition-colors ${
                showAssigneeList
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('projects.filter.assignee') || 'Assignee'}</span>
            </button>
            <button 
              onClick={() => setShowStatusManagementModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={t('projects.board.manageWorkTypes') || 'Manage Workflow Statuses'}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Horizontal Assignee & Team Filter Bar */}
      {showAssigneeList && (
        <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-1.5">
          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Assignees */}
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[11px] font-medium text-gray-400 mr-1.5 uppercase tracking-wide">{t('projects.filter.assignee') || 'Assignee'}</span>
              {/* Unassigned */}
              <button
                onClick={() => {
                  if (selectedAssigneeFilters.includes('unassigned')) {
                    setSelectedAssigneeFilters(selectedAssigneeFilters.filter(id => id !== 'unassigned'));
                  } else {
                    setSelectedAssigneeFilters([...selectedAssigneeFilters, 'unassigned']);
                  }
                }}
                onMouseEnter={(e) => showTooltip(e, t('projects.filter.unassigned') || 'Unassigned')}
                onMouseLeave={hideTooltip}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedAssigneeFilters.includes('unassigned')
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </button>

              {/* Project Members */}
              {projectMembers.filter(m => m?.profile).map((member) => {
                const isSelected = selectedAssigneeFilters.includes(member._id);
                const initials = `${member.profile?.firstName?.charAt(0) || ''}${member.profile?.lastName?.charAt(0) || ''}`.toUpperCase();
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                const colorIndex = (member.profile?.firstName?.charCodeAt(0) || 0) % colors.length;
                const fullName = `${member.profile.firstName} ${member.profile.lastName}`;

                return (
                  <button
                    key={member._id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAssigneeFilters(selectedAssigneeFilters.filter(id => id !== member._id));
                      } else {
                        setSelectedAssigneeFilters([...selectedAssigneeFilters, member._id]);
                      }
                    }}
                    onMouseEnter={(e) => showTooltip(e, fullName)}
                    onMouseLeave={hideTooltip}
                    className={`w-7 h-7 rounded-full transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold`}>
                      {initials}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {/* Teams */}
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[11px] font-medium text-gray-400 mr-1.5 uppercase tracking-wide">{t('projects.settings.teams') || 'Teams'}</span>
              {/* All Teams */}
              <button
                onClick={() => setSelectedTeamFilter(null)}
                onMouseEnter={(e) => showTooltip(e, t('projects.board.allTeams') || 'All Teams')}
                onMouseLeave={hideTooltip}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedTeamFilter === null
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </button>

              {/* Team List */}
              {teams.map((team) => {
                const isSelected = selectedTeamFilter === team._id;

                return (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeamFilter(isSelected ? null : team._id)}
                    onMouseEnter={(e) => showTooltip(e, team.name)}
                    onMouseLeave={hideTooltip}
                    className={`w-7 h-7 rounded-full transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-semibold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clear All Filters */}
            {(selectedAssigneeFilters.length > 0 || selectedTeamFilter !== null) && (
              <>
                <div className="w-px h-6 bg-gray-200 shrink-0" />
                <button
                  onClick={() => { setSelectedAssigneeFilters([]); setSelectedTeamFilter(null); }}
                  className="shrink-0 text-[11px] text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-full transition-colors whitespace-nowrap"
                >
                  ✕ {t('projects.filter.clearSelection') || 'Clear'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fixed Tooltip */}
      {tooltip && (
        <div
          className="fixed z-9999 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap pointer-events-none shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip.text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}

      {/* Board + Detail Panel Container */}
      <div className="flex-1 flex min-h-0">
        {/* Board */}
        <div className="flex-1 p-3 md:p-4 overflow-x-auto overflow-y-auto bg-gray-100 min-h-0">
          {isScrum && (
            <SprintHeader
              sprint={activeSprint}
              totalTasks={allTasks.length}
              completedTasks={completedTasksCount}
              weightedProgress={weightedProgress}
              onCompleteSprint={() => setShowCompleteSprintModal(true)}
            />
          )}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-2 md:gap-3 items-stretch min-w-fit">
              {statuses.map((status) => (
                <div key={status.id} className="flex-1 min-w-64">
                  <DroppableColumn
                    id={status.id}
                    title={(() => { const translated = t(`projects.board.status.${status.id}`); return translated && !translated.startsWith('projects.board.status.') ? translated : status.name; })()}
                    count={filteredTasksByStatus[status.id]?.length || 0}
                    taskIds={(filteredTasksByStatus[status.id] || []).map(t => t._id)}
                    showCreateButton={status.id === 'backlog'}
                    onCreateTask={() => setShowNewTaskModal(true)}
                  >
                    {(filteredTasksByStatus[status.id] || []).map((task) => (
                      <DraggableTaskCard
                        key={task._id}
                        task={task}
                        onClick={() => router.push(`/projects/${projectId}/board?selectedIssue=${task.key}`)}
                        getTypeIcon={getTypeIcon}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </DroppableColumn>
                </div>
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg opacity-90">
                  <p className="text-sm text-gray-900 mb-3">{activeTask.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                      {activeTask.key}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Task Detail Panel */}
      {selectedIssue && selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          taskDetail={taskDetail}
          projectId={projectId as string}
          onClose={() => router.push(`/projects/${projectId}/board`)}
          onTaskUpdate={() => {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            if (token) fetchBoardTasks(token);
          }}
          teamMembers={projectMembers}
          sprints={isScrum ? allSprints : []}
          availableLabels={[]}
          availableTeams={teams}
        />
      )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div data-testid="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowNewTaskModal(false); setShowTypeDropdown(false); setShowStatusDropdown(false); } }} className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-8 overflow-y-auto">
          <div data-testid="create-task-modal" className="bg-white rounded-lg w-full max-w-2xl shadow-2xl mb-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('projects.board.createTask') || 'Create'} {workTypes.find(w => w.id === newTaskType)?.name || 'Epic'}</h2>
              <div className="flex items-center gap-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">—</button>
                <button className="p-1 text-gray-400 hover:text-gray-600">⤢</button>
                <button className="p-1 text-gray-400 hover:text-gray-600">•••</button>
                <button data-testid="modal-close-btn" onClick={() => { setShowNewTaskModal(false); setShowTypeDropdown(false); setShowStatusDropdown(false); }} className="p-1 text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-500 mb-4">{t('projects.board.requiredFields') || 'Required fields are marked with an asterisk'} <span className="text-red-500">*</span></p>

              {/* Space/Project */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.space') || 'Space'} <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
                  <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-xs font-bold">
                    {project?.key?.substring(0, 2) || 'PR'}
                  </div>
                  <span>{project?.name} ({project?.key})</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>

              {/* Work Type */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.workType') || 'Work type'} <span className="text-red-500">*</span></label>
                <button
                  onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700 border border-blue-500 rounded text-white"
                >
                  <span>{workTypes.find(w => w.id === newTaskType)?.icon}</span>
                  <span>{workTypes.find(w => w.id === newTaskType)?.name}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </button>
                <a href="#" className="text-sm text-blue-500 hover:underline mt-1 inline-block">{t('projects.board.learnWorkTypes') || 'Learn about work types'}</a>
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {workTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => { setNewTaskType(type.id); setShowTypeDropdown(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left ${newTaskType === type.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-200">
                      <button className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-100">{t('projects.board.addWorkType') || 'Add work type'}</button>
                      <button className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-100">{t('projects.board.editWorkType') || 'Edit work type'}</button>
                      <button className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-100">{t('projects.board.manageWorkTypes') || 'Manage work types'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.common.status') || 'Status'}</label>
                <button
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900"
                >
                  <span className={`w-2 h-2 rounded-full ${taskStatuses.find(s => s.id === newTaskStatus)?.color}`}></span>
                  <span>{taskStatuses.find(s => s.id === newTaskStatus)?.name}</span>
                  <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                </button>
                <p className="text-xs text-gray-500 mt-1">{t('projects.board.initialStatus') || 'This is the initial status upon creation'}</p>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {taskStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => { setNewTaskStatus(status.id); setShowStatusDropdown(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left ${newTaskStatus === status.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                        <span>{status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title/Summary */}
              <div className="mb-4">
                <label data-testid="task-title-label" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.summary') || 'Summary'} <span className="text-red-500">*</span></label>
                <input
                  data-testid="task-title-input"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!newTaskTitle.trim() ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t('projects.board.enterSummary') || 'Enter a summary'}
                  autoFocus
                />
                {!newTaskTitle.trim() && <p data-testid="task-title-error" className="text-xs text-red-500 mt-1">{t('projects.board.summaryRequired') || 'Summary is required'}</p>}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.common.description') || 'Description'}</label>
                <div className="border border-gray-300 rounded">
                  <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50">
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">¶</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded font-bold">B</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded italic">I</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded underline">U</button>
                    <span className="w-px h-4 bg-gray-300 mx-1"></span>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">≡</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">•</button>
                    <span className="w-px h-4 bg-gray-300 mx-1"></span>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">🔗</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">📷</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">@</button>
                    <button className="p-1 text-gray-500 hover:bg-gray-200 rounded">😊</button>
                  </div>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
                    rows={3}
                    placeholder={t('projects.board.descriptionPlaceholder') || 'Pro tip: Type / to add tables, images, code blocks, and more.'}
                  />
                </div>
              </div>

              {/* Assignee */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.assignee') || 'Assignee'}</label>
                <button
                  type="button"
                  onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setShowTypeDropdown(false); setShowStatusDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900"
                >
                  {newTaskAssignee && newTaskAssignee !== 'automatic' ? (
                    <>
                      {(() => {
                        const member = projectMembers.find(m => m._id === newTaskAssignee);
                        const initials = member?.profile ? `${member.profile.firstName?.charAt(0) || ''}${member.profile.lastName?.charAt(0) || ''}` : 'U';
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                        const colorIndex = (member?.profile?.firstName?.charCodeAt(0) ?? 0) % colors.length;
                        return (
                          <>
                            <div className={`w-6 h-6 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
                              {initials}
                            </div>
                            <span className="truncate">{member?.profile?.firstName} {member?.profile?.lastName}</span>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500">{t('projects.filter.unassigned') || 'Unassigned'}</span>
                    </>
                  )}
                  <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                </button>
                {showAssigneeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {/* Unassigned option */}
                    <button
                      type="button"
                      onClick={() => { setNewTaskAssignee('automatic'); setShowAssigneeDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${newTaskAssignee === 'automatic' || !newTaskAssignee ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span>{t('projects.filter.unassigned') || 'Unassigned'}</span>
                    </button>
                    
                    {/* Members list */}
                    {projectMembers.filter(m => m?.profile).map((member) => {
                      const isSelected = newTaskAssignee === member._id;
                      const initials = `${member.profile?.firstName?.charAt(0) || ''}${member.profile?.lastName?.charAt(0) || ''}`.toUpperCase();
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                      const colorIndex = (member.profile?.firstName?.charCodeAt(0) ?? 0) % colors.length;

                      return (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => { setNewTaskAssignee(member._id); setShowAssigneeDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                        >
                          <div className={`w-6 h-6 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium`}>
                            {initials}
                          </div>
                          <span className="truncate">{member.profile?.firstName} {member.profile?.lastName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => setNewTaskAssignee('me')} className="text-sm text-blue-500 hover:underline mt-1">{t('projects.board.assignToMe') || 'Assign to me'}</button>
              </div>

              {/* Two column layout for smaller fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.labels') || 'Labels'}</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-500">
                    <span>{t('projects.board.selectLabel') || 'Select label'}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </div>
                </div>

                {/* Parent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.parent') || 'Parent'}</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-500">
                    <span>{t('projects.board.selectParent') || 'Select parent'}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('projects.board.hierarchyNote') || 'Your work type hierarchy determines the work items you can select here.'}</p>
                </div>
              </div>

              {/* Team */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.team') || 'Team'}</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-500">
                  <span>{t('projects.board.chooseTeam') || 'Choose a team'}</span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('projects.board.teamNote') || 'Associates a team to an issue. You can use this field to search and filter issues by team.'}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.dueDate') || 'Due date'}</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.startDate') || 'Start date'}</label>
                  <input
                    type="date"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('projects.board.startDateNote') || 'Allows the planned start date for a piece of work to be set.'}</p>
                </div>
              </div>

              {/* Sprint & Story Points */}
              <div className={`grid ${isScrum ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
                {isScrum && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.sprint') || 'Sprint'}</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-500">
                      <span>{t('projects.board.selectSprint') || 'Select sprint'}</span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('projects.board.sprintNote') || 'Jira Software sprint field'}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.storyPoints') || 'Story point estimate'}</label>
                  <input
                    type="number"
                    value={newTaskStoryPoints}
                    onChange={(e) => setNewTaskStoryPoints(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('projects.board.storyPointsNote') || 'Measurement of complexity and/or size of a requirement.'}</p>
                </div>
              </div>

              {/* Reporter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.reporter') || 'Reporter'} <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">LS</div>
                  <span>Lviv solutions</span>
                  <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                </div>
              </div>

              {/* Attachment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.attachment') || 'Attachment'}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-gray-500">{t('projects.board.dropFiles') || 'Drop files to attach or'} <button className="text-blue-500 hover:underline">{t('projects.board.browse') || 'Browse'}</button></p>
                </div>
              </div>

              {/* Linked Work Items */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.linkedWorkItems') || 'Linked Work items'}</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-500">
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">added to idea</span>
                  <input type="text" placeholder={t('projects.board.typePasteUrl') || 'Type, search or paste URL'} className="flex-1 border-none focus:outline-none text-gray-900" />
                </div>
              </div>

              {/* Flagged */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.flagged') || 'Flagged'}</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTaskFlagged}
                    onChange={(e) => setNewTaskFlagged(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{t('projects.board.impediment') || 'Impediment'}</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">{t('projects.board.flaggedNote') || 'Allows to flag issues with impediments.'}</p>
              </div>

              {/* Issue Color */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.board.issueColor') || 'Issue color'}</label>
                <div className="flex items-center gap-2">
                  {issueColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewTaskColor(color.id)}
                      className={`w-8 h-8 rounded ${color.color} border-2 ${newTaskColor === color.id ? 'border-blue-500' : 'border-gray-300'} ${color.id === '' ? 'bg-gray-100' : ''}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={createAnother}
                  onChange={(e) => setCreateAnother(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t('projects.board.createAnother') || 'Create another'}
              </label>
              <div className="flex items-center gap-3">
                <button
                  data-testid="cancel-btn"
                  onClick={() => { setShowNewTaskModal(false); setShowTypeDropdown(false); setShowStatusDropdown(false); }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  {t('projects.common.cancel') || 'Cancel'}
                </button>
                <button
                  data-testid="save-task-btn"
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded transition-colors"
                >
                  {t('projects.common.create') || 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Sprint Modal */}
      {isScrum && (
        <CompleteSprintModal
          isOpen={showCompleteSprintModal}
          onClose={() => setShowCompleteSprintModal(false)}
          onComplete={handleCompleteSprint}
          incompleteTasks={incompleteTasks}
          sprintName={activeSprint?.name || ''}
        />
      )}

      {/* Status Management Modal */}
      <StatusManagementModal
        isOpen={showStatusManagementModal}
        onClose={() => setShowStatusManagementModal(false)}
        statuses={statuses}
        onStatusesChange={handleStatusesReorder}
        onAddStatus={() => {
          setShowStatusManagementModal(false);
          setShowAddStatusModal(true);
        }}
        onDeleteStatus={handleDeleteStatus}
      />

      {/* Add Status Modal */}
      <AddStatusModal
        isOpen={showAddStatusModal}
        onClose={() => setShowAddStatusModal(false)}
        onAdd={handleAddStatus}
      />
      
      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
