'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  Eye,
  ArrowUpDown,
  Filter,
  Send,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import {
  useServiceRequests,
  ServiceRequestStatus,
  Priority,
  ServiceRequest,
  ServiceRequestFilters,
} from '@/hooks/useServiceRequests';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Project {
  _id: string;
  name: string;
  key: string;
}

const statusConfig: Record<string, { label: string; labelAr: string; color: string; icon: typeof FileText }> = {
  submitted: { label: 'Submitted', labelAr: 'مقدم', color: 'bg-brand-soft text-brand', icon: Send },
  pending_approval: { label: 'Pending Approval', labelAr: 'بانتظار الموافقة', color: 'bg-warning-soft text-warning', icon: Clock },
  under_review: { label: 'Under Review', labelAr: 'قيد المراجعة', color: 'bg-info-soft text-info', icon: Eye },
  approved: { label: 'Approved', labelAr: 'تمت الموافقة', color: 'bg-success-soft text-success', icon: CheckCircle },
  rejected: { label: 'Rejected', labelAr: 'مرفوض', color: 'bg-destructive-soft text-destructive', icon: XCircle },
  in_progress: { label: 'In Progress', labelAr: 'قيد التنفيذ', color: 'bg-info-soft text-info', icon: Clock },
  on_hold: { label: 'On Hold', labelAr: 'معلق', color: 'bg-warning-soft text-warning', icon: AlertCircle },
  fulfilled: { label: 'Fulfilled', labelAr: 'منجز', color: 'bg-success-soft text-success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', labelAr: 'ملغي', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; labelAr: string; color: string; dot: string }> = {
  critical: { label: 'Critical', labelAr: 'حرج', color: 'bg-destructive-soft text-destructive', dot: 'bg-destructive' },
  high: { label: 'High', labelAr: 'عالي', color: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  medium: { label: 'Medium', labelAr: 'متوسط', color: 'bg-brand-soft text-brand', dot: 'bg-brand' },
  low: { label: 'Low', labelAr: 'منخفض', color: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/30' },
};

export default function ProjectServiceRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { methodology } = useMethodology(projectId);
  const { t, locale } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch project info
  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
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
    if (!token) { router.push('/login'); return; }
    fetchProject(token);
  }, [projectId, router, fetchProject]);

  // Build filters
  const filters: ServiceRequestFilters = useMemo(() => {
    const f: ServiceRequestFilters = { limit: 50 };
    if (filterStatus !== 'all') f.status = filterStatus as ServiceRequestStatus;
    if (filterPriority !== 'all') f.priority = filterPriority as Priority;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [filterStatus, filterPriority, searchQuery]);

  const { data: requestsData, isLoading: requestsLoading } = useServiceRequests(filters);

  const requests: ServiceRequest[] = useMemo(() => {
    if (!requestsData) return [];
    const d = requestsData as { data?: ServiceRequest[] };
    return Array.isArray(d.data) ? d.data : Array.isArray(requestsData) ? requestsData as unknown as ServiceRequest[] : [];
  }, [requestsData]);

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter(r => ['submitted', 'pending_approval', 'under_review', 'approved', 'in_progress'].includes(r.status)).length;
    const fulfilled = requests.filter(r => r.status === 'fulfilled').length;
    const breached = requests.filter(r => r.sla?.resolutionBreached).length;
    return { total, open, fulfilled, breached };
  }, [requests]);

  if (projectLoading) return <LoadingState />;

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-muted/50">
      <ProjectHeader
        projectKey={project?.key}
        projectName={project?.name}
        projectId={projectId}
      />
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

      {/* Stats Bar */}
      <div className="bg-background px-4 py-3 border-b border-border">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{locale === 'ar' ? 'الإجمالي' : 'Total'}:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-muted-foreground">{locale === 'ar' ? 'مفتوح' : 'Open'}:</span>
            <span className="font-semibold">{stats.open}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">{locale === 'ar' ? 'منجز' : 'Fulfilled'}:</span>
            <span className="font-semibold">{stats.fulfilled}</span>
          </div>
          {stats.breached > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{locale === 'ar' ? 'تجاوز SLA' : 'SLA Breached'}:</span>
              <span className="font-semibold text-destructive">{stats.breached}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background px-4 py-3 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ar' ? 'بحث عن طلب...' : 'Search requests...'}
              className="pl-10"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{locale === 'ar' ? cfg.labelAr : cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder={locale === 'ar' ? 'الأولوية' : 'Priority'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
              {Object.entries(priorityConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{locale === 'ar' ? cfg.labelAr : cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href={`/self-service`}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {locale === 'ar' ? 'طلب جديد' : 'New Request'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {requestsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {locale === 'ar' ? 'لا توجد طلبات خدمة' : 'No Service Requests'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === 'ar' ? 'ابدأ بإنشاء طلب خدمة جديد' : 'Get started by creating a new service request'}
            </p>
            <Link href="/self-service">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {locale === 'ar' ? 'طلب جديد' : 'New Request'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'رقم الطلب' : 'Request ID'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'الأولوية' : 'Priority'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'مقدم الطلب' : 'Requester'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{locale === 'ar' ? 'SLA' : 'SLA'}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const sCfg = statusConfig[req.status] || statusConfig.submitted;
                  const pCfg = priorityConfig[req.priority] || priorityConfig.medium;
                  const StatusIcon = sCfg.icon;
                  const slaBreached = req.sla?.resolutionBreached;
                  return (
                    <tr
                      key={req._id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/itsm-dashboard/service-requests/${req._id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand font-medium">
                          {req.requestId || req.request_id || req._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[200px]">
                          {locale === 'ar' ? (req.serviceNameAr || req.serviceName) : (req.serviceName || req.service_name)}
                        </div>
                        {req.serviceCategory && (
                          <span className="text-xs text-muted-foreground">{req.serviceCategory}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`${sCfg.color} gap-1 text-xs`}>
                          <StatusIcon className="h-3 w-3" />
                          {locale === 'ar' ? sCfg.labelAr : sCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
                          <span className="text-xs">{locale === 'ar' ? pCfg.labelAr : pCfg.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{req.requester?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(req.submittedAt || req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {slaBreached ? (
                          <Badge variant="secondary" className="bg-destructive-soft text-destructive text-xs">
                            {locale === 'ar' ? 'تجاوز' : 'Breached'}
                          </Badge>
                        ) : req.sla?.targetResolutionDate ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(req.sla.targetResolutionDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
