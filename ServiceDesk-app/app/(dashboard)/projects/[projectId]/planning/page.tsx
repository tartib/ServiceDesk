'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  Clock,
  Users,
  Zap,
  GripVertical,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import PlanningPokerModal from '@/components/projects/PlanningPokerModal';
import TeamCapacityModal from '@/components/projects/TeamCapacityModal';
import SprintCommitmentModal from '@/components/projects/SprintCommitmentModal';
import { useMethodology } from '@/hooks/useMethodology';
import { useSprintPlanning } from '@/hooks/useSprintPlanning';

interface BacklogItem {
  id: string;
  key: string;
  title: string;
  type: 'story' | 'bug' | 'task';
  priority: 'high' | 'medium' | 'low';
  points?: number;
  assignee?: string;
  selected: boolean;
}

interface ApiTask {
  _id?: string;
  id?: string;
  key?: string;
  number?: number;
  title?: string;
  summary?: string;
  type?: string;
  priority?: string;
  storyPoints?: number;
  sprint?: string;
  status?: string;
  assignee?: {
    name?: string;
  };
  assignedToName?: string;
}

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  capacity: number;
  committed: number;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  organization?: string | { _id: string };
}

interface ApiSprint {
  _id?: string;
  id?: string;
  name: string;
  goal?: string;
  status: string;
  capacity?: number | { planned?: number; available?: number };
  stats?: { totalPoints?: number };
  startDate?: string;
  endDate?: string;
}



const defaultSprint: Sprint = {
  id: '',
  name: 'Loading...',
  goal: '',
  capacity: 40,
  committed: 0,
};

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  story: { label: 'Story', color: 'bg-green-100 text-green-700', icon: '📖' },
  bug: { label: 'Bug', color: 'bg-red-100 text-red-700', icon: '🐛' },
  task: { label: 'Task', color: 'bg-blue-100 text-blue-700', icon: '✓' },
  epic: { label: 'Epic', color: 'bg-purple-100 text-purple-700', icon: '🎯' },
};

const getTypeConfig = (type: string) => {
  return typeConfig[type?.toLowerCase()] || typeConfig.task;
};

const priorityConfig = {
  high: { label: 'High', color: 'text-red-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  low: { label: 'Low', color: 'text-gray-500' },
};

export default function SprintPlanningPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [sprint, setSprint] = useState<Sprint>(defaultSprint);
  const [allSprints, setAllSprints] = useState<ApiSprint[]>([]);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [sprintItems, setSprintItems] = useState<BacklogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sprintGoal, setSprintGoal] = useState('');
  
  const [showPokerModal, setShowPokerModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [selectedTaskForPoker, setSelectedTaskForPoker] = useState<BacklogItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<BacklogItem | null>(null);
  const [draggedFromSprint, setDraggedFromSprint] = useState(false);
  
  const { startSprint, updateSprintSettings } = useSprintPlanning(projectId);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const proj = data.data.project;
        setProject(proj);
        const orgId = typeof proj.organization === 'string' ? proj.organization : proj.organization?._id;
        if (orgId) localStorage.setItem('organizationId', orgId);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId]);

  const fetchBacklog = useCallback(async (token: string) => {
    try {
      // Try fetching from backlog endpoint first
      let res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/backlog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // If backlog endpoint doesn't exist, try tasks endpoint
      if (!res.ok) {
        res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      const data = await res.json();
      console.log('📋 Backlog API Response:', data);
      
      if (data.success) {
        const tasks = data.data?.tasks || data.data?.backlog || data.data || [];
        console.log('📋 Tasks found:', tasks.length);
        
        // Filter for backlog items (not in sprint, or status is Backlog/Ready)
        const backlogTasks = tasks.filter((task: ApiTask) => 
          !task.sprint || task.status === 'Backlog' || task.status === 'Ready'
        );
        
        // Map API tasks to BacklogItem format
        const backlogItems: BacklogItem[] = backlogTasks.map((task: ApiTask) => ({
          id: task._id || task.id,
          key: task.key || `${project?.key}-${task.number || ''}`,
          title: task.title || task.summary,
          type: (task.type?.toLowerCase() || 'task') as 'story' | 'bug' | 'task',
          priority: (task.priority?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          points: task.storyPoints,
          assignee: task.assignee?.name || task.assignedToName,
          selected: false,
        }));
        
        console.log('📋 Mapped backlog items:', backlogItems.length);
        setBacklog(backlogItems);
      }
    } catch (error) {
      console.error('Failed to fetch backlog:', error);
      // Fallback to default backlog for testing
    } finally {
      setIsLoading(false);
    }
  }, [projectId, project?.key]);

  const fetchSprintTasks = useCallback(async (token: string, sprintId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/tasks?sprintId=${sprintId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        const tasks = data.data?.tasks || data.data || [];
        const items: BacklogItem[] = tasks.map((task: ApiTask) => ({
          id: task._id || task.id,
          key: task.key || `${project?.key}-${task.number || ''}`,
          title: task.title || task.summary,
          type: task.type?.toLowerCase() || 'task',
          priority: task.priority?.toLowerCase() || 'medium',
          points: task.storyPoints,
          assignee: task.assignee?.name || task.assignedToName,
          selected: false,
        }));
        setSprintItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch sprint tasks:', error);
    }
  }, [projectId, project?.key]);

  const selectSprint = useCallback((sprintData: ApiSprint, token: string) => {
    const sprintId = sprintData._id || sprintData.id || '';
    setSprint({
      id: sprintId,
      name: sprintData.name,
      goal: sprintData.goal || '',
      capacity: typeof sprintData.capacity === 'number' ? sprintData.capacity : (sprintData.capacity?.planned || sprintData.capacity?.available || 40),
      committed: sprintData.stats?.totalPoints || 0,
    });
    setSprintGoal(sprintData.goal || '');
    setSprintItems([]);
    if (sprintData.status === 'active' || sprintData.status === 'planning') {
      fetchSprintTasks(token, sprintId);
    }
  }, [fetchSprintTasks]);

  const fetchAllSprints = useCallback(async (token: string) => {
    try {
      // Fetch ALL sprints for this project
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        const sprints: ApiSprint[] = data.data?.sprints || data.data || [];
        setAllSprints(sprints);
        
        // Auto-select first planning or active sprint
        const planningOrActive = sprints.find((s: ApiSprint) => s.status === 'planning' || s.status === 'active');
        const firstSprint = planningOrActive || sprints[0];
        
        if (firstSprint) {
          selectSprint(firstSprint, token);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    }
  }, [projectId, selectSprint]);

  const handleSelectSprint = (sprintData: ApiSprint) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    selectSprint(sprintData, token);
    setShowSprintSelector(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const loadData = async () => {
      await fetchProject(token);
      await fetchAllSprints(token);
      await fetchBacklog(token);
    };
    
    loadData();
  }, [projectId, router, fetchProject, fetchBacklog, fetchAllSprints]);

  const handleAddToSprint = (item: BacklogItem) => {
    if (!item.points) {
      alert('⚠️ This item needs to be estimated before adding to sprint. Use Planning Poker to estimate.');
      return;
    }
    
    const newCommitted = sprint.committed + (item.points || 0);
    if (newCommitted > sprint.capacity) {
      const proceed = confirm(
        `⚠️ Warning: Adding this item will exceed sprint capacity!\n\n` +
        `Current: ${sprint.committed} pts\n` +
        `Adding: ${item.points} pts\n` +
        `Total: ${newCommitted} pts\n` +
        `Capacity: ${sprint.capacity} pts\n\n` +
        `Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }
    
    setBacklog(prev => prev.filter(b => b.id !== item.id));
    setSprintItems(prev => [...prev, item]);
    setSprint(prev => ({ ...prev, committed: newCommitted }));
  };

  const handleRemoveFromSprint = (item: BacklogItem) => {
    setSprintItems(prev => prev.filter(s => s.id !== item.id));
    setBacklog(prev => [...prev, item]);
    setSprint(prev => ({ ...prev, committed: prev.committed - (item.points || 0) }));
  };

  const getCapacityPercentage = () => {
    return Math.round((sprint.committed / sprint.capacity) * 100);
  };

  const getCapacityColor = () => {
    const percentage = getCapacityPercentage();
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleOpenPoker = (item: BacklogItem) => {
    setSelectedTaskForPoker(item);
    setShowPokerModal(true);
  };

  const handleEstimateComplete = (estimate: number) => {
    if (selectedTaskForPoker) {
      const updatedItem = { ...selectedTaskForPoker, points: estimate };
      setBacklog(prev => prev.map(item => 
        item.id === selectedTaskForPoker.id ? updatedItem : item
      ));
      setSprintItems(prev => prev.map(item => 
        item.id === selectedTaskForPoker.id ? updatedItem : item
      ));
    }
    setShowPokerModal(false);
    setSelectedTaskForPoker(null);
  };

  const handleCapacityUpdated = (newCapacity: number) => {
    setSprint(prev => ({ ...prev, capacity: newCapacity }));
  };

  const handleUpdateSprintGoal = async (goal: string) => {
    setSprintGoal(goal);
    try {
      await updateSprintSettings(sprint.id, { goal });
    } catch (error) {
      console.error('Failed to update sprint goal:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (item: BacklogItem, fromSprint: boolean) => {
    setDraggedItem(item);
    setDraggedFromSprint(fromSprint);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedFromSprint(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnBacklog = (e: React.DragEvent, targetItem?: BacklogItem) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedFromSprint) {
      // Moving from sprint to backlog
      handleRemoveFromSprint(draggedItem);
    } else if (targetItem) {
      // Reordering within backlog
      const items = [...backlog];
      const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
      const targetIndex = items.findIndex(i => i.id === targetItem.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedItem);
        setBacklog(items);
      }
    }
    handleDragEnd();
  };

  const handleDropOnSprint = (e: React.DragEvent, targetItem?: BacklogItem) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (!draggedFromSprint) {
      // Moving from backlog to sprint
      handleAddToSprint(draggedItem);
    } else if (targetItem) {
      // Reordering within sprint
      const items = [...sprintItems];
      const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
      const targetIndex = items.findIndex(i => i.id === targetItem.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedItem);
        setSprintItems(items);
      }
    }
    handleDragEnd();
  };

  const validateSprintCommitment = (): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!sprintGoal.trim()) {
      errors.push('Sprint Goal is required. Define what you want to achieve.');
    }

    if (sprintItems.length === 0) {
      errors.push('No items selected for the sprint. Add at least one item.');
    }

    const unestimatedItems = sprintItems.filter(item => !item.points);
    if (unestimatedItems.length > 0) {
      errors.push(`${unestimatedItems.length} item(s) are not estimated. Use Planning Poker to estimate.`);
    }

    const capacityPercentage = getCapacityPercentage();
    if (capacityPercentage > 100) {
      warnings.push(`Sprint is over capacity by ${capacityPercentage - 100}%. Consider removing items.`);
    } else if (capacityPercentage < 50) {
      warnings.push(`Sprint is under-utilized (${capacityPercentage}%). Consider adding more items.`);
    }

    return { errors, warnings };
  };

  const handleStartSprint = () => {
    const validation = validateSprintCommitment();
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      setShowCommitmentModal(true);
    } else {
      confirmStartSprint();
    }
  };

  const confirmStartSprint = async () => {
    try {
      console.log('🚀 Starting sprint:', { sprintId: sprint.id, sprintName: sprint.name });
      if (!sprint.id) {
        alert('❌ No sprint selected. Please select a sprint first.');
        return;
      }
      await startSprint(sprint.id);
      alert('✅ Sprint started successfully!');
      router.push(`/projects/${projectId}/board`);
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { error?: string; data?: { validationErrors?: string[] } } } };
      const serverError = axiosErr?.response?.data?.error;
      const validationErrors = axiosErr?.response?.data?.data?.validationErrors;
      console.error('Failed to start sprint:', { serverError, validationErrors, error });
      if (validationErrors && validationErrors.length > 0) {
        alert(`❌ Cannot start sprint:\n${validationErrors.join('\n')}`);
      } else {
        alert(`❌ Failed to start sprint: ${serverError || 'Please try again.'}`);
      }
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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sprint Planning</h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSprintSelector(!showSprintSelector)}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full hover:bg-purple-200 transition-colors flex items-center gap-1.5"
              >
                {sprint.name || 'Select Sprint'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSprintSelector ? 'rotate-180' : ''}`} />
              </button>
              {showSprintSelector && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSprintSelector(false)} />
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 max-h-64 overflow-y-auto">
                  {allSprints.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No sprints found</div>
                  ) : (
                    allSprints.map((s) => {
                      const sId = s._id || s.id || '';
                      const isActive = sId === sprint.id;
                      const statusColors: Record<string, string> = {
                        planning: 'bg-blue-100 text-blue-700',
                        active: 'bg-green-100 text-green-700',
                        completed: 'bg-gray-100 text-gray-600',
                        cancelled: 'bg-red-100 text-red-600',
                      };
                      return (
                        <button
                          key={sId}
                          onClick={() => handleSelectSprint(s)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 ${
                            isActive ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <div className={`text-sm font-medium truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
                              {s.name}
                            </div>
                            {s.goal && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">{s.goal}</div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>
                            {s.status}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Capacity Indicator */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{sprint.committed}</span> / {sprint.capacity} pts
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getCapacityColor()}`}
                  style={{ width: `${Math.min(getCapacityPercentage(), 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{getCapacityPercentage()}%</span>
            </div>
            <button
              onClick={() => setShowCapacityModal(true)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Capacity
            </button>
            <button
              onClick={handleStartSprint}
              className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Sprint Goal */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Sprint Goal:</span>
          <input
            type="text"
            value={sprintGoal}
            onChange={(e) => handleUpdateSprintGoal(e.target.value)}
            placeholder="What do you want to achieve in this sprint?"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {!sprintGoal && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Required
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Two Panels */}
      <div className="flex-1 overflow-hidden flex">
        {/* Backlog Panel */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Product Backlog</h3>
              <span className="text-sm text-gray-500">{backlog.length} items</span>
            </div>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnBacklog(e)}
          >
            <div className="space-y-3">
              {backlog.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border-2 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                    draggedItem?.id === item.id ? 'opacity-50 border-purple-400' : 'border-gray-200'
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(item, false)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnBacklog(e, item)}
                >
                  {/* Drag indicator bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 pt-1">
                      <GripVertical className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                    
                    {/* Type Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {getTypeConfig(item.type).icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {item.key}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${priorityConfig[item.priority].color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {priorityConfig[item.priority].label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeConfig(item.type).color}`}>
                          {getTypeConfig(item.type).label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</p>
                      {item.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{item.assignee}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {item.points ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg text-sm font-bold text-purple-700 shadow-sm">
                          {item.points}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPoker(item)}
                          className="px-3 py-2 text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-lg hover:from-purple-200 hover:to-purple-300 transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                          title="Estimate with Planning Poker"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Estimate
                        </button>
                      )}
                      <button
                        onClick={() => handleAddToSprint(item)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-purple-600 rounded-lg transition-all shadow-sm hover:shadow"
                        title="Add to Sprint"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {backlog.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Target className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-500">No items in backlog</p>
                  <p className="text-sm mt-1">Create tasks to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sprint Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">{sprint.name} Backlog</h3>
              </div>
              <span className="text-sm text-purple-700">{sprintItems.length} items • {sprint.committed} pts</span>
            </div>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSprint(e)}
          >
            <div className="space-y-3">
              {sprintItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-gradient-to-br from-white to-purple-50 border-2 rounded-xl p-4 hover:border-purple-400 hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                    draggedItem?.id === item.id ? 'opacity-50 border-purple-500' : 'border-purple-200'
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(item, true)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSprint(e, item)}
                >
                  {/* Sprint indicator bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-700 transition-opacity" />
                  
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 pt-1">
                      <GripVertical className="h-5 w-5 text-purple-300 group-hover:text-purple-600 transition-colors" />
                    </div>
                    
                    {/* Type Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">
                        {getTypeConfig(item.type).icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {item.key}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${priorityConfig[item.priority].color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {priorityConfig[item.priority].label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeConfig(item.type).color}`}>
                          {getTypeConfig(item.type).label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</p>
                      {item.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{item.assignee}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {item.points ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-sm font-bold text-white shadow-md">
                          {item.points}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPoker(item)}
                          className="px-3 py-2 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                          title="Estimate with Planning Poker"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Estimate
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFromSprint(item)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shadow-sm hover:shadow"
                        title="Remove from Sprint"
                      >
                        <span className="text-lg font-bold">×</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {sprintItems.length === 0 && (
                <div className="text-center py-12 text-purple-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="font-medium text-purple-600">No items in sprint</p>
                  <p className="text-sm mt-1 text-purple-500">Drag items from the backlog or click + to add</p>
                </div>
              )}
            </div>
          </div>

          {/* Sprint Summary */}
          {sprintItems.length > 0 && (
            <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-purple-700">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {sprintItems.filter(i => i.type === 'story').length} Stories
                  </span>
                  <span className="text-purple-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {sprintItems.filter(i => i.type === 'bug').length} Bugs
                  </span>
                </div>
                <span className="font-semibold text-purple-900">
                  Total: {sprint.committed} points
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPokerModal && selectedTaskForPoker && sprint.id && (
        <PlanningPokerModal
          isOpen={showPokerModal}
          onClose={() => {
            setShowPokerModal(false);
            setSelectedTaskForPoker(null);
          }}
          taskId={selectedTaskForPoker.id}
          taskTitle={selectedTaskForPoker.title}
          sprintId={sprint.id}
          onEstimateComplete={handleEstimateComplete}
        />
      )}

      {showCapacityModal && (
        <TeamCapacityModal
          isOpen={showCapacityModal}
          onClose={() => setShowCapacityModal(false)}
          sprintId={sprint.id}
          projectId={projectId}
          sprintDays={10}
          onCapacityUpdated={handleCapacityUpdated}
        />
      )}

      {showCommitmentModal && (
        <SprintCommitmentModal
          isOpen={showCommitmentModal}
          onClose={() => setShowCommitmentModal(false)}
          onConfirm={() => {
            setShowCommitmentModal(false);
            confirmStartSprint();
          }}
          sprintName={sprint.name}
          sprintGoal={sprintGoal}
          itemCount={sprintItems.length}
          totalPoints={sprint.committed}
          capacity={sprint.capacity}
          validationErrors={validateSprintCommitment().errors}
          validationWarnings={validateSprintCommitment().warnings}
        />
      )}
    </div>
  );
}
