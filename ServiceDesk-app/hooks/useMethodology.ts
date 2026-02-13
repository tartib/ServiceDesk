import { useState, useEffect, useCallback } from 'react';

export type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

export interface MethodologyConfig {
  _id: string;
  projectId: string;
  methodologyCode: MethodologyType;
  scrum?: ScrumConfig;
  kanban?: KanbanConfig;
  waterfall?: WaterfallConfig;
  itil?: ItilConfig;
  lean?: LeanConfig;
  okr?: OkrConfig;
}

export interface ScrumConfig {
  sprintLength: number;
  roles: {
    productOwner?: string;
    scrumMaster?: string;
    developers: string[];
  };
  definitionOfDone: string[];
  events: {
    planning: { enabled: boolean; defaultDuration: number };
    daily: { enabled: boolean; defaultDuration: number };
    review: { enabled: boolean; defaultDuration: number };
    retrospective: { enabled: boolean; defaultDuration: number };
  };
  estimationMethod: 'story_points' | 'hours' | 'tshirt';
  velocityHistory: number[];
}

export interface KanbanConfig {
  columns: Array<{
    id: string;
    name: string;
    order: number;
    wipLimit?: number;
    category: 'todo' | 'in_progress' | 'done';
  }>;
  wipLimits: {
    global?: number;
    perColumn: Record<string, number>;
  };
  policies: {
    pullBased: boolean;
    cycleTimeTracking: boolean;
    blockerHighlight: boolean;
    agingThreshold: number;
  };
}

export interface WaterfallConfig {
  phases: Array<{
    id: string;
    name: string;
    order: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
    deliverables: string[];
  }>;
  gates: Array<{
    id: string;
    name: string;
    phaseId: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  milestones: Array<{
    id: string;
    name: string;
    dueDate: string;
    status: 'upcoming' | 'completed' | 'missed';
  }>;
}

export interface ItilConfig {
  serviceCatalog: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    status: 'active' | 'inactive' | 'deprecated';
  }>;
  slaDefinitions: Array<{
    id: string;
    name: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    responseTime: number;
    resolutionTime: number;
  }>;
  processes: {
    incident: { enabled: boolean; prefix: string };
    problem: { enabled: boolean; prefix: string };
    change: { enabled: boolean; prefix: string };
    release: { enabled: boolean; prefix: string };
  };
  cab: {
    enabled: boolean;
    members: string[];
    approvalThreshold: number;
  };
}

export interface LeanConfig {
  valueStream: Array<{
    id: string;
    name: string;
    order: number;
    processTime: number;
    waitTime: number;
  }>;
  wasteCategories: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
  }>;
  improvementBoard: {
    enabled: boolean;
    columns: string[];
  };
  metrics: {
    leadTime: boolean;
    cycleTime: boolean;
    throughput: boolean;
    bottleneckDetection: boolean;
  };
}

export interface OkrConfig {
  cycleType: 'monthly' | 'quarterly' | 'yearly';
  cycles: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'planning' | 'active' | 'review' | 'closed';
  }>;
  objectives: Array<{
    id: string;
    title: string;
    description?: string;
    owner: string;
    keyResults: Array<{
      id: string;
      title: string;
      targetValue: number;
      currentValue: number;
      unit: string;
    }>;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    progress: number;
  }>;
  checkInFrequency: 'daily' | 'weekly' | 'biweekly';
  scoringMethod: 'percentage' | 'scale_1_10' | 'binary';
}

interface UseMethodologyReturn {
  methodology: MethodologyType | null;
  config: MethodologyConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateConfig: (updates: Partial<MethodologyConfig>) => Promise<void>;
  changeMethodology: (newMethodology: MethodologyType) => Promise<void>;
}

export function useMethodology(projectId: string): UseMethodologyReturn {
  const [methodology, setMethodology] = useState<MethodologyType | null>(null);
  const [config, setConfig] = useState<MethodologyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethodology = useCallback(async () => {
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/methodology`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConfig(data.data);
          setMethodology(data.data.methodologyCode);
        }
      } else if (response.status === 404) {
        // No methodology config yet, try to get from project
        const projectResponse = await fetch(
          `http://localhost:5000/api/v1/pm/projects/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          if (projectData.success && projectData.data?.methodology?.code) {
            setMethodology(projectData.data.methodology.code);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch methodology');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMethodology();
  }, [fetchMethodology]);

  const updateConfig = async (updates: Partial<MethodologyConfig>) => {
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      throw new Error('Valid projectId is required');
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/methodology`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update methodology config');
      }

      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      throw err;
    }
  };

  const changeMethodology = async (newMethodology: MethodologyType) => {
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      throw new Error('Valid projectId is required');
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/methodology/change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ methodologyCode: newMethodology }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to change methodology');
      }

      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        setMethodology(newMethodology);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change methodology');
      throw err;
    }
  };

  return {
    methodology,
    config,
    isLoading,
    error,
    refetch: fetchMethodology,
    updateConfig,
    changeMethodology,
  };
}

// Navigation helper
export function getMethodologyNavigation(methodology: MethodologyType): Array<{ id: string; label: string; href: string }> {
  const baseTabs = [{ id: 'summary', label: 'Summary', href: '/summary' }];

  switch (methodology) {
    case 'scrum':
      return [
        ...baseTabs,
        { id: 'board', label: 'Board', href: '/board' },
        { id: 'backlog', label: 'Backlog', href: '/backlog' },
        { id: 'sprints', label: 'Sprints', href: '/sprints' },
        { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
        { id: 'calendar', label: 'Calendar', href: '/calendar' },
        { id: 'analytics', label: 'Analytics', href: '/analytics' },
      ];
    case 'kanban':
      return [
        ...baseTabs,
        { id: 'board', label: 'Board', href: '/board' },
        { id: 'backlog', label: 'Backlog', href: '/backlog' },
        { id: 'calendar', label: 'Calendar', href: '/calendar' },
        { id: 'analytics', label: 'Analytics', href: '/analytics' },
      ];
    case 'waterfall':
      return [
        ...baseTabs,
        { id: 'phases', label: 'Phases', href: '/phases' },
        { id: 'milestones', label: 'Milestones', href: '/milestones' },
        { id: 'gates', label: 'Gate Reviews', href: '/gates' },
        { id: 'gantt', label: 'Gantt', href: '/gantt' },
        { id: 'analytics', label: 'Analytics', href: '/analytics' },
      ];
    case 'itil':
      return [
        ...baseTabs,
        { id: 'service-catalog', label: 'Services', href: '/service-catalog' },
        { id: 'incidents', label: 'Incidents', href: '/incidents' },
        { id: 'problems', label: 'Problems', href: '/problems' },
        { id: 'changes', label: 'Changes', href: '/changes' },
        { id: 'releases', label: 'Releases', href: '/releases' },
        { id: 'sla', label: 'SLA', href: '/sla' },
      ];
    case 'lean':
      return [
        ...baseTabs,
        { id: 'value-stream', label: 'Value Stream', href: '/value-stream' },
        { id: 'board', label: 'Board', href: '/board' },
        { id: 'improvements', label: 'Improvements', href: '/improvements' },
        { id: 'analytics', label: 'Analytics', href: '/analytics' },
      ];
    case 'okr':
      return [
        ...baseTabs,
        { id: 'objectives', label: 'Objectives', href: '/objectives' },
        { id: 'key-results', label: 'Key Results', href: '/key-results' },
        { id: 'check-ins', label: 'Check-ins', href: '/check-ins' },
        { id: 'analytics', label: 'Progress', href: '/analytics' },
      ];
    default:
      return baseTabs;
  }
}

// Default landing page helper
export function getDefaultLandingPage(methodology: MethodologyType): string {
  switch (methodology) {
    case 'scrum':
    case 'kanban':
    case 'lean':
      return '/board';
    case 'waterfall':
      return '/phases';
    case 'itil':
      return '/service-catalog';
    case 'okr':
      return '/objectives';
    default:
      return '/summary';
  }
}
