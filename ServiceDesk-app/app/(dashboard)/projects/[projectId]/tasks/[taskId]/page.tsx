'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MoreHorizontal,
  User,
  Calendar,
  Users,
  Flag,
  Tag,
  Clock,
  Link2,
  Send,
  Bold,
  Italic,
  Code,
  AtSign,
  ChevronDown,
  Check,
  X,
  Search,
  Plus,
  GitBranch,
  GitCommit,
  Settings,
  Edit3,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import toast, { Toaster } from 'react-hot-toast';
import { useTaskComments, useAddComment } from '@/hooks/useComments';

interface TaskAssignee {
  _id: string;
  name?: string;
  email?: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface TaskStatus {
  id: string;
  name: string;
  category: string;
}

interface Task {
  _id: string;
  key: string;
  title: string;
  description?: string;
  type: string;
  status: TaskStatus;
  priority: string;
  assignee?: TaskAssignee;
  reporter?: TaskAssignee;
  storyPoints?: number;
  labels?: string[];
  dueDate?: string;
  startDate?: string;
  sprint?: {
    _id: string;
    name: string;
    status?: string;
  };
  parent?: {
    _id: string;
    key: string;
    title: string;
  };
  team?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  organization?: string | { _id: string };
}

interface Comment {
  _id: string;
  author: TaskAssignee;
  content: string;
  timestamp: string;
  isEdited?: boolean;
}

interface TeamMember {
  _id: string;
  name?: string;
  role?: string;
  user?: {
    _id: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Sprint {
  _id: string;
  name: string;
  status: string;
}

interface Team {
  _id: string;
  name: string;
}

interface Label {
  _id: string;
  name: string;
  color: string;
}

interface CurrentUser {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  permissions?: {
    canEditTasks?: boolean;
    isAdmin?: boolean;
  };
}

const priorities = [
  { id: 'critical', name: 'Critical', color: 'text-red-600', bg: 'bg-red-100', icon: '🔴' },
  { id: 'high', name: 'High', color: 'text-orange-600', bg: 'bg-orange-100', icon: '🟠' },
  { id: 'medium', name: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🟡' },
  { id: 'low', name: 'Low', color: 'text-green-600', bg: 'bg-green-100', icon: '🟢' },
  { id: 'none', name: 'None', color: 'text-gray-500', bg: 'bg-gray-100', icon: '⚪' },
];

const issueTypes = [
  { id: 'epic', name: 'Epic', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
  { id: 'story', name: 'Story', icon: '📖', color: 'bg-green-100 text-green-700' },
  { id: 'task', name: 'Task', icon: '✓', color: 'bg-blue-100 text-blue-700' },
  { id: 'bug', name: 'Bug', icon: '🐛', color: 'bg-red-100 text-red-700' },
  { id: 'subtask', name: 'Subtask', icon: '📋', color: 'bg-gray-100 text-gray-700' },
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;

  // Core state
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'worklog'>('comments');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activities, setActivities] = useState<Array<{ _id: string; type: string; author?: { profile?: { firstName: string; lastName: string } }; field?: string; oldValue?: string; newValue?: string; timestamp: string }>>([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  // Comment API hooks
  const { data: apiComments = [], isLoading: commentsLoading } = useTaskComments(taskId);
  const addCommentMutation = useAddComment();
  const comments: Comment[] = apiComments.map((c) => ({
    _id: c._id,
    author: {
      _id: c.author?._id || '',
      email: c.author?.email,
      profile: c.author?.profile ? { firstName: c.author.profile.firstName || '', lastName: c.author.profile.lastName || '' } : undefined,
    },
    content: c.content,
    timestamp: c.createdAt,
    isEdited: c.isEdited,
  }));

  // Details dropdowns state
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showSprintDropdown, setShowSprintDropdown] = useState(false);
  const [showReporterDropdown, setShowReporterDropdown] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<TaskStatus[]>([]);

  // Data lists
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [parentSearchResults, setParentSearchResults] = useState<Task[]>([]);

  // Search/filter state
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');

  // Edit state
  const [editingStoryPoints, setEditingStoryPoints] = useState(false);
  const [storyPointsValue, setStoryPointsValue] = useState('');
  const [branchName, setBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  // Refs
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const labelsDropdownRef = useRef<HTMLDivElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const sprintDropdownRef = useRef<HTMLDivElement>(null);
  const reporterDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Permission check
  const canEditTask = currentUser?.permissions?.canEditTasks || currentUser?.permissions?.isAdmin || true;

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchTask = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Task not found');
        } else {
          throw new Error('Failed to fetch task');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTask(data.data.task || data.data);
      }
    } catch (err) {
      console.error('Failed to fetch task:', err);
      setError('Failed to load task');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, router]);

  const fetchProject = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProject(data.data.project || data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTask();
    fetchProject();
  }, [fetchTask, fetchProject]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const user = data.data || data;
          setCurrentUser({
            _id: user._id || user.id,
            profile: user.profile || { firstName: user.firstName || '', lastName: user.lastName || '' },
            permissions: { canEditTasks: true, isAdmin: user.role === 'admin' },
          });
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch team members, sprints, teams, labels
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        // Fetch team members
        const membersRes = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (membersRes.ok) {
          const data = await membersRes.json();
          const members = data.data?.members || data.data || [];
          // Normalize member structure - API returns userId object with user data
          interface MemberResponse {
            userId?: { _id: string; name?: string; email?: string; profile?: { firstName: string; lastName: string; avatar?: string } };
            user?: { _id: string; name?: string; profile?: { firstName: string; lastName: string; avatar?: string } };
            _id?: string;
            name?: string;
            role?: string;
            profile?: { firstName: string; lastName: string; avatar?: string };
          }
          const normalizedMembers = members.map((m: MemberResponse) => {
            const userObj = m.userId || m.user;
            // Parse name into firstName/lastName if profile not available
            const nameParts = (userObj?.name || m.name || '').split(' ');
            const firstName = userObj?.profile?.firstName || nameParts[0] || '';
            const lastName = userObj?.profile?.lastName || nameParts.slice(1).join(' ') || '';
            
            return {
              _id: userObj?._id || m._id,
              profile: userObj?.profile || { firstName, lastName, avatar: undefined },
              name: userObj?.name || m.name || `${firstName} ${lastName}`.trim(),
              role: m.role,
            };
          });
          setTeamMembers(normalizedMembers);
        }

        // Fetch sprints - include organization header if available
        const sprintHeaders: Record<string, string> = { Authorization: `Bearer ${token}` };
        if (project?.organization) {
          sprintHeaders['X-Organization-ID'] = typeof project.organization === 'string' ? project.organization : project.organization._id;
        }
        const sprintsRes = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
          headers: sprintHeaders,
        });
        if (sprintsRes.ok) {
          const data = await sprintsRes.json();
          setSprints(data.data?.sprints || data.data || []);
        }

        // Fetch labels
        const labelsRes = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/labels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (labelsRes.ok) {
          const data = await labelsRes.json();
          setAvailableLabels(data.data?.labels || data.data || []);
        }

        // Fetch teams
        const teamsRes = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.data?.teams || data.data || []);
        }

        // Fetch available statuses (workflow)
        const workflowRes = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/workflow`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (workflowRes.ok) {
          const data = await workflowRes.json();
          const statuses = data.data?.statuses || data.data?.workflow?.statuses || [];
          setAvailableStatuses(statuses);
        }
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };

    fetchData();
  }, [projectId, project]);

  // Fetch task activity
  useEffect(() => {
    const fetchActivity = async () => {
      const token = getToken();
      if (!token || !taskId) return;

      try {
        const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data.data?.activities || data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      }
    };

    fetchActivity();
  }, [taskId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(target)) {
        setShowAssigneeDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(target)) {
        setShowPriorityDropdown(false);
      }
      if (labelsDropdownRef.current && !labelsDropdownRef.current.contains(target)) {
        setShowLabelsDropdown(false);
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(target)) {
        setShowTeamDropdown(false);
      }
      if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(target)) {
        setShowSprintDropdown(false);
      }
      if (reporterDropdownRef.current && !reporterDropdownRef.current.contains(target)) {
        setShowReporterDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentIssueType = () => {
    return issueTypes.find(type => type.id === task?.type) || issueTypes[1];
  };

  const getPriorityInfo = (priorityId: string) => {
    return priorities.find(p => p.id === priorityId) || priorities[4];
  };

  const getStatusStyle = (category: string) => {
    switch (category) {
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Update task API with optimistic update
  const updateTask = async (updates: Partial<Task>) => {
    const token = getToken();
    if (!token || !task) return;

    // Optimistic update - update local state immediately
    const previousTask = task;
    setTask({ ...task, ...updates });

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        // Rollback on error
        setTask(previousTask);
        throw new Error('Failed to update task');
      }

      // Update with server response for any computed fields
      const data = await response.json();
      if (data.success && data.data) {
        setTask(prev => prev ? { ...prev, ...data.data.task || data.data } : prev);
      }

      toast.success(t('projects.board.taskUpdated') || 'Task updated!');
    } catch (error) {
      toast.error(t('projects.board.updateFailed') || 'Failed to update task');
    }
  };

  // Field handlers
  const handleAssigneeChange = async (memberId: string | null) => {
    const token = getToken();
    if (!token || !task) return;

    // Find the member to get full assignee object for optimistic update
    const member = memberId ? teamMembers.find(m => m._id === memberId) : null;
    const newAssignee = member ? {
      _id: member._id,
      profile: member.profile || member.user?.profile,
    } : undefined;

    // Optimistic update
    const previousTask = task;
    setTask({ ...task, assignee: newAssignee as TaskAssignee | undefined });
    setShowAssigneeDropdown(false);
    setAssigneeSearch('');

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignee: memberId }),
      });

      if (!response.ok) {
        setTask(previousTask);
        throw new Error('Failed to update assignee');
      }

      toast.success(t('projects.board.taskUpdated') || 'Assignee updated!');
    } catch (error) {
      toast.error(t('projects.board.updateFailed') || 'Failed to update assignee');
    }
  };

  const handleAssignToMe = async () => {
    if (currentUser) {
      await handleAssigneeChange(currentUser._id);
    }
  };

  const handlePriorityChange = async (priorityId: string) => {
    await updateTask({ priority: priorityId });
    setShowPriorityDropdown(false);
  };

  const handleParentChange = async (parentId: string | null) => {
    await updateTask({ parent: parentId as unknown as Task['parent'] });
    setShowParentModal(false);
    setParentSearch('');
  };

  const handleDueDateChange = async (date: string) => {
    await updateTask({ dueDate: date || undefined });
  };

  const handleStartDateChange = async (date: string) => {
    await updateTask({ startDate: date || undefined });
  };

  const handleLabelToggle = async (labelId: string) => {
    const currentLabels = task?.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(l => l !== labelId)
      : [...currentLabels, labelId];
    await updateTask({ labels: newLabels });
  };

  const handleTeamChange = async (teamId: string | null) => {
    await updateTask({ team: teamId as unknown as Task['team'] });
    setShowTeamDropdown(false);
  };

  const handleSprintChange = async (sprintId: string | null) => {
    await updateTask({ sprint: sprintId as unknown as Task['sprint'] });
    setShowSprintDropdown(false);
  };

  const handleStoryPointsChange = async () => {
    const points = storyPointsValue ? parseInt(storyPointsValue) : undefined;
    await updateTask({ storyPoints: points });
    setEditingStoryPoints(false);
  };

  const handleReporterChange = async (memberId: string) => {
    await updateTask({ reporter: memberId as unknown as TaskAssignee });
    setShowReporterDropdown(false);
  };

  const handleStatusChange = async (statusId: string) => {
    const token = getToken();
    if (!token || !task) return;

    // Find the new status for optimistic update
    const newStatus = availableStatuses.find(s => s.id === statusId);
    if (!newStatus) return;

    // Optimistic update
    const previousTask = task;
    setTask({ ...task, status: newStatus });
    setShowStatusDropdown(false);

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId }),
      });

      if (!response.ok) {
        setTask(previousTask);
        throw new Error('Failed to update status');
      }

      toast.success(t('projects.board.statusUpdated') || 'Status updated!');
    } catch (error) {
      toast.error(t('projects.board.updateFailed') || 'Failed to update status');
    }
  };

  const handleCreateBranch = () => {
    const defaultBranchName = `feature/${task?.key?.toLowerCase()}-${task?.title?.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`;
    setBranchName(defaultBranchName);
    setShowBranchModal(true);
  };

  const handleCreateCommit = () => {
    const defaultMessage = `${task?.key}: ${task?.title}`;
    setCommitMessage(defaultMessage);
    setShowCommitModal(true);
  };

  const handleSearchParent = async (query: string) => {
    setParentSearch(query);
    if (!query.trim()) {
      setParentSearchResults([]);
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/tasks?search=${encodeURIComponent(query)}&type=epic,story`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setParentSearchResults(data.data?.tasks || data.data || []);
      }
    } catch (error) {
      console.error('Failed to search parent issues:', error);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('projects.board.linkCopied') || 'Link copied!');
    });
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await addCommentMutation.mutateAsync({ taskId, content: commentText.trim() });
      setCommentText('');
      toast.success(t('projects.board.commentAdded') || 'Comment added!');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filtered lists
  const filteredTeamMembers = teamMembers.filter(member => {
    const firstName = member.profile?.firstName || member.user?.profile?.firstName || member.name?.split(' ')[0] || '';
    const lastName = member.profile?.lastName || member.user?.profile?.lastName || member.name?.split(' ').slice(1).join(' ') || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(assigneeSearch.toLowerCase());
  });

  // Helper to get member display name
  const getMemberName = (member: TeamMember) => {
    const firstName = member.profile?.firstName || member.user?.profile?.firstName || member.name?.split(' ')[0] || '';
    const lastName = member.profile?.lastName || member.user?.profile?.lastName || member.name?.split(' ').slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  const filteredLabels = availableLabels.filter(label =>
    label.name.toLowerCase().includes(labelSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('projects.board.taskNotFound') || 'Task Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">{error || 'The task you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/board`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('projects.board.backToBoard') || 'Back to Board'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-3 flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push(`/projects/${projectId}/board`)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {project?.name || 'Project'}
            </button>
            <span className="text-gray-300">/</span>
            {task.parent && (
              <>
                <a
                  href={`/projects/${projectId}/tasks/${task.parent._id}`}
                  className="text-purple-600 hover:underline flex items-center gap-1"
                >
                  ⚡ {task.parent.key}
                </a>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className={`flex items-center gap-1 ${getCurrentIssueType().color} px-2 py-0.5 rounded`}>
              {getCurrentIssueType().icon} {task.key}
            </span>
          </div>

          {/* Title and Actions */}
          <div className="py-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title={t('projects.board.copyLink') || 'Copy link'}
              >
                <Link2 className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">
            {/* Status */}
            <div className="relative" ref={statusDropdownRef}>
              <div className="flex items-center gap-4">
                {canEditTask ? (
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusStyle(task.status.category)} flex items-center gap-1 hover:opacity-80`}
                  >
                    {task.status.name}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                ) : (
                  <span className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusStyle(task.status.category)}`}>
                    {task.status.name}
                  </span>
                )}
              </div>
              
              {/* Status Dropdown */}
              {showStatusDropdown && (
                <div className="absolute start-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {availableStatuses.length > 0 ? (
                    availableStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${task.status.id === status.id ? 'bg-blue-50' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${status.category === 'done' ? 'bg-green-500' : status.category === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-900">{status.name}</span>
                        {task.status.id === status.id && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No statuses available</div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 group">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('projects.common.description') || 'Description'}
                </h2>
                {canEditTask && !editingDescription && (
                  <button
                    onClick={() => { setDescriptionValue(task.description || ''); setEditingDescription(true); }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {editingDescription ? (
                <div>
                  <textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                    rows={5}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingDescription(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {t('projects.board.cancel') || 'Cancel'}
                    </button>
                    <button
                      onClick={async () => {
                        await updateTask({ description: descriptionValue });
                        setEditingDescription(false);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t('projects.board.save') || 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`prose max-w-none ${canEditTask ? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors' : ''}`}
                  onClick={() => { if (canEditTask) { setDescriptionValue(task.description || ''); setEditingDescription(true); } }}
                >
                  {task.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">
                      {t('projects.board.noDescription') || 'Click to add a description...'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Activity Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('projects.board.activity') || 'Activity'}
              </h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                {(['comments', 'history', 'worklog'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t(`projects.board.activityTab.${tab}`) || tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Comment Input */}
              {activeTab === 'comments' && (
                <div className="mb-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium shrink-0">
                      {currentUser ? getInitials(currentUser.profile.firstName, currentUser.profile.lastName) : '?'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t('projects.board.addComment') || 'Add a comment...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-2">
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Bold className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Italic className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Code className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <AtSign className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={handleAddComment}
                          disabled={!commentText.trim()}
                          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Send className="h-4 w-4" />
                          {t('projects.board.send') || 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {commentsLoading ? (
                    <p className="text-gray-500 text-center py-4">{t('common.loading') || 'Loading...'}</p>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {t('projects.board.noComments') || 'No comments yet'}
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium shrink-0">
                          {comment.author.profile?.firstName?.[0] || comment.author.email?.[0]?.toUpperCase() || '?'}{comment.author.profile?.lastName?.[0] || ''}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.author.profile?.firstName || comment.author.email || 'Unknown'} {comment.author.profile?.lastName || ''}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.timestamp)}
                            </span>
                            {comment.isEdited && (
                              <span className="text-xs text-gray-400 italic">{t('projects.board.edited') || '(edited)'}</span>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* History */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {t('projects.board.noHistory') || 'No history yet'}
                    </p>
                  ) : (
                    activities
                      .filter(a => a.type !== 'comment')
                      .map((activity) => (
                        <div key={activity._id} className="flex gap-3 items-start">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium shrink-0">
                            {activity.author?.profile?.firstName?.[0] || '?'}{activity.author?.profile?.lastName?.[0] || ''}
                          </div>
                          <div className="flex-1 text-sm">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-gray-900">
                                {activity.author?.profile ? `${activity.author.profile.firstName} ${activity.author.profile.lastName}` : 'System'}
                              </span>
                              <span className="text-gray-400">{formatDate(activity.timestamp)}</span>
                            </div>
                            {activity.type === 'created' && (
                              <p className="text-gray-600">{t('projects.board.createdTask') || 'Created this task'}</p>
                            )}
                            {activity.type === 'status_change' && (
                              <p className="text-gray-600">
                                {t('projects.board.changedStatus') || 'Changed status'}{' '}
                                {activity.oldValue && <span className="line-through text-gray-400">{activity.oldValue}</span>}{' '}
                                {activity.newValue && <span className="font-medium text-gray-800">→ {activity.newValue}</span>}
                              </p>
                            )}
                            {activity.type === 'field_update' && (
                              <p className="text-gray-600">
                                {t('projects.board.updated') || 'Updated'} <span className="font-medium">{activity.field}</span>{' '}
                                {activity.oldValue && <span className="line-through text-gray-400">{activity.oldValue}</span>}{' '}
                                {activity.newValue && <span className="font-medium text-gray-800">→ {activity.newValue}</span>}
                              </p>
                            )}
                            {activity.type === 'sprint_change' && (
                              <p className="text-gray-600">
                                {t('projects.board.movedToSprint') || 'Moved to sprint'}{' '}
                                <span className="font-medium text-gray-800">{activity.newValue}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Worklog */}
              {activeTab === 'worklog' && (
                <p className="text-gray-500 text-center py-4">
                  {t('projects.board.noWorklog') || 'No work logged yet'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('projects.board.details') || 'Details'}
                </h2>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Type Field */}
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{getCurrentIssueType().icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.type') || 'Type'}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm ${getCurrentIssueType().color}`}>
                    {getCurrentIssueType().name}
                  </span>
                </div>
              </div>

              {/* US1: Assignee Field */}
              <div className="relative" ref={assigneeDropdownRef}>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 mb-1">{t('projects.board.assignee') || 'Assignee'}</p>
                    {canEditTask ? (
                      <button
                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                        className="flex items-center gap-2 text-start hover:bg-gray-100 rounded-md px-2 py-1.5 -ms-2 w-full transition-colors"
                      >
                        {task.assignee ? (
                          <>
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0"
                              style={{ backgroundColor: `hsl(${(task.assignee.profile?.firstName?.charCodeAt(0) || 0) * 10 % 360}, 60%, 50%)` }}
                            >
                              {getInitials(
                                task.assignee.profile?.firstName || task.assignee.name?.split(' ')[0] || '',
                                task.assignee.profile?.lastName || task.assignee.name?.split(' ').slice(1).join(' ') || ''
                              )}
                            </div>
                            <span className="text-gray-900 text-sm font-medium truncate">
                              {task.assignee.profile 
                                ? `${task.assignee.profile.firstName} ${task.assignee.profile.lastName}`
                                : task.assignee.name || task.assignee.email || 'Unknown'}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <span className="text-gray-500 text-sm">{t('projects.board.unassigned') || 'Unassigned'}</span>
                          </>
                        )}
                        <ChevronDown className="h-4 w-4 text-gray-400 ms-auto flex-shrink-0" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ backgroundColor: `hsl(${(task.assignee.profile?.firstName?.charCodeAt(0) || 0) * 10 % 360}, 60%, 50%)` }}
                            >
                              {getInitials(
                                task.assignee.profile?.firstName || '',
                                task.assignee.profile?.lastName || ''
                              )}
                            </div>
                            <span className="text-gray-900 text-sm">
                              {task.assignee.profile 
                                ? `${task.assignee.profile.firstName} ${task.assignee.profile.lastName}`
                                : task.assignee.name || 'Unknown'}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">{t('projects.board.unassigned') || 'Unassigned'}</span>
                        )}
                      </div>
                    )}
                    {!task.assignee && canEditTask && (
                      <button
                        onClick={handleAssignToMe}
                        className="text-blue-600 text-sm hover:text-blue-700 hover:underline mt-1 font-medium"
                      >
                        {t('projects.board.assignToMe') || 'Assign to me'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignee Dropdown */}
                {showAssigneeDropdown && (
                  <div className="absolute start-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-30">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder={t('projects.board.searchMembers') || 'Search members...'}
                          className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {/* Unassigned option */}
                      <button
                        onClick={() => handleAssigneeChange(null)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-start transition-colors ${
                          !task.assignee ? 'bg-blue-50' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{t('projects.board.unassigned') || 'Unassigned'}</span>
                        {!task.assignee && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                      </button>
                      
                      {/* Divider */}
                      {filteredTeamMembers.length > 0 && (
                        <div className="border-t border-gray-100 my-1" />
                      )}
                      
                      {/* Team members */}
                      {filteredTeamMembers.map((member) => {
                        const { firstName, lastName } = getMemberName(member);
                        const isSelected = task.assignee?._id === member._id;
                        const avatarColor = `hsl(${(firstName?.charCodeAt(0) || 0) * 10 % 360}, 60%, 50%)`;
                        
                        return (
                          <button
                            key={member._id}
                            onClick={() => handleAssigneeChange(member._id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-start transition-colors ${
                              isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {getInitials(firstName, lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {firstName} {lastName}
                              </p>
                              {member.role && (
                                <p className="text-xs text-gray-500 truncate">{member.role}</p>
                              )}
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                      
                      {/* Empty state */}
                      {filteredTeamMembers.length === 0 && assigneeSearch && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          {t('projects.board.noMembersFound') || 'No members found'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* US2: Priority Field */}
              <div className="relative" ref={priorityDropdownRef}>
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('projects.board.priority') || 'Priority'}</p>
                    {canEditTask ? (
                      <button
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                        className="flex items-center gap-2 text-start hover:bg-gray-50 rounded p-1 -ms-1"
                      >
                        <span>{getPriorityInfo(task.priority).icon}</span>
                        <span className={getPriorityInfo(task.priority).color}>
                          {getPriorityInfo(task.priority).name}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                    ) : (
                      <p className={getPriorityInfo(task.priority).color}>
                        {getPriorityInfo(task.priority).name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Priority Dropdown */}
                {showPriorityDropdown && (
                  <div className="absolute end-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {priorities.map((priority) => (
                      <button
                        key={priority.id}
                        onClick={() => handlePriorityChange(priority.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                          task.priority === priority.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span>{priority.icon}</span>
                        <span className={priority.color}>{priority.name}</span>
                        {task.priority === priority.id && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* US3: Parent Issue */}
              <div className="flex items-start gap-3">
                <Plus className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.parent') || 'Parent'}</p>
                  {task.parent ? (
                    <a
                      href={`/projects/${projectId}/tasks/${task.parent._id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {task.parent.key} - {task.parent.title}
                    </a>
                  ) : canEditTask ? (
                    <button
                      onClick={() => setShowParentModal(true)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {t('projects.board.addParent') || 'Add parent'}
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">{t('projects.board.noParent') || 'None'}</span>
                  )}
                </div>
              </div>

              {/* US4: Due Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.dueDate') || 'Due date'}</p>
                  {canEditTask ? (
                    <div className="relative">
                      {task.dueDate ? (
                        <input
                          type="date"
                          value={task.dueDate.split('T')[0]}
                          onChange={(e) => handleDueDateChange(e.target.value)}
                          className="text-sm text-gray-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="date"
                          value=""
                          onChange={(e) => handleDueDateChange(e.target.value)}
                          className="text-sm text-blue-600 border border-dashed border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-blue-400"
                          placeholder="Select date"
                        />
                      )}
                    </div>
                  ) : task.dueDate ? (
                    <p className="text-gray-900 text-sm">{formatDate(task.dueDate)}</p>
                  ) : (
                    <span className="text-gray-400 text-sm">{t('projects.board.noDueDate') || 'None'}</span>
                  )}
                </div>
              </div>

              {/* US5: Labels */}
              <div className="relative" ref={labelsDropdownRef}>
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('projects.board.labels') || 'Labels'}</p>
                    {task.labels && task.labels.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.labels.map((label, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm">
                            {label}
                          </span>
                        ))}
                        {canEditTask && (
                          <button
                            onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                            className="px-2 py-0.5 text-blue-600 text-sm hover:bg-blue-50 rounded"
                          >
                            +
                          </button>
                        )}
                      </div>
                    ) : canEditTask ? (
                      <button
                        onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {t('projects.board.addLabels') || 'Add labels'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">{t('projects.board.noLabels') || 'None'}</span>
                    )}
                  </div>
                </div>

                {/* Labels Dropdown */}
                {showLabelsDropdown && (
                  <div className="absolute end-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={labelSearch}
                          onChange={(e) => setLabelSearch(e.target.value)}
                          placeholder={t('projects.board.searchLabels') || 'Search labels...'}
                          className="w-full ps-8 pe-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      {filteredLabels.map((label) => (
                        <button
                          key={label._id}
                          onClick={() => handleLabelToggle(label._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-start ${
                            task.labels?.includes(label._id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: label.color }} />
                          <span className="text-sm text-gray-700">{label.name}</span>
                          {task.labels?.includes(label._id) && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* US6: Team */}
              <div className="relative" ref={teamDropdownRef}>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('projects.board.team') || 'Team'}</p>
                    {canEditTask ? (
                      <button
                        onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                        className="flex items-center gap-2 text-start hover:bg-gray-50 rounded p-1 -ms-1"
                      >
                        {task.team ? (
                          <span className="text-gray-900 text-sm">{task.team.name}</span>
                        ) : (
                          <span className="text-blue-600 text-sm">{t('projects.board.addTeam') || 'Add team'}</span>
                        )}
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                    ) : (
                      <p className="text-gray-900 text-sm">{task.team?.name || t('projects.board.noTeam') || 'None'}</p>
                    )}
                  </div>
                </div>

                {/* Team Dropdown */}
                {showTeamDropdown && (
                  <div className="absolute end-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="max-h-48 overflow-y-auto">
                      {[{ _id: 'no-team', name: t('projects.board.noTeam') || 'No team', isNoTeam: true }, ...teams].map((team) => (
                        <button
                          key={team._id}
                          onClick={() => handleTeamChange((team as { isNoTeam?: boolean }).isNoTeam ? null : team._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                            (team as { isNoTeam?: boolean }).isNoTeam
                              ? !task.team?._id ? 'bg-blue-50' : ''
                              : task.team?._id === team._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className={`text-sm ${(team as { isNoTeam?: boolean }).isNoTeam ? 'text-gray-500' : 'text-gray-900'}`}>{team.name}</span>
                          {((team as { isNoTeam?: boolean }).isNoTeam ? !task.team?._id : task.team?._id === team._id) && (
                            <Check className="h-4 w-4 text-blue-600 ms-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* US7: Start Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.startDate') || 'Start date'}</p>
                  {canEditTask ? (
                    <div className="relative">
                      {task.startDate ? (
                        <input
                          type="date"
                          value={task.startDate.split('T')[0]}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="text-sm text-gray-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="date"
                          value=""
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="text-sm text-blue-600 border border-dashed border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-blue-400"
                          placeholder="Select date"
                        />
                      )}
                    </div>
                  ) : task.startDate ? (
                    <p className="text-gray-900 text-sm">{formatDate(task.startDate)}</p>
                  ) : (
                    <span className="text-gray-400 text-sm">{t('projects.board.addDate') || 'None'}</span>
                  )}
                </div>
              </div>

              {/* US8: Sprint */}
              <div className="relative" ref={sprintDropdownRef}>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('projects.board.sprint') || 'Sprint'}</p>
                    {canEditTask ? (
                      <button
                        onClick={() => setShowSprintDropdown(!showSprintDropdown)}
                        className="flex items-center gap-2 text-start hover:bg-gray-50 rounded p-1 -ms-1"
                      >
                        {task.sprint ? (
                          <span className="text-blue-600 text-sm hover:underline">{task.sprint.name}</span>
                        ) : (
                          <span className="text-blue-600 text-sm">{t('projects.board.addSprint') || 'Add sprint'}</span>
                        )}
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                    ) : (
                      <p className="text-gray-900 text-sm">{task.sprint?.name || t('projects.board.noSprint') || 'None'}</p>
                    )}
                  </div>
                </div>

                {/* Sprint Dropdown */}
                {showSprintDropdown && (
                  <div className="absolute end-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        onClick={() => handleSprintChange(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start"
                      >
                        <span className="text-gray-500 text-sm">{t('projects.board.noSprint') || 'No sprint'}</span>
                      </button>
                      {sprints.map((sprint) => (
                        <button
                          key={sprint._id}
                          onClick={() => handleSprintChange(sprint._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                            task.sprint?._id === sprint._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className="text-gray-900 text-sm">{sprint.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            sprint.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sprint.status}
                          </span>
                          {task.sprint?._id === sprint._id && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* US9: Story Points */}
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 text-lg">📊</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.storyPoints') || 'Story point estimate'}</p>
                  {canEditTask ? (
                    editingStoryPoints ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={storyPointsValue}
                          onChange={(e) => setStoryPointsValue(e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onBlur={handleStoryPointsChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleStoryPointsChange()}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setStoryPointsValue(task.storyPoints?.toString() || '');
                          setEditingStoryPoints(true);
                        }}
                        className="text-start hover:bg-gray-50 rounded p-1 -ms-1"
                      >
                        {task.storyPoints !== undefined ? (
                          <span className="text-gray-900 text-sm">{task.storyPoints}</span>
                        ) : (
                          <span className="text-blue-600 text-sm">{t('projects.board.addStoryPoints') || 'Add story points'}</span>
                        )}
                      </button>
                    )
                  ) : (
                    <p className="text-gray-900 text-sm">{task.storyPoints ?? (t('projects.board.noStoryPoints') || 'None')}</p>
                  )}
                </div>
              </div>

              {/* US10: Development Section */}
              <div className="flex items-start gap-3">
                <GitBranch className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{t('projects.board.development') || 'Development'}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={handleCreateBranch}
                      className="text-blue-600 text-sm hover:underline text-start flex items-center gap-1"
                    >
                      <GitBranch className="h-3 w-3" />
                      {t('projects.board.createBranch') || 'Create branch'}
                    </button>
                    <button
                      onClick={handleCreateCommit}
                      className="text-blue-600 text-sm hover:underline text-start flex items-center gap-1"
                    >
                      <GitCommit className="h-3 w-3" />
                      {t('projects.board.createCommit') || 'Create commit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* US11: Reporter */}
              <div className="relative" ref={reporterDropdownRef}>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t('projects.board.reporter') || 'Reporter'}</p>
                    {canEditTask ? (
                      <button
                        onClick={() => setShowReporterDropdown(!showReporterDropdown)}
                        className="flex items-center gap-2 text-start hover:bg-gray-50 rounded p-1 -ms-1"
                      >
                        {task.reporter?.profile ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                              {getInitials(task.reporter.profile.firstName, task.reporter.profile.lastName)}
                            </div>
                            <span className="text-gray-900 text-sm">
                              {task.reporter.profile.firstName} {task.reporter.profile.lastName}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">{t('projects.board.noReporter') || 'No reporter'}</span>
                        )}
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                    ) : task.reporter?.profile ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                          {getInitials(task.reporter.profile.firstName, task.reporter.profile.lastName)}
                        </div>
                        <span className="text-gray-900 text-sm">
                          {task.reporter.profile.firstName} {task.reporter.profile.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">{t('projects.board.noReporter') || 'No reporter'}</span>
                    )}
                  </div>
                </div>

                {/* Reporter Dropdown */}
                {showReporterDropdown && (
                  <div className="absolute end-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <button
                          key={member._id}
                          onClick={() => handleReporterChange(member._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                            task.reporter?._id === member._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                            {getInitials(getMemberName(member).firstName, getMemberName(member).lastName)}
                          </div>
                          <span className="text-gray-900 text-sm">
                            {getMemberName(member).firstName} {getMemberName(member).lastName}
                          </span>
                          {task.reporter?._id === member._id && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Created/Updated */}
              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                {task.createdAt && (
                  <p>{t('projects.board.created') || 'Created'}: {formatDate(task.createdAt)}</p>
                )}
                {task.updatedAt && (
                  <p>{t('projects.board.updated') || 'Updated'}: {formatDate(task.updatedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Search Modal */}
      {showParentModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowParentModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('projects.board.selectParent') || 'Select Parent Issue'}
              </h2>
              <button
                onClick={() => setShowParentModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={parentSearch}
                onChange={(e) => handleSearchParent(e.target.value)}
                placeholder={t('projects.board.searchParentIssue') || 'Search for epic or story...'}
                className="w-full ps-10 pe-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {parentSearchResults.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {parentSearch ? t('projects.board.noResults') || 'No results found' : t('projects.board.typeToSearch') || 'Type to search...'}
                </p>
              ) : (
                parentSearchResults.map((issue) => (
                  <button
                    key={issue._id}
                    onClick={() => handleParentChange(issue._id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-start"
                  >
                    <span className="text-purple-600">⚡</span>
                    <div>
                      <span className="font-medium text-gray-900">{issue.key}</span>
                      <span className="text-gray-500 ms-2">{issue.title}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            {task.parent && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleParentChange(null)}
                  className="text-red-600 text-sm hover:underline"
                >
                  {t('projects.board.removeParent') || 'Remove parent'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowBranchModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[450px] max-w-[90vw] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('projects.board.createBranch') || 'Create Branch'}
              </h2>
              <button
                onClick={() => setShowBranchModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('projects.board.branchName') || 'Branch name'}
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBranchModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('projects.board.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`git checkout -b ${branchName}`);
                  toast.success(t('projects.board.branchCommandCopied') || 'Branch command copied!');
                  setShowBranchModal(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('projects.board.copyCommand') || 'Copy command'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commit Modal */}
      {showCommitModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCommitModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[450px] max-w-[90vw] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('projects.board.createCommit') || 'Create Commit'}
              </h2>
              <button
                onClick={() => setShowCommitModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('projects.board.commitMessage') || 'Commit message'}
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCommitModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('projects.board.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`git commit -m "${commitMessage}"`);
                  toast.success(t('projects.board.commitCommandCopied') || 'Commit command copied!');
                  setShowCommitModal(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('projects.board.copyCommand') || 'Copy command'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
