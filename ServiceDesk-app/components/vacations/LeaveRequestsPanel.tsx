'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, CalendarDays } from 'lucide-react';
import {
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useDeleteLeaveRequest,
} from '@/hooks/useLeaveRequests';

interface LeaveRequestsPanelProps {
  requests: LeaveRequest[];
  isLoading: boolean;
  showActions?: boolean;
  currentUserId?: string;
}

const typeColors: Record<LeaveType, { bg: string; text: string; dot: string }> = {
  vacation: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  wfh: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  sick: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  holiday: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  blackout: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const statusConfig: Record<LeaveStatus, { variant: 'default' | 'secondary' | 'destructive'; labelEn: string; labelAr: string }> = {
  pending: { variant: 'secondary', labelEn: 'Pending', labelAr: 'معلق' },
  approved: { variant: 'default', labelEn: 'Approved', labelAr: 'موافق عليه' },
  rejected: { variant: 'destructive', labelEn: 'Rejected', labelAr: 'مرفوض' },
};

const typeLabels: Record<LeaveType, { en: string; ar: string }> = {
  vacation: { en: 'Vacation', ar: 'إجازة' },
  wfh: { en: 'Work from Home', ar: 'عمل من المنزل' },
  sick: { en: 'Sick Day', ar: 'إجازة مرضية' },
  holiday: { en: 'Holiday', ar: 'عطلة رسمية' },
  blackout: { en: 'Blackout', ar: 'فترة محظورة' },
};

function getUserName(user: LeaveRequest['userId']): string {
  if (!user) return '';
  if (user.profile?.firstName) {
    return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
  }
  return user.name || user.email || '';
}

export default function LeaveRequestsPanel({
  requests,
  isLoading,
  showActions = false,
  currentUserId,
}: LeaveRequestsPanelProps) {
  const { locale } = useLanguage();
  const approveRequest = useApproveLeaveRequest();
  const rejectRequest = useRejectLeaveRequest();
  const deleteRequest = useDeleteLeaveRequest();

  const handleApprove = async (id: string) => {
    try {
      await approveRequest.mutateAsync(id);
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt(locale === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
    if (reason === null) return;
    try {
      await rejectRequest.mutateAsync({ id, reviewNote: reason });
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this request?')) return;
    try {
      await deleteRequest.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CalendarDays className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-muted-foreground">
          {locale === 'ar' ? 'لا توجد طلبات' : 'No requests'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const tc = typeColors[req.type] || typeColors.vacation;
        const sc = statusConfig[req.status] || statusConfig.pending;
        const tl = typeLabels[req.type] || typeLabels.vacation;
        const isOwn = currentUserId && String(req.userId?._id) === String(currentUserId);
        const canDelete = isOwn && req.status === 'pending';

        return (
          <div
            key={req._id}
            className={`p-3 rounded-lg border ${tc.bg} border-opacity-50`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`w-2 h-2 rounded-full ${tc.dot} shrink-0`} />
                  <span className={`text-sm font-medium ${tc.text}`}>
                    {locale === 'ar' ? tl.ar : tl.en}
                  </span>
                  <Badge variant={sc.variant} className="text-xs">
                    {locale === 'ar' ? sc.labelAr : sc.labelEn}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {getUserName(req.userId)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(req.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                  {req.startDate !== req.endDate && (
                    <>
                      {' → '}
                      {new Date(req.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                    </>
                  )}
                </p>
                {req.reason && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{req.reason}</p>
                )}
                {req.reviewNote && (
                  <p className="text-xs text-red-500 mt-1 truncate">
                    {locale === 'ar' ? 'سبب الرفض: ' : 'Reason: '}{req.reviewNote}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {showActions && req.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(req._id)}
                      disabled={approveRequest.isPending}
                      title={locale === 'ar' ? 'موافقة' : 'Approve'}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(req._id)}
                      disabled={rejectRequest.isPending}
                      title={locale === 'ar' ? 'رفض' : 'Reject'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                    onClick={() => handleDelete(req._id)}
                    disabled={deleteRequest.isPending}
                    title={locale === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
