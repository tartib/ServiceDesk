'use client';
import { useIncidentStats, useOpenIncidents, useBreachedIncidents, incidentKeys } from '@/hooks/useIncidents';
import { useProblemStats, problemKeys } from '@/hooks/useProblems';
import { useChangeStats, changeKeys } from '@/hooks/useChanges';
import { useSLACompliance, useIncidentTrend } from '@/hooks/useITSMDashboard';
import { IIncident, IIncidentStats, IProblemStats, IChangeStats, ISLACompliancePoint, IIncidentTrendPoint, getPriorityColor, getStatusColor, formatSLATime } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useITSMSocket } from '@/hooks/useSocket';
import { requestKeys } from '@/hooks/useServiceRequests';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bug,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  HelpCircle,
  Plus,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ClipboardList as PIRIcon,
  Calendar,
} from 'lucide-react';

export default function ITSMDashboardPage() {
  const { t, locale } = useLanguage();
  const queryClient = useQueryClient();
  const { data: incidentStats, isLoading: loadingIncidents } = useIncidentStats();
  const { data: problemStats, isLoading: loadingProblems } = useProblemStats();
  const { data: changeStats, isLoading: loadingChanges } = useChangeStats();
  const { data: openIncidents } = useOpenIncidents();
  const { data: breachedIncidents } = useBreachedIncidents();
  const { data: slaData } = useSLACompliance(7);
  const { data: trendData } = useIncidentTrend(14);
  const slaPoints = (slaData as ISLACompliancePoint[] | undefined) ?? [];
  const trendPoints = (trendData as IIncidentTrendPoint[] | undefined) ?? [];

  // WebSocket for real-time updates
  useITSMSocket({
    onIncidentCreated: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.open() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.breached() });
    },
    onIncidentUpdated: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.open() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.breached() });
    },
    onServiceRequestCreated: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
    onServiceRequestUpdated: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
    onProblemCreated: () => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
    onProblemUpdated: () => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
    onChangeCreated: () => {
      queryClient.invalidateQueries({ queryKey: changeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: changeKeys.stats() });
    },
    onChangeUpdated: () => {
      queryClient.invalidateQueries({ queryKey: changeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: changeKeys.stats() });
    },
  });

  const stats = {
    incidents: incidentStats as IIncidentStats | undefined,
    problems: problemStats as IProblemStats | undefined,
    changes: changeStats as IChangeStats | undefined,
  };

  // Per-section loading — each section renders independently

  const SkeletonCard = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-8 bg-muted rounded w-1/3"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('dashboard.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/incidents/new"
            className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('dashboard.newIncident')}
            </span>
          </Link>
          <Link
            href="/changes/new"
            className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900 transition-colors">
              <GitBranch className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('dashboard.newChange')}
            </span>
          </Link>
          <Link
            href="/self-service/new-request"
            className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900 transition-colors">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('selfService.requestHelp')}
            </span>
          </Link>
          <Link
            href="/itsm-dashboard/service-requests"
            className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900 transition-colors">
              <ClipboardList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {locale === 'ar' ? 'إدارة الطلبات' : 'Manage Requests'}
            </span>
          </Link>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                  {locale === 'ar' ? 'بلاغات مفتوحة' : 'Open Incidents'}
                </p>
                <p className="text-3xl font-bold mt-1">{stats.incidents?.open || 0}</p>
              </div>
              <AlertTriangle className="w-9 h-9 text-blue-200/60" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium uppercase tracking-wide">
                  {locale === 'ar' ? 'تجاوز SLA' : 'SLA Breached'}
                </p>
                <p className="text-3xl font-bold mt-1">{stats.incidents?.breached || 0}</p>
              </div>
              <XCircle className="w-9 h-9 text-red-200/60" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                  {locale === 'ar' ? 'أخطاء معروفة' : 'Known Errors'}
                </p>
                <p className="text-3xl font-bold mt-1">{stats.problems?.knownErrors || 0}</p>
              </div>
              <Bug className="w-9 h-9 text-purple-200/60" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase tracking-wide">
                  {locale === 'ar' ? 'تغييرات مجدولة' : 'Scheduled Changes'}
                </p>
                <p className="text-3xl font-bold mt-1">{stats.changes?.scheduled || 0}</p>
              </div>
              <GitBranch className="w-9 h-9 text-green-200/60" />
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Incidents Card */}
          <Link href="/incidents" className="group bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('incidents.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === 'ar' ? 'إجمالي البلاغات' : 'Total incidents'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            <div className="p-5">
              {loadingIncidents ? <SkeletonCard /> : (
                <>
                  <div className="text-3xl font-bold text-foreground mb-4">
                    {stats.incidents?.total || 0}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'مفتوح' : 'Open'}: <span className="font-medium text-foreground">{stats.incidents?.open || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'قيد التنفيذ' : 'In Progress'}: <span className="font-medium text-foreground">{stats.incidents?.inProgress || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'تم الحل' : 'Resolved'}: <span className="font-medium text-foreground">{stats.incidents?.resolved || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'متجاوز' : 'Breached'}: <span className="font-medium text-foreground">{stats.incidents?.breached || 0}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Problems Card */}
          <Link href="/problems" className="group bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Bug className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('problems.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === 'ar' ? 'إجمالي المشاكل' : 'Total problems'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            <div className="p-5">
              {loadingProblems ? <SkeletonCard /> : (
                <>
                  <div className="text-3xl font-bold text-foreground mb-4">
                    {stats.problems?.total || 0}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'مسجل' : 'Logged'}: <span className="font-medium text-foreground">{stats.problems?.logged || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'تحليل السبب' : 'RCA'}: <span className="font-medium text-foreground">{stats.problems?.rcaInProgress || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'أخطاء معروفة' : 'Known Errors'}: <span className="font-medium text-foreground">{stats.problems?.knownErrors || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'تم الحل' : 'Resolved'}: <span className="font-medium text-foreground">{stats.problems?.resolved || 0}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Changes Card */}
          <Link href="/changes" className="group bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <GitBranch className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('changes.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === 'ar' ? 'إجمالي التغييرات' : 'Total changes'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            <div className="p-5">
              {loadingChanges ? <SkeletonCard /> : (
                <>
                  <div className="text-3xl font-bold text-foreground mb-4">
                    {stats.changes?.total || 0}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'مسودة' : 'Draft'}: <span className="font-medium text-foreground">{stats.changes?.draft || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'بانتظار الموافقة' : 'Pending'}: <span className="font-medium text-foreground">{stats.changes?.pendingApproval || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'مجدول' : 'Scheduled'}: <span className="font-medium text-foreground">{stats.changes?.scheduled || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'مكتمل' : 'Completed'}: <span className="font-medium text-foreground">{stats.changes?.completed || 0}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>
        </div>

        {/* SLA Compliance + Incident Trend Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SLA Compliance 7-day bar chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                SLA Compliance (7 days)
              </h3>
              {slaPoints.length > 0 && (
                <span className={`text-sm font-bold ${
                  slaPoints[slaPoints.length - 1]?.compliance_rate >= 95 ? 'text-green-600' :
                  slaPoints[slaPoints.length - 1]?.compliance_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {slaPoints[slaPoints.length - 1]?.compliance_rate?.toFixed(1)}%
                </span>
              )}
            </div>
            {slaPoints.length > 0 ? (
              <div className="space-y-2">
                {slaPoints.map((pt) => (
                  <div key={pt.period} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {new Date(pt.period).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          pt.compliance_rate >= 95 ? 'bg-green-500' :
                          pt.compliance_rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(pt.compliance_rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-12 text-right">
                      {pt.compliance_rate?.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No SLA data available</p>
            )}
          </div>

          {/* Incident Trend 14-day */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Incident Trend (14 days)
              </h3>
              {trendPoints.length >= 2 && (() => {
                const last = trendPoints[trendPoints.length - 1]?.created ?? 0;
                const prev = trendPoints[trendPoints.length - 2]?.created ?? 0;
                const up = last >= prev;
                return (
                  <span className={`flex items-center gap-1 text-sm font-bold ${up ? 'text-red-600' : 'text-green-600'}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {last}
                  </span>
                );
              })()}
            </div>
            {trendPoints.length > 0 ? (
              <div className="flex items-end gap-1 h-20">
                {trendPoints.map((pt) => {
                  const max = Math.max(...trendPoints.map((p) => p.created), 1);
                  const pct = (pt.created / max) * 100;
                  return (
                    <div key={pt.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={`${pt.date}: ${pt.created}`}
                      />
                      <span className="text-xs text-muted-foreground rotate-45 origin-left hidden md:block" style={{ fontSize: '0.6rem' }}>
                        {new Date(pt.date).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No trend data available</p>
            )}
          </div>
        </div>

        {/* SLA Breached Incidents */}
        {breachedIncidents && (breachedIncidents as IIncident[]).length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    {locale === 'ar'
                      ? `بلاغات تجاوزت SLA (${(breachedIncidents as IIncident[]).length})`
                      : `SLA Breached Incidents (${(breachedIncidents as IIncident[]).length})`}
                  </h3>
                </div>
                <Link href="/incidents?breached=true" className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1">
                  {locale === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-red-200 dark:divide-red-800">
              {(breachedIncidents as IIncident[]).slice(0, 5).map((incident: IIncident) => (
                <Link
                  key={incident._id}
                  href={`/incidents/${incident.incident_id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-mono font-medium text-red-700 dark:text-red-300 shrink-0">
                      {incident.incident_id}
                    </span>
                    <span className="text-sm text-red-600 dark:text-red-400 truncate">
                      {incident.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(incident.priority)}`}>
                      {incident.priority}
                    </span>
                    <span className="text-sm text-red-500 dark:text-red-400 hidden sm:inline">
                      {incident.requester.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Open Incidents */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">{t('dashboard.openIncidents')}</h3>
              </div>
              <Link href="/incidents?status=open" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                {locale === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border">
            {openIncidents && (openIncidents as IIncident[]).length > 0 ? (
              (openIncidents as IIncident[]).slice(0, 5).map((incident: IIncident) => (
                <Link
                  key={incident._id}
                  href={`/incidents/${incident.incident_id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 shrink-0">
                      {incident.incident_id}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {incident.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-4">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(incident.priority)}`}>
                      {incident.priority}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                    {incident.time_to_breach_minutes !== undefined && (
                      <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatSLATime(incident.time_to_breach_minutes)}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="font-medium">{t('dashboard.noOpenIncidents')}</p>
                <p className="text-sm mt-1 text-muted-foreground">
                  {locale === 'ar' ? 'جميع البلاغات تم معالجتها' : 'All incidents have been handled'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
