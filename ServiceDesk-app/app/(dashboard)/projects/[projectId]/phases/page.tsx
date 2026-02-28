'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Pause,
  Calendar,
  FileText,
  Users,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Phase {
  id: string;
  name: string;
  description?: string;
  order: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  deliverables: string[];
  progress: number;
  tasks: PhaseTask[];
}

interface PhaseTask {
  _id: string;
  key: string;
  title: string;
  status: { name: string; category: string };
  assignee?: { profile: { firstName: string; lastName: string } };
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPhase = (p: Record<string, any>): Phase => ({
  id: p._id,
  name: p.name,
  description: p.description,
  order: p.order,
  plannedStartDate: p.plannedStartDate,
  plannedEndDate: p.plannedEndDate,
  actualStartDate: p.actualStartDate,
  actualEndDate: p.actualEndDate,
  status: p.status || 'not_started',
  deliverables: p.deliverables || [],
  progress: p.progress || 0,
  tasks: [],
});

const statusConfig = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  on_hold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
};

export default function PhasesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPhaseModal, setShowNewPhaseModal] = useState(false);
  const [newPhase, setNewPhase] = useState({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' });

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchData = useCallback(async (token: string) => {
    try {
      const [projRes, phasesRes] = await Promise.all([
        fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pm/projects/${projectId}/phases`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const projData = await projRes.json();
      if (projData.success) setProject(projData.data.project);
      const phasesData = await phasesRes.json();
      if (phasesData.success) setPhases((phasesData.data.phases || []).map(mapPhase));
    } catch (error) {
      console.error('Failed to fetch phases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [projectId, router, fetchData]);

  const handleCreatePhase = async () => {
    if (!newPhase.name) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}/phases`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhase),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(token);
        setShowNewPhaseModal(false);
        setNewPhase({ name: '', description: '', plannedStartDate: '', plannedEndDate: '' });
      }
    } catch (error) { console.error('Failed to create phase:', error); }
  };

  const handleUpdatePhaseStatus = async (phaseId: string, status: Phase['status'], progress?: number) => {
    const token = getToken();
    if (!token) return;
    try {
      const body: Record<string, unknown> = { status };
      if (progress !== undefined) body.progress = progress;
      if (status === 'in_progress') body.actualStartDate = new Date().toISOString();
      if (status === 'completed') { body.actualEndDate = new Date().toISOString(); body.progress = 100; }
      const res = await fetch(`${API_URL}/pm/phases/${phaseId}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) fetchData(token);
    } catch (error) { console.error('Failed to update phase:', error); }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getOverallProgress = () => {
    const total = phases.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(total / phases.length);
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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'waterfall'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search phases..."
        primaryAction={{
          label: 'Add Phase',
          onClick: () => setShowNewPhaseModal(true),
        }}
      />

      {/* Progress Overview */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-gray-900">{getOverallProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getOverallProgress()}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {phases.filter(p => p.status === 'completed').length} Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {phases.filter(p => p.status === 'in_progress').length} In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {phases.filter(p => p.status === 'not_started').length} Not Started
          </span>
        </div>
      </div>

      {/* Phases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {phases.map((phase, index) => {
          const isExpanded = expandedPhases.has(phase.id);
          const isLast = index === phases.length - 1;
          const prevPhase = index > 0 ? phases[index - 1] : null;
          const canStart = !prevPhase || prevPhase.status === 'completed';

          return (
            <div
              key={phase.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Phase Header */}
              <div
                className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                {/* Expand/Collapse */}
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {/* Phase Number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  phase.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : phase.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {phase.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[phase.status].color}`}>
                      {statusConfig[phase.status].label}
                    </span>
                  </div>
                  {phase.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{phase.description}</p>
                  )}
                </div>

                {/* Progress */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">{phase.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          phase.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Phase Details (Expanded) */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Dates */}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Timeline</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(phase.plannedStartDate)} — {formatDate(phase.plannedEndDate)}
                        </p>
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Deliverables</p>
                        <p className="text-sm text-gray-900 mt-1">{phase.deliverables.length} items</p>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks</p>
                        <p className="text-sm text-gray-900 mt-1">{phase.tasks.length} tasks</p>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Deliverables</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                        >
                          {deliverable}
                        </span>
                      ))}
                      <button className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    {phase.status === 'not_started' && canStart && (
                      <button onClick={() => handleUpdatePhaseStatus(phase.id, 'in_progress')} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Start Phase
                      </button>
                    )}
                    {phase.status === 'in_progress' && (
                      <>
                        <button onClick={() => handleUpdatePhaseStatus(phase.id, 'completed', 100)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                          Complete Phase
                        </button>
                        <button onClick={() => handleUpdatePhaseStatus(phase.id, 'on_hold')} className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors">
                          Put On Hold
                        </button>
                      </>
                    )}
                    {phase.status === 'on_hold' && (
                      <button onClick={() => handleUpdatePhaseStatus(phase.id, 'in_progress')} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Resume Phase
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      View Tasks
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Request Gate Review
                    </button>
                  </div>
                </div>
              )}

              {/* Connection Line */}
              {!isLast && (
                <div className="flex justify-center -mb-3 relative z-10">
                  <div className="w-0.5 h-6 bg-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Phase Modal */}
      {showNewPhaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Phase</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name</label>
                <input
                  type="text"
                  value={newPhase.name}
                  onChange={(e) => setNewPhase(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., User Acceptance Testing"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPhase.description}
                  onChange={(e) => setNewPhase(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the phase objectives..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewPhaseModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button onClick={handleCreatePhase} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Phase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
