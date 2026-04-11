'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle2, Calendar,
  Loader2, FileText, Shield, AlertTriangle, Zap, Target, Activity,
  FolderKanban,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useItsmAnalytics, useItsmIncidentTrend,
  usePmAnalytics, usePmVelocityTrend,
  useDashboardAnalytics, useDailyReport, useWeeklyReport, useMonthlyReport,
} from '@/hooks/useReports';

type TabType = 'itsm' | 'pm' | 'legacy';
type ReportType = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('itsm');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getWeekStart = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ITSM hooks
  const { data: itsmData, isLoading: isLoadingItsm } = useItsmAnalytics();
  const { data: incidentTrend } = useItsmIncidentTrend(14);

  // PM hooks
  const { data: pmData, isLoading: isLoadingPm } = usePmAnalytics();
  const { data: velocityTrend } = usePmVelocityTrend(10);

  // Legacy hooks
  const { data: analytics, isLoading: isLoadingAnalytics } = useDashboardAnalytics();
  const { data: dailyReport, isLoading: isLoadingDaily } = useDailyReport(selectedDate);
  const { data: weeklyReport, isLoading: isLoadingWeekly } = useWeeklyReport(weekStart);
  const { data: monthlyReport, isLoading: isLoadingMonthly } = useMonthlyReport(selectedMonth, selectedYear);

  const renderTrend = (changePercent: number, isPositive?: boolean) => {
    const positive = isPositive ?? changePercent >= 0;
    return (
      <span className={`flex items-center gap-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(changePercent)}%
      </span>
    );
  };

  const StatBox = ({ label, value, color = 'bg-muted/50', textColor = '' }: { label: string; value: string | number; color?: string; textColor?: string }) => (
    <div className={`p-4 ${color} rounded-lg`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );

  // ── ITSM Tab ──────────────────────────────────────────────
  const renderItsmTab = () => (
    <div className="space-y-6">
      {isLoadingItsm ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : itsmData ? (
        <>
          {/* Incident KPIs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {t('reports.itsm.incidents')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label={t('reports.itsm.openIncidents')} value={itsmData.incidents.total_open} color="bg-red-50" textColor="text-red-600" />
              <StatBox label={t('reports.itsm.inProgress')} value={itsmData.incidents.total_in_progress} color="bg-blue-50" textColor="text-blue-600" />
              <StatBox label={t('reports.itsm.mttr')} value={`${itsmData.incidents.mttr_hours}h`} color="bg-yellow-50" textColor="text-yellow-600" />
              <StatBox label={t('reports.itsm.breachedSla')} value={itsmData.incidents.breached_sla} color="bg-orange-50" textColor="text-orange-600" />
            </div>
          </div>

          {/* SLA Compliance */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              {t('reports.itsm.slaCompliance')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox label={t('reports.itsm.complianceRate')} value={`${itsmData.sla.compliance_percent}%`} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.itsm.totalMeasured')} value={itsmData.sla.total_measured} />
              <StatBox label={t('reports.itsm.totalBreached')} value={itsmData.sla.total_breached} color="bg-red-50" textColor="text-red-600" />
            </div>
          </div>

          {/* Problem KPIs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              {t('reports.itsm.problems')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label={t('reports.itsm.openProblems')} value={itsmData.problems.total_open} color="bg-purple-50" textColor="text-purple-600" />
              <StatBox label={t('reports.itsm.knownErrors')} value={itsmData.problems.total_known_errors} color="bg-yellow-50" textColor="text-yellow-600" />
              <StatBox label={t('reports.itsm.resolutionRate')} value={`${itsmData.problems.resolution_rate_percent}%`} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.itsm.avgAge')} value={`${itsmData.problems.avg_age_days}d`} />
            </div>
          </div>

          {/* Change KPIs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              {t('reports.itsm.changes')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label={t('reports.itsm.pendingApproval')} value={itsmData.changes.total_pending_approval} color="bg-yellow-50" textColor="text-yellow-600" />
              <StatBox label={t('reports.itsm.scheduled')} value={itsmData.changes.total_scheduled} color="bg-blue-50" textColor="text-blue-600" />
              <StatBox label={t('reports.itsm.successRate')} value={`${itsmData.changes.success_rate_percent}%`} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.itsm.emergencyChanges')} value={itsmData.changes.emergency_changes_this_month} color="bg-red-50" textColor="text-red-600" />
            </div>
          </div>

          {/* Incident Trend */}
          {incidentTrend && incidentTrend.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('reports.itsm.incidentTrend')}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {incidentTrend.slice(-7).map((point) => (
                  <div key={point.date} className="p-2 bg-muted/50 rounded text-center text-xs">
                    <p className="text-muted-foreground">{new Date(point.date).toLocaleDateString('default', { weekday: 'short' })}</p>
                    <p className="font-semibold text-red-600">+{point.created}</p>
                    <p className="font-semibold text-green-600">-{point.resolved}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">{t('reports.noData')}</div>
      )}
    </div>
  );

  // ── PM Tab ────────────────────────────────────────────────
  const renderPmTab = () => (
    <div className="space-y-6">
      {isLoadingPm ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pmData ? (
        <>
          {/* Project Overview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              {t('reports.pm.projects')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox label={t('reports.pm.totalProjects')} value={pmData.projects.total} />
              <StatBox label={t('reports.pm.activeProjects')} value={pmData.projects.active} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.pm.archivedProjects')} value={pmData.projects.archived} color="bg-muted/50" />
            </div>
          </div>

          {/* Task Stats */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('reports.pm.taskStats')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label={t('reports.totalTasks')} value={pmData.tasks.total} />
              <StatBox label={t('reports.completed')} value={pmData.tasks.done} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.pm.inProgress')} value={pmData.tasks.in_progress} color="bg-blue-50" textColor="text-blue-600" />
              <StatBox label={t('reports.overdue')} value={pmData.tasks.overdue} color="bg-red-50" textColor="text-red-600" />
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox label={t('reports.completionRate')} value={`${pmData.tasks.completion_rate_percent}%`} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.pm.storyPoints')} value={`${pmData.story_points.completed}/${pmData.story_points.total}`} color="bg-blue-50" textColor="text-blue-600" />
              <StatBox label={t('reports.pm.pointsCompletion')} value={`${pmData.story_points.completion_percent}%`} color="bg-purple-50" textColor="text-purple-600" />
            </div>
          </div>

          {/* Sprint Stats */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              {t('reports.pm.sprints')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label={t('reports.pm.totalSprints')} value={pmData.sprints.total} />
              <StatBox label={t('reports.pm.activeSprints')} value={pmData.sprints.active} color="bg-blue-50" textColor="text-blue-600" />
              <StatBox label={t('reports.pm.completedSprints')} value={pmData.sprints.completed} color="bg-green-50" textColor="text-green-600" />
              <StatBox label={t('reports.pm.avgVelocity')} value={pmData.sprints.avg_velocity} color="bg-purple-50" textColor="text-purple-600" />
            </div>
          </div>

          {/* Velocity Trend */}
          {velocityTrend && velocityTrend.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('reports.pm.velocityTrend')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {velocityTrend.slice(-5).map((point, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground truncate">{point.sprint_name}</p>
                    <p className="font-bold text-blue-600">{point.committed}</p>
                    <p className="text-sm text-green-600">{point.completed} {t('reports.completed').toLowerCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">{t('reports.noData')}</div>
      )}
    </div>
  );

  // ── Legacy Tab ────────────────────────────────────────────
  const renderLegacyTab = () => (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalTasks')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.totalTasks?.count ?? 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  {analytics?.totalTasks && renderTrend(analytics.totalTasks.changePercent)}
                  <span className="text-xs text-muted-foreground">{analytics?.totalTasks?.changeLabel}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.completionRate')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.completionRate?.percent ?? 0}%</div>
                <div className="flex items-center gap-2 mt-1">
                  {analytics?.completionRate && renderTrend(analytics.completionRate.changePercent)}
                  <span className="text-xs text-muted-foreground">{analytics?.completionRate?.changeLabel}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.avgResolutionTime')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.avgPrepTime?.hours ?? 0}h</div>
                <div className="flex items-center gap-2 mt-1">
                  {analytics?.avgPrepTime && renderTrend(analytics.avgPrepTime.changePercent, analytics.avgPrepTime.changePercent <= 0)}
                  <span className="text-xs text-muted-foreground">{analytics?.avgPrepTime?.changeLabel}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.onTimeTasks')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.onTimeTasks?.percent ?? 0}%</div>
                <div className="flex items-center gap-2 mt-1">
                  {analytics?.onTimeTasks && renderTrend(analytics.onTimeTasks.changePercent)}
                  <span className="text-xs text-muted-foreground">{analytics?.onTimeTasks?.changeLabel}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['daily', 'weekly', 'monthly'] as const).map((rt) => (
          <Button key={rt} variant={reportType === rt ? 'default' : 'outline'} size="sm" onClick={() => setReportType(rt)}>
            {t(`reports.${rt}`)}
          </Button>
        ))}
      </div>

      {/* Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
        {reportType === 'daily' && (
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md h-10 text-sm" />
        )}
        {reportType === 'weekly' && (
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
            className="px-3 py-2 border rounded-md h-10 text-sm" />
        )}
        {reportType === 'monthly' && (
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-md h-10 text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-md h-10 text-sm">
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Daily Report */}
      {reportType === 'daily' && (
        isLoadingDaily ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : dailyReport ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label={t('reports.totalTasks')} value={dailyReport.totalTasks as number} />
            <StatBox label={t('reports.completed')} value={dailyReport.completedTasks as number} color="bg-green-50" textColor="text-green-600" />
            <StatBox label={t('reports.pending')} value={dailyReport.pendingTasks as number} color="bg-yellow-50" textColor="text-yellow-600" />
            <StatBox label={t('reports.overdue')} value={dailyReport.overdueTasks as number} color="bg-red-50" textColor="text-red-600" />
          </div>
        ) : <div className="text-center py-12 text-muted-foreground">{t('reports.noData')}</div>
      )}

      {/* Weekly Report */}
      {reportType === 'weekly' && (
        isLoadingWeekly ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : weeklyReport ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label={t('reports.totalTasks')} value={weeklyReport.totalTasks as number} />
            <StatBox label={t('reports.completed')} value={weeklyReport.completedTasks as number} color="bg-green-50" textColor="text-green-600" />
            <StatBox label={t('reports.completionRate')} value={`${weeklyReport.completionRate}%`} color="bg-blue-50" textColor="text-blue-600" />
            <StatBox label={t('reports.avgResolutionTime')} value={`${weeklyReport.avgPrepTime}h`} color="bg-yellow-50" textColor="text-yellow-600" />
          </div>
        ) : <div className="text-center py-12 text-muted-foreground">{t('reports.noData')}</div>
      )}

      {/* Monthly Report */}
      {reportType === 'monthly' && (
        isLoadingMonthly ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : monthlyReport ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label={t('reports.totalTasks')} value={monthlyReport.totalTasks as number} />
            <StatBox label={t('reports.completed')} value={monthlyReport.completedTasks as number} color="bg-green-50" textColor="text-green-600" />
            <StatBox label={t('reports.completionRate')} value={`${monthlyReport.completionRate}%`} color="bg-blue-50" textColor="text-blue-600" />
            <StatBox label={t('reports.avgResolutionTime')} value={`${monthlyReport.avgPrepTime}h`} color="bg-yellow-50" textColor="text-yellow-600" />
          </div>
        ) : <div className="text-center py-12 text-muted-foreground">{t('reports.noData')}</div>
      )}
    </div>
  );

  return (
    <DashboardLayout allowedRoles={['supervisor', 'manager']}>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{t('reports.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">{t('reports.subtitle')}</p>
          </div>
        </div>

        {/* Domain Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button variant={activeTab === 'itsm' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('itsm')}>
            <Shield className="h-4 w-4 mr-1.5" />
            {t('reports.tab.itsm')}
          </Button>
          <Button variant={activeTab === 'pm' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('pm')}>
            <FolderKanban className="h-4 w-4 mr-1.5" />
            {t('reports.tab.pm')}
          </Button>
          <Button variant={activeTab === 'legacy' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('legacy')}>
            <FileText className="h-4 w-4 mr-1.5" />
            {t('reports.tab.legacy')}
          </Button>
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="pt-6">
            {activeTab === 'itsm' && renderItsmTab()}
            {activeTab === 'pm' && renderPmTab()}
            {activeTab === 'legacy' && renderLegacyTab()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
