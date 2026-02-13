'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChange, useSubmitChangeForApproval, useAddCabApproval, useScheduleChange, useStartImplementation, useCompleteChange, useCancelChange } from '@/hooks/useChanges';
import { IChange, ChangeStatus, ChangeType, ApprovalStatus, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Send,
  Ban
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const getStatusColor = (status: ChangeStatus): string => {
  const colors: Record<ChangeStatus, string> = {
    [ChangeStatus.DRAFT]: 'bg-gray-100 text-gray-700',
    [ChangeStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
    [ChangeStatus.CAB_REVIEW]: 'bg-yellow-100 text-yellow-700',
    [ChangeStatus.APPROVED]: 'bg-green-100 text-green-700',
    [ChangeStatus.REJECTED]: 'bg-red-100 text-red-700',
    [ChangeStatus.SCHEDULED]: 'bg-purple-100 text-purple-700',
    [ChangeStatus.IMPLEMENTING]: 'bg-orange-100 text-orange-700',
    [ChangeStatus.COMPLETED]: 'bg-green-100 text-green-700',
    [ChangeStatus.FAILED]: 'bg-red-100 text-red-700',
    [ChangeStatus.CANCELLED]: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getTypeColor = (type: ChangeType): string => {
  const colors: Record<ChangeType, string> = {
    [ChangeType.NORMAL]: 'bg-blue-100 text-blue-700',
    [ChangeType.STANDARD]: 'bg-green-100 text-green-700',
    [ChangeType.EMERGENCY]: 'bg-red-100 text-red-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

export default function ChangeDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const changeId = params.id as string;
  
  const { data: change, isLoading, error } = useChange(changeId);
  const submitForApproval = useSubmitChangeForApproval();
  const addCabApproval = useAddCabApproval();
  const scheduleChange = useScheduleChange();
  const startImplementation = useStartImplementation();
  const completeChange = useCompleteChange();
  const cancelChange = useCancelChange();

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    planned_start: '',
    planned_end: '',
  });

  const handleSubmitForApproval = () => {
    if (!change) return;
    submitForApproval.mutate(change.change_id);
  };

  const handleCabApproval = (decision: ApprovalStatus) => {
    if (!change) return;
    addCabApproval.mutate({
      changeId: change.change_id,
      decision,
      comments: decision === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected',
    });
  };

  const handleSchedule = () => {
    if (!change || !scheduleData.planned_start || !scheduleData.planned_end) return;
    scheduleChange.mutate({
      changeId: change.change_id,
      schedule: {
        planned_start: new Date(scheduleData.planned_start).toISOString(),
        planned_end: new Date(scheduleData.planned_end).toISOString(),
      },
    }, {
      onSuccess: () => setShowScheduleForm(false),
    });
  };

  const handleStartImplementation = () => {
    if (!change) return;
    startImplementation.mutate(change.change_id);
  };

  const handleComplete = (success: boolean) => {
    if (!change) return;
    completeChange.mutate({
      changeId: change.change_id,
      success,
      notes: success ? 'Change completed successfully' : 'Change failed',
    });
  };

  const handleCancel = () => {
    if (!change) return;
    cancelChange.mutate({
      changeId: change.change_id,
      reason: 'Cancelled by user',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !change) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change not found</h2>
          <p className="text-gray-500 mt-2">The change request you are looking for does not exist.</p>
          <Link href="/changes" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Changes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const changeData = change as IChange;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {changeData.change_id}
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(changeData.type)}`}>
                  {changeData.type}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{changeData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(changeData.status)}`}>
              {changeData.status.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityColor(changeData.priority)}`}>
              {changeData.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {changeData.description}
              </p>
            </div>

            {/* Justification */}
            {changeData.reason_for_change && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reason for Change</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {changeData.reason_for_change}
                </p>
              </div>
            )}

            {/* Risk & Rollback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {changeData.risk_assessment && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Risk Assessment</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{changeData.risk_assessment}</p>
                </div>
              )}
              {changeData.rollback_plan && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Rollback Plan</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{changeData.rollback_plan}</p>
                </div>
              )}
            </div>

            {/* CAB Approval Status */}
            {changeData.approval && changeData.approval.members && changeData.approval.members.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CAB Approvals</h2>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Status: <span className="font-medium">{changeData.approval.cab_status}</span> ({changeData.approval.current_approvers}/{changeData.approval.required_approvers} approvers)
                </div>
                <div className="space-y-3">
                  {changeData.approval.members.map((member, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {member.decision === ApprovalStatus.APPROVED ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : member.decision === ApprovalStatus.REJECTED ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.decision === ApprovalStatus.APPROVED 
                          ? 'bg-green-100 text-green-700' 
                          : member.decision === ApprovalStatus.REJECTED
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.decision || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Schedule</h3>
              {changeData.schedule ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Planned Start</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(changeData.schedule.planned_start).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Planned End</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(changeData.schedule.planned_end).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not scheduled yet</p>
              )}
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Requested By</p>
                    <p className="font-medium text-gray-900 dark:text-white">{changeData.requested_by.name}</p>
                    <p className="text-sm text-gray-500">{changeData.requested_by.email}</p>
                  </div>
                </div>
                {changeData.owner && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-white">{changeData.owner.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(changeData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Actions</h3>
              <div className="space-y-2">
                {changeData.status === ChangeStatus.DRAFT && (
                  <>
                    <button
                      onClick={handleSubmitForApproval}
                      disabled={submitForApproval.isPending}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit for Approval
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelChange.isPending}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}

                {changeData.status === ChangeStatus.CAB_REVIEW && (
                  <>
                    <button
                      onClick={() => handleCabApproval(ApprovalStatus.APPROVED)}
                      disabled={addCabApproval.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleCabApproval(ApprovalStatus.REJECTED)}
                      disabled={addCabApproval.isPending}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}

                {changeData.status === ChangeStatus.APPROVED && (
                  <>
                    {!showScheduleForm ? (
                      <button
                        onClick={() => setShowScheduleForm(true)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="datetime-local"
                          value={scheduleData.planned_start}
                          onChange={(e) => setScheduleData({ ...scheduleData, planned_start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                          placeholder="Start"
                        />
                        <input
                          type="datetime-local"
                          value={scheduleData.planned_end}
                          onChange={(e) => setScheduleData({ ...scheduleData, planned_end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                          placeholder="End"
                        />
                        <button
                          onClick={handleSchedule}
                          disabled={scheduleChange.isPending}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Confirm Schedule
                        </button>
                      </div>
                    )}
                  </>
                )}

                {changeData.status === ChangeStatus.SCHEDULED && (
                  <button
                    onClick={handleStartImplementation}
                    disabled={startImplementation.isPending}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Implementation
                  </button>
                )}

                {changeData.status === ChangeStatus.IMPLEMENTING && (
                  <>
                    <button
                      onClick={() => handleComplete(true)}
                      disabled={completeChange.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Successfully
                    </button>
                    <button
                      onClick={() => handleComplete(false)}
                      disabled={completeChange.isPending}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Mark as Failed
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
