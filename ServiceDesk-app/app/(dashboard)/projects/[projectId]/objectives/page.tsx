'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  owner?: string;
  status: 'on_track' | 'at_risk' | 'behind';
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  owner: string;
  ownerAvatar?: string;
  keyResults: KeyResult[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  quarter: string;
  dueDate?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultObjectives: Objective[] = [
  {
    id: 'obj1',
    title: 'Increase customer satisfaction',
    description: 'Improve overall customer experience and satisfaction scores',
    owner: 'Sarah Johnson',
    status: 'active',
    progress: 72,
    quarter: 'Q1 2024',
    keyResults: [
      { id: 'kr1', title: 'Achieve NPS score of 50+', targetValue: 50, currentValue: 45, unit: 'points', status: 'at_risk' },
      { id: 'kr2', title: 'Reduce support ticket response time', targetValue: 2, currentValue: 1.5, unit: 'hours', status: 'on_track' },
      { id: 'kr3', title: 'Increase customer retention rate', targetValue: 95, currentValue: 92, unit: '%', status: 'on_track' },
    ],
  },
  {
    id: 'obj2',
    title: 'Launch new product features',
    description: 'Deliver key features to improve product competitiveness',
    owner: 'Mike Chen',
    status: 'active',
    progress: 45,
    quarter: 'Q1 2024',
    keyResults: [
      { id: 'kr4', title: 'Release mobile app v2.0', targetValue: 100, currentValue: 60, unit: '%', status: 'on_track' },
      { id: 'kr5', title: 'Implement AI-powered search', targetValue: 100, currentValue: 30, unit: '%', status: 'behind' },
      { id: 'kr6', title: 'Add 5 new integrations', targetValue: 5, currentValue: 2, unit: 'integrations', status: 'at_risk' },
    ],
  },
  {
    id: 'obj3',
    title: 'Expand market presence',
    description: 'Grow our presence in new markets and segments',
    owner: 'Emily Davis',
    status: 'active',
    progress: 85,
    quarter: 'Q1 2024',
    keyResults: [
      { id: 'kr7', title: 'Enter 3 new geographic markets', targetValue: 3, currentValue: 3, unit: 'markets', status: 'on_track' },
      { id: 'kr8', title: 'Increase brand awareness by 25%', targetValue: 25, currentValue: 20, unit: '%', status: 'on_track' },
      { id: 'kr9', title: 'Generate 1000 qualified leads', targetValue: 1000, currentValue: 850, unit: 'leads', status: 'on_track' },
    ],
  },
];

const statusColors = {
  on_track: { bg: 'bg-green-100', text: 'text-green-700', label: 'On Track' },
  at_risk: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'At Risk' },
  behind: { bg: 'bg-red-100', text: 'text-red-700', label: 'Behind' },
};

const objectiveStatusColors = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function ObjectivesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>(defaultObjectives);
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set(['obj1', 'obj2']));
  const [isLoading, setIsLoading] = useState(true);
  const [showNewObjectiveModal, setShowNewObjectiveModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2024');

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
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

  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOverallProgress = () => {
    const total = objectives.reduce((sum, o) => sum + o.progress, 0);
    return Math.round(total / objectives.length);
  };

  const getStatusIcon = (status: 'on_track' | 'at_risk' | 'behind') => {
    switch (status) {
      case 'on_track': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'at_risk': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'behind': return <TrendingDown className="h-4 w-4 text-red-500" />;
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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'okr'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search objectives..."
        primaryAction={{
          label: 'Add Objective',
          onClick: () => setShowNewObjectiveModal(true),
        }}
        rightActions={
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Q1 2024">Q1 2024</option>
            <option value="Q2 2024">Q2 2024</option>
            <option value="Q3 2024">Q3 2024</option>
            <option value="Q4 2024">Q4 2024</option>
          </select>
        }
      />

      {/* Progress Overview */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">{selectedQuarter} OKR Progress</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{getOverallProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(getOverallProgress())}`}
            style={{ width: `${getOverallProgress()}%` }}
          />
        </div>
        <div className="flex items-center gap-6 mt-3 text-sm">
          <span className="text-gray-500">{objectives.length} Objectives</span>
          <span className="text-gray-500">{objectives.reduce((sum, o) => sum + o.keyResults.length, 0)} Key Results</span>
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {objectives.filter(o => o.progress >= 70).length} On Track
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            {objectives.filter(o => o.progress >= 40 && o.progress < 70).length} At Risk
          </span>
        </div>
      </div>

      {/* Objectives List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {objectives.map((objective) => {
          const isExpanded = expandedObjectives.has(objective.id);

          return (
            <div
              key={objective.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Objective Header */}
              <div
                className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleObjective(objective.id)}
              >
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {/* Progress Circle */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke={objective.progress >= 70 ? '#22c55e' : objective.progress >= 40 ? '#eab308' : '#ef4444'}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${objective.progress * 1.26} 126`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {objective.progress}%
                  </span>
                </div>

                {/* Objective Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{objective.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${objectiveStatusColors[objective.status].bg} ${objectiveStatusColors[objective.status].text}`}>
                      {objective.status.charAt(0).toUpperCase() + objective.status.slice(1)}
                    </span>
                  </div>
                  {objective.description && (
                    <p className="text-sm text-gray-500 truncate">{objective.description}</p>
                  )}
                </div>

                {/* Owner & KRs */}
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                      {objective.owner.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-gray-600">{objective.owner}</span>
                  </div>
                  <span className="text-sm text-gray-500">{objective.keyResults.length} KRs</span>
                </div>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Key Results (Expanded) */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {objective.keyResults.map((kr, index) => {
                    const progress = Math.round((kr.currentValue / kr.targetValue) * 100);

                    return (
                      <div
                        key={kr.id}
                        className={`flex items-center gap-4 px-4 py-3 ${
                          index !== objective.keyResults.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="w-8 flex justify-center">
                          {getStatusIcon(kr.status)}
                        </div>

                        {/* KR Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{kr.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex-1 max-w-xs">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    kr.status === 'on_track' ? 'bg-green-500' :
                                    kr.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {kr.currentValue} / {kr.targetValue} {kr.unit}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[kr.status].bg} ${statusColors[kr.status].text}`}>
                          {statusColors[kr.status].label}
                        </span>

                        {/* Update Button */}
                        <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          Update
                        </button>
                      </div>
                    );
                  })}

                  {/* Add Key Result */}
                  <button className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-full transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Key Result
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Objective Modal */}
      {showNewObjectiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Objective</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objective Title</label>
                <input
                  type="text"
                  placeholder="e.g., Increase customer satisfaction"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the objective..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Q1 2024">Q1 2024</option>
                    <option value="Q2 2024">Q2 2024</option>
                    <option value="Q3 2024">Q3 2024</option>
                    <option value="Q4 2024">Q4 2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select owner...</option>
                    <option value="sarah">Sarah Johnson</option>
                    <option value="mike">Mike Chen</option>
                    <option value="emily">Emily Davis</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewObjectiveModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Objective
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
