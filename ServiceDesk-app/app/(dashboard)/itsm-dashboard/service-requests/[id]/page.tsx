'use client';

import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Play,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  useServiceRequest,
  useUpdateServiceRequestStatus,
  useApproveServiceRequest,
  useAssignServiceRequest,
  useFulfillServiceRequest,
  ServiceRequestStatus,
  getStatusColor,
  getPriorityColor,
} from '@/hooks/useServiceRequests';

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const { locale } = useLanguage();
  const { user } = useAuthStore();
  const id = params.id as string;

  const { data: request, isLoading, error, refetch } = useServiceRequest(id);
  const updateStatus = useUpdateServiceRequestStatus();
  const approveRequest = useApproveServiceRequest();
  const assignRequest = useAssignServiceRequest();
  const fulfillRequest = useFulfillServiceRequest();

  const statusLabels: Record<ServiceRequestStatus, { en: string; ar: string }> = {
    [ServiceRequestStatus.SUBMITTED]: { en: 'Submitted', ar: 'مقدم' },
    [ServiceRequestStatus.PENDING_APPROVAL]: { en: 'Pending Approval', ar: 'بانتظار الموافقة' },
    [ServiceRequestStatus.APPROVED]: { en: 'Approved', ar: 'موافق عليه' },
    [ServiceRequestStatus.REJECTED]: { en: 'Rejected', ar: 'مرفوض' },
    [ServiceRequestStatus.IN_PROGRESS]: { en: 'In Progress', ar: 'قيد التنفيذ' },
    [ServiceRequestStatus.ON_HOLD]: { en: 'On Hold', ar: 'معلق' },
    [ServiceRequestStatus.FULFILLED]: { en: 'Fulfilled', ar: 'منجز' },
    [ServiceRequestStatus.CANCELLED]: { en: 'Cancelled', ar: 'ملغي' },
  };

  const handleApprove = async () => {
    if (!request || !user) return;
    await approveRequest.mutateAsync({
      id: request.request_id,
      decision: 'approve',
      approver_id: user.id || '',
      approver_name: user.name || 'Unknown',
    });
    refetch();
  };

  const handleReject = async () => {
    if (!request || !user) return;
    const comments = prompt(locale === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
    if (comments === null) return;
    await approveRequest.mutateAsync({
      id: request.request_id,
      decision: 'reject',
      approver_id: user.id || '',
      approver_name: user.name || 'Unknown',
      comments,
    });
    refetch();
  };

  const handleAssign = async () => {
    if (!request || !user) return;
    await assignRequest.mutateAsync({
      id: request.request_id,
      technician_id: user.id || '',
      name: user.name || 'Unknown',
      email: user.email || '',
    });
    refetch();
  };

  const handleStartWork = async () => {
    if (!request || !user) return;
    await updateStatus.mutateAsync({
      id: request.request_id,
      status: ServiceRequestStatus.IN_PROGRESS,
      user_id: user.id || '',
      user_name: user.name || 'Unknown',
    });
    refetch();
  };

  const handleFulfill = async () => {
    if (!request || !user) return;
    const notes = prompt(locale === 'ar' ? 'ملاحظات التنفيذ:' : 'Fulfillment notes:');
    await fulfillRequest.mutateAsync({
      id: request.request_id,
      fulfilled_by: user.id || '',
      fulfilled_by_name: user.name || 'Unknown',
      notes: notes || undefined,
    });
    refetch();
  };

  const handleCancel = async () => {
    if (!request || !user) return;
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this request?')) return;
    await updateStatus.mutateAsync({
      id: request.request_id,
      status: ServiceRequestStatus.CANCELLED,
      user_id: user.id || '',
      user_name: user.name || 'Unknown',
    });
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'الطلب غير موجود' : 'Request not found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar' ? 'لم يتم العثور على الطلب المطلوب' : 'The requested service request could not be found'}
              </p>
              <Link href="/itsm-dashboard/service-requests">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'العودة للقائمة' : 'Back to List'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const canApprove = request.status === ServiceRequestStatus.PENDING_APPROVAL || request.status === ServiceRequestStatus.SUBMITTED;
  const canAssign = request.status === ServiceRequestStatus.APPROVED && !request.assigned_to;
  const canStartWork = request.status === ServiceRequestStatus.APPROVED && request.assigned_to;
  const canFulfill = request.status === ServiceRequestStatus.IN_PROGRESS;
  const canCancel = ![ServiceRequestStatus.FULFILLED, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.REJECTED].includes(request.status);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/itsm-dashboard/service-requests">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{request.request_id}</h1>
                <Badge className={getStatusColor(request.status)}>
                  {locale === 'ar' ? statusLabels[request.status].ar : statusLabels[request.status].en}
                </Badge>
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                {request.sla?.breach_flag && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    SLA
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{request.service_name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canApprove && (
              <>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'موافقة' : 'Approve'}
                </Button>
                <Button onClick={handleReject} variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'رفض' : 'Reject'}
                </Button>
              </>
            )}
            {canAssign && (
              <Button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-700">
                <UserCheck className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'تعيين لي' : 'Assign to me'}
              </Button>
            )}
            {canStartWork && (
              <Button onClick={handleStartWork} className="bg-purple-600 hover:bg-purple-700">
                <Play className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'بدء العمل' : 'Start Work'}
              </Button>
            )}
            {canFulfill && (
              <Button onClick={handleFulfill} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'تنفيذ' : 'Fulfill'}
              </Button>
            )}
            {canCancel && (
              <Button onClick={handleCancel} variant="outline" className="text-destructive">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'الخدمة' : 'Service'}</p>
                  <p className="font-medium">{request.service_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'معرف الخدمة' : 'Service ID'}</p>
                  <p className="font-medium">{request.service_id}</p>
                </div>
              </div>
              {request.form_data && Object.keys(request.form_data).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">{locale === 'ar' ? 'بيانات النموذج' : 'Form Data'}</p>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    {Object.entries(request.form_data).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                        <span className="text-sm">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'معلومات مقدم الطلب' : 'Requester Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'الاسم' : 'Name'}</p>
                    <p className="font-medium">{request.requester.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium">{request.requester.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'القسم' : 'Department'}</p>
                  <p className="font-medium">{request.requester.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          {request.assigned_to && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'معلومات التعيين' : 'Assignment Information'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'معين إلى' : 'Assigned To'}</p>
                      <p className="font-medium">{request.assigned_to.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="font-medium">{request.assigned_to.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLA Info */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'اتفاقية مستوى الخدمة' : 'SLA Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'موعد الاستجابة' : 'Response Due'}</p>
                    <p className="font-medium">
                      {new Date(request.sla.response_due).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'موعد الحل' : 'Resolution Due'}</p>
                    <p className="font-medium">
                      {new Date(request.sla.resolution_due).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>
              {request.sla.breach_flag && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{locale === 'ar' ? 'تم تجاوز اتفاقية مستوى الخدمة' : 'SLA has been breached'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          {request.timeline && request.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'سجل الأحداث' : 'Timeline'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.event}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.by_name || event.by} • {new Date(event.time).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fulfillment Info */}
          {request.fulfillment && request.fulfillment.fulfilled_at && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'معلومات التنفيذ' : 'Fulfillment Information'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'تم التنفيذ بواسطة' : 'Fulfilled By'}</p>
                    <p className="font-medium">{request.fulfillment.fulfilled_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'تاريخ التنفيذ' : 'Fulfilled At'}</p>
                    <p className="font-medium">
                      {new Date(request.fulfillment.fulfilled_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
                {request.fulfillment.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{request.fulfillment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
