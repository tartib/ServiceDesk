'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle2, Calendar, Loader2, FileText, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardAnalytics, useDailyReport, useWeeklyReport, useMonthlyReport } from '@/hooks/useReports';

type ReportType = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Get current week start (Monday)
  const getWeekStart = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };
  
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Fetch analytics and reports
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

  return (
    <DashboardLayout allowedRoles={['supervisor', 'manager']}>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold leading-tight">{t('reports.title')}</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1 leading-relaxed">{t('reports.subtitle')}</p>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.totalTasks')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.totalTasks?.count ?? 0}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics?.totalTasks && renderTrend(analytics.totalTasks.changePercent)}
                    <span className="text-xs text-gray-500">{analytics?.totalTasks?.changeLabel}</span>
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
              {isLoadingAnalytics ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.completionRate?.percent ?? 0}%</div>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics?.completionRate && renderTrend(analytics.completionRate.changePercent)}
                    <span className="text-xs text-gray-500">{analytics?.completionRate?.changeLabel}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reports.avgPrepTime')}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.avgPrepTime?.hours ?? 0}h</div>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics?.avgPrepTime && renderTrend(analytics.avgPrepTime.changePercent, analytics.avgPrepTime.changePercent <= 0)}
                    <span className="text-xs text-gray-500">{analytics?.avgPrepTime?.changeLabel}</span>
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
              {isLoadingAnalytics ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.onTimeTasks?.percent ?? 0}%</div>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics?.onTimeTasks && renderTrend(analytics.onTimeTasks.changePercent)}
                    <span className="text-xs text-gray-500">{analytics?.onTimeTasks?.changeLabel}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Type Selector */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('reports.detailedReports')}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={reportType === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 md:h-10 text-xs md:text-sm"
                  onClick={() => setReportType('daily')}
                >
                  {t('reports.daily')}
                </Button>
                <Button
                  variant={reportType === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 md:h-10 text-xs md:text-sm"
                  onClick={() => setReportType('weekly')}
                >
                  {t('reports.weekly')}
                </Button>
                <Button
                  variant={reportType === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 md:h-10 text-xs md:text-sm"
                  onClick={() => setReportType('monthly')}
                >
                  {t('reports.monthly')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Date Selector */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <Calendar className="h-5 w-5 text-gray-500 shrink-0" />
              {reportType === 'daily' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 md:py-2.5 border rounded-md h-10 md:h-11 flex-1 md:flex-none text-sm md:text-base"
                />
              )}
              {reportType === 'weekly' && (
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="px-3 py-2 md:py-2.5 border rounded-md h-10 md:h-11 flex-1 md:flex-none text-sm md:text-base"
                />
              )}
              {reportType === 'monthly' && (
                <div className="flex gap-2 flex-1 md:flex-none">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 md:py-2.5 border rounded-md h-10 md:h-11 flex-1 text-sm md:text-base"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 md:py-2.5 border rounded-md h-10 md:h-11 flex-1 text-sm md:text-base"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Daily Report */}
            {reportType === 'daily' && (
              <div>
                {isLoadingDaily ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : dailyReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.totalTasks')}</p>
                        <p className="text-2xl font-bold">{dailyReport.totalTasks}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.completed')}</p>
                        <p className="text-2xl font-bold text-green-600">{dailyReport.completedTasks}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.pending')}</p>
                        <p className="text-2xl font-bold text-yellow-600">{dailyReport.pendingTasks}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.overdue')}</p>
                        <p className="text-2xl font-bold text-red-600">{dailyReport.overdueTasks}</p>
                      </div>
                    </div>
                    
                    {/* Tasks by User */}
                    {dailyReport.tasksByUser && dailyReport.tasksByUser.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {t('reports.tasksByUser')}
                        </h3>
                        <div className="space-y-2">
                          {dailyReport.tasksByUser.map((user) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span>{user.userName}</span>
                              <Badge>{user.count} {t('reports.tasks')}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('reports.noData')}
                  </div>
                )}
              </div>
            )}

            {/* Weekly Report */}
            {reportType === 'weekly' && (
              <div>
                {isLoadingWeekly ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : weeklyReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.totalTasks')}</p>
                        <p className="text-2xl font-bold">{weeklyReport.totalTasks}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.completed')}</p>
                        <p className="text-2xl font-bold text-green-600">{weeklyReport.completedTasks}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.completionRate')}</p>
                        <p className="text-2xl font-bold text-blue-600">{weeklyReport.completionRate}%</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.avgPrepTime')}</p>
                        <p className="text-2xl font-bold text-yellow-600">{weeklyReport.avgPrepTime}h</p>
                      </div>
                    </div>
                    
                    {/* Daily Breakdown */}
                    {weeklyReport.dailyBreakdown && weeklyReport.dailyBreakdown.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">{t('reports.dailyBreakdown')}</h3>
                        <div className="grid grid-cols-7 gap-2">
                          {weeklyReport.dailyBreakdown.map((day) => (
                            <div key={day.date} className="p-3 bg-gray-50 rounded-lg text-center">
                              <p className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('default', { weekday: 'short' })}</p>
                              <p className="font-bold">{day.completed}/{day.total}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('reports.noData')}
                  </div>
                )}
              </div>
            )}

            {/* Monthly Report */}
            {reportType === 'monthly' && (
              <div>
                {isLoadingMonthly ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : monthlyReport ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.totalTasks')}</p>
                        <p className="text-2xl font-bold">{monthlyReport.totalTasks}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.completed')}</p>
                        <p className="text-2xl font-bold text-green-600">{monthlyReport.completedTasks}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.completionRate')}</p>
                        <p className="text-2xl font-bold text-blue-600">{monthlyReport.completionRate}%</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('reports.avgPrepTime')}</p>
                        <p className="text-2xl font-bold text-yellow-600">{monthlyReport.avgPrepTime}h</p>
                      </div>
                    </div>
                    
                    {/* Weekly Breakdown */}
                    {monthlyReport.weeklyBreakdown && monthlyReport.weeklyBreakdown.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">{t('reports.weeklyBreakdown')}</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {monthlyReport.weeklyBreakdown.map((week) => (
                            <div key={week.week} className="p-3 bg-gray-50 rounded-lg text-center">
                              <p className="text-xs text-gray-500">{t('reports.week')} {week.week}</p>
                              <p className="font-bold">{week.completed}/{week.total}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('reports.noData')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
