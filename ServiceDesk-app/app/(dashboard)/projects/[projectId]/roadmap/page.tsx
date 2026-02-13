'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  User,
  Search,
  Filter,
  Settings,
  Download,
  Share2,
  GripVertical,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Zap,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface Project {
  _id: string;
  name: string;
  key: string;
  methodology: {
    code: string;
  };
}

// Jira-compatible Task interface
interface Task {
  _id: string;
  id?: string;
  key: string;
  title: string;
  summary?: string;
  type: string;
  itemTypeId?: number;
  parentId?: string | null;
  status: { id: string; name: string; category?: string; statusCategory?: { id: string } };
  priority: string;
  startDate?: string;
  startDateRFC3339?: string | null;
  dueDate?: string;
  dueDateRFC3339?: string | null;
  assignee?: { 
    _id?: string; 
    accountId?: string;
    name?: string;
    picture?: string;
    profile?: { firstName: string; lastName: string } 
  };
  description?: string;
  storyPoints?: number;
  labels?: string[];
  sprintIds?: string[];
  sprint?: string;
  color?: string;
  rank?: string;
  dependencies?: { id: string; type: string }[];
  resolved?: boolean;
}

// Roadmap configuration from API
interface RoadmapConfig {
  sprints?: {
    id: string;
    name: string;
    state: string;
    startDateRFC3339: string;
    endDateRFC3339: string;
  }[];
  statusCategories?: {
    id: string;
    key: string;
    name: string;
  }[];
  parentItemTypes?: {
    id: string;
    name: string;
    iconUrl: string;
  }[];
  childItemTypes?: {
    id: string;
    name: string;
    iconUrl: string;
  }[];
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { t } = useLanguage();
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showDependencies, setShowDependencies] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  // Timeline interaction states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const previousZoomLevel = useRef<'day' | 'week' | 'month' | 'quarter'>('month');
  
  // Inline Create states
  const [isCreating, setIsCreating] = useState(false);
  const [newItemSummary, setNewItemSummary] = useState('');
  const [newItemType, setNewItemType] = useState<'epic' | 'story' | 'task' | 'bug'>('epic');
  const [newItemAssignee, setNewItemAssignee] = useState<string | null>(null);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [createStatus, setCreateStatus] = useState<string>('');

  const fetchProject = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProject(data.data.project);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId]);


  const fetchTasks = useCallback(async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
      } else if (response.status === 401) {
        console.error('Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProject(token);
    fetchTasks(token);
  }, [projectId, router, fetchProject, fetchTasks]);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Create new task/epic via API
  const createTask = useCallback(async (summary: string, type: string, assigneeName: string | null) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !summary.trim()) return false;

    try {
      setCreateStatus(`Creating ${type}...`);
      
      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: summary.trim(),
          type: type,
          priority: 'medium',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCreateStatus(`${type} created successfully!`);
        // Refresh tasks list
        await fetchTasks(token);
        return true;
      } else {
        setCreateStatus(`Failed to create ${type}: ${data.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setCreateStatus(`Failed to create ${type}. Please try again.`);
      return false;
    }
  }, [projectId, fetchTasks]);

  // Update status for API operations
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Update task via API with optimistic updates and better feedback
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return false;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    // Optimistic update - update local state immediately
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === taskId ? { ...task, ...updates } : task
      )
    );

    // Also update selectedTask if it's the same task
    if (selectedTask?._id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpdateSuccess(true);
        // Clear success message after 2 seconds
        setTimeout(() => setUpdateSuccess(false), 2000);
        return true;
      } else {
        // Revert optimistic update on failure
        await fetchTasks(token);
        setUpdateError(data.message || 'Failed to update');
        setTimeout(() => setUpdateError(null), 3000);
        return false;
      }
    } catch (error) {
      // Revert optimistic update on error
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) await fetchTasks(token);
      setUpdateError('Network error. Please try again.');
      setTimeout(() => setUpdateError(null), 3000);
      console.error('Failed to update task:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [projectId, fetchTasks, selectedTask]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'idea': 'bg-gray-200 text-gray-700',
      'todo': 'bg-gray-200 text-gray-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'in progress': 'bg-blue-100 text-blue-700',
      'done': 'bg-green-100 text-green-700',
      'testing': 'bg-yellow-100 text-yellow-700',
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-200 text-gray-700';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      epic: 'text-purple-600',
      story: 'text-green-600',
      task: 'text-blue-600',
      bug: 'text-red-600',
    };
    return colors[type] || 'text-blue-600';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      epic: '⚡',
      story: '📖',
      task: '✓',
      bug: '🐛',
    };
    return icons[type] || '✓';
  };

  // Timeline date range based on zoom level AND task dates
  const timelineRange = useMemo(() => {
    const now = new Date();
    
    // Find earliest and latest dates from all tasks
    let earliestDate = new Date(now);
    let latestDate = new Date(now);
    
    tasks.forEach(task => {
      const taskStart = task.startDate ? new Date(task.startDate) : 
                        task.startDateRFC3339 ? new Date(task.startDateRFC3339) : null;
      const taskEnd = task.dueDate ? new Date(task.dueDate) : 
                      task.dueDateRFC3339 ? new Date(task.dueDateRFC3339) : null;
      
      // Update earliest date
      if (taskStart && taskStart.getTime() < earliestDate.getTime()) {
        earliestDate = new Date(taskStart);
      }
      // Update latest date
      if (taskEnd && taskEnd.getTime() > latestDate.getTime()) {
        latestDate = new Date(taskEnd);
      }
      // Also check start date for latest (in case no due date)
      if (taskStart && taskStart.getTime() > latestDate.getTime()) {
        latestDate = new Date(taskStart);
      }
    });
    
    // Add padding around the range
    let startDate: Date;
    let endDate: Date;
    let totalDays: number;
    
    switch (zoomLevel) {
      case 'day':
        // Start 7 days before earliest task
        startDate = new Date(earliestDate);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0); // Reset to start of day
        // End 14 days after latest task
        endDate = new Date(latestDate);
        endDate.setDate(endDate.getDate() + 14);
        endDate.setHours(23, 59, 59, 999); // End of day
        totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (totalDays < 30) {
          // Extend endDate to meet minimum
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 30);
          endDate.setHours(23, 59, 59, 999);
          totalDays = 30;
        }
        break;
      case 'week':
        // Start 2 weeks before earliest task
        startDate = new Date(earliestDate);
        startDate.setDate(startDate.getDate() - startDate.getDay() - 14);
        startDate.setHours(0, 0, 0, 0); // Reset to start of day
        // End 4 weeks after latest task
        endDate = new Date(latestDate);
        endDate.setDate(endDate.getDate() + 28);
        endDate.setHours(23, 59, 59, 999); // End of day
        totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (totalDays < 56) {
          // Extend endDate to meet minimum
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 56);
          endDate.setHours(23, 59, 59, 999);
          totalDays = 56;
        }
        break;
      case 'month':
        // Start 1 month before earliest task
        startDate = new Date(earliestDate);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        // End 2 months after latest task
        endDate = new Date(latestDate);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 3, 0);
        totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'quarter':
      default:
        // Start 1 quarter before earliest task
        startDate = new Date(earliestDate);
        startDate = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3 - 3, 1);
        // End 2 quarters after latest task
        endDate = new Date(latestDate);
        endDate = new Date(endDate.getFullYear(), Math.floor(endDate.getMonth() / 3) * 3 + 9, 0);
        totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
    }
    
    return { startDate, endDate, totalDays, now };
  }, [zoomLevel, tasks]);

  // Calculate position and width for a task bar based on dates
  // This function will be updated after timelineColumns is defined
  const getTaskBarStyle = useCallback((task: Task, columnsCount: number) => {
    const { startDate: rangeStart, totalDays } = timelineRange;
    
    // Check if dates are missing
    const hasMissingDates = !task.startDate && !task.startDateRFC3339 && !task.dueDate && !task.dueDateRFC3339;
    
    // Use any available date, fallback to today
    let taskStart = task.startDate ? new Date(task.startDate) : 
                    task.startDateRFC3339 ? new Date(task.startDateRFC3339) : new Date();
    let taskEnd = task.dueDate ? new Date(task.dueDate) : 
                  task.dueDateRFC3339 ? new Date(task.dueDateRFC3339) : 
                  new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Normalize to start of day for consistent calculation
    taskStart = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
    taskEnd = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());
    const rangeStartNorm = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    
    // For day view, use columnsCount (number of days shown)
    // For other views, use totalDays
    const effectiveTotalDays = zoomLevel === 'day' ? columnsCount : totalDays;
    
    // Calculate actual start offset in days
    const startOffsetDays = Math.floor((taskStart.getTime() - rangeStartNorm.getTime()) / (1000 * 60 * 60 * 24));
    const endOffsetDays = Math.floor((taskEnd.getTime() - rangeStartNorm.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include end day
    
    // Clamp to visible range
    const visibleStart = Math.max(0, startOffsetDays);
    const visibleEnd = Math.min(effectiveTotalDays, endOffsetDays);
    const visibleDuration = Math.max(1, visibleEnd - visibleStart);
    
    // Check if task is visible in current range
    const isVisible = endOffsetDays > 0 && startOffsetDays < effectiveTotalDays;
    
    // Check for continuation arrows
    const showLeftArrow = startOffsetDays < 0;
    const showRightArrow = endOffsetDays > effectiveTotalDays;
    
    const leftPercent = (visibleStart / effectiveTotalDays) * 100;
    const widthPercent = (visibleDuration / effectiveTotalDays) * 100;
    
    // Always show tasks, but position them at start if before range or end if after range
    if (!isVisible) {
      // Task is completely outside range - show at edge with minimal width
      if (endOffsetDays <= 0) {
        // Task ended before range - show at start
        return { left: '0%', width: '2%', opacity: 0.5, hasMissingDates, showLeftArrow: true, showRightArrow: false };
      } else {
        // Task starts after range - show at end
        return { left: '98%', width: '2%', opacity: 0.5, hasMissingDates, showLeftArrow: false, showRightArrow: true };
      }
    }
    
    return {
      left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      width: `${Math.max(2, Math.min(100 - leftPercent, widthPercent))}%`,
      hasMissingDates,
      showLeftArrow,
      showRightArrow,
    };
  }, [timelineRange, zoomLevel]);

  // Calculate today line position and visibility
  const getTodayPosition = useCallback(() => {
    const { startDate: rangeStart, endDate: rangeEnd, totalDays, now } = timelineRange;
    const daysSinceStart = (now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    
    // Check if today is within the visible range
    const isVisible = now >= rangeStart && now <= rangeEnd;
    
    return {
      left: `${(daysSinceStart / totalDays) * 100}%`,
      isVisible,
    };
  }, [timelineRange]);

  // Generate timeline columns based on zoom level and timelineRange
  const timelineColumns = useMemo(() => {
    const columns: { label: string; sublabel?: string; isCurrent: boolean; date: Date; monthLabel?: string; isFirstOfMonth?: boolean }[] = [];
    const now = new Date();
    const { startDate: rangeStart, totalDays } = timelineRange;
    
    switch (zoomLevel) {
      case 'day': {
        // Generate columns for each day in range
        let lastMonth = -1;
        for (let i = 0; i < totalDays; i++) {
          const date = new Date(rangeStart);
          date.setDate(date.getDate() + i);
          const isFirstOfMonth = date.getMonth() !== lastMonth;
          lastMonth = date.getMonth();
          columns.push({
            label: date.getDate().toString(),
            sublabel: undefined,
            isCurrent: date.toDateString() === now.toDateString(),
            date,
            monthLabel: date.toLocaleDateString('en-US', { month: 'short' }),
            isFirstOfMonth,
          });
        }
        break;
      }
      case 'week': {
        // Generate columns for each week in range
        const numWeeks = Math.ceil(totalDays / 7);
        for (let i = 0; i < numWeeks; i++) {
          const date = new Date(rangeStart);
          date.setDate(date.getDate() + (i * 7));
          const weekOfYear = Math.ceil((((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
          columns.push({
            label: `W${weekOfYear}`,
            sublabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isCurrent: now >= date && now < new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
            date,
          });
        }
        break;
      }
      case 'month': {
        // Generate columns for each month in range
        const startMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        const endMonth = new Date(timelineRange.endDate.getFullYear(), timelineRange.endDate.getMonth(), 1);
        const currentMonthDate = new Date(startMonth);
        while (currentMonthDate <= endMonth) {
          const monthDate = new Date(currentMonthDate);
          columns.push({
            label: monthDate.toLocaleDateString('en-US', { month: 'long' }),
            sublabel: monthDate.getFullYear() !== now.getFullYear() ? monthDate.getFullYear().toString() : '',
            isCurrent: monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear(),
            date: monthDate,
          });
          currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
        }
        break;
      }
      case 'quarter': {
        // Generate columns for each quarter in range
        const startQuarterMonth = Math.floor(rangeStart.getMonth() / 3) * 3;
        const startQuarterDate = new Date(rangeStart.getFullYear(), startQuarterMonth, 1);
        const endQuarterDate = new Date(timelineRange.endDate.getFullYear(), Math.floor(timelineRange.endDate.getMonth() / 3) * 3, 1);
        const currentQuarterDate = new Date(startQuarterDate);
        while (currentQuarterDate <= endQuarterDate) {
          const quarterDate = new Date(currentQuarterDate);
          const quarterIndex = Math.floor(quarterDate.getMonth() / 3);
          const isCurrentQuarter = quarterIndex === Math.floor(now.getMonth() / 3) && quarterDate.getFullYear() === now.getFullYear();
          columns.push({
            label: `Q${quarterIndex + 1}`,
            sublabel: quarterDate.getFullYear().toString(),
            isCurrent: isCurrentQuarter,
            date: quarterDate,
          });
          currentQuarterDate.setMonth(currentQuarterDate.getMonth() + 3);
        }
        break;
      }
    }
    
    return columns;
  }, [zoomLevel, timelineRange]);

  // Filter and group tasks
  const groupedTasks = useMemo(() => {
    // Apply filters
    let filteredTasks = tasks;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.key.toLowerCase().includes(query)
      );
    }
    
    // Type filter
    if (selectedTypes.length > 0) {
      filteredTasks = filteredTasks.filter(t => selectedTypes.includes(t.type));
    }
    
    // Status filter
    if (selectedStatuses.length > 0) {
      filteredTasks = filteredTasks.filter(t => {
        const statusName = t.status?.name?.toLowerCase().replace(' ', '_') || 'todo';
        return selectedStatuses.includes(statusName);
      });
    }
    
    // Assignee filter
    if (selectedAssignees.length > 0) {
      filteredTasks = filteredTasks.filter(t => {
        if (!t.assignee) return false;
        // Support both Jira format (name) and legacy format (profile)
        const fullName = t.assignee.name || 
          (t.assignee.profile ? `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}` : '');
        return selectedAssignees.includes(fullName);
      });
    }
    
    // Group by parent-child relationship (Jira style with parentId)
    const childTasks = filteredTasks.filter(t => t.parentId !== null && t.parentId !== undefined && t.type !== 'epic');
    const parentIds = new Set(childTasks.map(t => t.parentId!));
    const epics = filteredTasks.filter(t => t.type === 'epic' || parentIds.has(t._id));
    const epicIds = new Set(epics.map(t => t._id));
    const standaloneTasks = filteredTasks.filter(t => !epicIds.has(t._id) && (t.parentId === null || t.parentId === undefined) && t.type !== 'epic');
    const others = childTasks;
    
    // Build hierarchy map for quick child lookup
    const childrenMap = new Map<string, Task[]>();
    others.forEach(task => {
      if (task.parentId) {
        const children = childrenMap.get(task.parentId) || [];
        children.push(task);
        childrenMap.set(task.parentId, children);
      }
    });
    
    return { epics, others, childrenMap, standaloneTasks };
  }, [tasks, searchQuery, selectedTypes, selectedStatuses, selectedAssignees]);

  // Handle zoom level change with scroll position preservation
  const handleZoomChange = useCallback((newZoom: 'day' | 'week' | 'month' | 'quarter') => {
    if (!timelineRef.current) {
      setZoomLevel(newZoom);
      return;
    }
    
    const scrollContainer = timelineRef.current;
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    
    // Calculate scroll ratio (0 to 1) representing position in timeline
    const scrollRatio = scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0;
    
    // Store previous zoom for transition
    previousZoomLevel.current = zoomLevel;
    
    // Update zoom level
    setZoomLevel(newZoom);
    
    // Restore scroll position after render
    requestAnimationFrame(() => {
      if (timelineRef.current) {
        const newScrollWidth = timelineRef.current.scrollWidth;
        const newClientWidth = timelineRef.current.clientWidth;
        const newScrollLeft = scrollRatio * (newScrollWidth - newClientWidth);
        timelineRef.current.scrollLeft = Math.max(0, newScrollLeft);
      }
    });
  }, [zoomLevel]);

  // Calculate individual task progress based on status
  const getTaskProgress = useCallback((task: Task) => {
    const statusName = task.status?.name?.toLowerCase() || '';
    const statusCategory = task.status?.category?.toLowerCase() || '';
    
    if (statusName === 'done' || statusName === 'resolved' || statusCategory === 'done' || task.resolved) {
      return 100;
    }
    if (statusName === 'in progress' || statusName === 'in_progress' || statusCategory === 'in_progress') {
      return 50;
    }
    if (statusName === 'testing' || statusName === 'review' || statusName === 'in review') {
      return 75;
    }
    if (statusName === 'todo' || statusName === 'to do' || statusName === 'idea' || statusCategory === 'todo') {
      return 0;
    }
    return 0;
  }, []);

  // Calculate epic progress from children tasks
  const getEpicProgress = useCallback((epicId: string) => {
    const children = groupedTasks.childrenMap.get(epicId) || [];
    if (children.length === 0) {
      // No children - calculate progress from the task's own status
      const epic = tasks.find(t => t._id === epicId);
      if (!epic) return 0;
      return getTaskProgress(epic);
    }
    
    const completedCount = children.filter(task => 
      task.status?.name?.toLowerCase() === 'done' || 
      task.status?.name?.toLowerCase() === 'resolved' ||
      task.status?.category?.toLowerCase() === 'done' ||
      task.resolved === true
    ).length;
    
    const inProgressCount = children.filter(task =>
      task.status?.name?.toLowerCase() === 'in progress' ||
      task.status?.name?.toLowerCase() === 'in_progress' ||
      task.status?.name?.toLowerCase() === 'testing' ||
      task.status?.name?.toLowerCase() === 'review' ||
      task.status?.category?.toLowerCase() === 'in_progress'
    ).length;
    
    // Completed tasks count as 100%, in-progress as 50%
    const totalProgress = (completedCount * 100) + (inProgressCount * 50);
    return Math.round(totalProgress / children.length);
  }, [groupedTasks.childrenMap, tasks, getTaskProgress]);

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

      {/* 7️⃣ Filter & Search Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('roadmap.filters.search')}
                aria-describedby="search-hint"
                className="w-full ps-9 pe-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span id="search-hint" className="sr-only">Results filtered as you type</span>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 relative">
              {/* Assignee Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveFilter(activeFilter === 'assignee' ? null : 'assignee')}
                  aria-haspopup="listbox"
                  aria-expanded={activeFilter === 'assignee'}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                    selectedAssignees.length > 0 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>{t('roadmap.filters.assignee')} {selectedAssignees.length > 0 && `(${selectedAssignees.length})`}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'assignee' ? 'rotate-180' : ''}`} />
                </button>
                {activeFilter === 'assignee' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder={t('roadmap.filters.search')}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                    </div>
                    {['Sarah Johnson', 'Mike Chen', 'Emily Davis', 'John Doe'].map((name) => (
                      <label key={name} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignees([...selectedAssignees, name]);
                            } else {
                              setSelectedAssignees(selectedAssignees.filter(a => a !== name));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                          {name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-700">{name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Type Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveFilter(activeFilter === 'type' ? null : 'type')}
                  aria-haspopup="listbox"
                  aria-expanded={activeFilter === 'type'}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                    selectedTypes.length > 0 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{t('roadmap.filters.type')} {selectedTypes.length > 0 && `(${selectedTypes.length})`}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'type' ? 'rotate-180' : ''}`} />
                </button>
                {activeFilter === 'type' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    {[
                      { value: 'epic', label: t('roadmap.types.epic'), icon: '⚡' },
                      { value: 'story', label: t('roadmap.types.story'), icon: '📖' },
                      { value: 'task', label: t('roadmap.types.task'), icon: '✓' },
                      { value: 'bug', label: t('roadmap.types.bug'), icon: '🐛' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTypes([...selectedTypes, type.value]);
                            } else {
                              setSelectedTypes(selectedTypes.filter(t => t !== type.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span>{type.icon}</span>
                        <span className="text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')}
                  aria-haspopup="listbox"
                  aria-expanded={activeFilter === 'status'}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                    selectedStatuses.length > 0 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{t('roadmap.filters.status')} {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'status' ? 'rotate-180' : ''}`} />
                </button>
                {activeFilter === 'status' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    {[
                      { value: 'todo', label: t('roadmap.status.todo'), color: 'bg-gray-400' },
                      { value: 'in_progress', label: t('roadmap.status.inProgress'), color: 'bg-blue-500' },
                      { value: 'done', label: t('roadmap.status.done'), color: 'bg-green-500' },
                    ].map((status) => (
                      <label key={status.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStatuses([...selectedStatuses, status.value]);
                            } else {
                              setSelectedStatuses(selectedStatuses.filter(s => s !== status.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(selectedAssignees.length > 0 || selectedTypes.length > 0 || selectedStatuses.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedAssignees([]);
                    setSelectedTypes([]);
                    setSelectedStatuses([]);
                    setActiveFilter(null);
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {t('roadmap.filters.clearAll')}
                </button>
              )}
            </div>
          </div>

          {/* 8️⃣ View Settings & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              aria-label="Toggle dependencies"
              className={`p-2 rounded-lg transition-colors ${
                showDependencies 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={showDependencies ? 'Hide dependencies' : 'Show dependencies'}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                alert('Export feature coming soon!');
              }}
              aria-label="Export timeline"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              aria-label="Share timeline"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                alert('Settings panel coming soon!');
              }}
              aria-label="Timeline settings"
              aria-haspopup="menu"
              aria-expanded="false"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
              aria-label="Fullscreen"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close filters */}
      {activeFilter && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveFilter(null)}
        />
      )}

      {/* 9️⃣ Timeline / Roadmap Grid (Core Content) with ARIA */}
      <div 
        className="flex-1 overflow-hidden bg-white flex"
        role="main"
        aria-label="Timeline roadmap"
      >
        {/* Fixed Left Column - Work Items */}
        <div className="w-64 sm:w-80 lg:w-96 shrink-0 border-r border-gray-300 bg-white z-20 flex flex-col">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">{t('roadmap.columns.workItems')}</span>
          </div>
          
          {/* Sprints Header in Fixed Column */}
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sprints</span>
          </div>
          
          {/* Work Items List - Scrollable */}
          <div className="flex-1 overflow-y-auto" id="work-items-scroll">
            {groupedTasks.epics.map((epic, epicIndex) => (
              <div key={epic._id}>
                {/* Epic Row */}
                <div 
                  className={`px-3 sm:px-4 py-3 border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                    epicIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 cursor-grab hover:text-gray-500" />
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      aria-label={`Select ${epic.title}`}
                    />
                    <button 
                      onClick={() => toggleItem(epic._id)} 
                      className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      aria-expanded={expandedItems.has(epic._id)}
                    >
                      {expandedItems.has(epic._id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <span className={`${getTypeColor(epic.type)} text-lg`}>{getTypeIcon(epic.type)}</span>
                    <button 
                      onClick={() => { setSelectedTask(epic); setShowTaskDetail(true); }}
                      className="text-blue-600 text-xs sm:text-sm font-mono hover:underline"
                    >
                      {epic.key}
                    </button>
                    <span className="text-gray-900 text-sm font-medium truncate flex-1">{epic.title || epic.summary}</span>
                  </div>
                  <div className="ms-16 mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          getEpicProgress(epic._id) === 100 ? 'bg-green-500' :
                          getEpicProgress(epic._id) >= 50 ? 'bg-blue-500' :
                          getEpicProgress(epic._id) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${getEpicProgress(epic._id)}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      getEpicProgress(epic._id) === 100 ? 'text-green-600' :
                      getEpicProgress(epic._id) >= 50 ? 'text-blue-600' :
                      getEpicProgress(epic._id) > 0 ? 'text-amber-600' : 'text-gray-400'
                    }`}>{getEpicProgress(epic._id)}%</span>
                  </div>
                </div>
                
                {/* Child Tasks */}
                {expandedItems.has(epic._id) && (groupedTasks.childrenMap.get(epic._id) || groupedTasks.childrenMap.get(epic.id || '') || []).map((task, taskIndex) => (
                  <div 
                    key={task._id}
                    className={`ps-10 pe-3 sm:pe-4 py-2.5 border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                      taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-gray-300 cursor-grab" />
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                      <span className={`${getTypeColor(task.type)} text-sm`}>{getTypeIcon(task.type)}</span>
                      <button 
                        onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                        className="text-blue-600 text-xs font-mono hover:underline"
                      >
                        {task.key}
                      </button>
                      <span className="text-gray-800 text-sm truncate flex-1">{task.title || task.summary}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              getTaskProgress(task) === 100 ? 'bg-green-500' :
                              getTaskProgress(task) >= 50 ? 'bg-blue-500' :
                              getTaskProgress(task) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${getTaskProgress(task)}%` }}
                          ></div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(task.status?.name || 'todo')}`}>
                          {task.status?.name || 'TODO'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {/* Standalone tasks (not epics, no parent) */}
            {groupedTasks.standaloneTasks.map((task, idx) => (
              <div 
                key={task._id}
                className={`px-3 sm:px-4 py-3 border-b border-gray-100 hover:bg-blue-50/30 ${
                  (groupedTasks.epics.length + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" aria-label={`Select ${task.title}`} />
                  <span className={`${getTypeColor(task.type)} text-lg`}>{getTypeIcon(task.type)}</span>
                  <button 
                    onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                    className="text-blue-600 text-xs sm:text-sm font-mono hover:underline"
                  >
                    {task.key}
                  </button>
                  <span className="text-gray-900 text-sm font-medium truncate flex-1">{task.title || task.summary}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          getTaskProgress(task) === 100 ? 'bg-green-500' :
                          getTaskProgress(task) >= 50 ? 'bg-blue-500' :
                          getTaskProgress(task) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${getTaskProgress(task)}%` }}
                      ></div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(task.status?.name || 'todo')}`}>
                      {task.status?.name || 'TODO'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scrollable Timeline Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto" ref={timelineRef}>
          <div className="relative min-w-[800px]" style={{ width: `${timelineColumns.length * (zoomLevel === 'day' ? 40 : 120)}px` }}>
            {/* Today Line - Single instance for entire timeline */}
            {getTodayPosition().isVisible && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none" 
                style={{ left: getTodayPosition().left }}
                aria-label="Today"
              />
            )}
            
            {/* Timeline Header - Sticky Top with Month Row + Day Row for 'day' zoom */}
            <div className="sticky top-0 bg-white z-10">
              {/* Month Row - Only for 'day' zoom level */}
              {zoomLevel === 'day' && (
                <div className="flex border-b border-gray-200">
                  {(() => {
                    const monthGroups: { month: string; count: number }[] = [];
                    let currentMonth = '';
                    let count = 0;
                    timelineColumns.forEach((col, idx) => {
                      if (col.monthLabel !== currentMonth) {
                        if (currentMonth) monthGroups.push({ month: currentMonth, count });
                        currentMonth = col.monthLabel || '';
                        count = 1;
                      } else {
                        count++;
                      }
                      if (idx === timelineColumns.length - 1) {
                        monthGroups.push({ month: currentMonth, count });
                      }
                    });
                    return monthGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-2 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-r border-gray-200 last:border-r-0"
                        style={{ flex: group.count, minWidth: `${group.count * 40}px` }}
                      >
                        {group.month}
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              {/* Day/Week/Month/Quarter Row */}
              <div className="flex border-b border-gray-200">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`px-1 py-2 text-center text-xs border-r border-gray-200 last:border-r-0 ${
                      zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'
                    } ${
                      col.isCurrent 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    <div className={zoomLevel === 'day' ? 'text-xs' : 'font-medium'}>{col.label}</div>
                    {col.sublabel && <div className="text-xs text-gray-400 mt-0.5">{col.sublabel}</div>}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sprints Row */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 h-[41px]">
              {timelineColumns.map((_, idx) => (
                <div key={idx} className={`border-r border-gray-100 last:border-r-0 ${zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'}`} />
              ))}
            </div>

            {/* Timeline Rows for Epics */}
            {groupedTasks.epics.map((epic, epicIndex) => (
              <div key={epic._id}>
                {/* Epic Timeline Row */}
                <div 
                  className={`relative flex border-b border-gray-100 ${epicIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  style={{ minHeight: '60px' }}
                >
                  {timelineColumns.map((col, colIdx) => (
                    <div 
                      key={colIdx} 
                      className={`border-r border-gray-100 last:border-r-0 ${zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'} ${
                        col.isCurrent ? 'bg-blue-50/30' : ''
                      }`}
                    />
                  ))}
                  
                  {/* Epic Bar - Positioned absolutely within row */}
                  <div 
                    className={`absolute h-7 rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-all group/bar ${
                      hoveredTask === epic._id ? 'shadow-lg scale-[1.02] z-20' : ''
                    } ${selectedTask?._id === epic._id ? 'ring-2 ring-purple-300 shadow-lg z-20' : ''
                    } ${isDragging && draggedItem === epic._id ? 'opacity-70 scale-105 z-30' : ''}`}
                    style={{
                      ...getTaskBarStyle(epic, timelineColumns.length),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: epic.color === 'PURPLE' ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' :
                                 epic.color === 'BLUE' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                 epic.color === 'GREEN' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                    }}
                    onMouseEnter={() => setHoveredTask(epic._id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    onClick={() => { setSelectedTask(epic); setShowTaskDetail(true); }}
                    draggable
                    onDragStart={(e) => {
                      setIsDragging(true);
                      setDraggedItem(epic._id);
                      setDragStartX(e.clientX);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={async (e) => {
                      setIsDragging(false);
                      setDraggedItem(null);
                      if (timelineRef.current) {
                        const deltaX = e.clientX - dragStartX;
                        // Calculate column width based on zoom level
                        const columnWidth = zoomLevel === 'day' ? 40 : 100;
                        const totalWidth = timelineColumns.length * columnWidth;
                        const daysMoved = Math.round((deltaX / totalWidth) * timelineRange.totalDays);
                        if (daysMoved !== 0 && epic.startDate) {
                          const newStart = new Date(epic.startDate);
                          newStart.setDate(newStart.getDate() + daysMoved);
                          const newEnd = epic.dueDate ? new Date(epic.dueDate) : new Date(newStart);
                          if (epic.dueDate) newEnd.setDate(newEnd.getDate() + daysMoved);
                          await updateTask(epic._id, { 
                            startDate: newStart.toISOString().split('T')[0],
                            dueDate: newEnd.toISOString().split('T')[0]
                          });
                        }
                      }
                    }}
                  >
                    {/* Continuation Arrows */}
                    {getTaskBarStyle(epic, timelineColumns.length).showLeftArrow && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                        <ArrowLeft className="h-3 w-3 text-purple-600" />
                      </div>
                    )}
                    {getTaskBarStyle(epic, timelineColumns.length).showRightArrow && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                        <ArrowRight className="h-3 w-3 text-purple-600" />
                      </div>
                    )}
                    
                    <div className="absolute inset-y-0 left-0 bg-white/30 rounded-l-md transition-all duration-500" style={{ width: `${getEpicProgress(epic._id)}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium truncate px-3 drop-shadow-sm">
                      {getTaskBarStyle(epic, timelineColumns.length).hasMissingDates && (
                        <span className="inline-flex" title="Missing or invalid dates">
                          <AlertTriangle className="h-3 w-3 me-1" />
                        </span>
                      )}
                      {epic.title || epic.summary}
                    </span>
                    {hoveredTask === epic._id && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                        <div className="font-medium">{epic.title || epic.summary}</div>
                        <div className="text-gray-400 mt-0.5">
                          {epic.startDate || epic.startDateRFC3339 ? new Date(epic.startDate || epic.startDateRFC3339!).toLocaleDateString() : 'No start'} → {epic.dueDate || epic.dueDateRFC3339 ? new Date(epic.dueDate || epic.dueDateRFC3339!).toLocaleDateString() : 'No end'}
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Child Task Timeline Rows */}
                {expandedItems.has(epic._id) && (groupedTasks.childrenMap.get(epic._id) || groupedTasks.childrenMap.get(epic.id || '') || []).map((task, taskIndex) => (
                  <div 
                    key={task._id}
                    className={`relative flex border-b border-gray-100 ${taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
                    style={{ minHeight: '44px' }}
                  >
                    {timelineColumns.map((col, colIdx) => (
                      <div 
                        key={colIdx} 
                        className={`border-r border-gray-50 last:border-r-0 ${zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'} ${
                          col.isCurrent ? 'bg-blue-50/20' : ''
                        }`}
                      />
                    ))}
                    
                    {/* Task Bar */}
                    <div 
                      className={`absolute h-5 rounded cursor-grab active:cursor-grabbing transition-all ${
                        hoveredTask === task._id ? 'shadow-lg scale-[1.02] z-20' : ''
                      } ${selectedTask?._id === task._id ? 'ring-2 ring-green-300 shadow-lg z-20' : ''}`}
                      style={{
                        ...getTaskBarStyle(task, timelineColumns.length),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: task.type === 'bug' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                                   task.type === 'story' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                   'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      }}
                      onMouseEnter={() => setHoveredTask(task._id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                    >
                      {/* Progress overlay */}
                      <div className="absolute inset-y-0 left-0 bg-white/30 rounded-l transition-all duration-500" style={{ width: `${getTaskProgress(task)}%` }} />
                      {/* Continuation Arrows */}
                      {getTaskBarStyle(task, timelineColumns.length).showLeftArrow && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                          <ArrowLeft className="h-2.5 w-2.5 text-blue-600" />
                        </div>
                      )}
                      {getTaskBarStyle(task, timelineColumns.length).showRightArrow && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                          <ArrowRight className="h-2.5 w-2.5 text-blue-600" />
                        </div>
                      )}
                      
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium truncate px-2 drop-shadow-sm">
                        {getTaskBarStyle(task, timelineColumns.length).hasMissingDates && (
                          <span className="inline-flex" title="Missing or invalid dates">
                            <AlertTriangle className="h-2.5 w-2.5 me-1" />
                          </span>
                        )}
                        {task.title || task.summary}
                      </span>
                      {hoveredTask === task._id && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                          <div className="font-medium">{task.title || task.summary}</div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {/* Standalone Tasks Timeline */}
            {groupedTasks.standaloneTasks.map((task, idx) => (
              <div 
                key={task._id}
                className={`relative flex border-b border-gray-100 ${(groupedTasks.epics.length + idx) % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                style={{ minHeight: '44px' }}
              >
                {timelineColumns.map((col, colIdx) => (
                  <div 
                    key={colIdx} 
                    className={`border-r border-gray-100 last:border-r-0 ${zoomLevel === 'day' ? 'min-w-[40px]' : 'min-w-[100px] flex-1'} ${
                      col.isCurrent ? 'bg-blue-50/30' : ''
                    }`}
                  />
                ))}
                
                {/* Task Bar */}
                <div 
                  className={`absolute h-5 rounded cursor-pointer transition-all ${
                    hoveredTask === task._id ? 'shadow-lg scale-[1.02] z-20' : ''
                  } ${selectedTask?._id === task._id ? 'ring-2 ring-blue-300 shadow-lg z-20' : ''}`}
                  style={{
                    ...getTaskBarStyle(task, timelineColumns.length),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: task.type === 'bug' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                               task.type === 'story' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                               'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  }}
                  onMouseEnter={() => setHoveredTask(task._id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                >
                  {/* Progress overlay */}
                  <div className="absolute inset-y-0 left-0 bg-white/30 rounded-l transition-all duration-500" style={{ width: `${getTaskProgress(task)}%` }} />
                  {/* Continuation Arrows */}
                  {getTaskBarStyle(task, timelineColumns.length).showLeftArrow && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                      <ArrowLeft className="h-2.5 w-2.5 text-blue-600" />
                    </div>
                  )}
                  {getTaskBarStyle(task, timelineColumns.length).showRightArrow && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-0.5 shadow-sm">
                      <ArrowRight className="h-2.5 w-2.5 text-blue-600" />
                    </div>
                  )}
                  
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium truncate px-2 drop-shadow-sm">
                    {getTaskBarStyle(task, timelineColumns.length).hasMissingDates && (
                      <span className="inline-flex" title="Missing or invalid dates">
                        <AlertTriangle className="h-2.5 w-2.5 me-1" />
                      </span>
                    )}
                    {task.title || task.summary}
                  </span>
                  {hoveredTask === task._id && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                      <div className="font-medium">{task.title || task.summary}</div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create New Task Button */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full"
            aria-label="Create new epic"
          >
            <Plus className="h-4 w-4" />
            <span>{t('roadmap.create.button')}</span>
            <kbd className="ms-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">C</kbd>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const types: ('epic' | 'story' | 'task' | 'bug')[] = ['epic', 'story', 'task', 'bug'];
                const currentIndex = types.indexOf(newItemType);
                setNewItemType(types[(currentIndex + 1) % types.length]);
              }}
              className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-lg hover:bg-purple-200 transition-colors shrink-0"
              title={`Type: ${newItemType}`}
            >
              {getTypeIcon(newItemType)}
            </button>
            <input
              type="text"
              value={newItemSummary}
              onChange={(e) => setNewItemSummary(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newItemSummary.trim()) {
                  const success = await createTask(newItemSummary, newItemType, newItemAssignee);
                  if (success) {
                    setNewItemSummary('');
                    setNewItemAssignee(null);
                    setIsCreating(false);
                  }
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewItemSummary('');
                }
              }}
              placeholder="What needs to be done? (Enter to create, Esc to cancel)"
              autoFocus
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setIsCreating(false);
                setNewItemSummary('');
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Task Detail Slide Panel - Jira Style */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => {
              setShowTaskDetail(false);
              setSelectedTask(null);
            }}
          />
          
          {/* Update Status Toast */}
          {(isUpdating || updateError || updateSuccess) && (
            <div className="fixed top-4 right-4 z-[60] animate-in fade-in slide-in-from-top-2">
              {isUpdating && (
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {updateSuccess && !isUpdating && (
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <span>✓</span>
                  <span className="text-sm">Saved successfully</span>
                </div>
              )}
              {updateError && !isUpdating && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <span>✕</span>
                  <span className="text-sm">{updateError}</span>
                </div>
              )}
            </div>
          )}

          {/* Panel Container */}
          <div 
            className="relative w-full max-w-lg bg-gray-900 text-white shadow-2xl animate-in slide-in-from-right h-full overflow-hidden"
            role="dialog"
            aria-label="Work item details"
          >
            <div className="flex flex-col h-full">
              
              {/* 2️⃣ Header Section */}
              <div className="px-4 py-3 border-b border-gray-700">
                {/* Top Row: Type Icon + Key + Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Issue Type Icon */}
                    <span 
                      role="img" 
                      aria-label={`${selectedTask.type} work item`}
                      className="text-xl"
                    >
                      {getTypeIcon(selectedTask.type)}
                    </span>
                    {/* Issue Key */}
                    <span className="text-blue-400 font-mono text-sm hover:underline cursor-pointer">
                      {selectedTask.key}
                    </span>
                  </div>
                  
                  {/* 4️⃣ Action Bar */}
                  <div className="flex items-center gap-1" role="group" aria-label="Action items">
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Watch"
                      aria-label="Watch this issue"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
                      title="Watchers"
                    >
                      <Eye className="h-3 w-3" />
                      <span>1</span>
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Share"
                      aria-label="Share this issue"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="More actions"
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setShowTaskDetail(false);
                        setSelectedTask(null);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors ms-2"
                      aria-label="Close panel"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* 2.2 Title (Summary) - Editable */}
                <div className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedTask.type === 'epic' ? '#9333ea' : selectedTask.type === 'bug' ? '#ef4444' : '#22c55e' }}
                  >
                    {getTypeIcon(selectedTask.type)}
                  </div>
                  <h1 
                    className="text-xl font-semibold text-white flex-1 cursor-text hover:bg-gray-800 rounded px-1 -mx-1 transition-colors"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={async (e) => {
                      const newTitle = e.currentTarget.textContent?.trim();
                      if (newTitle && newTitle !== selectedTask.title) {
                        await updateTask(selectedTask._id, { title: newTitle });
                      }
                    }}
                  >
                    {selectedTask.title}
                  </h1>
                </div>
              </div>

              {/* Main Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {/* 5️⃣ Status Section */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <button 
                      id="issue-status-button"
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      aria-haspopup="listbox"
                    >
                      {selectedTask.status?.name || 'To Do'}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <span className="text-green-500">✓</span>
                      {selectedTask.status?.name || 'Done'}
                    </span>
                    <div className="flex items-center gap-1 ms-auto">
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Automation">
                        <Zap className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Settings">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Add">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6️⃣ Description Section */}
                <div className="px-4 py-4 border-b border-gray-700">
                  <h2 className="text-sm font-semibold text-white mb-2">Description</h2>
                  <div 
                    className="text-gray-400 text-sm cursor-text hover:bg-gray-800 rounded p-2 -m-2 min-h-[60px] transition-colors"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={async (e) => {
                      const newDescription = e.currentTarget.textContent?.trim();
                      if (newDescription && newDescription !== 'Add a description...') {
                        await updateTask(selectedTask._id, { description: newDescription });
                      }
                    }}
                  >
                    {selectedTask.description || <span className="text-gray-500 italic">Add a description...</span>}
                  </div>
                </div>

                {/* 7️⃣ Child Work Items */}
                <div className="px-4 py-4 border-b border-gray-700">
                  <h2 className="text-sm font-semibold text-white mb-2">Child work items</h2>
                  <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add child work item
                  </button>
                </div>

                {/* Linked Work Items */}
                <div className="px-4 py-4 border-b border-gray-700">
                  <h2 className="text-sm font-semibold text-white mb-2">Linked work items</h2>
                  <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add linked work item
                  </button>
                </div>

                {/* 8️⃣ Details Panel */}
                <section aria-label="Details" className="px-4 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <button className="flex items-center gap-2 text-white text-sm font-semibold">
                      <ChevronDown className="h-4 w-4" />
                      Details
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white" title="Configure fields">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Assignee */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Assignee</label>
                    <button className="flex items-center gap-2 w-full hover:bg-gray-800 rounded p-1 -m-1 transition-colors">
                      {selectedTask.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-medium">
                            {selectedTask.assignee.name?.[0] || selectedTask.assignee.profile?.firstName?.[0] || 'A'}{selectedTask.assignee.name?.split(' ')[1]?.[0] || selectedTask.assignee.profile?.lastName?.[0] || ''}
                          </div>
                          <span className="text-white text-sm">
                            {selectedTask.assignee.name || (selectedTask.assignee.profile ? `${selectedTask.assignee.profile.firstName} ${selectedTask.assignee.profile.lastName}` : 'Assignee')}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-400" />
                          </div>
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Labels */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Labels</label>
                    <button className="text-blue-400 text-sm hover:text-blue-300">
                      Add labels
                    </button>
                  </div>

                  {/* Sprint */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Sprint</label>
                    <button className="text-gray-400 text-sm hover:text-white">
                      None
                    </button>
                  </div>

                  {/* Story Points */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Story Points</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedTask.storyPoints || ''}
                      placeholder="None"
                      onChange={async (e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        await updateTask(selectedTask._id, { storyPoints: value });
                      }}
                      className="bg-transparent text-white text-sm w-16 border-b border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Priority */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Priority</label>
                    <select 
                      value={selectedTask.priority || 'medium'}
                      onChange={async (e) => {
                        await updateTask(selectedTask._id, { priority: e.target.value });
                      }}
                      className="bg-gray-800 text-white text-sm rounded p-1 border border-gray-600 cursor-pointer"
                    >
                      <option value="highest">🔴 Highest</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🔵 Low</option>
                      <option value="lowest">⚪ Lowest</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">{t('roadmap.dates.startDate')}</label>
                    <input 
                      type="date" 
                      defaultValue={selectedTask.startDate?.split('T')[0] || ''} 
                      onChange={async (e) => {
                        if (e.target.value) {
                          await updateTask(selectedTask._id, { startDate: e.target.value });
                        }
                      }}
                      className="bg-transparent text-white text-sm border-none p-0 focus:outline-none focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">{t('roadmap.dates.dueDate')}</label>
                    <input 
                      type="date" 
                      defaultValue={selectedTask.dueDate?.split('T')[0] || ''} 
                      onChange={async (e) => {
                        if (e.target.value) {
                          await updateTask(selectedTask._id, { dueDate: e.target.value });
                        }
                      }}
                      className="bg-transparent text-white text-sm border-none p-0 focus:outline-none focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* 9️⃣ Development Section */}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h3 className="text-xs text-gray-400 mb-2">Development</h3>
                    <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Create branch
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Zoom controls with enhanced UX */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <button 
              aria-label="Previous period"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded transition-colors">
              Today
            </button>
            <button 
              aria-label="Next period"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Center: Zoom Level */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button 
              aria-label="Zoom out"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => handleZoomChange('day')}
            >
              {t('roadmap.zoom.days')}
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => handleZoomChange('week')}
            >
              {t('roadmap.zoom.weeks')}
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => handleZoomChange('month')}
            >
              {t('roadmap.zoom.months')}
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'quarter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => handleZoomChange('quarter')}
            >
              {t('roadmap.zoom.quarters')}
            </button>
            <button 
              aria-label="Zoom in"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Right: More options */}
          <div className="flex items-center gap-2">
            <button 
              aria-label="More options"
              aria-haspopup="menu"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
