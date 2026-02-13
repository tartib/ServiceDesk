'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Calendar,
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
  objectiveId: string;
  objectiveTitle: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  unit: string;
  owner: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  dueDate: string;
  lastUpdated: string;
  updates: Array<{
    date: string;
    value: number;
    note?: string;
  }>;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultKeyResults: KeyResult[] = [
  {
    id: 'kr1',
    title: 'Achieve NPS score of 50+',
    objectiveId: 'obj1',
    objectiveTitle: 'Increase customer satisfaction',
    targetValue: 50,
    currentValue: 45,
    startValue: 35,
    unit: 'points',
    owner: 'Sarah Johnson',
    status: 'at_risk',
    dueDate: '2024-03-31',
    lastUpdated: '2024-01-15',
    updates: [
      { date: '2024-01-01', value: 35 },
      { date: '2024-01-08', value: 40 },
      { date: '2024-01-15', value: 45 },
    ],
  },
  {
    id: 'kr2',
    title: 'Reduce support ticket response time to 2 hours',
    objectiveId: 'obj1',
    objectiveTitle: 'Increase customer satisfaction',
    targetValue: 2,
    currentValue: 1.5,
    startValue: 4,
    unit: 'hours',
    owner: 'Mike Chen',
    status: 'achieved',
    dueDate: '2024-03-31',
    lastUpdated: '2024-01-14',
    updates: [
      { date: '2024-01-01', value: 4 },
      { date: '2024-01-08', value: 2.5 },
      { date: '2024-01-14', value: 1.5 },
    ],
  },
  {
    id: 'kr3',
    title: 'Increase customer retention rate to 95%',
    objectiveId: 'obj1',
    objectiveTitle: 'Increase customer satisfaction',
    targetValue: 95,
    currentValue: 92,
    startValue: 88,
    unit: '%',
    owner: 'Emily Davis',
    status: 'on_track',
    dueDate: '2024-03-31',
    lastUpdated: '2024-01-15',
    updates: [
      { date: '2024-01-01', value: 88 },
      { date: '2024-01-08', value: 90 },
      { date: '2024-01-15', value: 92 },
    ],
  },
  {
    id: 'kr4',
    title: 'Release mobile app v2.0',
    objectiveId: 'obj2',
    objectiveTitle: 'Launch new product features',
    targetValue: 100,
    currentValue: 60,
    startValue: 0,
    unit: '%',
    owner: 'John Doe',
    status: 'on_track',
    dueDate: '2024-03-31',
    lastUpdated: '2024-01-15',
    updates: [
      { date: '2024-01-01', value: 20 },
      { date: '2024-01-08', value: 40 },
      { date: '2024-01-15', value: 60 },
    ],
  },
  {
    id: 'kr5',
    title: 'Implement AI-powered search',
    objectiveId: 'obj2',
    objectiveTitle: 'Launch new product features',
    targetValue: 100,
    currentValue: 30,
    startValue: 0,
    unit: '%',
    owner: 'Tech Lead',
    status: 'behind',
    dueDate: '2024-03-31',
    lastUpdated: '2024-01-12',
    updates: [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-08', value: 20 },
      { date: '2024-01-12', value: 30 },
    ],
  },
];

const statusConfig = {
  on_track: { label: 'On Track', color: 'bg-green-100 text-green-700', icon: TrendingUp, iconColor: 'text-green-500' },
  at_risk: { label: 'At Risk', color: 'bg-yellow-100 text-yellow-700', icon: Minus, iconColor: 'text-yellow-500' },
  behind: { label: 'Behind', color: 'bg-red-100 text-red-700', icon: TrendingDown, iconColor: 'text-red-500' },
  achieved: { label: 'Achieved', color: 'bg-blue-100 text-blue-700', icon: Target, iconColor: 'text-blue-500' },
};

export default function KeyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [keyResults] = useState<KeyResult[]>(defaultKeyResults);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
  const [filterObjective, setFilterObjective] = useState<string>('all');

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

  const getProgress = (kr: KeyResult) => {
    const range = kr.targetValue - kr.startValue;
    if (range === 0) return 100;
    const progress = ((kr.currentValue - kr.startValue) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getUniqueObjectives = () => {
    const objectives = new Map<string, string>();
    keyResults.forEach(kr => {
      objectives.set(kr.objectiveId, kr.objectiveTitle);
    });
    return Array.from(objectives.entries());
  };

  const filteredKeyResults = keyResults.filter(kr => {
    if (filterObjective !== 'all' && kr.objectiveId !== filterObjective) return false;
    return true;
  });

  const getStats = () => {
    return {
      total: keyResults.length,
      onTrack: keyResults.filter(kr => kr.status === 'on_track').length,
      atRisk: keyResults.filter(kr => kr.status === 'at_risk').length,
      behind: keyResults.filter(kr => kr.status === 'behind').length,
      achieved: keyResults.filter(kr => kr.status === 'achieved').length,
    };
  };

  const stats = getStats();

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
        searchPlaceholder="Search key results..."
        primaryAction={{
          label: 'Add Key Result',
          onClick: () => setShowUpdateModal(true),
        }}
        rightActions={
          <select
            value={filterObjective}
            onChange={(e) => setFilterObjective(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Objectives</option>
            {getUniqueObjectives().map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats.total} Key Results</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">{stats.onTrack} On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">{stats.atRisk} At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{stats.behind} Behind</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-600">{stats.achieved} Achieved</span>
          </div>
        </div>
      </div>

      {/* Key Results List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredKeyResults.map((kr) => {
            const progress = getProgress(kr);
            const StatusIcon = statusConfig[kr.status].icon;

            return (
              <div
                key={kr.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {kr.objectiveTitle}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[kr.status].color}`}>
                        <StatusIcon className={`h-3 w-3 ${statusConfig[kr.status].iconColor}`} />
                        {statusConfig[kr.status].label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{kr.title}</h3>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {kr.currentValue}
                        <span className="text-sm font-normal text-gray-500 ml-1">{kr.unit}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="text-lg text-gray-500">
                        {kr.targetValue}
                        <span className="text-sm ml-1">{kr.unit}</span>
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        kr.status === 'achieved' ? 'bg-blue-500' :
                        kr.status === 'on_track' ? 'bg-green-500' :
                        kr.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                        {kr.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{kr.owner}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Due {new Date(kr.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedKR(kr);
                      setShowUpdateModal(true);
                    }}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedKR ? 'Update Progress' : 'Add Key Result'}
            </h2>
            {selectedKR ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Key Result</p>
                  <p className="font-medium text-gray-900">{selectedKR.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Value ({selectedKR.unit})
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedKR.currentValue}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Target: {selectedKR.targetValue} {selectedKR.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    placeholder="Add a note about this update..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Increase revenue by 20%"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                    <input
                      type="number"
                      placeholder="100"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      placeholder="%"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {getUniqueObjectives().map(([id, title]) => (
                      <option key={id} value={id}>{title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedKR(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {selectedKR ? 'Save Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
