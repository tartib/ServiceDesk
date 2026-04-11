'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, XCircle, CheckCircle, Ban, Send,
  Star, MessageSquare, Clock, ExternalLink,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Person {
  _id: string;
  name?: string;
  email?: string;
  profile?: { firstName?: string; lastName?: string; avatar?: string };
}

interface IntakeDetail {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  stage: string;
  requestedBy?: Person;
  approvedBy?: Person;
  projectId?: { _id: string; name: string; key: string; status: string };
  businessJustification?: string;
  expectedBenefits?: string;
  estimatedBudget?: number;
  estimatedTimeline?: string;
  riskLevel?: string;
  strategicAlignment?: string;
  preferredMethodology?: string;
  suggestedTeam?: string;
  scores: { criterion: string; score: number; scoredBy?: Person; scoredAt: string }[];
  comments: { _id: string; author?: Person; content: string; createdAt: string }[];
  stageHistory: { stage: string; enteredAt: string; exitedAt?: string; action?: string; actionBy?: Person; comment?: string }[];
  reviewers: Person[];
  createdAt: string;
  updatedAt: string;
}

const STAGES_ORDER = ['draft', 'screening', 'business_case', 'prioritization', 'approved'];

// stageLabels will be derived from t() inside the component

const stageColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  screening: 'bg-blue-100 text-blue-700',
  business_case: 'bg-purple-100 text-purple-700',
  prioritization: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
};

function personName(p?: Person, fallback = 'Unknown'): string {
  if (!p) return fallback;
  if (p.profile?.firstName) return `${p.profile.firstName} ${p.profile.lastName || ''}`.trim();
  return p.name || p.email || fallback;
}

function personInitial(p?: Person): string {
  const name = personName(p);
  return (name[0] || '?').toUpperCase();
}

const SCORE_CRITERIA_KEYS = [
  { key: 'strategicValue', criterion: 'Strategic Value' },
  { key: 'roiPotential', criterion: 'ROI Potential' },
  { key: 'technicalFeasibility', criterion: 'Technical Feasibility' },
  { key: 'resourceAvailability', criterion: 'Resource Availability' },
  { key: 'riskLevel', criterion: 'Risk Level' },
];

export default function IntakeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const intakeId = params?.intakeId as string;

  const stageLabels: Record<string, string> = {
    draft: t('intake.stages.draft'),
    screening: t('intake.stages.screening'),
    business_case: t('intake.stages.business_case'),
    prioritization: t('intake.stages.prioritization'),
    approved: t('intake.stages.approved'),
    rejected: t('intake.stages.rejected'),
    cancelled: t('intake.stages.cancelled'),
  };

  const [intake, setIntake] = useState<IntakeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [showActionModal, setShowActionModal] = useState<'advance' | 'reject' | 'approve' | null>(null);
  const [projectKey, setProjectKey] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchIntake = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    try {
      const res = await fetch(`${API_URL}/pm/intake/${intakeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setIntake(data.data.intake);
    } catch (error) {
      console.error('Failed to fetch intake:', error);
    } finally {
      setIsLoading(false);
    }
  }, [intakeId, router]);

  useEffect(() => { fetchIntake(); }, [fetchIntake]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/pm/intake/${intakeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: comment }),
      });
      setComment('');
      fetchIntake();
    } catch {
      toast.error(t('intake.detail.failedComment'));
    }
  };

  const handleScore = async (criterion: string, score: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/pm/intake/${intakeId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ criterion, score }),
      });
      fetchIntake();
    } catch {
      toast.error(t('intake.detail.failedScore'));
    }
  };

  const handleAction = async (action: 'advance' | 'reject' | 'cancel' | 'approve') => {
    const token = getToken();
    if (!token) return;

    setIsActioning(true);
    try {
      const endpoint = action === 'cancel' ? 'cancel' : action === 'reject' ? 'reject' : action === 'approve' ? 'approve' : 'advance';
      const body: Record<string, unknown> = {};
      if (actionComment) body.comment = actionComment;
      if (action === 'approve' && projectKey) body.projectKey = projectKey;

      const res = await fetch(`${API_URL}/pm/intake/${intakeId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('intake.detail.actionFailed'));
      } else {
        toast.success(data.message || t('intake.detail.actionFailed'));
        setShowActionModal(null);
        setActionComment('');
        fetchIntake();
      }
    } catch {
      toast.error(t('intake.detail.actionFailed'));
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!intake) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>{t('intake.detail.notFound')}</p>
          <button onClick={() => router.push('/projects/intake')} className="mt-2 text-blue-600 hover:underline text-sm">
            {t('intake.detail.backToIntake')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStageIdx = STAGES_ORDER.indexOf(intake.stage);
  const isFinal = ['approved', 'rejected', 'cancelled'].includes(intake.stage);
  const canAdvance = !isFinal && intake.stage !== 'approved';
  const canReject = !isFinal;
  const canApprove = intake.stage === 'prioritization';

  const avgScore = intake.scores.length > 0
    ? (intake.scores.reduce((sum, s) => sum + s.score, 0) / intake.scores.length).toFixed(1)
    : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push('/projects/intake')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColors[intake.stage] || 'bg-gray-100 text-gray-600'}`}>
              {stageLabels[intake.stage] || intake.stage}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
              intake.priority === 'critical' ? 'bg-red-100 text-red-700' :
              intake.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              intake.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {t(`intake.priorities.${intake.priority}`)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{intake.title}</h1>
          <p className="text-sm text-gray-500">
            {t('intake.detail.requestedBy')} <strong>{personName(intake.requestedBy, t('intake.detail.unknown'))}</strong> {t('intake.detail.on')} {new Date(intake.createdAt).toLocaleDateString()}
          </p>

          {/* Stage Progress Bar */}
          <div className="flex items-center gap-1 mt-4">
            {STAGES_ORDER.map((stage, idx) => {
              const isComplete = currentStageIdx > idx || intake.stage === 'approved';
              const isCurrent = intake.stage === stage;
              const isRejected = intake.stage === 'rejected';
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-full h-2 rounded-full ${
                        isComplete ? 'bg-green-500' :
                        isCurrent ? (isRejected ? 'bg-red-500' : 'bg-blue-500') :
                        'bg-gray-200'
                      }`}
                    />
                    <span className={`text-[10px] mt-1 ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                      {stageLabels[stage]}
                    </span>
                  </div>
                  {idx < STAGES_ORDER.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300 mx-0.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Approved — link to project */}
              {intake.stage === 'approved' && intake.projectId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">{t('intake.detail.projectCreated')}</p>
                    <p className="text-xs text-green-600 mt-0.5">{intake.projectId.key} — {intake.projectId.name}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/projects/${intake.projectId!._id}/board`)}
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium"
                  >
                    {t('intake.detail.openProject')} <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('intake.detail.description')}</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{intake.description}</p>
              </div>

              {/* Business Case */}
              {(intake.businessJustification || intake.expectedBenefits || intake.strategicAlignment) && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('intake.detail.businessCase')}</h2>
                  <div className="space-y-4">
                    {intake.businessJustification && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">{t('intake.detail.justification')}</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{intake.businessJustification}</p>
                      </div>
                    )}
                    {intake.expectedBenefits && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">{t('intake.detail.expectedBenefits')}</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{intake.expectedBenefits}</p>
                      </div>
                    )}
                    {intake.strategicAlignment && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">{t('intake.detail.strategicAlignment')}</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{intake.strategicAlignment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scoring (visible in prioritization+ stages) */}
              {['prioritization', 'approved'].includes(intake.stage) && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900">{t('intake.detail.scoring')}</h2>
                    {avgScore && (
                      <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {t('intake.detail.avgLabel')}: {avgScore}/5
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {SCORE_CRITERIA_KEYS.map(({ key, criterion }) => {
                      const existingScore = intake.scores.find((s) => s.criterion === criterion);
                      return (
                        <div key={criterion} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{t(`intake.detail.scoreCriteria.${key}`)}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                onClick={() => intake.stage === 'prioritization' && handleScore(criterion, val)}
                                disabled={intake.stage !== 'prioritization'}
                                className={`p-0.5 transition-colors ${
                                  existingScore && val <= existingScore.score
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-300'
                                } ${intake.stage !== 'prioritization' ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <Star className="h-4 w-4" fill={existingScore && val <= existingScore.score ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('intake.detail.comments')} ({intake.comments.length})
                </h2>

                <div className="space-y-3 mb-4">
                  {intake.comments.map((c, idx) => (
                    <div key={c._id || idx} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-medium shrink-0">
                        {personInitial(c.author)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{personName(c.author)}</span>
                          <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {intake.comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">{t('intake.detail.noComments')}</p>
                  )}
                </div>

                {!isFinal && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('intake.detail.addComment')}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Actions */}
              {!isFinal && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('intake.detail.actions')}</h3>
                  {canAdvance && (
                    <button
                      onClick={() => setShowActionModal('advance')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {t('intake.detail.advanceStage')}
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={() => setShowActionModal('approve')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t('intake.detail.approveCreate')}
                    </button>
                  )}
                  {canReject && (
                    <button
                      onClick={() => setShowActionModal('reject')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      {t('intake.detail.reject')}
                    </button>
                  )}
                  {['draft', 'screening'].includes(intake.stage) && (
                    <button
                      onClick={() => handleAction('cancel')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 rounded-lg hover:bg-gray-100 text-sm"
                    >
                      <Ban className="h-4 w-4" />
                      {t('intake.detail.cancelRequest')}
                    </button>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('intake.detail.details')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('intake.detail.category')}</span>
                    <span className="text-gray-900">{t(`intake.categories.${intake.category}`)}</span>
                  </div>
                  {intake.preferredMethodology && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('intake.detail.methodology')}</span>
                      <span className="text-gray-900">{t(`intake.methodologies.${intake.preferredMethodology}`)}</span>
                    </div>
                  )}
                  {intake.estimatedBudget !== undefined && intake.estimatedBudget !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('intake.detail.budget')}</span>
                      <span className="text-gray-900">${intake.estimatedBudget.toLocaleString()}</span>
                    </div>
                  )}
                  {intake.estimatedTimeline && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('intake.detail.timeline')}</span>
                      <span className="text-gray-900">{intake.estimatedTimeline}</span>
                    </div>
                  )}
                  {intake.riskLevel && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('intake.detail.risk')}</span>
                      <span className={`capitalize font-medium ${
                        intake.riskLevel === 'high' ? 'text-red-600' :
                        intake.riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {t(`intake.priorities.${intake.riskLevel}`)}
                      </span>
                    </div>
                  )}
                  {avgScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('intake.detail.avgScore')}</span>
                      <span className="text-gray-900 font-medium">{avgScore}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('intake.detail.timelineSection')}</h3>
                <div className="space-y-3">
                  {intake.stageHistory.map((h, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          h.action === 'rejected' ? 'bg-red-500' :
                          h.action === 'approved' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        {idx < intake.stageHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-gray-900">
                          {stageLabels[h.stage] || h.stage}
                          {h.action && <span className="text-gray-400 font-normal"> — {h.action}</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(h.enteredAt).toLocaleString()}
                        </p>
                        {h.actionBy && (
                          <p className="text-[10px] text-gray-400">{t('intake.detail.by')} {personName(h.actionBy, t('intake.detail.unknown'))}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowActionModal(null)}>
            <div className="bg-white rounded-xl shadow-xl w-[440px] max-w-[90vw] p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {showActionModal === 'advance' ? t('intake.detail.modal.advanceTitle') :
                 showActionModal === 'reject' ? t('intake.detail.modal.rejectTitle') :
                 t('intake.detail.modal.approveTitle')}
              </h2>

              {showActionModal === 'approve' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.detail.modal.projectKey')}</label>
                  <input
                    type="text"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                    placeholder={t('intake.detail.modal.projectKeyPlaceholder')}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {showActionModal === 'reject' ? t('intake.detail.modal.commentRequired') : t('intake.detail.modal.commentOptional')}
                </label>
                <textarea
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={t('intake.detail.modal.commentPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowActionModal(null); setActionComment(''); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t('intake.detail.modal.cancel')}
                </button>
                <button
                  onClick={() => handleAction(showActionModal)}
                  disabled={isActioning || (showActionModal === 'reject' && !actionComment.trim())}
                  className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 font-medium ${
                    showActionModal === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    showActionModal === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isActioning ? t('intake.detail.modal.processing') :
                   showActionModal === 'advance' ? t('intake.detail.modal.advance') :
                   showActionModal === 'reject' ? t('intake.detail.reject') : t('intake.detail.modal.approve')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
