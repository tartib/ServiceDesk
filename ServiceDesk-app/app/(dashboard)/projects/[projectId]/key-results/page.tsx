'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useMemo } from 'react';

interface FlatKeyResult {
  id: string;
  title: string;
  objectiveId: string;
  objectiveTitle: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  owner?: string;
  status: 'on_track' | 'at_risk' | 'behind';
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const statusConfig = {
  on_track: { label: 'On Track', color: 'bg-green-100 text-green-700', icon: TrendingUp, iconColor: 'text-green-500' },
  at_risk: { label: 'At Risk', color: 'bg-yellow-100 text-yellow-700', icon: Minus, iconColor: 'text-yellow-500' },
  behind: { label: 'Behind', color: 'bg-red-100 text-red-700', icon: TrendingDown, iconColor: 'text-red-500' },
};

export default function KeyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology, config, isLoading: methodLoading, updateKeyResult } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedKR, setSelectedKR] = useState<FlatKeyResult | null>(null);
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [updateValue, setUpdateValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const keyResults: FlatKeyResult[] = useMemo(() => {
    const objectives = config?.okr?.objectives || [];
    const flat: FlatKeyResult[] = [];
    objectives.forEach(obj => {
      (obj.keyResults || []).forEach(kr => {
        flat.push({
          id: kr.id,
          title: kr.title,
          objectiveId: obj.id,
          objectiveTitle: obj.title,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue,
          unit: kr.unit,
          owner: kr.owner || obj.owner,
          status: kr.status || 'on_track',
        });
      });
    });
    return flat;
  }, [config]);

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

  const getProgress = (kr: FlatKeyResult) => {
    if (kr.targetValue === 0) return 100;
    const progress = (kr.currentValue / kr.targetValue) * 100;
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
    };
  };

  const handleUpdateProgress = async () => {
    if (!selectedKR || !updateValue) return;
    setSubmitting(true);
    try {
      const newValue = Number(updateValue);
      const progress = selectedKR.targetValue > 0 ? (newValue / selectedKR.targetValue) * 100 : 0;
      let status: 'on_track' | 'at_risk' | 'behind' = 'on_track';
      if (progress < 40) status = 'behind';
      else if (progress < 70) status = 'at_risk';

      await updateKeyResult(selectedKR.objectiveId, selectedKR.id, {
        currentValue: newValue,
        status,
      });
      setShowUpdateModal(false);
      setSelectedKR(null);
      setUpdateValue('');
    } catch (err) {
      console.error('Failed to update key result:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const stats = getStats();

  if (isLoading || methodLoading) {
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
                    {kr.owner && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                          {kr.owner.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{kr.owner}</span>
                      </div>
                    )}
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
      {showUpdateModal && selectedKR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Progress</h2>
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
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder={String(selectedKR.currentValue)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Target: {selectedKR.targetValue} {selectedKR.unit}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedKR(null);
                  setUpdateValue('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={submitting || !updateValue}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {keyResults.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No key results yet</h3>
          <p className="text-sm text-gray-500">Add key results to your objectives first</p>
        </div>
      )}
    </div>
  );
}
