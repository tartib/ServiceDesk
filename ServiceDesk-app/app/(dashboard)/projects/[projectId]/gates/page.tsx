'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface GateReview {
  id: string;
  name: string;
  phaseId: string;
  phaseName: string;
  criteria: GateCriteria[];
  approvers: Approver[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  requestedAt?: string;
  completedAt?: string;
  comments: GateComment[];
}

interface GateCriteria {
  id: string;
  name: string;
  description?: string;
  status: 'not_checked' | 'passed' | 'failed';
  checkedBy?: string;
  checkedAt?: string;
}

interface Approver {
  id: string;
  name: string;
  role: string;
  decision?: 'approved' | 'rejected' | 'pending';
  decidedAt?: string;
  comment?: string;
}

interface GateComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultGates: GateReview[] = [
  {
    id: 'g1',
    name: 'Requirements Gate',
    phaseId: 'requirements',
    phaseName: 'Requirements',
    status: 'approved',
    requestedAt: '2024-01-10',
    completedAt: '2024-01-14',
    criteria: [
      { id: 'c1', name: 'Requirements documented', status: 'passed', checkedBy: 'John Doe' },
      { id: 'c2', name: 'Stakeholder sign-off obtained', status: 'passed', checkedBy: 'Jane Smith' },
      { id: 'c3', name: 'Scope baseline approved', status: 'passed', checkedBy: 'John Doe' },
    ],
    approvers: [
      { id: 'a1', name: 'Sarah Johnson', role: 'Project Sponsor', decision: 'approved', decidedAt: '2024-01-14' },
      { id: 'a2', name: 'Mike Chen', role: 'Technical Lead', decision: 'approved', decidedAt: '2024-01-13' },
    ],
    comments: [],
  },
  {
    id: 'g2',
    name: 'Design Gate',
    phaseId: 'design',
    phaseName: 'Design',
    status: 'in_review',
    requestedAt: '2024-01-28',
    criteria: [
      { id: 'c4', name: 'Architecture document complete', status: 'passed', checkedBy: 'Mike Chen' },
      { id: 'c5', name: 'UI/UX designs approved', status: 'passed', checkedBy: 'Design Team' },
      { id: 'c6', name: 'Technical feasibility confirmed', status: 'not_checked' },
      { id: 'c7', name: 'Security review completed', status: 'not_checked' },
    ],
    approvers: [
      { id: 'a3', name: 'Sarah Johnson', role: 'Project Sponsor', decision: 'pending' },
      { id: 'a4', name: 'Mike Chen', role: 'Technical Lead', decision: 'approved', decidedAt: '2024-01-29' },
      { id: 'a5', name: 'Security Team', role: 'Security', decision: 'pending' },
    ],
    comments: [
      { id: 'cm1', author: 'Mike Chen', content: 'Architecture looks solid. Approved from technical perspective.', createdAt: '2024-01-29' },
    ],
  },
  {
    id: 'g3',
    name: 'Development Gate',
    phaseId: 'development',
    phaseName: 'Development',
    status: 'pending',
    criteria: [
      { id: 'c8', name: 'Code complete', status: 'not_checked' },
      { id: 'c9', name: 'Unit tests passing', status: 'not_checked' },
      { id: 'c10', name: 'Code review completed', status: 'not_checked' },
      { id: 'c11', name: 'Documentation updated', status: 'not_checked' },
    ],
    approvers: [
      { id: 'a6', name: 'Mike Chen', role: 'Technical Lead', decision: 'pending' },
      { id: 'a7', name: 'QA Lead', role: 'Quality Assurance', decision: 'pending' },
    ],
    comments: [],
  },
];

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: Users },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function GatesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [gates, setGates] = useState<GateReview[]>(defaultGates);
  const [selectedGate, setSelectedGate] = useState<GateReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getApprovalProgress = (gate: GateReview) => {
    const approved = gate.approvers.filter(a => a.decision === 'approved').length;
    return { approved, total: gate.approvers.length };
  };

  const getCriteriaProgress = (gate: GateReview) => {
    const passed = gate.criteria.filter(c => c.status === 'passed').length;
    return { passed, total: gate.criteria.length };
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
        searchPlaceholder="Search gate reviews..."
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Gates List */}
        <div className={`${selectedGate ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          <div className="space-y-3">
            {gates.map((gate) => {
              const StatusIcon = statusConfig[gate.status].icon;
              const approvalProgress = getApprovalProgress(gate);
              const criteriaProgress = getCriteriaProgress(gate);

              return (
                <div
                  key={gate.id}
                  onClick={() => setSelectedGate(gate)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedGate?.id === gate.id 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      gate.status === 'approved' ? 'bg-green-100' :
                      gate.status === 'rejected' ? 'bg-red-100' :
                      gate.status === 'in_review' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <Shield className={`h-5 w-5 ${
                        gate.status === 'approved' ? 'text-green-600' :
                        gate.status === 'rejected' ? 'text-red-600' :
                        gate.status === 'in_review' ? 'text-blue-600' :
                        'text-gray-500'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{gate.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[gate.status].color}`}>
                          {statusConfig[gate.status].label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">Phase: {gate.phaseName}</p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Criteria: {criteriaProgress.passed}/{criteriaProgress.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Approvals: {approvalProgress.approved}/{approvalProgress.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Detail Panel */}
        {selectedGate && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedGate.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Phase: {selectedGate.phaseName}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedGate.status].color}`}>
                  {statusConfig[selectedGate.status].label}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                {selectedGate.requestedAt && (
                  <span>Requested: {formatDate(selectedGate.requestedAt)}</span>
                )}
                {selectedGate.completedAt && (
                  <span>Completed: {formatDate(selectedGate.completedAt)}</span>
                )}
              </div>

              {/* Criteria Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Gate Criteria
                </h3>
                <div className="space-y-2">
                  {selectedGate.criteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        criterion.status === 'passed' ? 'bg-green-50 border-green-200' :
                        criterion.status === 'failed' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {criterion.status === 'passed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : criterion.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{criterion.name}</p>
                        {criterion.checkedBy && (
                          <p className="text-xs text-gray-500">Checked by {criterion.checkedBy}</p>
                        )}
                      </div>
                      {criterion.status === 'not_checked' && (
                        <button className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                          Verify
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Approvers Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Approvers
                </h3>
                <div className="space-y-2">
                  {selectedGate.approvers.map((approver) => (
                    <div
                      key={approver.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                        {approver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{approver.name}</p>
                        <p className="text-xs text-gray-500">{approver.role}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        approver.decision === 'approved' ? 'bg-green-100 text-green-700' :
                        approver.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {approver.decision === 'approved' ? 'Approved' :
                         approver.decision === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              {selectedGate.comments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </h3>
                  <div className="space-y-3">
                    {selectedGate.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedGate.status === 'in_review' && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Approve Gate
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                    Reject Gate
                  </button>
                </div>
              )}
              {selectedGate.status === 'pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Request Gate Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
