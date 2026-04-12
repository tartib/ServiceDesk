'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
} from '@/components/ui/card';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
 ArrowLeft,
 Search,
 Filter,
 Clock,
 CheckCircle,
 XCircle,
 AlertTriangle,
 RefreshCw,
 Eye,
 UserCheck,
 Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
 useServiceRequests,
 useServiceRequestStats,
 useApproveServiceRequest,
 useAssignServiceRequest,
 useFulfillServiceRequest,
 ServiceRequest,
 ServiceRequestStatus,
 Priority,
 getStatusColor,
 getPriorityColor,
} from '@/hooks/useServiceRequests';

export default function ServiceRequestsManagementPage() {
 const { locale } = useLanguage();
 const router = useRouter();
 const { user } = useAuthStore();

 const [filters, setFilters] = useState({
 status: '',
 priority: '',
 search: '',
 });
 const [page, setPage] = useState(1);

 // Modal state
 const [rejectTarget, setRejectTarget] = useState<ServiceRequest | null>(null);
 const [rejectReason, setRejectReason] = useState('');
 const [fulfillTarget, setFulfillTarget] = useState<ServiceRequest | null>(null);
 const [fulfillNotes, setFulfillNotes] = useState('');

 const { data: requestsData, isLoading, refetch } = useServiceRequests({
 page,
 limit: 10,
 status: (filters.status && filters.status !== 'all' ? filters.status : undefined) as ServiceRequestStatus | undefined,
 priority: (filters.priority && filters.priority !== 'all' ? filters.priority : undefined) as Priority | undefined,
 search: filters.search || undefined,
 });

 const { data: stats } = useServiceRequestStats();
 const approveRequest = useApproveServiceRequest();
 const assignRequest = useAssignServiceRequest();
 const fulfillRequest = useFulfillServiceRequest();

 const requests = requestsData?.data || [];
 const totalPages = requestsData?.pagination?.pages || 1;

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

 const handleApprove = async (request: ServiceRequest) => {
 if (!user) return;
 await approveRequest.mutateAsync({
 id: request.request_id,
 decision: 'approve',
 approver_id: user.id || '',
 approver_name: user.name || 'Unknown',
 });
 refetch();
 };

 const handleReject = async () => {
 if (!user || !rejectTarget) return;
 await approveRequest.mutateAsync({
 id: rejectTarget.request_id,
 decision: 'reject',
 approver_id: user.id || '',
 approver_name: user.name || 'Unknown',
 comments: rejectReason,
 });
 setRejectTarget(null);
 setRejectReason('');
 refetch();
 };

 const handleAssign = async (request: ServiceRequest) => {
 if (!user) return;
 await assignRequest.mutateAsync({
 id: request.request_id,
 technician_id: user.id || '',
 name: user.name || 'Unknown',
 email: user.email || '',
 });
 refetch();
 };

 const handleFulfill = async () => {
 if (!user || !fulfillTarget) return;
 await fulfillRequest.mutateAsync({
 id: fulfillTarget.request_id,
 fulfilled_by: user.id || '',
 fulfilled_by_name: user.name || 'Unknown',
 notes: fulfillNotes || undefined,
 });
 setFulfillTarget(null);
 setFulfillNotes('');
 refetch();
 };

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link href="/itsm-dashboard">
 <Button variant="ghost" size="icon">
 <ArrowLeft className="h-5 w-5" />
 </Button>
 </Link>
 <div>
 <h1 className="text-2xl font-bold">
 {locale === 'ar' ? 'إدارة طلبات الخدمة' : 'Service Requests Management'}
 </h1>
 <p className="text-muted-foreground">
 {locale === 'ar' ? 'مراقبة وتحديث طلبات الخدمة' : 'Monitor and update service requests'}
 </p>
 </div>
 </div>
 <Button onClick={() => refetch()} variant="outline" size="sm">
 <RefreshCw className="h-4 w-4 mr-2" />
 {locale === 'ar' ? 'تحديث' : 'Refresh'}
 </Button>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <Card>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-brand-soft dark:bg-brand rounded-lg">
 <Clock className="h-6 w-6 text-brand" />
 </div>
 <div>
 <p className="text-2xl font-bold">{stats?.total || 0}</p>
 <p className="text-sm text-muted-foreground">
 {locale === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-warning-soft rounded-lg">
 <AlertTriangle className="h-6 w-6 text-warning" />
 </div>
 <div>
 <p className="text-2xl font-bold">{stats?.pending_approval || 0}</p>
 <p className="text-sm text-muted-foreground">
 {locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval'}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-info-soft dark:bg-info rounded-lg">
 <RefreshCw className="h-6 w-6 text-info" />
 </div>
 <div>
 <p className="text-2xl font-bold">{stats?.by_status?.in_progress || 0}</p>
 <p className="text-sm text-muted-foreground">
 {locale === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-success-soft rounded-lg">
 <CheckCircle className="h-6 w-6 text-success" />
 </div>
 <div>
 <p className="text-2xl font-bold">{stats?.by_status?.fulfilled || 0}</p>
 <p className="text-sm text-muted-foreground">
 {locale === 'ar' ? 'منجز' : 'Fulfilled'}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Filter className="h-5 w-5" />
 {locale === 'ar' ? 'تصفية' : 'Filters'}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
 value={filters.search}
 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
 className="pl-10"
 />
 </div>
 <Select
 value={filters.status}
 onValueChange={(value) => setFilters({ ...filters, status: value })}
 >
 <SelectTrigger>
 <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
 {Object.values(ServiceRequestStatus).map((status) => (
 <SelectItem key={status} value={status}>
 {locale === 'ar' ? statusLabels[status].ar : statusLabels[status].en}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select
 value={filters.priority}
 onValueChange={(value) => setFilters({ ...filters, priority: value })}
 >
 <SelectTrigger>
 <SelectValue placeholder={locale === 'ar' ? 'الأولوية' : 'Priority'} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
 <SelectItem value={Priority.LOW}>{locale === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
 <SelectItem value={Priority.MEDIUM}>{locale === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
 <SelectItem value={Priority.HIGH}>{locale === 'ar' ? 'عالي' : 'High'}</SelectItem>
 <SelectItem value={Priority.CRITICAL}>{locale === 'ar' ? 'حرج' : 'Critical'}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* Requests Table */}
 <Card>
 <CardContent className="p-0">
 {isLoading ? (
 <div className="flex justify-center items-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 ) : requests.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
 <Clock className="h-12 w-12 mb-4 opacity-50" />
 <p>{locale === 'ar' ? 'لا توجد طلبات' : 'No requests found'}</p>
 </div>
 ) : (
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>{locale === 'ar' ? 'رقم الطلب' : 'Request ID'}</TableHead>
 <TableHead>{locale === 'ar' ? 'الخدمة' : 'Service'}</TableHead>
 <TableHead>{locale === 'ar' ? 'مقدم الطلب' : 'Requester'}</TableHead>
 <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
 <TableHead>{locale === 'ar' ? 'الأولوية' : 'Priority'}</TableHead>
 <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
 <TableHead>{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {requests.map((request: ServiceRequest) => (
 <TableRow key={request._id}>
 <TableCell className="font-medium">{request.request_id}</TableCell>
 <TableCell>{request.service_name}</TableCell>
 <TableCell>
 <div>
 <p className="font-medium">{request.requester.name}</p>
 <p className="text-sm text-muted-foreground">{request.requester.email}</p>
 </div>
 </TableCell>
 <TableCell>
 <Badge className={getStatusColor(request.status)}>
 {locale === 'ar' ? statusLabels[request.status].ar : statusLabels[request.status].en}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge className={getPriorityColor(request.priority)}>
 {request.priority}
 </Badge>
 </TableCell>
 <TableCell>
 {new Date(request.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
 </TableCell>
 <TableCell>
 <div className="flex gap-1">
 <Button
 variant="ghost"
 size="icon"
 title={locale === 'ar' ? 'عرض' : 'View'}
 onClick={() => router.push(`/itsm-dashboard/service-requests/${request.request_id}`)}
 >
 <Eye className="h-4 w-4" />
 </Button>
 {(request.status === ServiceRequestStatus.SUBMITTED || 
 request.status === ServiceRequestStatus.PENDING_APPROVAL) && (
 <>
 <Button
 variant="ghost"
 size="icon"
 className="text-success"
 title={locale === 'ar' ? 'موافقة' : 'Approve'}
 onClick={() => handleApprove(request)}
 >
 <CheckCircle className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="text-destructive"
 title={locale === 'ar' ? 'رفض' : 'Reject'}
 onClick={() => { setRejectTarget(request); setRejectReason(''); }}
 >
 <XCircle className="h-4 w-4" />
 </Button>
 </>
 )}
 {request.status === ServiceRequestStatus.APPROVED && (
 <Button
 variant="ghost"
 size="icon"
 className="text-brand"
 title={locale === 'ar' ? 'تعيين لي وبدء العمل' : 'Assign to me & Start'}
 onClick={() => handleAssign(request)}
 >
 <UserCheck className="h-4 w-4" />
 </Button>
 )}
 {request.status === ServiceRequestStatus.IN_PROGRESS && (
 <Button
 variant="ghost"
 size="icon"
 className="text-success"
 title={locale === 'ar' ? 'تنفيذ' : 'Fulfill'}
 onClick={() => { setFulfillTarget(request); setFulfillNotes(''); }}
 >
 <CheckCircle className="h-4 w-4" />
 </Button>
 )}
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </CardContent>
 </Card>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex justify-center gap-2">
 <Button
 variant="outline"
 size="sm"
 disabled={page === 1}
 onClick={() => setPage(page - 1)}
 >
 {locale === 'ar' ? 'السابق' : 'Previous'}
 </Button>
 <span className="flex items-center px-4 text-sm">
 {locale === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
 </span>
 <Button
 variant="outline"
 size="sm"
 disabled={page === totalPages}
 onClick={() => setPage(page + 1)}
 >
 {locale === 'ar' ? 'التالي' : 'Next'}
 </Button>
 </div>
 )}
 </div>

 {/* Reject Dialog */}
 <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>{locale === 'ar' ? 'رفض الطلب' : 'Reject Request'}</DialogTitle>
 <DialogDescription>
 {locale === 'ar'
 ? `رفض الطلب ${rejectTarget?.request_id || ''}`
 : `Reject request ${rejectTarget?.request_id || ''}`}
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <Label>{locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</Label>
 <Textarea
 value={rejectReason}
 onChange={(e) => setRejectReason(e.target.value)}
 placeholder={locale === 'ar' ? 'اشرح سبب الرفض...' : 'Explain why this request is being rejected...'}
 rows={4}
 dir={locale === 'ar' ? 'rtl' : 'ltr'}
 />
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setRejectTarget(null)}>
 {locale === 'ar' ? 'إلغاء' : 'Cancel'}
 </Button>
 <Button
 variant="destructive"
 onClick={handleReject}
 disabled={approveRequest.isPending}
 >
 {approveRequest.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
 {locale === 'ar' ? 'رفض' : 'Reject'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Fulfill Dialog */}
 <Dialog open={!!fulfillTarget} onOpenChange={(open) => { if (!open) setFulfillTarget(null); }}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>{locale === 'ar' ? 'تنفيذ الطلب' : 'Fulfill Request'}</DialogTitle>
 <DialogDescription>
 {locale === 'ar'
 ? `تأكيد تنفيذ الطلب ${fulfillTarget?.request_id || ''}`
 : `Confirm fulfillment of request ${fulfillTarget?.request_id || ''}`}
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <Label>{locale === 'ar' ? 'ملاحظات التنفيذ' : 'Fulfillment Notes'}</Label>
 <Textarea
 value={fulfillNotes}
 onChange={(e) => setFulfillNotes(e.target.value)}
 placeholder={locale === 'ar' ? 'أضف ملاحظات حول التنفيذ...' : 'Add notes about the fulfillment...'}
 rows={4}
 dir={locale === 'ar' ? 'rtl' : 'ltr'}
 />
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setFulfillTarget(null)}>
 {locale === 'ar' ? 'إلغاء' : 'Cancel'}
 </Button>
 <Button
 className="bg-success hover:bg-success/80"
 onClick={handleFulfill}
 disabled={fulfillRequest.isPending}
 >
 {fulfillRequest.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
 {locale === 'ar' ? 'تنفيذ' : 'Fulfill'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </DashboardLayout>
 );
}
