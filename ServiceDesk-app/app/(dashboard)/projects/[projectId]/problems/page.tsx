'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Search,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  Link2,
  MoreHorizontal,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useProblems, useProblemStats, useCreateProblem } from '@/hooks/useProblems';
import { useCategories } from '@/hooks/useCategories';
import { IProblem, ProblemStatus, Priority, Impact } from '@/types/itsm';

interface Project {
  _id: string;
  name: string;
  key: string;
}

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  logged: { label: 'Logged', color: 'bg-blue-100 text-blue-700' },
  rca_in_progress: { label: 'RCA In Progress', color: 'bg-purple-100 text-purple-700' },
  known_error: { label: 'Known Error', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-500' },
};

export default function ProblemsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<IProblem | null>(null);
  const [showNewProblemModal, setShowNewProblemModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    impact: Impact.MEDIUM,
    category_id: '',
  });
  const [formError, setFormError] = useState('');

  // API hooks
  const statusFilter = filterStatus !== 'all' ? [filterStatus as ProblemStatus] : undefined;
  const { data: problemsData } = useProblems({ status: statusFilter });
  const { data: stats } = useProblemStats();
  const createProblem = useCreateProblem();
  const { data: categories = [] } = useCategories(true);

  const problems: IProblem[] = useMemo(() => problemsData?.data || [], [problemsData]);

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
      setProjectLoading(false);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateProblem = async () => {
    setFormError('');
    if (!newForm.title.trim() || newForm.title.trim().length < 3) {
      setFormError('Title must be at least 3 characters');
      return;
    }
    if (!newForm.description.trim() || newForm.description.trim().length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }
    try {
      await createProblem.mutateAsync({
        title: newForm.title,
        description: newForm.description,
        priority: newForm.priority,
        impact: newForm.impact,
        category_id: newForm.category_id || 'general',
        site_id: 'default',
      });
      setShowNewProblemModal(false);
      setNewForm({ title: '', description: '', priority: Priority.MEDIUM, impact: Impact.MEDIUM, category_id: '' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to create problem');
    }
  };

  if (projectLoading) {
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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search problems..."
        primaryAction={{
          label: 'New Problem',
          onClick: () => setShowNewProblemModal(true),
        }}
        rightActions={
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="logged">Logged</option>
            <option value="rca_in_progress">RCA In Progress</option>
            <option value="known_error">Known Error</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats?.total || problems.length} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-600">{stats?.logged || 0} Logged</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">{stats?.knownErrors || 0} Known Errors</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{stats?.resolved || 0} Resolved</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Problems List */}
        <div className={`${selectedProblem ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          {problems.length === 0 ? (
            <div className="text-center py-12">
              <AlertOctagon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No problems found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {problems.map((problem) => {
                const pCfg = priorityConfig[problem.priority] || priorityConfig.medium;
                const sCfg = statusConfig[problem.status] || statusConfig.logged;

                return (
                  <div
                    key={problem._id}
                    onClick={() => setSelectedProblem(problem)}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedProblem?._id === problem._id 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${
                        problem.priority === 'critical' ? 'bg-red-100' :
                        problem.priority === 'high' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        <AlertOctagon className={`h-5 w-5 ${
                          problem.priority === 'critical' ? 'text-red-600' :
                          problem.priority === 'high' ? 'text-orange-600' :
                          'text-gray-500'
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{problem.problem_id}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${pCfg.color}`}>
                            {pCfg.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sCfg.color}`}>
                            {sCfg.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{problem.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{problem.category_id}</span>
                          <span className="flex items-center gap-1">
                            <Link2 className="h-3.5 w-3.5" />
                            {problem.linked_incidents_count ?? problem.linked_incidents?.length ?? 0} incidents
                          </span>
                        </div>
                      </div>

                      {/* Owner */}
                      {problem.owner?.name && (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                            {problem.owner.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        </div>
                      )}

                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Problem Detail Panel */}
        {selectedProblem && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{selectedProblem.problem_id}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(priorityConfig[selectedProblem.priority] || priorityConfig.medium).color}`}>
                      {(priorityConfig[selectedProblem.priority] || priorityConfig.medium).label}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProblem.title}</h2>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${(statusConfig[selectedProblem.status] || statusConfig.logged).color}`}>
                  {(statusConfig[selectedProblem.status] || statusConfig.logged).label}
                </span>
              </div>

              {/* Description */}
              {selectedProblem.description && (
                <p className="text-gray-600 mb-6">{selectedProblem.description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedProblem.category_id}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedProblem.owner?.name || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedProblem.created_at)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Related Incidents</p>
                  <p className="text-sm font-medium text-blue-600 mt-1">{selectedProblem.linked_incidents_count ?? selectedProblem.linked_incidents?.length ?? 0} incidents</p>
                </div>
              </div>

              {/* Root Cause */}
              {selectedProblem.root_cause && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Root Cause</h3>
                  </div>
                  <p className="text-sm text-indigo-700">{selectedProblem.root_cause}</p>
                </div>
              )}

              {/* Workaround */}
              {selectedProblem.workaround && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">Workaround</h3>
                  </div>
                  <p className="text-sm text-yellow-700">{selectedProblem.workaround}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {selectedProblem.status === ProblemStatus.LOGGED && (
                  <button className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
                    Start Investigation
                  </button>
                )}
                {selectedProblem.status === ProblemStatus.RCA_IN_PROGRESS && (
                  <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Document Root Cause
                  </button>
                )}
                {selectedProblem.status === ProblemStatus.KNOWN_ERROR && (
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Mark Resolved
                  </button>
                )}
                <button className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Problem Modal */}
      {showNewProblemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Problem</h2>
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => { setNewForm({ ...newForm, title: e.target.value }); setFormError(''); }}
                  placeholder="Brief description of the problem"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => { setNewForm({ ...newForm, description: e.target.value }); setFormError(''); }}
                  placeholder="Detailed description (at least 10 characters)..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as Priority })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={Priority.CRITICAL}>Critical</option>
                    <option value={Priority.HIGH}>High</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.LOW}>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                  <select
                    value={newForm.impact}
                    onChange={(e) => setNewForm({ ...newForm, impact: e.target.value as Impact })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={Impact.HIGH}>High</option>
                    <option value={Impact.MEDIUM}>Medium</option>
                    <option value={Impact.LOW}>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newForm.category_id}
                  onChange={(e) => setNewForm({ ...newForm, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowNewProblemModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProblem}
                  disabled={createProblem.isPending}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {createProblem.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    'Create Problem'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
