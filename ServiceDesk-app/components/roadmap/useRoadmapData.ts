import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api/config';
import type { Task, Project, GroupedTasks } from './types';
import { getTaskProgress } from './utils';

export function useRoadmapData(projectId: string) {
 const router = useRouter();

 const [project, setProject] = useState<Project | null>(null);
 const [tasks, setTasks] = useState<Task[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 // Task detail panel state
 const [selectedTask, setSelectedTask] = useState<Task | null>(null);
 const [taskDetail, setTaskDetail] = useState<Task | null>(null);
 const [showTaskDetail, setShowTaskDetail] = useState(false);

 // Update status for API operations
 const [isUpdating, setIsUpdating] = useState(false);
 const [updateError, setUpdateError] = useState<string | null>(null);
 const [updateSuccess, setUpdateSuccess] = useState(false);

 // Inline create states
 const [isCreating, setIsCreating] = useState(false);
 const [createStatus, setCreateStatus] = useState<string>('');

 // Filter states
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
 const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
 const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

 const fetchProject = useCallback(async (token: string) => {
 try {
 const response = await fetch(`${API_URL}/pm/projects/${projectId}`, {
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
 const response = await fetch(`${API_URL}/pm/projects/${projectId}/tasks`, {
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

 // Create new task/epic via API
 const createTask = useCallback(async (summary: string, type: string, assigneeName: string | null) => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !summary.trim()) return false;

 try {
 setCreateStatus(`Creating ${type}...`);
 
 const response = await fetch(`${API_URL}/pm/projects/${projectId}/tasks`, {
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
 const response = await fetch(`${API_URL}/pm/tasks/${taskId}`, {
 method: 'PATCH',
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

 // Fetch full task detail when panel opens
 useEffect(() => {
 if (!showTaskDetail || !selectedTask) {
 setTaskDetail(null);
 return;
 }
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token) return;
 fetch(`${API_URL}/pm/tasks/${selectedTask._id}`, {
 headers: { Authorization: `Bearer ${token}` },
 })
 .then(res => res.json())
 .then(data => {
 if (data.success) setTaskDetail(data.data.task);
 })
 .catch(error => console.error('Failed to fetch task detail:', error));
 }, [showTaskDetail, selectedTask?._id]);

 // Filter and group tasks
 const groupedTasks: GroupedTasks = useMemo(() => {
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
 }, [groupedTasks.childrenMap, tasks]);

 // Export functions
 const exportCSV = useCallback(() => {
 const { epics, standaloneTasks, childrenMap } = groupedTasks;
 const allTasks = [...epics];
 epics.forEach(e => { const children = childrenMap.get(e._id) || []; allTasks.push(...children); });
 allTasks.push(...standaloneTasks);
 const header = 'Key,Title,Type,Status,Priority,Assignee,Start Date,Due Date,Story Points';
 const rows = allTasks.map(t => {
 const assigneeName = t.assignee?.name || (t.assignee?.profile ? `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}` : '');
 return [t.key, `"${(t.title || '').replace(/"/g, '""')}"`, t.type, t.status?.name || '', t.priority || '', `"${assigneeName}"`, t.startDate || t.startDateRFC3339 || '', t.dueDate || t.dueDateRFC3339 || '', t.storyPoints ?? ''].join(',');
 });
 const csv = [header, ...rows].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = `${project?.key || 'roadmap'}-timeline.csv`; a.click();
 URL.revokeObjectURL(url);
 }, [groupedTasks, project?.key]);

 const exportJSON = useCallback(() => {
 const { epics, standaloneTasks, childrenMap } = groupedTasks;
 const allTasks = [...epics];
 epics.forEach(e => { const children = childrenMap.get(e._id) || []; allTasks.push(...children); });
 allTasks.push(...standaloneTasks);
 const json = JSON.stringify(allTasks.map(t => ({
 key: t.key, title: t.title, type: t.type, status: t.status?.name, priority: t.priority,
 assignee: t.assignee?.name || (t.assignee?.profile ? `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}` : null),
 startDate: t.startDate || t.startDateRFC3339 || null, dueDate: t.dueDate || t.dueDateRFC3339 || null,
 storyPoints: t.storyPoints ?? null, labels: t.labels || [],
 })), null, 2);
 const blob = new Blob([json], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = `${project?.key || 'roadmap'}-timeline.json`; a.click();
 URL.revokeObjectURL(url);
 }, [groupedTasks, project?.key]);

 const openTaskDetail = useCallback((task: Task) => {
 setSelectedTask(task);
 setShowTaskDetail(true);
 }, []);

 const closeTaskDetail = useCallback(() => {
 setShowTaskDetail(false);
 setSelectedTask(null);
 }, []);

 const refreshTasks = useCallback(() => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (token) fetchTasks(token);
 }, [fetchTasks]);

 const clearFilters = useCallback(() => {
 setSelectedAssignees([]);
 setSelectedTypes([]);
 setSelectedStatuses([]);
 }, []);

 return {
 // Core data
 project,
 tasks,
 isLoading,
 groupedTasks,

 // Task detail
 selectedTask,
 taskDetail,
 showTaskDetail,
 openTaskDetail,
 closeTaskDetail,

 // CRUD
 createTask,
 updateTask,
 refreshTasks,

 // Update status
 isUpdating,
 updateError,
 updateSuccess,

 // Create form
 isCreating,
 setIsCreating,
 createStatus,

 // Filters
 searchQuery,
 setSearchQuery,
 selectedAssignees,
 setSelectedAssignees,
 selectedTypes,
 setSelectedTypes,
 selectedStatuses,
 setSelectedStatuses,
 clearFilters,

 // Progress
 getEpicProgress,

 // Export
 exportCSV,
 exportJSON,
 };
}
