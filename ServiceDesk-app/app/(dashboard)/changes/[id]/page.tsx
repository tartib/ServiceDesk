'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChange, useSubmitChangeForApproval, useAddCabApproval, useScheduleChange, useStartImplementation, useCompleteChange, useCancelChange } from '@/hooks/useChanges';
import { useCreateCalendarEvent } from '@/hooks/useChangeCalendar';
import { IChange, ChangeStatus, ChangeType, ApprovalStatus, getPriorityColor, ChangeCalendarEventType } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
 Ban,
 X
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const getStatusColor = (status: ChangeStatus): string => {
 const colors: Record<ChangeStatus, string> = {
 [ChangeStatus.DRAFT]: 'bg-muted text-foreground',
 [ChangeStatus.SUBMITTED]: 'bg-brand-soft text-brand',
 [ChangeStatus.CAB_REVIEW]: 'bg-warning-soft text-warning',
 [ChangeStatus.APPROVED]: 'bg-success-soft text-success',
 [ChangeStatus.REJECTED]: 'bg-destructive-soft text-destructive',
 [ChangeStatus.SCHEDULED]: 'bg-info-soft text-info',
 [ChangeStatus.IMPLEMENTING]: 'bg-warning-soft text-warning',
 [ChangeStatus.COMPLETED]: 'bg-success-soft text-success',
 [ChangeStatus.FAILED]: 'bg-destructive-soft text-destructive',
 [ChangeStatus.CANCELLED]: 'bg-muted text-foreground',
 };
 return colors[status] || 'bg-muted text-foreground';
};

const getTypeColor = (type: ChangeType): string => {
 const colors: Record<ChangeType, string> = {
 [ChangeType.NORMAL]: 'bg-brand-soft text-brand',
 [ChangeType.STANDARD]: 'bg-success-soft text-success',
 [ChangeType.EMERGENCY]: 'bg-destructive-soft text-destructive',
 };
 return colors[type] || 'bg-muted text-foreground';
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
 const [showCalModal, setShowCalModal] = useState(false);
 const [calForm, setCalForm] = useState({ start_date: '', end_date: '' });

 const createCalendarEvent = useCreateCalendarEvent();

 const handleAddToCalendar = () => {
 if (!calForm.start_date || !calForm.end_date) return;
 createCalendarEvent.mutate(
 {
 type: ChangeCalendarEventType.MAINTENANCE_WINDOW,
 title: `[${changeData?.change_id}] ${changeData?.title ?? ''}`,
 description: changeData?.description,
 start_date: new Date(calForm.start_date).toISOString(),
 end_date: new Date(calForm.end_date).toISOString(),
 },
 { onSuccess: () => { setShowCalModal(false); setCalForm({ start_date: '', end_date: '' }); } }
 );
 };

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
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 </DashboardLayout>
 );
 }

 if (error || !change) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
 <h2 className="text-xl font-semibold text-foreground">Change not found</h2>
 <p className="text-muted-foreground mt-2">The change request you are looking for does not exist.</p>
 <Link href="/changes" className="mt-4 inline-block text-brand hover:underline">
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
 className="p-2 hover:bg-accent rounded-lg transition-colors"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold text-foreground">
 {changeData.change_id}
 </h1>
 <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(changeData.type)}`}>
 {changeData.type}
 </span>
 </div>
 <p className="text-muted-foreground mt-1">{changeData.title}</p>
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
 <Card className="p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
 <p className="text-muted-foreground whitespace-pre-wrap">
 {changeData.description}
 </p>
 </Card>

 {/* Justification */}
 {changeData.reason_for_change && (
 <Card className="p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4">Reason for Change</h2>
 <p className="text-muted-foreground whitespace-pre-wrap">
 {changeData.reason_for_change}
 </p>
 </Card>
 )}

 {/* Risk & Rollback */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {changeData.risk_assessment && (
 <Card className="p-6">
 <h3 className="text-md font-semibold text-foreground mb-3">Risk Assessment</h3>
 <p className="text-muted-foreground text-sm">{changeData.risk_assessment}</p>
 </Card>
 )}
 {changeData.rollback_plan && (
 <Card className="p-6">
 <h3 className="text-md font-semibold text-foreground mb-3">Rollback Plan</h3>
 <p className="text-muted-foreground text-sm">{changeData.rollback_plan}</p>
 </Card>
 )}
 </div>

 {/* CAB Approval Status */}
 {changeData.approval && changeData.approval.members && changeData.approval.members.length > 0 && (
 <Card className="p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4">CAB Approvals</h2>
 <div className="mb-4 text-sm text-muted-foreground">
 Status: <span className="font-medium">{changeData.approval.cab_status}</span> ({changeData.approval.current_approvers}/{changeData.approval.required_approvers} approvers)
 </div>
 <div className="space-y-3">
 {changeData.approval.members.map((member, index: number) => (
 <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
 <div className="flex items-center gap-3">
 {member.decision === ApprovalStatus.APPROVED ? (
 <CheckCircle className="w-5 h-5 text-success" />
 ) : member.decision === ApprovalStatus.REJECTED ? (
 <XCircle className="w-5 h-5 text-destructive" />
 ) : (
 <Clock className="w-5 h-5 text-muted-foreground" />
 )}
 <div>
 <p className="font-medium text-foreground">{member.name}</p>
 <p className="text-sm text-muted-foreground">{member.role}</p>
 </div>
 </div>
 <span className={`px-2 py-1 text-xs rounded-full ${
 member.decision === ApprovalStatus.APPROVED 
 ? 'bg-success-soft text-success' 
 : member.decision === ApprovalStatus.REJECTED
 ? 'bg-destructive-soft text-destructive'
 : 'bg-muted text-foreground'
 }`}>
 {member.decision || 'Pending'}
 </span>
 </div>
 ))}
 </div>
 </Card>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Schedule */}
 <Card className="p-6">
 <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Schedule</h3>
 {changeData.schedule ? (
 <div className="space-y-3 text-sm">
 <div className="flex items-start gap-3">
 <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-muted-foreground">Planned Start</p>
 <p className="font-medium text-foreground">
 {new Date(changeData.schedule.planned_start).toLocaleString()}
 </p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-muted-foreground">Planned End</p>
 <p className="font-medium text-foreground">
 {new Date(changeData.schedule.planned_end).toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 ) : (
 <p className="text-muted-foreground text-sm">Not scheduled yet</p>
 )}
 </Card>

 {/* Details */}
 <Card className="p-6">
 <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Details</h3>
 <div className="space-y-4">
 <div className="flex items-start gap-3">
 <User className="w-5 h-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-sm text-muted-foreground">Requested By</p>
 <p className="font-medium text-foreground">{changeData.requested_by?.name ?? '—'}</p>
 <p className="text-sm text-muted-foreground">{changeData.requested_by?.email ?? ''}</p>
 </div>
 </div>
 {changeData.owner && (
 <div className="flex items-start gap-3">
 <User className="w-5 h-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-sm text-muted-foreground">Owner</p>
 <p className="font-medium text-foreground">{changeData.owner.name}</p>
 </div>
 </div>
 )}
 <div className="flex items-start gap-3">
 <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
 <div>
 <p className="text-sm text-muted-foreground">Created</p>
 <p className="font-medium text-foreground">
 {new Date(changeData.created_at).toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 </Card>

 {/* Actions */}
 <Card className="p-6">
 <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Actions</h3>
 <div className="space-y-2">
 {changeData.status === ChangeStatus.DRAFT && (
 <>
 <Button className="w-full" onClick={handleSubmitForApproval} disabled={submitForApproval.isPending}>
 <Send className="w-4 h-4" />
 Submit for Approval
 </Button>
 <Button variant="outline" className="w-full" onClick={handleCancel} disabled={cancelChange.isPending}>
 <Ban className="w-4 h-4" />
 Cancel
 </Button>
 </>
 )}

 {changeData.status === ChangeStatus.CAB_REVIEW && (
 <>
 <button
 onClick={() => handleCabApproval(ApprovalStatus.APPROVED)}
 disabled={addCabApproval.isPending}
 className="w-full px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
 >
 <CheckCircle className="w-4 h-4" />
 Approve
 </button>
 <button
 onClick={() => handleCabApproval(ApprovalStatus.REJECTED)}
 disabled={addCabApproval.isPending}
 className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
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
 className="w-full px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors flex items-center justify-center gap-2"
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
 className="w-full px-3 py-2 border border-input rounded-lg text-sm"
 placeholder="Start"
 />
 <input
 type="datetime-local"
 value={scheduleData.planned_end}
 onChange={(e) => setScheduleData({ ...scheduleData, planned_end: e.target.value })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm"
 placeholder="End"
 />
 <button
 onClick={handleSchedule}
 disabled={scheduleChange.isPending}
 className="w-full px-4 py-2 bg-info text-white rounded-lg hover:bg-info"
 >
 Confirm Schedule
 </button>
 </div>
 )}
 </>
 )}

 {/* Add to Calendar — available for SCHEDULED and APPROVED changes */}
 {(changeData.status === ChangeStatus.SCHEDULED || changeData.status === ChangeStatus.APPROVED) && (
 <button
 onClick={() => setShowCalModal(true)}
 className="w-full px-4 py-2 border border-brand-border dark:border-brand text-brand dark:text-brand rounded-lg hover:bg-brand-surface dark:hover:bg-brand-strong/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
 >
 <Calendar className="w-4 h-4" />
 Add to Calendar
 </button>
 )}

 {changeData.status === ChangeStatus.SCHEDULED && (
 <button
 onClick={handleStartImplementation}
 disabled={startImplementation.isPending}
 className="w-full px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning transition-colors flex items-center justify-center gap-2"
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
 className="w-full px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
 >
 <CheckCircle className="w-4 h-4" />
 Complete Successfully
 </button>
 <button
 onClick={() => handleComplete(false)}
 disabled={completeChange.isPending}
 className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
 >
 <XCircle className="w-4 h-4" />
 Mark as Failed
 </button>
 </>
 )}
 </div>
 </Card>
 </div>
 </div>
 </div>
 {/* Add to Calendar Modal */}
 {showCalModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h2 className="text-base font-bold text-foreground">Add to Change Calendar</h2>
 <button onClick={() => setShowCalModal(false)} className="p-1.5 hover:bg-accent rounded-lg">
 <X className="w-4 h-4" />
 </button>
 </div>
 <div className="p-5 space-y-4">
 <p className="text-sm text-muted-foreground truncate">
 <span className="font-medium text-foreground">{changeData.change_id}</span> — {changeData.title}
 </p>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Start <span className="text-destructive">*</span></label>
 <input
 type="datetime-local"
 value={calForm.start_date}
 onChange={(e) => setCalForm({ ...calForm, start_date: e.target.value })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-brand focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">End <span className="text-destructive">*</span></label>
 <input
 type="datetime-local"
 value={calForm.end_date}
 onChange={(e) => setCalForm({ ...calForm, end_date: e.target.value })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-brand focus:border-transparent"
 />
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
 <Button variant="secondary" onClick={() => setShowCalModal(false)}>
 Cancel
 </Button>
 <Button
 onClick={handleAddToCalendar}
 disabled={createCalendarEvent.isPending || !calForm.start_date || !calForm.end_date}
 >
 {createCalendarEvent.isPending ? (
 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
 ) : (
 <><Calendar className="w-4 h-4" /> Add to Calendar</>
 )}
 </Button>
 </div>
 </div>
 </div>
 )}
 </DashboardLayout>
 );
}
