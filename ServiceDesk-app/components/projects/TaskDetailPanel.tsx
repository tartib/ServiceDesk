'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ExternalLink,
  Maximize2,
  ChevronDown,
  User,
  Calendar,
  Users,
  GitBranch,
  GitCommit,
  Flag,
  Zap,
  Settings,
  Plus,
  Pin,
  Check,
  Search,
  MessageSquare,
  MoreHorizontal,
  Bold,
  Italic,
  Code,
  AtSign,
  Send,
  Edit3,
  Trash2,
  Quote,
  Link2,
  List,
  Heading,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import { useTaskComments, useAddComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments';

interface TaskAssignee {
  _id: string;
  name?: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
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
  type: string;
  status: TaskStatus;
  priority: string;
  assignee?: TaskAssignee;
  storyPoints?: number;
  labels?: string[];
  dueDate?: string;
  startDate?: string;
  sprint?: {
    _id: string;
    name: string;
  };
  sprintId?: {
    _id: string;
    name: string;
    goal?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
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
  reporter?: TaskAssignee;
  description?: string;
}

interface TeamMember {
  _id: string;
  name?: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

interface Sprint {
  _id: string;
  name: string;
  status: string;
}

interface Label {
  _id: string;
  name: string;
  color: string;
}

type ActivityType = 'all' | 'comments' | 'history' | 'worklog';

interface ActivityAuthor {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface ActivityItem {
  _id: string;
  type: 'status_change' | 'sprint_change' | 'created' | 'field_update' | 'comment' | 'worklog';
  author: ActivityAuthor;
  timestamp: string;
  field?: string;
  oldValue?: string | { id: string; name: string };
  newValue?: string | { id: string; name: string };
  content?: string;
}

interface Comment {
  _id: string;
  author: ActivityAuthor;
  content: string;
  timestamp: string;
  isEdited?: boolean;
}

interface CurrentUser {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  permissions?: {
    canComment?: boolean;
    isAdmin?: boolean;
  };
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members?: Array<{ userId: string; role: string }>;
}

interface TaskDetailPanelProps {
  task: Task;
  taskDetail: Task | null;
  projectId: string;
  onClose: () => void;
  onTaskUpdate: () => void;
  teamMembers?: TeamMember[];
  sprints?: Sprint[];
  availableLabels?: Label[];
  availableTeams?: Team[];
  currentUser?: CurrentUser;
}

// Note: projectId is already in the interface and is required for API operations

const cannedComments = [
  { id: 'looks-good', emoji: '🎉', text: 'Looks good!' },
  { id: 'need-help', emoji: '👋', text: 'Need help?' },
  { id: 'blocked', emoji: '⛔', text: 'This is blocked...' },
  { id: 'clarify', emoji: '🔍', text: 'Can you clarify...?' },
  { id: 'on-track', emoji: '✅', text: 'This is on track' },
];

const priorities = [
  { id: 'critical', name: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'high', name: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'medium', name: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'low', name: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'none', name: 'None', color: 'text-gray-500', bg: 'bg-gray-100' },
];

interface StatusOption {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
  color: string;
  bgColor: string;
}

const defaultStatusOptions: StatusOption[] = [
  { id: 'backlog', name: 'Backlog', category: 'todo', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  { id: 'ready', name: 'Ready', category: 'todo', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { id: 'in-progress', name: 'In Progress', category: 'in_progress', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  { id: 'in-review', name: 'In Review', category: 'in_progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { id: 'done', name: 'Done', category: 'done', color: 'text-green-700', bgColor: 'bg-green-100' },
];

interface RelationshipType {
  id: string;
  name: string;
  inverse: string;
}

const relationshipTypes: RelationshipType[] = [
  { id: 'is_blocked_by', name: 'is blocked by', inverse: 'blocks' },
  { id: 'blocks', name: 'blocks', inverse: 'is blocked by' },
  { id: 'is_cloned_by', name: 'is cloned by', inverse: 'clones' },
  { id: 'clones', name: 'clones', inverse: 'is cloned by' },
  { id: 'is_duplicated_by', name: 'is duplicated by', inverse: 'duplicates' },
  { id: 'duplicates', name: 'duplicates', inverse: 'is duplicated by' },
  { id: 'added_to_idea', name: 'added to idea', inverse: 'is idea for' },
  { id: 'is_idea_for', name: 'is idea for', inverse: 'added to idea' },
  { id: 'merged_into', name: 'merged into', inverse: 'merged from' },
  { id: 'merged_from', name: 'merged from', inverse: 'merged into' },
  { id: 'is_implemented_by', name: 'is implemented by', inverse: 'implements' },
  { id: 'implements', name: 'implements', inverse: 'is implemented by' },
  { id: 'relates_to', name: 'relates to', inverse: 'relates to' },
];

interface LinkedIssue {
  _id: string;
  type: string;
  targetIssue: {
    _id: string;
    key: string;
    title: string;
    type: string;
    status: { id: string; name: string; category?: string };
    priority?: string;
    assignee?: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    };
  };
}

interface SearchResult {
  _id: string;
  key: string;
  title: string;
  type?: string;
  status: { id?: string; name: string; category?: string };
  priority?: string;
  assignee?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

const issueTypeIcons: Record<string, { icon: string; color: string; label: string }> = {
  epic: { icon: '⚡', color: 'text-purple-600', label: 'Epic' },
  story: { icon: '📖', color: 'text-green-600', label: 'Story' },
  task: { icon: '✓', color: 'text-blue-600', label: 'Task' },
  bug: { icon: '🐛', color: 'text-red-600', label: 'Bug' },
  subtask: { icon: '📋', color: 'text-gray-600', label: 'Subtask' },
};

const priorityConfig: Record<string, { icon: string; color: string; label: string }> = {
  critical: { icon: '🔴', color: 'text-red-600', label: 'Critical' },
  high: { icon: '🔺', color: 'text-orange-500', label: 'High' },
  medium: { icon: '🔸', color: 'text-yellow-500', label: 'Medium' },
  low: { icon: '🔽', color: 'text-green-500', label: 'Low' },
  none: { icon: '⚪', color: 'text-gray-400', label: 'None' },
};

const statusColorMap: Record<string, { bg: string; text: string }> = {
  todo: { bg: 'bg-gray-100', text: 'text-gray-700' },
  idea: { bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  testing: { bg: 'bg-purple-100', text: 'text-purple-700' },
  done: { bg: 'bg-green-100', text: 'text-green-700' },
};

interface Epic {
  _id: string;
  key: string;
  title: string;
}

interface Watcher {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

const issueTypes = [
  { id: 'epic', name: 'Epic', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
  { id: 'story', name: 'Story', icon: '📖', color: 'bg-green-100 text-green-700' },
  { id: 'task', name: 'Task', icon: '✓', color: 'bg-blue-100 text-blue-700' },
  { id: 'bug', name: 'Bug', icon: '🐛', color: 'bg-red-100 text-red-700' },
  { id: 'subtask', name: 'Subtask', icon: '📋', color: 'bg-gray-100 text-gray-700' },
];

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

export function TaskDetailPanel({
  task,
  taskDetail,
  projectId,
  onClose,
  onTaskUpdate,
  teamMembers = [],
  sprints = [],
  availableLabels = [],
  availableTeams = [],
  currentUser,
}: TaskDetailPanelProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  // Prefer taskDetail (fully populated from detail API) over task (from list)
  const activeTask: Task = taskDetail || task;
  const taskId = activeTask._id;

  // Real API hooks for comments
  const { data: apiComments = [], isLoading: commentsLoading } = useTaskComments(taskId);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  // UI State
  const [showDetails, setShowDetails] = useState(true);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showSprintDropdown, setShowSprintDropdown] = useState(false);
  const [showReporterDropdown, setShowReporterDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Search states
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');

  // Edit states
  const [editingStoryPoints, setEditingStoryPoints] = useState(false);
  const [storyPointsValue, setStoryPointsValue] = useState(activeTask.storyPoints?.toString() || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(activeTask.title);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(taskDetail?.description || '');
  const [descriptionPreviewMode, setDescriptionPreviewMode] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Pinned fields
  const [pinnedFields, setPinnedFields] = useState<string[]>([]);

  // Status State
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(defaultStatusOptions);
  const [focusedStatusIndex, setFocusedStatusIndex] = useState<number>(-1);
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusListRef = useRef<HTMLUListElement>(null);

  // Permission check for status editing
  const canEditStatus = currentUser?.permissions?.isAdmin === true || 
    activeTask.assignee?._id === currentUser?._id;

  // Activity Feed State
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityType>('all');
  const [activitySortOrder, setActivitySortOrder] = useState<'newest' | 'oldest'>('newest');
  const [hoveredAuthor, setHoveredAuthor] = useState<ActivityAuthor | null>(null);
  const [profileCardPosition, setProfileCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentActionMenuId, setCommentActionMenuId] = useState<string | null>(null);

  // Map API comments to local Comment interface
  const comments: Comment[] = apiComments.map((c) => ({
    _id: c._id,
    author: {
      _id: c.author?._id || '',
      profile: {
        firstName: c.author?.profile?.firstName || '',
        lastName: c.author?.profile?.lastName || '',
        avatar: c.author?.profile?.avatar,
      },
    },
    content: c.content,
    timestamp: c.createdAt,
    isEdited: c.isEdited,
  }));

  // Keyboard shortcut for focusing comment input (M key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          commentInputRef.current?.focus();
          setIsCommentInputFocused(true);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if current user can comment
  const canComment = currentUser?.permissions?.canComment !== false;
  const isAdmin = currentUser?.permissions?.isAdmin === true;

  // Link Issues State
  const [showLinkSection, setShowLinkSection] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('is_blocked_by');
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);
  const [focusedRelationshipIndex, setFocusedRelationshipIndex] = useState<number>(-1);
  const [issueSearchQuery, setIssueSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<SearchResult | null>(null);
  const [linkedIssues, setLinkedIssues] = useState<LinkedIssue[]>([]);
  const [showCreateLinkedModal, setShowCreateLinkedModal] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const relationshipDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Permission check for linking issues
  const canLinkIssues = currentUser?.permissions?.isAdmin === true || 
    activeTask.assignee?._id === currentUser?._id;

  // Quick Add Menu State
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [focusedQuickAddIndex, setFocusedQuickAddIndex] = useState<number>(-1);
  const [showCreateSubtaskModal, setShowCreateSubtaskModal] = useState(false);
  const [showAddWebLinkModal, setShowAddWebLinkModal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [webLinkUrl, setWebLinkUrl] = useState('');
  const [webLinkTitle, setWebLinkTitle] = useState('');
  const [webLinkDescription, setWebLinkDescription] = useState('');
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);
  const quickAddMenuRef = useRef<HTMLDivElement>(null);
  const quickAddSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Header Actions State
  const [showEpicDropdown, setShowEpicDropdown] = useState(false);
  const [showIssueTypeDropdown, setShowIssueTypeDropdown] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [availableEpics, setAvailableEpics] = useState<Epic[]>([]);
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [showWatchersDropdown, setShowWatchersDropdown] = useState(false);
  const [epicSearch, setEpicSearch] = useState('');
  const epicDropdownRef = useRef<HTMLDivElement>(null);
  const issueTypeDropdownRef = useRef<HTMLDivElement>(null);
  const kebabMenuRef = useRef<HTMLDivElement>(null);
  const watchersDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Add Menu Items
  const quickAddItems = [
    { id: 'create-subtask', icon: '📋', label: 'Create subtask', shortcut: '⇧ C', action: () => setShowCreateSubtaskModal(true) },
    { id: 'link-work-item', icon: '🔗', label: 'Link work item', shortcut: '⇧ K', action: () => setShowLinkSection(true) },
    { id: 'add-attachment', icon: '📎', label: 'Add attachment', action: () => fileInputRef.current?.click() },
    { id: 'add-web-link', icon: '🌐', label: 'Add web link', action: () => setShowAddWebLinkModal(true) },
  ];

  const recommendedItems = [
    { id: 'idea', icon: '💡', label: 'Idea', description: 'Add an idea or suggestion' },
    { id: 'video-recording', icon: '🎥', label: 'Video recording', description: 'Record with Loom' },
  ];

  // Filter quick add items based on search
  const filteredQuickAddItems = quickAddItems.filter(item =>
    item.label.toLowerCase().includes(quickAddSearch.toLowerCase())
  );

  const filteredRecommendedItems = recommendedItems.filter(item =>
    !dismissedRecommendations.includes(item.id) &&
    item.label.toLowerCase().includes(quickAddSearch.toLowerCase())
  );

  // Mock activity data - in real implementation, fetch from API
  const [activities] = useState<ActivityItem[]>([
    {
      _id: '1',
      type: 'created',
      author: { _id: 'u1', profile: { firstName: 'John', lastName: 'Doe' } },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: '2',
      type: 'status_change',
      author: { _id: 'u1', profile: { firstName: 'John', lastName: 'Doe' } },
      timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      field: 'status',
      oldValue: { id: 'idea', name: 'Idea' },
      newValue: { id: 'todo', name: 'To Do' },
    },
    {
      _id: '3',
      type: 'sprint_change',
      author: { _id: 'u2', profile: { firstName: 'Jane', lastName: 'Smith' } },
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      field: 'sprint',
      oldValue: { id: 's1', name: 'Sprint 1' },
      newValue: { id: 's2', name: 'Sprint 2' },
    },
  ]);

  const closeAllDropdowns = () => {
    setShowAssigneeDropdown(false);
    setShowPriorityDropdown(false);
    setShowLabelsDropdown(false);
    setShowTeamDropdown(false);
    setShowSprintDropdown(false);
    setShowReporterDropdown(false);
    setShowStatusDropdown(false);
    setShowEpicDropdown(false);
    setShowIssueTypeDropdown(false);
    setShowKebabMenu(false);
    setShowWatchersDropdown(false);
  };

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  // Comment Handlers - using real API
  const handleAddComment = useCallback(async (text: string) => {
    if (!text.trim() || !canComment) return;
    
    try {
      await addCommentMutation.mutateAsync({ taskId, content: text.trim() });
      setCommentText('');
      setIsCommentInputFocused(false);
      toast.success(t('projects.board.commentAdded') || 'Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  }, [canComment, taskId, addCommentMutation, t]);

  const handleEditComment = useCallback(async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    
    try {
      await updateCommentMutation.mutateAsync({ commentId, content: newText.trim(), taskId });
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success(t('projects.board.commentUpdated') || 'Comment updated!');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  }, [taskId, updateCommentMutation, t]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId, taskId });
      setCommentActionMenuId(null);
      toast.success(t('projects.board.commentDeleted') || 'Comment deleted!');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }, [taskId, deleteCommentMutation, t]);

  const handleCopyCommentLink = useCallback((commentId: string) => {
    const url = `${window.location.origin}/projects/${projectId}/tasks/${activeTask._id}#comment-${commentId}`;
    navigator.clipboard.writeText(url);
    setCommentActionMenuId(null);
    toast.success(t('projects.board.linkCopied') || 'Link copied!');
  }, [projectId, activeTask._id, t]);

  const handleQuoteComment = useCallback((content: string) => {
    const quotedText = content.split('\n').map(line => `> ${line}`).join('\n');
    setCommentText(prev => prev + (prev ? '\n\n' : '') + quotedText + '\n\n');
    setCommentActionMenuId(null);
    commentInputRef.current?.focus();
  }, []);

  // Link Issues Handlers
  const searchIssues = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const token = getToken();

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/tasks?search=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        const results = (data.data.tasks || []).filter((t: SearchResult) => t._id !== activeTask._id);
        setSearchResults(results);
        if (results.length === 0) {
          setSearchError(t('projects.board.noMatchingIssues') || 'No matching issues found');
        }
      } else {
        setSearchError(t('projects.board.searchFailed') || 'Search failed');
      }
    } catch {
      setSearchError(t('projects.board.searchFailed') || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [projectId, activeTask._id, t]);

  const handleIssueSearchChange = useCallback((value: string) => {
    setIssueSearchQuery(value);
    setSelectedIssue(null);
    setSearchError(null);

    // Check if it's a pasted URL
    const urlMatch = value.match(/\/browse\/([A-Z]+-\d+)/i) || value.match(/([A-Z]+-\d+)/i);
    if (urlMatch) {
      const issueKey = urlMatch[1].toUpperCase();
      setIssueSearchQuery(issueKey);
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchIssues(value);
    }, 300);
  }, [searchIssues]);

  const handleLinkIssue = useCallback(async () => {
    if (!selectedIssue || !canLinkIssues) return;

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/links`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: selectedRelationship,
            targetIssueKey: selectedIssue.key,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to link issue');
      }

      // Add to local state
      const newLink: LinkedIssue = {
        _id: data.data?._id || `link-${Date.now()}`,
        type: selectedRelationship,
        targetIssue: {
          _id: selectedIssue._id,
          key: selectedIssue.key,
          title: selectedIssue.title,
          type: selectedIssue.type || 'task',
          status: {
            id: selectedIssue.status?.id || '',
            name: selectedIssue.status?.name || '',
            category: selectedIssue.status?.category,
          },
          priority: selectedIssue.priority,
          assignee: selectedIssue.assignee,
        },
      };
      setLinkedIssues(prev => [...prev, newLink]);

      // Reset form
      setIssueSearchQuery('');
      setSelectedIssue(null);
      setSearchResults([]);
      setShowLinkSection(false);

      toast.success(t('projects.board.issuedLinked') || 'Issue linked successfully!');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link issue';
      toast.error(errorMessage);
    }
  }, [selectedIssue, canLinkIssues, activeTask._id, selectedRelationship, t, onTaskUpdate]);

  const handleUnlinkIssue = useCallback(async (linkId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/links/${linkId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unlink issue');
      }

      setLinkedIssues(prev => prev.filter(l => l._id !== linkId));
      toast.success(t('projects.board.issueUnlinked') || 'Issue unlinked!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlink issue';
      toast.error(errorMessage);
    }
  }, [activeTask._id, t]);

  const handleRelationshipKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showRelationshipDropdown) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setShowRelationshipDropdown(true);
        setFocusedRelationshipIndex(relationshipTypes.findIndex(r => r.id === selectedRelationship));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedRelationshipIndex(prev => 
          prev < relationshipTypes.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedRelationshipIndex(prev => 
          prev > 0 ? prev - 1 : relationshipTypes.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedRelationshipIndex >= 0) {
          setSelectedRelationship(relationshipTypes[focusedRelationshipIndex].id);
          setShowRelationshipDropdown(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowRelationshipDropdown(false);
        break;
      case 'Tab':
        setShowRelationshipDropdown(false);
        break;
    }
  }, [showRelationshipDropdown, selectedRelationship, focusedRelationshipIndex]);

  const handleCancelLink = useCallback(() => {
    setShowLinkSection(false);
    setIssueSearchQuery('');
    setSelectedIssue(null);
    setSearchResults([]);
    setSearchError(null);
    setSelectedRelationship('is_blocked_by');
  }, []);

  const getRelationshipName = useCallback((id: string) => {
    return relationshipTypes.find(r => r.id === id)?.name || id;
  }, []);

  // Quick Add Handlers
  const handleQuickAddKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showQuickAddMenu) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setShowQuickAddMenu(true);
        setFocusedQuickAddIndex(0);
        setTimeout(() => quickAddSearchRef.current?.focus(), 50);
      }
      return;
    }

    const allItems = [...filteredQuickAddItems, ...filteredRecommendedItems];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedQuickAddIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedQuickAddIndex(prev => 
          prev > 0 ? prev - 1 : allItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedQuickAddIndex >= 0 && focusedQuickAddIndex < filteredQuickAddItems.length) {
          filteredQuickAddItems[focusedQuickAddIndex].action();
          setShowQuickAddMenu(false);
          setQuickAddSearch('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowQuickAddMenu(false);
        setQuickAddSearch('');
        setFocusedQuickAddIndex(-1);
        break;
    }
  }, [showQuickAddMenu, filteredQuickAddItems, filteredRecommendedItems, focusedQuickAddIndex]);

  // Keyboard shortcuts for Quick Add (Shift+C for subtask, Shift+K for link)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowCreateSubtaskModal(true);
      } else if (e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setShowLinkSection(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleCreateSubtask = useCallback(async () => {
    if (!newSubtaskTitle.trim()) return;

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          type: 'subtask',
          parent: activeTask._id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subtask');
      }

      toast.success(t('projects.board.subtaskCreated') || 'Subtask created!');
      setShowCreateSubtaskModal(false);
      setNewSubtaskTitle('');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subtask';
      toast.error(errorMessage);
    }
  }, [newSubtaskTitle, projectId, activeTask._id, t, onTaskUpdate]);

  const handleAddWebLink = useCallback(async () => {
    if (!webLinkUrl.trim()) return;

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/web-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: webLinkUrl.trim(),
          title: webLinkTitle.trim() || webLinkUrl.trim(),
          description: webLinkDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add web link');
      }

      toast.success(t('projects.board.webLinkAdded') || 'Web link added!');
      setShowAddWebLinkModal(false);
      setWebLinkUrl('');
      setWebLinkTitle('');
      setWebLinkDescription('');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add web link';
      toast.error(errorMessage);
    }
  }, [webLinkUrl, webLinkTitle, webLinkDescription, activeTask._id, t, onTaskUpdate]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = getToken();
    if (!token) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('attachments', files[i]);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload attachment');
      }

      toast.success(t('projects.board.attachmentUploaded') || 'Attachment uploaded!');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload attachment';
      toast.error(errorMessage);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeTask._id, t, onTaskUpdate]);

  // Fetch available epics
  useEffect(() => {
    const fetchEpics = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks?type=epic`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setAvailableEpics(data.data.tasks || []);
        }
      } catch (error) {
        console.error('Failed to fetch epics:', error);
      }
    };

    fetchEpics();
  }, [projectId]);

  // Fetch watchers
  useEffect(() => {
    const fetchWatchers = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/watchers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setWatchers(data.data.watchers || []);
          setIsWatching(data.data.watchers?.some((w: Watcher) => w._id === currentUser?._id) || false);
        }
      } catch (error) {
        console.error('Failed to fetch watchers:', error);
      }
    };

    fetchWatchers();
  }, [activeTask._id, currentUser?._id]);

  // Copy issue link to clipboard
  const handleCopyLink = useCallback(() => {
    const issueUrl = `${window.location.origin}/projects/${projectId}/tasks/${activeTask._id}`;
    navigator.clipboard.writeText(issueUrl).then(() => {
      toast.success(t('projects.board.linkCopied') || 'Link copied!');
    }).catch(() => {
      toast.error(t('projects.board.copyFailed') || 'Failed to copy link');
    });
  }, [projectId, activeTask._id, t]);

  // Toggle watch status
  const handleToggleWatch = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const method = isWatching ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/watchers`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update watch status');
      }

      setIsWatching(!isWatching);
      if (isWatching) {
        setWatchers(prev => prev.filter(w => w._id !== currentUser?._id));
        toast.success(t('projects.board.unwatched') || 'Stopped watching');
      } else {
        if (currentUser) {
          setWatchers(prev => [...prev, currentUser]);
        }
        toast.success(t('projects.board.watching') || 'Now watching');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update watch status';
      toast.error(errorMessage);
    }
  }, [isWatching, activeTask._id, currentUser, t]);

  // Change issue type
  const handleChangeIssueType = useCallback(async (newType: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: newType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change issue type');
      }

      toast.success(t('projects.board.issueTypeChanged') || 'Issue type changed!');
      setShowIssueTypeDropdown(false);
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change issue type';
      toast.error(errorMessage);
    }
  }, [activeTask._id, t, onTaskUpdate]);

  // Change parent epic
  const handleChangeEpic = useCallback(async (epicId: string | null) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parent: epicId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change epic');
      }

      toast.success(epicId ? (t('projects.board.epicAssigned') || 'Epic assigned!') : (t('projects.board.epicRemoved') || 'Epic removed!'));
      setShowEpicDropdown(false);
      setEpicSearch('');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change epic';
      toast.error(errorMessage);
    }
  }, [activeTask._id, t, onTaskUpdate]);

  // Kebab menu actions
  const handleCloneIssue = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to clone issue');
      }

      toast.success(t('projects.board.issueCloned') || 'Issue cloned!');
      setShowKebabMenu(false);
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clone issue';
      toast.error(errorMessage);
    }
  }, [activeTask._id, t, onTaskUpdate]);

  const handleDeleteIssue = useCallback(async () => {
    if (!confirm(t('projects.board.confirmDelete') || 'Are you sure you want to delete this issue?')) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete issue');
      }

      toast.success(t('projects.board.issueDeleted') || 'Issue deleted!');
      setShowKebabMenu(false);
      onClose();
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete issue';
      toast.error(errorMessage);
    }
  }, [activeTask._id, t, onClose, onTaskUpdate]);

  // Filter epics based on search
  const filteredEpics = availableEpics.filter(epic =>
    epic.title.toLowerCase().includes(epicSearch.toLowerCase()) ||
    epic.key.toLowerCase().includes(epicSearch.toLowerCase())
  );

  // Get current issue type info
  const getCurrentIssueType = () => {
    return issueTypes.find(type => type.id === activeTask.type) || issueTypes[1]; // default to story
  };

  // Status Handlers
  const handleStatusChange = useCallback(async (statusId: string) => {
    if (!canEditStatus) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      toast.success(t('projects.board.statusUpdated') || 'Status updated!');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setShowStatusDropdown(false);
      setFocusedStatusIndex(-1);
    }
  }, [canEditStatus, activeTask._id, onTaskUpdate, t]);

  const handleStatusKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showStatusDropdown) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (canEditStatus) {
          setShowStatusDropdown(true);
          setFocusedStatusIndex(0);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedStatusIndex(prev => 
          prev < statusOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedStatusIndex(prev => 
          prev > 0 ? prev - 1 : statusOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedStatusIndex >= 0 && focusedStatusIndex < statusOptions.length) {
          handleStatusChange(statusOptions[focusedStatusIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowStatusDropdown(false);
        setFocusedStatusIndex(-1);
        break;
      case 'Tab':
        setShowStatusDropdown(false);
        setFocusedStatusIndex(-1);
        break;
    }
  }, [showStatusDropdown, canEditStatus, statusOptions, focusedStatusIndex, handleStatusChange]);

  const handleCreateStatus = useCallback(() => {
    if (!newStatusName.trim()) return;
    
    const newStatus: StatusOption = {
      id: newStatusName.toLowerCase().replace(/\s+/g, '-'),
      name: newStatusName.trim(),
      category: newStatusCategory,
      color: newStatusCategory === 'done' ? 'text-green-700' : 
             newStatusCategory === 'in_progress' ? 'text-blue-700' : 'text-gray-700',
      bgColor: newStatusCategory === 'done' ? 'bg-green-100' : 
               newStatusCategory === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100',
    };
    
    setStatusOptions(prev => [...prev, newStatus]);
    setNewStatusName('');
    setNewStatusCategory('todo');
    setShowCreateStatusModal(false);
    toast.success(t('projects.board.statusCreated') || 'Status created!');
  }, [newStatusName, newStatusCategory, t]);

  // Get current status styling
  const getCurrentStatusStyle = useCallback(() => {
    const status = statusOptions.find(s => s.id === activeTask.status.id);
    return status || { color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }, [statusOptions, activeTask.status.id]);

  // API Handlers
  const updateTask = async (updates: Record<string, unknown>) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${activeTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      toast.success(t('projects.board.taskUpdated') || 'Task updated successfully!');
      onTaskUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      toast.error(errorMessage);
    }
  };

  const handleAssigneeChange = async (userId: string | null) => {
    closeAllDropdowns();
    await updateTask({ assignee: userId });
  };

  const handleAssignToMe = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Get current user
      const response = await fetch('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data?.user?._id) {
        await handleAssigneeChange(data.data.user._id);
      }
    } catch {
      toast.error('Failed to get current user');
    }
  };

  const handlePriorityChange = async (priority: string) => {
    closeAllDropdowns();
    await updateTask({ priority });
  };

  const handleLabelsChange = async (labels: string[]) => {
    await updateTask({ labels });
  };

  const handleAddLabel = async (labelId: string) => {
    const currentLabels = activeTask.labels || [];
    if (!currentLabels.includes(labelId)) {
      await handleLabelsChange([...currentLabels, labelId]);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    const currentLabels = activeTask.labels || [];
    await handleLabelsChange(currentLabels.filter(l => l !== labelId));
  };

  const handleSprintChange = async (sprintId: string | null) => {
    closeAllDropdowns();
    await updateTask({ sprintId: sprintId });
  };

  const handleTeamChange = async (teamId: string | null) => {
    closeAllDropdowns();
    await updateTask({ team: teamId });
  };

  const handleReporterChange = async (reporterId: string) => {
    closeAllDropdowns();
    await updateTask({ reporter: reporterId });
  };

  const handleStartDateChange = async (date: string) => {
    await updateTask({ startDate: date || null });
  };

  const handleDueDateChange = async (date: string) => {
    await updateTask({ dueDate: date || null });
  };

  const handleStoryPointsChange = async () => {
    setEditingStoryPoints(false);
    const points = storyPointsValue ? parseInt(storyPointsValue) : null;
    await updateTask({ storyPoints: points });
  };

  const handleTitleChange = async () => {
    if (titleValue.trim() === '') {
      toast.error('Title cannot be empty');
      setTitleValue(activeTask.title);
      setEditingTitle(false);
      return;
    }
    setEditingTitle(false);
    if (titleValue !== activeTask.title) {
      await updateTask({ title: titleValue });
    }
  };

  const handleDescriptionChange = async () => {
    setEditingDescription(false);
    if (descriptionValue !== (taskDetail?.description || '')) {
      await updateTask({ description: descriptionValue });
    }
  };

  // Markdown formatting helpers
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = descriptionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = descriptionValue.substring(start, end);
    const newText = descriptionValue.substring(0, start) + before + selectedText + after + descriptionValue.substring(end);
    
    setDescriptionValue(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    
    // Simple markdown rendering
    const html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Code
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return html;
  };

  const togglePinField = (fieldId: string) => {
    setPinnedFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getDisplayName = (person: TaskAssignee | null | undefined): string => {
    if (!person) return '';
    if (person.profile?.firstName || person.profile?.lastName) {
      return `${person.profile.firstName || ''} ${person.profile.lastName || ''}`.trim();
    }
    return person.name || person.email || '';
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    const displayName = getDisplayName(member);
    if (!displayName) return false;
    return displayName.toLowerCase().includes(assigneeSearch.toLowerCase());
  });

  const filteredLabels = availableLabels.filter(label =>
    label.name.toLowerCase().includes(labelSearch.toLowerCase())
  );

  const getDisplayInitials = (person: TaskAssignee | null | undefined): string => {
    if (!person) return '?';
    if (person.profile?.firstName || person.profile?.lastName) {
      return getInitials(person.profile.firstName || '', person.profile.lastName || '');
    }
    if (person.name) {
      const parts = person.name.split(' ');
      return parts.map(p => p[0] || '').join('').toUpperCase().slice(0, 2);
    }
    return person.email?.[0]?.toUpperCase() || '?';
  };

  const getPriorityInfo = (priorityId: string) => {
    return priorities.find(p => p.id === priorityId) || priorities[4];
  };

  return (
    <div className="w-[480px] shrink-0 bg-white border-s border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {/* Issue Type Selector */}
          <div className="relative" ref={issueTypeDropdownRef}>
            <button
              onClick={() => setShowIssueTypeDropdown(!showIssueTypeDropdown)}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${getCurrentIssueType().color}`}
              aria-haspopup="listbox"
              aria-expanded={showIssueTypeDropdown}
              title={t('projects.board.changeIssueType') || 'Change issue type'}
            >
              <span>{getCurrentIssueType().icon}</span>
              <span className="text-xs font-medium">{getCurrentIssueType().name}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showIssueTypeDropdown && (
              <div className="absolute start-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                <ul role="listbox" className="py-1">
                  {issueTypes.map((type) => (
                    <li key={type.id} role="option" aria-selected={activeTask.type === type.id}>
                      <button
                        onClick={() => handleChangeIssueType(type.id)}
                        className={`w-full px-3 py-2 text-start flex items-center gap-2 hover:bg-gray-100 ${
                          activeTask.type === type.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className={type.color}>{type.icon}</span>
                        <span className="text-sm text-gray-700">{type.name}</span>
                        {activeTask.type === type.id && <Check className="h-4 w-4 text-blue-600 ms-auto" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <span className="text-gray-400">|</span>
          <span>{t('projects.board.workItem') || 'Work item'}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={t('projects.board.copyLink') || 'Copy link'}
            aria-label={t('projects.board.copyLink') || 'Copy link'}
          >
            <Link2 className="h-4 w-4" />
          </button>
          
          {/* Watchers Button */}
          <div className="relative" ref={watchersDropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWatchersDropdown(!showWatchersDropdown);
              }}
              className={`p-1.5 rounded flex items-center gap-1 ${
                showWatchersDropdown || isWatching ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={`${watchers.length} ${t('projects.board.watching') || 'watching'}`}
              aria-label={`${watchers.length} ${t('projects.board.watching') || 'watching'}`}
            >
              <svg className="h-4 w-4" fill={isWatching ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {watchers.length > 0 && <span className="text-xs">{watchers.length}</span>}
            </button>

            {/* Watchers Dropdown */}
            {showWatchersDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t('projects.board.watchers') || 'Watchers'} ({watchers.length})
                  </h3>
                </div>
                
                {watchers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {t('projects.board.noWatchers') || 'No watchers yet'}
                  </div>
                ) : (
                  <div className="py-2">
                    {watchers.map((watcher) => {
                      if (!watcher?.profile?.firstName || !watcher?.profile?.lastName) {
                        return null;
                      }
                      
                      const initials = `${watcher.profile.firstName.charAt(0)}${watcher.profile.lastName.charAt(0)}`.toUpperCase();
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                      const colorIndex = (watcher.profile.firstName.charCodeAt(0) || 0) % colors.length;
                      const isCurrentUser = watcher._id === currentUser?._id;

                      return (
                        <div
                          key={watcher._id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                        >
                          <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {watcher.profile.firstName} {watcher.profile.lastName}
                              {isCurrentUser && <span className="ml-1 text-xs text-gray-500">(you)</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={t('projects.board.share') || 'Share'}
            aria-label={t('projects.board.share') || 'Share'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          
          {/* Open in Full Page */}
          <button
            onClick={() => window.open(`/projects/${projectId}/tasks/${activeTask._id}`, '_blank')}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={t('projects.board.openInNewTab') || 'Open in new tab'}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          
          {/* Kebab Menu */}
          <div className="relative" ref={kebabMenuRef}>
            <button
              onClick={() => setShowKebabMenu(!showKebabMenu)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title={t('projects.board.moreActions') || 'More actions'}
              aria-haspopup="menu"
              aria-expanded={showKebabMenu}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showKebabMenu && (
              <div className="absolute end-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                <ul role="menu" className="py-1">
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={() => {
                        router.push(`/projects/${projectId}/tasks/${activeTask._id}/edit`);
                        setShowKebabMenu(false);
                      }}
                      className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      {t('projects.board.edit') || 'Edit'}
                    </button>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={handleCloneIssue}
                      className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('projects.board.clone') || 'Clone'}
                    </button>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setShowKebabMenu(false);
                        // Move action - could open a modal to select destination
                        toast(t('projects.board.moveNotImplemented') || 'Move feature coming soon');
                      }}
                      className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      {t('projects.board.move') || 'Move'}
                    </button>
                  </li>
                  <li role="none" className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      role="menuitem"
                      onClick={handleDeleteIssue}
                      className="w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('projects.board.delete') || 'Delete'}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Breadcrumb with Epic */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
          {/* Epic/Parent Section */}
          <div className="relative" ref={epicDropdownRef}>
            {activeTask.parent ? (
              <div className="flex items-center gap-1">
                <a
                  href={`/projects/${projectId}/board?selectedIssue=${activeTask.parent?.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-600 hover:underline"
                  title={activeTask.parent.title}
                >
                  <span className="text-purple-600">⚡</span>
                  <span>{activeTask.parent.key}</span>
                </a>
                <button
                  onClick={() => setShowEpicDropdown(!showEpicDropdown)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title={t('projects.board.changeEpic') || 'Change epic'}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowEpicDropdown(!showEpicDropdown)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>{t('projects.board.addEpic') || 'Add epic'}</span>
              </button>
            )}
            
            {showEpicDropdown && (
              <div className="absolute start-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={epicSearch}
                      onChange={(e) => setEpicSearch(e.target.value)}
                      placeholder={t('projects.board.searchEpics') || 'Search epics...'}
                      className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </div>
                <ul className="max-h-48 overflow-y-auto py-1">
                  {activeTask.parent && (
                    <li>
                      <button
                        onClick={() => handleChangeEpic(null)}
                        className="w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        {t('projects.board.removeEpic') || 'Remove epic'}
                      </button>
                    </li>
                  )}
                  {filteredEpics.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      {t('projects.board.noEpicsFound') || 'No epics found'}
                    </li>
                  ) : (
                    filteredEpics.map((epic) => (
                      <li key={epic._id}>
                        <button
                          onClick={() => handleChangeEpic(epic._id)}
                          className={`w-full px-3 py-2 text-start text-sm hover:bg-gray-100 flex items-center gap-2 ${
                            activeTask.parent?._id === epic._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className="text-purple-600">⚡</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-700">{epic.key}</span>
                            <span className="text-gray-500 ms-1 truncate">{epic.title}</span>
                          </div>
                          {activeTask.parent?._id === epic._id && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <span className="text-gray-300">/</span>
          
          {/* Current Issue */}
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <span className={getCurrentIssueType().color}>{getCurrentIssueType().icon}</span>
            <span>{activeTask.key}</span>
          </span>
        </div>

        {/* Title */}
        {editingTitle ? (
          <div className="mb-4">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleChange();
                } else if (e.key === 'Escape') {
                  setTitleValue(activeTask.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="w-full text-xl font-semibold text-gray-900 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="group mb-4 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 flex-1">{activeTask.title}</h1>
            <button
              onClick={() => setEditingTitle(true)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
              aria-label="Edit title"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 mb-6 relative" ref={statusDropdownRef}>
          {canEditStatus ? (
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowStatusDropdown(!showStatusDropdown);
                setFocusedStatusIndex(statusOptions.findIndex(s => s.id === activeTask.status.id));
              }}
              onKeyDown={handleStatusKeyDown}
              className={`px-3 py-1.5 ${getCurrentStatusStyle().bgColor} ${getCurrentStatusStyle().color} border border-gray-300 rounded flex items-center gap-2 text-sm hover:opacity-80 transition-opacity`}
              aria-haspopup="listbox"
              aria-expanded={showStatusDropdown}
              aria-controls="status-listbox"
              aria-label={`${t('projects.board.status') || 'Status'}: ${activeTask.status.name || t('projects.board.selectStatus') || 'Select...'}`}
            >
              {activeTask.status.name || t('projects.board.selectStatus') || 'Select...'} 
              <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <span 
              className={`px-3 py-1.5 ${getCurrentStatusStyle().bgColor} ${getCurrentStatusStyle().color} border border-gray-200 rounded text-sm cursor-not-allowed`}
              aria-label={`${t('projects.board.status') || 'Status'}: ${activeTask.status.name}`}
            >
              {activeTask.status.name}
            </span>
          )}

          {/* Status Dropdown */}
          {showStatusDropdown && canEditStatus && (
            <div 
              className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30"
              role="presentation"
            >
              <ul
                ref={statusListRef}
                id="status-listbox"
                role="listbox"
                aria-label={t('projects.board.statusOptions') || 'Status options'}
                aria-activedescendant={focusedStatusIndex >= 0 ? `status-option-${statusOptions[focusedStatusIndex]?.id}` : undefined}
                className="py-1 max-h-60 overflow-y-auto"
              >
                {statusOptions.map((status, index) => (
                  <li
                    key={status.id}
                    id={`status-option-${status.id}`}
                    role="option"
                    aria-selected={activeTask.status.id === status.id}
                    tabIndex={-1}
                    onClick={() => handleStatusChange(status.id)}
                    onMouseEnter={() => setFocusedStatusIndex(index)}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                      focusedStatusIndex === index ? 'bg-gray-100' : ''
                    } ${activeTask.status.id === status.id ? 'bg-blue-50' : ''}`}
                  >
                    <span className={`w-3 h-3 rounded-full ${status.bgColor}`} />
                    <span className={`text-sm ${status.color}`}>{status.name}</span>
                    {activeTask.status.id === status.id && (
                      <Check className="h-4 w-4 text-blue-600 ms-auto" />
                    )}
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Admin Actions */}
              {currentUser?.permissions?.isAdmin && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowStatusDropdown(false);
                      setShowCreateStatusModal(true);
                    }}
                    className="w-full px-3 py-2 text-sm text-start text-blue-600 hover:bg-gray-100 flex items-center gap-2"
                    role="menuitem"
                  >
                    <Plus className="h-4 w-4" />
                    {t('projects.board.createStatus') || 'Create status'}
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusDropdown(false);
                      router.push(`/projects/${projectId}/settings/workflow`);
                    }}
                    className="w-full px-3 py-2 text-sm text-start text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4" />
                    {t('projects.board.editStatuses') || 'Edit statuses'}
                  </button>
                </div>
              )}

              {/* View Workflow */}
              <div className="border-t border-gray-200 py-1">
                <button
                  onClick={() => {
                    setShowStatusDropdown(false);
                    setShowWorkflowModal(true);
                  }}
                  className="w-full px-3 py-2 text-sm text-start text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  role="menuitem"
                >
                  <GitBranch className="h-4 w-4" />
                  {t('projects.board.viewWorkflow') || 'View workflow'}
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <button 
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label={t('projects.board.quickActions') || 'Quick actions'}
            title={t('projects.board.quickActions') || 'Quick actions'}
          >
            <Zap className="h-4 w-4" />
          </button>
          {currentUser?.permissions?.isAdmin && (
            <button 
              onClick={() => router.push(`/projects/${projectId}/settings/workflow`)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              aria-label={t('projects.board.editStatuses') || 'Edit statuses'}
              title={t('projects.board.editStatuses') || 'Edit statuses'}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          {currentUser?.permissions?.isAdmin && (
            <button 
              onClick={() => setShowCreateStatusModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              aria-label={t('projects.board.createStatus') || 'Create status'}
              title={t('projects.board.createStatus') || 'Create status'}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Create Status Modal */}
        {showCreateStatusModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateStatusModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-status-title"
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-96 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="create-status-title" className="text-lg font-semibold text-gray-900 mb-4">
                {t('projects.board.createNewStatus') || 'Create New Status'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="status-name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.statusName') || 'Status Name'}
                  </label>
                  <input
                    id="status-name"
                    type="text"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder={t('projects.board.enterStatusName') || 'Enter status name...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label htmlFor="status-category" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.statusCategory') || 'Category'}
                  </label>
                  <select
                    id="status-category"
                    value={newStatusCategory}
                    onChange={(e) => setNewStatusCategory(e.target.value as 'todo' | 'in_progress' | 'done')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todo">{t('projects.board.categoryTodo') || 'To Do'}</option>
                    <option value="in_progress">{t('projects.board.categoryInProgress') || 'In Progress'}</option>
                    <option value="done">{t('projects.board.categoryDone') || 'Done'}</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateStatusModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('projects.board.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={!newStatusName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('projects.board.create') || 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Workflow Modal */}
        {showWorkflowModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowWorkflowModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="workflow-title"
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-[600px] max-w-[90vw] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="workflow-title" className="text-lg font-semibold text-gray-900">
                  {t('projects.board.workflowDiagram') || 'Workflow Diagram'}
                </h2>
                <button
                  onClick={() => setShowWorkflowModal(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  aria-label={t('projects.board.close') || 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Simple Workflow Diagram */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
                {statusOptions.map((status, index) => (
                  <div key={status.id} className="flex items-center">
                    <div 
                      className={`px-4 py-3 rounded-lg border-2 ${
                        activeTask.status.id === status.id 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200'
                      } ${status.bgColor} min-w-[100px] text-center`}
                    >
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.name}
                      </span>
                      {activeTask.status.id === status.id && (
                        <div className="text-xs text-blue-600 mt-1">
                          {t('projects.board.currentStatus') || 'Current'}
                        </div>
                      )}
                    </div>
                    {index < statusOptions.length - 1 && (
                      <div className="flex items-center px-2">
                        <div className="w-8 h-0.5 bg-gray-300" />
                        <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                {t('projects.board.workflowDescription') || 'Click on any status in the dropdown to transition the task.'}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <button
            className="flex items-center gap-2 text-gray-900 mb-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? '' : '-rotate-90'}`} />
            <span className="font-medium">{t('projects.common.description') || 'Description'}</span>
          </button>
          {showDetails && (
            <div className="pl-6">
              {editingDescription ? (
                <div className="border border-blue-500 rounded-lg overflow-hidden">
                  {/* Markdown Toolbar */}
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1">
                    <button
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Bold (Ctrl+B)"
                      type="button"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Italic (Ctrl+I)"
                      type="button"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('`', '`')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Code"
                      type="button"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      onClick={() => insertMarkdown('# ', '')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Heading"
                      type="button"
                    >
                      <Heading className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('- ', '')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="List"
                      type="button"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('> ', '')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Quote"
                      type="button"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => insertMarkdown('[', '](url)')}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                      title="Link"
                      type="button"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex gap-1 border-l border-gray-300 pl-2">
                      <button
                        onClick={() => setDescriptionPreviewMode(false)}
                        className={`px-2 py-1 text-xs rounded ${!descriptionPreviewMode ? 'bg-white text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        type="button"
                      >
                        Write
                      </button>
                      <button
                        onClick={() => setDescriptionPreviewMode(true)}
                        className={`px-2 py-1 text-xs rounded ${descriptionPreviewMode ? 'bg-white text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                        type="button"
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Editor/Preview Area */}
                  {descriptionPreviewMode ? (
                    <div 
                      className="p-3 min-h-[120px] text-gray-600 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(descriptionValue) }}
                    />
                  ) : (
                    <textarea
                      ref={descriptionTextareaRef}
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setDescriptionValue(taskDetail?.description || '');
                          setEditingDescription(false);
                          setDescriptionPreviewMode(false);
                        }
                      }}
                      autoFocus
                      rows={6}
                      className="w-full text-gray-600 text-sm px-3 py-2 focus:outline-none resize-none"
                      placeholder={t('projects.board.enterDescription') || 'Enter description... (Markdown supported)'}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        handleDescriptionChange();
                        setDescriptionPreviewMode(false);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      type="button"
                    >
                      {t('common.save') || 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setDescriptionValue(taskDetail?.description || '');
                        setEditingDescription(false);
                        setDescriptionPreviewMode(false);
                      }}
                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                      type="button"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-500 self-center">
                      Markdown supported
                    </span>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <div className="flex items-start gap-2">
                    <div 
                      className="text-gray-600 text-sm flex-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: taskDetail?.description 
                          ? renderMarkdown(taskDetail.description) 
                          : `<span class="text-gray-400">${t('projects.board.noDescription') || 'No description'}</span>`
                      }}
                    />
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
                      aria-label="Edit description"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Section */}
        <div className="mb-6" ref={quickAddMenuRef}>
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickAddMenu(!showQuickAddMenu);
                setFocusedQuickAddIndex(0);
                setTimeout(() => quickAddSearchRef.current?.focus(), 50);
              }}
              onKeyDown={handleQuickAddKeyDown}
              className="w-full px-4 py-3 text-start bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
              aria-haspopup="menu"
              aria-expanded={showQuickAddMenu}
              aria-controls="quick-add-menu"
            >
              <Plus className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">
                {t('projects.board.addOrCreateWork') || 'Add or create work related to this Story'}
              </span>
            </button>

            {/* Quick Add Dropdown Menu */}
            {showQuickAddMenu && (
              <div
                id="quick-add-menu"
                className="absolute start-0 end-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30"
                role="menu"
                aria-label={t('projects.board.quickAddMenu') || 'Quick add menu'}
              >
                {/* Search Input */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={quickAddSearchRef}
                      type="text"
                      value={quickAddSearch}
                      onChange={(e) => setQuickAddSearch(e.target.value)}
                      onKeyDown={handleQuickAddKeyDown}
                      placeholder={t('projects.board.findMenuItem') || 'Find menu item'}
                      className="w-full ps-10 pe-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={t('projects.board.findMenuItem') || 'Find menu item'}
                    />
                  </div>
                </div>

                {/* Menu Items */}
                <ul className="py-1" role="menu">
                  {filteredQuickAddItems.map((item, index) => (
                    <li key={item.id} role="none">
                      <button
                        role="menuitem"
                        onClick={() => {
                          item.action();
                          setShowQuickAddMenu(false);
                          setQuickAddSearch('');
                        }}
                        onMouseEnter={() => setFocusedQuickAddIndex(index)}
                        className={`w-full px-4 py-2 text-start flex items-center gap-3 text-sm ${
                          focusedQuickAddIndex === index ? 'bg-gray-100' : ''
                        } hover:bg-gray-100`}
                        tabIndex={-1}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="flex-1 text-gray-700">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Recommended Section */}
                {filteredRecommendedItems.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 px-4 py-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('projects.board.recommendedForYou') || 'Recommended for you'}
                      </span>
                    </div>
                    <ul className="py-1" role="menu">
                      {filteredRecommendedItems.map((item) => (
                        <li key={item.id} role="none" className="flex items-center">
                          <button
                            role="menuitem"
                            className="flex-1 px-4 py-2 text-start flex items-center gap-3 text-sm hover:bg-gray-100"
                            tabIndex={-1}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1">
                              <span className="text-gray-700">{item.label}</span>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => setDismissedRecommendations(prev => [...prev, item.id])}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            aria-label={`${t('projects.board.dismiss') || 'Dismiss'} ${item.label}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* Subtasks */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{t('projects.board.subtasks') || 'Subtasks'}</h3>
          <button 
            onClick={() => setShowCreateSubtaskModal(true)}
            className="text-blue-600 text-sm hover:underline"
          >
            {t('projects.board.addSubtask') || 'Add subtask'}
          </button>
        </div>

        {/* Create Subtask Modal */}
        {showCreateSubtaskModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateSubtaskModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-subtask-title"
          >
            <div
              className="bg-white rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="create-subtask-title" className="text-lg font-semibold text-gray-900">
                  {t('projects.board.createSubtask') || 'Create Subtask'}
                </h2>
                <button
                  onClick={() => setShowCreateSubtaskModal(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  aria-label={t('projects.board.close') || 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="subtask-title" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.subtaskTitle') || 'Subtask title'}
                  </label>
                  <input
                    id="subtask-title"
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder={t('projects.board.enterSubtaskTitle') || 'Enter subtask title...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                        handleCreateSubtask();
                      }
                    }}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  {t('projects.board.parentIssue') || 'Parent issue'}: <span className="font-medium text-gray-700">{activeTask.key}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateSubtaskModal(false);
                    setNewSubtaskTitle('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('projects.board.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleCreateSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('projects.board.create') || 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Web Link Modal */}
        {showAddWebLinkModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddWebLinkModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-weblink-title"
          >
            <div
              className="bg-white rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="add-weblink-title" className="text-lg font-semibold text-gray-900">
                  {t('projects.board.addWebLink') || 'Add Web Link'}
                </h2>
                <button
                  onClick={() => setShowAddWebLinkModal(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  aria-label={t('projects.board.close') || 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="weblink-url" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.url') || 'URL'} *
                  </label>
                  <input
                    id="weblink-url"
                    type="url"
                    value={webLinkUrl}
                    onChange={(e) => setWebLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="weblink-title" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.linkTitle') || 'Title'}
                  </label>
                  <input
                    id="weblink-title"
                    type="text"
                    value={webLinkTitle}
                    onChange={(e) => setWebLinkTitle(e.target.value)}
                    placeholder={t('projects.board.enterLinkTitle') || 'Enter link title...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="weblink-description" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.linkDescription') || 'Description'}
                  </label>
                  <textarea
                    id="weblink-description"
                    value={webLinkDescription}
                    onChange={(e) => setWebLinkDescription(e.target.value)}
                    placeholder={t('projects.board.enterLinkDescription') || 'Enter description...'}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddWebLinkModal(false);
                    setWebLinkUrl('');
                    setWebLinkTitle('');
                    setWebLinkDescription('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('projects.board.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAddWebLink}
                  disabled={!webLinkUrl.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('projects.board.addLink') || 'Add link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowShareModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            <div
              className="bg-white rounded-lg shadow-xl w-[400px] max-w-[90vw] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="share-modal-title" className="text-lg font-semibold text-gray-900">
                  {t('projects.board.shareIssue') || 'Share Issue'}
                </h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  aria-label={t('projects.board.close') || 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Copy Link */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 truncate">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${projectId}/tasks/${activeTask._id}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleCopyLink();
                      setShowShareModal(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('projects.board.copy') || 'Copy'}
                  </button>
                </div>

                {/* Share Options */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {t('projects.board.shareVia') || 'Share via'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/projects/${projectId}/tasks/${activeTask._id}`;
                        window.open(`mailto:?subject=${encodeURIComponent(activeTask.title)}&body=${encodeURIComponent(url)}`, '_blank');
                        setShowShareModal(false);
                      }}
                      className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('projects.board.email') || 'Email'}
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/projects/${projectId}/tasks/${activeTask._id}`;
                        window.open(`https://slack.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(activeTask.title)}`, '_blank');
                        setShowShareModal(false);
                      }}
                      className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                      </svg>
                      Slack
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linked Work Items Section */}
        <div className="mb-6" role="region" aria-labelledby="linked-items-heading">
          <div className="flex items-center justify-between mb-3">
            <h3 id="linked-items-heading" className="font-medium text-gray-900">
              {t('projects.board.linkedWorkItems') || 'Linked work items'}
              {linkedIssues.length > 0 && (
                <span className="text-gray-500 font-normal ml-2">({linkedIssues.length})</span>
              )}
            </h3>
            {canLinkIssues && !showLinkSection && (
              <button
                onClick={() => setShowLinkSection(true)}
                className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                aria-label={t('projects.board.addLinkedWorkItem') || 'Add linked work item'}
              >
                <Plus className="h-4 w-4" />
                {t('projects.board.addLink') || 'Add link'}
              </button>
            )}
          </div>

          {/* Link Creation Form */}
          {showLinkSection && canLinkIssues && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="space-y-4">
                {/* Relationship Dropdown */}
                <div ref={relationshipDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.relationshipType') || 'Relationship type'}
                  </label>
                  <button
                    onClick={() => {
                      setShowRelationshipDropdown(!showRelationshipDropdown);
                      setFocusedRelationshipIndex(relationshipTypes.findIndex(r => r.id === selectedRelationship));
                    }}
                    onKeyDown={handleRelationshipKeyDown}
                    className="w-full px-3 py-2 text-start bg-white border border-gray-300 rounded-lg flex items-center justify-between text-sm hover:bg-gray-50"
                    aria-haspopup="listbox"
                    aria-expanded={showRelationshipDropdown}
                    aria-controls="relationship-listbox"
                    aria-label={`${t('projects.board.relationshipType') || 'Relationship type'}: ${getRelationshipName(selectedRelationship)}`}
                  >
                    <span>{getRelationshipName(selectedRelationship)}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showRelationshipDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showRelationshipDropdown && (
                    <ul
                      id="relationship-listbox"
                      role="listbox"
                      aria-label={t('projects.board.selectRelationship') || 'Select relationship type'}
                      aria-activedescendant={focusedRelationshipIndex >= 0 ? `relationship-${relationshipTypes[focusedRelationshipIndex]?.id}` : undefined}
                      className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {relationshipTypes.map((rel, index) => (
                        <li
                          key={rel.id}
                          id={`relationship-${rel.id}`}
                          role="option"
                          aria-selected={selectedRelationship === rel.id}
                          onClick={() => {
                            setSelectedRelationship(rel.id);
                            setShowRelationshipDropdown(false);
                          }}
                          onMouseEnter={() => setFocusedRelationshipIndex(index)}
                          className={`px-3 py-2 cursor-pointer text-sm ${
                            focusedRelationshipIndex === index ? 'bg-gray-100' : ''
                          } ${selectedRelationship === rel.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        >
                          {rel.name}
                          {selectedRelationship === rel.id && (
                            <Check className="h-4 w-4 text-blue-600 float-right" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Issue Search Input */}
                <div className="relative">
                  <label htmlFor="issue-search" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.searchIssue') || 'Search or paste issue URL'}
                  </label>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      id="issue-search"
                      type="text"
                      value={issueSearchQuery}
                      onChange={(e) => handleIssueSearchChange(e.target.value)}
                      placeholder={t('projects.board.issueSearchPlaceholder') || 'PROJ-123 or paste URL...'}
                      className="w-full ps-10 pe-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={t('projects.board.searchIssue') || 'Search or paste issue URL'}
                      aria-autocomplete="list"
                      aria-controls="search-results"
                      aria-describedby={searchError ? 'search-error' : undefined}
                      autoComplete="off"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && !selectedIssue && (
                    <ul
                      id="search-results"
                      role="listbox"
                      aria-label={t('projects.board.searchResults') || 'Search results'}
                      className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {searchResults.map((result) => (
                        <li
                          key={result._id}
                          role="option"
                          aria-selected={false}
                          onClick={() => {
                            setSelectedIssue(result);
                            setIssueSearchQuery(result.key);
                            setSearchResults([]);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="font-medium text-sm text-blue-600">{result.key}</span>
                          <span className="text-sm text-gray-700 truncate flex-1">{result.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            {result.status?.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Selected Issue */}
                  {selectedIssue && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <span className="font-medium text-sm text-blue-700">{selectedIssue.key}</span>
                      <span className="text-sm text-gray-700 truncate flex-1">{selectedIssue.title}</span>
                      <button
                        onClick={() => {
                          setSelectedIssue(null);
                          setIssueSearchQuery('');
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        aria-label={t('projects.board.clearSelection') || 'Clear selection'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Search Error */}
                  {searchError && (
                    <p id="search-error" className="mt-1 text-sm text-red-600" role="alert">
                      {searchError}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setShowCreateLinkedModal(true)}
                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    {t('projects.board.createLinkedWorkItem') || 'Create linked work item'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelLink}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      {t('projects.board.cancel') || 'Cancel'}
                    </button>
                    <button
                      onClick={handleLinkIssue}
                      disabled={!selectedIssue}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('projects.board.link') || 'Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Linked Issues List - Enhanced Cards */}
          {linkedIssues.length > 0 ? (
            <div 
              className="space-y-3" 
              role="list" 
              aria-label={t('projects.board.linkedIssuesList') || 'Linked issues'}
            >
              {linkedIssues.map((link) => {
                const issueType = issueTypeIcons[link.targetIssue.type?.toLowerCase()] || issueTypeIcons.task;
                const priority = priorityConfig[link.targetIssue.priority?.toLowerCase() || 'none'] || priorityConfig.none;
                const statusId = link.targetIssue.status?.id?.toLowerCase() || link.targetIssue.status?.name?.toLowerCase().replace(/\s+/g, '_') || 'todo';
                const statusStyle = statusColorMap[statusId] || statusColorMap.todo;
                const assignee = link.targetIssue.assignee;

                return (
                  <article
                    key={link._id}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        router.push(`/projects/${projectId}/board?selectedIssue=${link.targetIssue.key}`);
                      }
                    }}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow group focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`${t('projects.board.linkedIssue') || 'Linked issue'}: ${link.targetIssue.key} - ${link.targetIssue.title}`}
                  >
                    {/* Relationship Type Header */}
                    <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                      {getRelationshipName(link.type)}
                    </div>

                    {/* Card Content */}
                    <div className="flex items-start gap-3">
                      {/* Issue Type Icon */}
                      <span 
                        className={`text-lg shrink-0 ${issueType.color}`}
                        role="img"
                        aria-label={`${t('projects.board.issueType') || 'Issue type'}: ${issueType.label}`}
                        title={issueType.label}
                      >
                        {issueType.icon}
                      </span>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Issue Key and Title Row */}
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => router.push(`/projects/${projectId}/board?selectedIssue=${link.targetIssue.key}`)}
                            className="font-semibold text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:underline"
                            aria-label={`${t('projects.board.navigateTo') || 'Navigate to'} ${link.targetIssue.key}`}
                          >
                            {link.targetIssue.key}
                          </button>
                          <button
                            onClick={() => router.push(`/projects/${projectId}/board?selectedIssue=${link.targetIssue.key}`)}
                            className="text-sm text-gray-900 hover:text-blue-600 truncate text-start focus:outline-none focus:text-blue-600"
                            title={link.targetIssue.title}
                            aria-label={`${t('projects.board.openIssue') || 'Open issue'}: ${link.targetIssue.title}`}
                          >
                            {link.targetIssue.title}
                          </button>
                        </div>

                        {/* Status, Assignee, Priority Row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                            role="status"
                            aria-label={`${t('projects.board.status') || 'Status'}: ${link.targetIssue.status?.name}`}
                            title={`${t('projects.board.status') || 'Status'}: ${link.targetIssue.status?.name}`}
                          >
                            {link.targetIssue.status?.name}
                          </span>

                          {/* Priority Icon */}
                          <span
                            className={`inline-flex items-center text-sm ${priority.color}`}
                            role="img"
                            aria-label={`${t('projects.board.priority') || 'Priority'}: ${priority.label}`}
                            title={`${t('projects.board.priority') || 'Priority'}: ${priority.label}`}
                          >
                            {priority.icon}
                          </span>

                          {/* Assignee Avatar */}
                          {assignee ? (
                            <div
                              className="relative group/avatar"
                              role="img"
                              aria-label={`${t('projects.board.assignedTo') || 'Assigned to'}: ${getDisplayName(assignee)}`}
                            >
                              <div 
                                className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white cursor-default"
                                title={getDisplayName(assignee)}
                              >
                                {getDisplayInitials(assignee)}
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                                {getDisplayName(assignee)}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                              role="img"
                              aria-label={t('projects.board.unassigned') || 'Unassigned'}
                              title={t('projects.board.unassigned') || 'Unassigned'}
                            >
                              <User className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Unlink Button */}
                      {canLinkIssues && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlinkIssue(link._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all shrink-0"
                          aria-label={`${t('projects.board.unlinkIssue') || 'Unlink'} ${link.targetIssue.key}`}
                          title={t('projects.board.unlinkIssue') || 'Unlink issue'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !showLinkSection && (
            <p className="text-gray-500 text-sm">
              {t('projects.board.noLinkedItems') || 'No linked work items'}
            </p>
          )}
        </div>

        {/* Create Linked Work Item Modal */}
        {showCreateLinkedModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateLinkedModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-linked-title"
          >
            <div
              className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="create-linked-title" className="text-lg font-semibold text-gray-900">
                  {t('projects.board.createLinkedWorkItem') || 'Create Linked Work Item'}
                </h2>
                <button
                  onClick={() => setShowCreateLinkedModal(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  aria-label={t('projects.board.close') || 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {t('projects.board.createLinkedDescription') || 'Create a new issue and automatically link it to the current issue.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.relationshipType') || 'Relationship type'}
                  </label>
                  <select
                    value={selectedRelationship}
                    onChange={(e) => setSelectedRelationship(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {relationshipTypes.map((rel) => (
                      <option key={rel.id} value={rel.id}>{rel.name}</option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-gray-500">
                  {t('projects.board.createLinkedNote') || 'This feature will open the issue creation form. The new issue will be automatically linked with the selected relationship.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateLinkedModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('projects.board.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateLinkedModal(false);
                    router.push(`/projects/${projectId}/board?createTask=true&linkTo=${activeTask._id}&linkType=${selectedRelationship}`);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('projects.board.continue') || 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Development Section */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">
            {t('projects.board.development') || 'Development'}
          </h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <GitBranch className="h-4 w-4" />
              {t('projects.board.createBranch') || 'Create branch'}
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <GitCommit className="h-4 w-4" />
              {t('projects.board.createCommit') || 'Create commit'}
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-2 text-gray-900">
              <ChevronDown className="h-4 w-4" />
              <span className="font-medium">{t('projects.board.details') || 'Details'}</span>
            </button>
            <button className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Assignee Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('assignee')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('assignee') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.assignee') || 'Assignee'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowAssigneeDropdown(!showAssigneeDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  {activeTask.assignee ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                        {getDisplayInitials(activeTask.assignee)}
                      </div>
                      <span className="text-gray-900 text-sm">
                        {getDisplayName(activeTask.assignee)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-sm">
                        {t('projects.board.unassigned') || 'Unassigned'}
                      </span>
                    </>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* Assignee Dropdown */}
              {showAssigneeDropdown && (
                <div className="absolute end-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder={t('projects.board.searchMembers') || 'Search members...'}
                        className="w-full ps-8 pe-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleAssigneeChange(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-gray-700 text-sm">
                        {t('projects.board.unassigned') || 'Unassigned'}
                      </span>
                    </button>
                    {filteredTeamMembers.map((member) => (
                      <button
                        key={member._id}
                        onClick={() => handleAssigneeChange(member._id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                          activeTask.assignee?._id === member._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                          {getDisplayInitials(member)}
                        </div>
                        <span className="text-gray-900 text-sm">
                          {getDisplayName(member)}
                        </span>
                        {activeTask.assignee?._id === member._id && (
                          <Check className="h-4 w-4 text-blue-600 ms-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-right mt-1">
                <button onClick={handleAssignToMe} className="text-blue-600 text-sm hover:underline">
                  {t('projects.board.assignToMe') || 'Assign to me'}
                </button>
              </div>
            </div>

            {/* Priority Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('priority')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('priority') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.priority') || 'Priority'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowPriorityDropdown(!showPriorityDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  <Flag className={`h-4 w-4 ${getPriorityInfo(activeTask.priority).color}`} />
                  <span className={`text-sm ${getPriorityInfo(activeTask.priority).color}`}>
                    {getPriorityInfo(activeTask.priority).name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* Priority Dropdown */}
              {showPriorityDropdown && (
                <div className="absolute end-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {priorities.map((priority) => (
                    <button
                      key={priority.id}
                      onClick={() => handlePriorityChange(priority.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                        activeTask.priority === priority.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Flag className={`h-4 w-4 ${priority.color}`} />
                      <span className={`text-sm ${priority.color}`}>{priority.name}</span>
                      {activeTask.priority === priority.id && (
                        <Check className="h-4 w-4 text-blue-600 ms-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Labels Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('labels')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('labels') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.labels') || 'Labels'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowLabelsDropdown(!showLabelsDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  {activeTask.labels && activeTask.labels.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {activeTask.labels.slice(0, 2).map((labelId) => {
                        const label = availableLabels.find(l => l._id === labelId);
                        return label ? (
                          <span
                            key={labelId}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: label.color + '20', color: label.color }}
                          >
                            {label.name}
                          </span>
                        ) : null;
                      })}
                      {activeTask.labels.length > 2 && (
                        <span className="text-xs text-gray-500">+{activeTask.labels.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-blue-600 text-sm">
                      {t('projects.board.addLabels') || 'Add labels'}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
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
                    {filteredLabels.map((label) => {
                      const isSelected = activeTask.labels?.includes(label._id);
                      return (
                        <button
                          key={label._id}
                          onClick={() => isSelected ? handleRemoveLabel(label._id) : handleAddLabel(label._id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-left ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-gray-900 text-sm flex-1">{label.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      );
                    })}
                    {filteredLabels.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-2">
                        {t('projects.board.noLabelsFound') || 'No labels found'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Team Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('team')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('team') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.team') || 'Team'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowTeamDropdown(!showTeamDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  {activeTask.team ? (
                    <>
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 text-sm">{activeTask.team.name}</span>
                    </>
                  ) : (
                    <span className="text-blue-600 text-sm">
                      {t('projects.board.addTeam') || 'Add team'}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* Team Dropdown */}
              {showTeamDropdown && (
                <div className="absolute end-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleTeamChange(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start"
                    >
                      <span className="text-gray-500 text-sm">
                        {t('projects.board.noTeam') || 'No team'}
                      </span>
                    </button>
                    {availableTeams.map((team) => (
                      <button
                        key={team._id}
                        onClick={() => handleTeamChange(team._id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                          activeTask.team?._id === team._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 text-sm">{team.name}</span>
                        {activeTask.team?._id === team._id && (
                          <Check className="h-4 w-4 text-blue-600 ms-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Start Date Field */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinField('startDate')}
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    pinnedFields.includes('startDate') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                  }`}
                >
                  <Pin className="h-3 w-3" />
                </button>
                <span className="text-gray-500 text-sm">
                  {t('projects.board.startDate') || 'Start date'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={activeTask.startDate ? activeTask.startDate.split('T')[0] : ''}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Due Date Field */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinField('dueDate')}
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    pinnedFields.includes('dueDate') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                  }`}
                >
                  <Pin className="h-3 w-3" />
                </button>
                <span className="text-gray-500 text-sm">
                  {t('projects.board.dueDate') || 'Due date'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={activeTask.dueDate ? activeTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Parent Field */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinField('parent')}
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    pinnedFields.includes('parent') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                  }`}
                >
                  <Pin className="h-3 w-3" />
                </button>
                <span className="text-gray-500 text-sm">
                  {t('projects.board.parent') || 'Parent'}
                </span>
              </div>
              {activeTask.parent ? (
                <button
                  onClick={() => router.push(`/projects/${projectId}/board?selectedIssue=${activeTask.parent?.key}`)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  {activeTask.parent.key} - {activeTask.parent.title}
                </button>
              ) : (
                <button className="text-blue-600 text-sm hover:underline">
                  {t('projects.board.addParent') || 'Add parent'}
                </button>
              )}
            </div>

            {/* Sprint Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('sprint')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('sprint') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.sprint') || 'Sprint'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowSprintDropdown(!showSprintDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  {(taskDetail?.sprintId || taskDetail?.sprint || activeTask.sprint || activeTask.sprintId) ? (
                    <span className="text-gray-900 text-sm">
                      {taskDetail?.sprintId?.name || taskDetail?.sprint?.name || activeTask.sprintId?.name || activeTask.sprint?.name}
                    </span>
                  ) : (
                    <span className="text-blue-600 text-sm">
                      {t('projects.board.addSprint') || 'Add sprint'}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </div>

              {/* Sprint Dropdown */}
              {showSprintDropdown && (
                <div className="absolute end-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleSprintChange(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start"
                    >
                      <span className="text-gray-500 text-sm">
                        {t('projects.board.noSprint') || 'No sprint'}
                      </span>
                    </button>
                    {sprints.map((sprint) => (
                      <button
                        key={sprint._id}
                        onClick={() => handleSprintChange(sprint._id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-start ${
                          (taskDetail?.sprintId?._id === sprint._id || taskDetail?.sprint?._id === sprint._id || activeTask.sprint?._id === sprint._id || activeTask.sprintId?._id === sprint._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-gray-900 text-sm">{sprint.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          sprint.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sprint.status}
                        </span>
                        {(taskDetail?.sprintId?._id === sprint._id || taskDetail?.sprint?._id === sprint._id || activeTask.sprint?._id === sprint._id || activeTask.sprintId?._id === sprint._id) && (
                          <Check className="h-4 w-4 text-blue-600 ms-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Story Points Field */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinField('storyPoints')}
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    pinnedFields.includes('storyPoints') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                  }`}
                >
                  <Pin className="h-3 w-3" />
                </button>
                <span className="text-gray-500 text-sm">
                  {t('projects.board.storyPoints') || 'Story points'}
                </span>
              </div>
              {editingStoryPoints ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={storyPointsValue}
                    onChange={(e) => setStoryPointsValue(e.target.value)}
                    onBlur={handleStoryPointsChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleStoryPointsChange()}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    min="0"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setEditingStoryPoints(true)}
                  className="text-sm hover:bg-gray-100 rounded px-2 py-1"
                >
                  {activeTask.storyPoints !== undefined && activeTask.storyPoints !== null ? (
                    <span className="text-gray-900">{activeTask.storyPoints}</span>
                  ) : (
                    <span className="text-blue-600">
                      {t('projects.board.addStoryPoints') || 'Add story points'}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Reporter Field */}
            <div className="relative">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinField('reporter')}
                    className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      pinnedFields.includes('reporter') ? 'text-blue-600 opacity-100' : 'text-gray-400'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <span className="text-gray-500 text-sm">
                    {t('projects.board.reporter') || 'Reporter'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeAllDropdowns();
                    setShowReporterDropdown(!showReporterDropdown);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1"
                >
                  {activeTask.reporter ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                        {getDisplayInitials(activeTask.reporter)}
                      </div>
                      <span className="text-gray-900 text-sm">
                        {getDisplayName(activeTask.reporter)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {t('projects.board.noReporter') || 'No reporter'}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
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
                          activeTask.reporter?._id === member._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                          {getDisplayInitials(member)}
                        </div>
                        <span className="text-gray-900 text-sm">
                          {getDisplayName(member)}
                        </span>
                        {activeTask.reporter?._id === member._id && (
                          <Check className="h-4 w-4 text-blue-600 ms-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-4">
            {t('projects.board.activity') || 'Activity'}
          </h3>

          {/* Activity Tabs */}
          <div 
            className="flex items-center gap-1 mb-4 border-b border-gray-200"
            role="radiogroup"
            aria-label={t('projects.board.activityTabs') || 'Activity type tabs'}
          >
            {(['all', 'comments', 'history', 'worklog'] as const).map((tab) => (
              <button
                key={tab}
                role="radio"
                aria-checked={activeActivityTab === tab}
                aria-label={t(`projects.board.activityTab.${tab}`) || tab}
                onClick={() => setActiveActivityTab(tab)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const tabs: ActivityType[] = ['all', 'comments', 'history', 'worklog'];
                    const currentIndex = tabs.indexOf(activeActivityTab);
                    const newIndex = e.key === 'ArrowRight' 
                      ? (currentIndex + 1) % tabs.length 
                      : (currentIndex - 1 + tabs.length) % tabs.length;
                    setActiveActivityTab(tabs[newIndex]);
                  }
                }}
                tabIndex={activeActivityTab === tab ? 0 : -1}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeActivityTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' && (t('projects.board.activityTab.all') || 'All')}
                {tab === 'comments' && (t('projects.board.activityTab.comments') || 'Comments')}
                {tab === 'history' && (t('projects.board.activityTab.history') || 'History')}
                {tab === 'worklog' && (t('projects.board.activityTab.worklog') || 'Work log')}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setActivitySortOrder(activitySortOrder === 'newest' ? 'oldest' : 'newest')}
              aria-label={t('projects.board.sortActivity') || 'Sort activity feed'}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>
                {activitySortOrder === 'newest' 
                  ? (t('projects.board.newestFirst') || 'Newest first')
                  : (t('projects.board.oldestFirst') || 'Oldest first')
                }
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${activitySortOrder === 'oldest' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Activity Items */}
          <div className="space-y-4" role="feed" aria-label={t('projects.board.activityFeed') || 'Activity feed'}>
            {activities
              .filter((activity) => {
                if (activeActivityTab === 'all') return true;
                if (activeActivityTab === 'comments') return activity.type === 'comment';
                if (activeActivityTab === 'history') return ['status_change', 'sprint_change', 'field_update', 'created'].includes(activity.type);
                if (activeActivityTab === 'worklog') return activity.type === 'worklog';
                return true;
              })
              .sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return activitySortOrder === 'newest' ? dateB - dateA : dateA - dateB;
              })
              .map((activity) => (
                <article
                  key={activity._id}
                  className="flex gap-3"
                  aria-label={`${activity.author.profile.firstName} ${activity.author.profile.lastName} activity`}
                >
                  {/* Author Avatar */}
                  <button
                    className="relative flex-shrink-0"
                    onMouseEnter={(e) => {
                      setHoveredAuthor(activity.author);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setProfileCardPosition({ x: rect.left, y: rect.bottom + 4 });
                    }}
                    onMouseLeave={() => {
                      setHoveredAuthor(null);
                      setProfileCardPosition(null);
                    }}
                    onFocus={(e) => {
                      setHoveredAuthor(activity.author);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setProfileCardPosition({ x: rect.left, y: rect.bottom + 4 });
                    }}
                    onBlur={() => {
                      setHoveredAuthor(null);
                      setProfileCardPosition(null);
                    }}
                    aria-label={`View profile of ${activity.author.profile.firstName} ${activity.author.profile.lastName}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                      {getInitials(activity.author.profile.firstName, activity.author.profile.lastName)}
                    </div>
                  </button>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <button
                        className="font-medium text-gray-900 text-sm hover:underline"
                        onMouseEnter={(e) => {
                          setHoveredAuthor(activity.author);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setProfileCardPosition({ x: rect.left, y: rect.bottom + 4 });
                        }}
                        onMouseLeave={() => {
                          setHoveredAuthor(null);
                          setProfileCardPosition(null);
                        }}
                        aria-label={`View profile of ${activity.author.profile.firstName} ${activity.author.profile.lastName}`}
                      >
                        {activity.author.profile.firstName} {activity.author.profile.lastName}
                      </button>

                      {/* Activity Description */}
                      {activity.type === 'created' && (
                        <span className="text-gray-600 text-sm">
                          {t('projects.board.createdWorkItem') || 'created the Work item'}
                        </span>
                      )}

                      {activity.type === 'status_change' && (
                        <span className="text-gray-600 text-sm flex items-center gap-1 flex-wrap">
                          {t('projects.board.changedStatus') || 'changed status from'}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {typeof activity.oldValue === 'object' ? activity.oldValue.name : activity.oldValue}
                          </span>
                          {t('projects.board.to') || 'to'}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {typeof activity.newValue === 'object' ? activity.newValue.name : activity.newValue}
                          </span>
                        </span>
                      )}

                      {activity.type === 'sprint_change' && (
                        <span className="text-gray-600 text-sm flex items-center gap-1 flex-wrap">
                          {t('projects.board.updatedSprint') || 'updated the Sprint'}
                          {activity.oldValue && (
                            <>
                              <span className="text-gray-500">{t('projects.board.from') || 'from'}</span>
                              <span className="font-medium text-gray-700">
                                {typeof activity.oldValue === 'object' ? activity.oldValue.name : activity.oldValue}
                              </span>
                            </>
                          )}
                          {activity.newValue && (
                            <>
                              <span className="text-gray-500">{t('projects.board.to') || 'to'}</span>
                              <span className="font-medium text-gray-700">
                                {typeof activity.newValue === 'object' ? activity.newValue.name : activity.newValue}
                              </span>
                            </>
                          )}
                        </span>
                      )}

                      {activity.type === 'field_update' && (
                        <span className="text-gray-600 text-sm">
                          {t('projects.board.updatedField') || 'updated'} <span className="font-medium">{activity.field}</span>
                        </span>
                      )}

                      {activity.type === 'comment' && activity.content && (
                        <div className="text-gray-700 text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                          {activity.content}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <time
                      dateTime={activity.timestamp}
                      className="text-xs text-gray-500 mt-1 block"
                      aria-label={`Activity time: ${formatRelativeTime(activity.timestamp)}`}
                    >
                      {formatRelativeTime(activity.timestamp)}
                    </time>
                  </div>
                </article>
              ))}

            {activities.filter((activity) => {
              if (activeActivityTab === 'all') return true;
              if (activeActivityTab === 'comments') return activity.type === 'comment';
              if (activeActivityTab === 'history') return ['status_change', 'sprint_change', 'field_update', 'created'].includes(activity.type);
              if (activeActivityTab === 'worklog') return activity.type === 'worklog';
              return true;
            }).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                {t('projects.board.noActivity') || 'No activity to show'}
              </p>
            )}
          </div>

          {/* Profile Card Popup */}
          {hoveredAuthor && profileCardPosition && (
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64"
              style={{ left: profileCardPosition.x, top: profileCardPosition.y }}
              role="tooltip"
              aria-label={`Profile card for ${hoveredAuthor.profile.firstName} ${hoveredAuthor.profile.lastName}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-lg text-white">
                  {getInitials(hoveredAuthor.profile.firstName, hoveredAuthor.profile.lastName)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {hoveredAuthor.profile.firstName} {hoveredAuthor.profile.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('projects.board.teamMember') || 'Team member'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-6" role="region" aria-labelledby="comments-heading">
          <h3 id="comments-heading" className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('projects.board.comments') || 'Comments'}
            <span className="text-gray-500 text-sm font-normal">({comments.length})</span>
          </h3>

          {/* Comment Input Area */}
          {canComment ? (
            <div className="mb-6">
              <div 
                className={`border rounded-lg transition-all ${
                  isCommentInputFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    aria-label={t('projects.board.formatBold') || 'Bold'}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    aria-label={t('projects.board.formatItalic') || 'Italic'}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    aria-label={t('projects.board.formatCode') || 'Code'}
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <button
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    aria-label={t('projects.board.mention') || 'Mention someone'}
                    title="Mention (@)"
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                </div>

                {/* Text Input */}
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onFocus={() => setIsCommentInputFocused(true)}
                  onBlur={() => setIsCommentInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAddComment(commentText);
                    }
                  }}
                  placeholder={t('projects.board.addComment') || 'Add a comment... (Press M to focus)'}
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none resize-none min-h-[80px]"
                  aria-label={t('projects.board.commentInput') || 'Comment input'}
                  rows={3}
                />

                {/* Submit Button */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    {t('projects.board.commentTip') || 'Pro tip: Press M to comment, Ctrl+Enter to submit'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddComment(commentText)}
                    disabled={!commentText.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('projects.board.submitComment') || 'Submit comment'}
                  >
                    <Send className="h-4 w-4" />
                    {t('projects.board.send') || 'Send'}
                  </button>
                </div>
              </div>

              {/* Canned Comments */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  {t('projects.board.quickResponses') || 'Quick responses:'}
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('projects.board.cannedComments') || 'Quick comment buttons'}>
                  {cannedComments.map((canned) => (
                    <button
                      key={canned.id}
                      type="button"
                      onClick={() => handleAddComment(`${canned.emoji} ${canned.text}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label={`${t('projects.board.quickComment') || 'Quick comment'}: ${canned.text}`}
                      tabIndex={0}
                    >
                      <span>{canned.emoji}</span>
                      <span>{canned.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-6">
              {t('projects.board.noCommentPermission') || 'You do not have permission to comment.'}
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-4" role="list" aria-label={t('projects.board.commentsList') || 'Comments list'}>
            {comments.map((comment) => (
              <article
                key={comment._id}
                id={`comment-${comment._id}`}
                className="flex gap-3 group"
                role="listitem"
                aria-labelledby={`comment-author-${comment._id}`}
              >
                {/* Author Avatar */}
                <div className="shrink-0">
                  <div
                    className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white"
                    role="img"
                    aria-label={`${comment.author.profile.firstName} ${comment.author.profile.lastName}'s avatar`}
                  >
                    {getInitials(comment.author.profile.firstName, comment.author.profile.lastName)}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      id={`comment-author-${comment._id}`}
                      className="font-medium text-gray-900 text-sm"
                    >
                      {comment.author.profile.firstName} {comment.author.profile.lastName}
                    </span>
                    <time
                      dateTime={comment.timestamp}
                      className="text-xs text-gray-500"
                    >
                      {formatRelativeTime(comment.timestamp)}
                    </time>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-400">
                        ({t('projects.board.edited') || 'edited'})
                      </span>
                    )}
                  </div>

                  {/* Comment Text or Edit Mode */}
                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(comment._id, editingCommentText)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          {t('projects.board.save') || 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          {t('projects.board.cancel') || 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>

                {/* Comment Actions */}
                {(currentUser?._id === comment.author._id || isAdmin) && editingCommentId !== comment._id && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setCommentActionMenuId(
                        commentActionMenuId === comment._id ? null : comment._id
                      )}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t('projects.board.moreOptions') || 'More options'}
                      aria-expanded={commentActionMenuId === comment._id}
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Actions Menu */}
                    {commentActionMenuId === comment._id && (
                      <div
                        className="absolute end-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                        role="menu"
                        aria-label={t('projects.board.commentActions') || 'Comment actions'}
                      >
                        {currentUser?._id === comment.author._id && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditingCommentText(comment.content);
                              setCommentActionMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                            role="menuitem"
                          >
                            <Edit3 className="h-4 w-4" />
                            {t('projects.board.edit') || 'Edit'}
                          </button>
                        )}
                        <button
                          onClick={() => handleQuoteComment(comment.content)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                          role="menuitem"
                        >
                          <Quote className="h-4 w-4" />
                          {t('projects.board.quote') || 'Quote'}
                        </button>
                        <button
                          onClick={() => handleCopyCommentLink(comment._id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                          role="menuitem"
                        >
                          <Link2 className="h-4 w-4" />
                          {t('projects.board.copyLink') || 'Copy link'}
                        </button>
                        {(currentUser?._id === comment.author._id || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                            role="menuitem"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('projects.board.delete') || 'Delete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}

            {commentsLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                {t('projects.board.noComments') || 'No comments yet. Be the first to comment!'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
