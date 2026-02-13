'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useChanges, useChangeStats, useCreateChange } from '@/hooks/useChanges';
import { IChange, ChangeStatus, ChangeType, Priority, Impact, RiskLevel } from '@/types/itsm';

interface Project {
  _id: string;
  name: string;
  key: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  standard: { label: 'Standard', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  cab_review: { label: 'CAB Review', color: 'bg-purple-100 text-purple-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  scheduled: { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-700' },
  implementing: { label: 'Implementing', color: 'bg-teal-100 text-teal-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

const riskConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Risk', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High Risk', color: 'bg-red-100 text-red-700' },
};

const defaultFormState = {
  type: ChangeType.NORMAL,
  title: '',
  description: '',
  priority: Priority.MEDIUM,
  impact: Impact.MEDIUM,
  risk: RiskLevel.MEDIUM,
  risk_assessment: '',
  reason_for_change: '',
  implementation_plan: '',
  rollback_plan: '',
  planned_start: '',
  planned_end: '',
  affected_services_text: '',
};

export default function ChangesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<IChange | null>(null);
  const [showNewChangeModal, setShowNewChangeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [newForm, setNewForm] = useState(defaultFormState);
  const [formError, setFormError] = useState('');

  // API hooks
  const statusFilter = filterStatus !== 'all' ? [filterStatus as ChangeStatus] : undefined;
  const { data: changesData } = useChanges({ status: statusFilter });
  const { data: stats } = useChangeStats();
  const createChange = useCreateChange();

  const changes: IChange[] = useMemo(() => changesData?.data || [], [changesData]);

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

  const handleCreateChange = async () => {
    setFormError('');
    if (!newForm.title.trim() || newForm.title.trim().length < 3) {
      setFormError('Title must be at least 3 characters');
      return;
    }
    if (!newForm.description.trim() || newForm.description.trim().length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }
    if (!newForm.reason_for_change.trim()) {
      setFormError('Reason for change is required');
      return;
    }
    if (!newForm.implementation_plan.trim()) {
      setFormError('Implementation plan is required');
      return;
    }
    if (!newForm.rollback_plan.trim()) {
      setFormError('Rollback plan is required');
      return;
    }
    if (!newForm.planned_start || !newForm.planned_end) {
      setFormError('Planned start and end dates are required');
      return;
    }
    if (new Date(newForm.planned_end) <= new Date(newForm.planned_start)) {
      setFormError('Planned end date must be after start date');
      return;
    }

    const affected_services = newForm.affected_services_text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      await createChange.mutateAsync({
        type: newForm.type,
        title: newForm.title,
        description: newForm.description,
        priority: newForm.priority,
        impact: newForm.impact,
        risk: newForm.risk,
        risk_assessment: newForm.risk_assessment || `${newForm.risk} risk change`,
        reason_for_change: newForm.reason_for_change,
        implementation_plan: newForm.implementation_plan,
        rollback_plan: newForm.rollback_plan,
        schedule: {
          planned_start: new Date(newForm.planned_start).toISOString(),
          planned_end: new Date(newForm.planned_end).toISOString(),
        },
        affected_services: affected_services.length > 0 ? affected_services : ['General'],
        site_id: 'default',
      });
      setShowNewChangeModal(false);
      setNewForm(defaultFormState);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to create change request');
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
        searchPlaceholder="Search changes..."
        primaryAction={{
          label: 'New Change Request',
          onClick: () => setShowNewChangeModal(true),
        }}
        rightActions={
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value={ChangeStatus.DRAFT}>Draft</option>
            <option value={ChangeStatus.SUBMITTED}>Submitted</option>
            <option value={ChangeStatus.CAB_REVIEW}>CAB Review</option>
            <option value={ChangeStatus.APPROVED}>Approved</option>
            <option value={ChangeStatus.REJECTED}>Rejected</option>
            <option value={ChangeStatus.SCHEDULED}>Scheduled</option>
            <option value={ChangeStatus.IMPLEMENTING}>Implementing</option>
            <option value={ChangeStatus.COMPLETED}>Completed</option>
            <option value={ChangeStatus.FAILED}>Failed</option>
            <option value={ChangeStatus.CANCELLED}>Cancelled</option>
          </select>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats?.total || changes.length} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">{stats?.pendingApproval || 0} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{stats?.approved || 0} Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-gray-600">{stats?.scheduled || 0} Scheduled</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Changes List */}
        <div className={`${selectedChange ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          {changes.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No change requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => {
                const tCfg = typeConfig[change.type] || typeConfig.normal;
                const sCfg = statusConfig[change.status] || statusConfig.draft;
                const rCfg = riskConfig[change.risk] || riskConfig.medium;

                return (
                  <div
                    key={change._id}
                    onClick={() => setSelectedChange(change)}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedChange?._id === change._id 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${
                        change.type === 'emergency' ? 'bg-red-100' :
                        change.type === 'normal' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <RefreshCw className={`h-5 w-5 ${
                          change.type === 'emergency' ? 'text-red-600' :
                          change.type === 'normal' ? 'text-blue-600' :
                          'text-gray-500'
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{change.change_id}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tCfg.color}`}>
                            {tCfg.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sCfg.color}`}>
                            {sCfg.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{change.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {change.schedule?.planned_start && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(change.schedule.planned_start)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Risk & CAB */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${rCfg.color}`}>
                          {rCfg.label}
                        </span>
                        {change.cab_required && (
                          <span className="flex items-center gap-1 text-xs text-purple-600">
                            <Users className="h-3.5 w-3.5" />
                            CAB Required
                          </span>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Change Detail Panel */}
        {selectedChange && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{selectedChange.change_id}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(typeConfig[selectedChange.type] || typeConfig.normal).color}`}>
                      {(typeConfig[selectedChange.type] || typeConfig.normal).label}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedChange.title}</h2>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${(statusConfig[selectedChange.status] || statusConfig.draft).color}`}>
                  {(statusConfig[selectedChange.status] || statusConfig.draft).label}
                </span>
              </div>

              {/* Description */}
              {selectedChange.description && (
                <p className="text-gray-600 mb-6">{selectedChange.description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Level</p>
                  <p className={`text-sm font-medium mt-1 ${
                    selectedChange.risk === 'high' ? 'text-red-700' :
                    selectedChange.risk === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {(riskConfig[selectedChange.risk] || riskConfig.medium).label}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Requested By</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedChange.requested_by?.name || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedChange.owner?.name || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedChange.created_at)}</p>
                </div>
                {selectedChange.schedule?.planned_start && (
                  <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Scheduled</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(selectedChange.schedule.planned_start)} — {selectedChange.schedule?.planned_end ? formatDate(selectedChange.schedule.planned_end) : 'TBD'}
                    </p>
                  </div>
                )}
              </div>

              {/* Affected Services */}
              {selectedChange.affected_services?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Affected Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedChange.affected_services.map((service, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason for Change */}
              {selectedChange.reason_for_change && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Reason for Change</h3>
                  </div>
                  <p className="text-sm text-blue-700">{selectedChange.reason_for_change}</p>
                </div>
              )}

              {/* CAB Section */}
              {selectedChange.cab_required && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">CAB Approval Required</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    This change requires Change Advisory Board approval before implementation.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {selectedChange.status === ChangeStatus.SUBMITTED && (
                  <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Start Review
                  </button>
                )}
                {selectedChange.status === ChangeStatus.APPROVED && (
                  <button className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors">
                    Start Implementation
                  </button>
                )}
                {selectedChange.status === ChangeStatus.IMPLEMENTING && (
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Mark Completed
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

      {/* New Change Modal */}
      {showNewChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Change Request</h2>
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
                  placeholder="Brief description of the change"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => { setNewForm({ ...newForm, description: e.target.value }); setFormError(''); }}
                  placeholder="Detailed description of the change (at least 10 characters)..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newForm.reason_for_change}
                  onChange={(e) => { setNewForm({ ...newForm, reason_for_change: e.target.value }); setFormError(''); }}
                  placeholder="Why is this change needed?"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newForm.type}
                    onChange={(e) => setNewForm({ ...newForm, type: e.target.value as ChangeType })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ChangeType.STANDARD}>Standard</option>
                    <option value={ChangeType.NORMAL}>Normal</option>
                    <option value={ChangeType.EMERGENCY}>Emergency</option>
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select
                    value={newForm.risk}
                    onChange={(e) => setNewForm({ ...newForm, risk: e.target.value as RiskLevel })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={RiskLevel.LOW}>Low</option>
                    <option value={RiskLevel.MEDIUM}>Medium</option>
                    <option value={RiskLevel.HIGH}>High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Plan <span className="text-red-500">*</span></label>
                <textarea
                  value={newForm.implementation_plan}
                  onChange={(e) => { setNewForm({ ...newForm, implementation_plan: e.target.value }); setFormError(''); }}
                  placeholder="Steps to implement this change..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rollback Plan <span className="text-red-500">*</span></label>
                <textarea
                  value={newForm.rollback_plan}
                  onChange={(e) => { setNewForm({ ...newForm, rollback_plan: e.target.value }); setFormError(''); }}
                  placeholder="Steps to rollback if the change fails..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={newForm.planned_start}
                    onChange={(e) => { setNewForm({ ...newForm, planned_start: e.target.value }); setFormError(''); }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned End <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={newForm.planned_end}
                    onChange={(e) => { setNewForm({ ...newForm, planned_end: e.target.value }); setFormError(''); }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affected Services</label>
                <input
                  type="text"
                  value={newForm.affected_services_text}
                  onChange={(e) => setNewForm({ ...newForm, affected_services_text: e.target.value })}
                  placeholder="Comma-separated list (e.g. Web App, API, Database)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowNewChangeModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChange}
                  disabled={createChange.isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {createChange.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Request'
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
