'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  Users,
  Flag,
  BarChart3,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTeams, useTeam, Team } from '@/hooks/useTeams';
import { useLeaveRequests, LeaveRequest, LeaveType } from '@/hooks/useLeaveRequests';
import RequestLeaveDialog from '@/components/vacations/RequestLeaveDialog';
import LeaveRequestsPanel from '@/components/vacations/LeaveRequestsPanel';
import { getHolidaysInRange, PublicHoliday, SAUDI_PUBLIC_HOLIDAYS } from '@/lib/saudi-holidays';

// Annual leave entitlements per type (in days)
const ANNUAL_ENTITLEMENTS: Partial<Record<LeaveType, { days: number; labelEn: string; labelAr: string }>> = {
  vacation: { days: 21, labelEn: 'Annual Vacation', labelAr: 'إجازة سنوية' },
  sick: { days: 10, labelEn: 'Sick Leave', labelAr: 'إجازة مرضية' },
  wfh: { days: 30, labelEn: 'Work from Home', labelAr: 'عمل من المنزل' },
};

const leaveTypeConfig: Record<LeaveType, { dot: string; labelEn: string; labelAr: string }> = {
  vacation: { dot: 'bg-blue-500', labelEn: 'Vacation', labelAr: 'إجازة' },
  wfh: { dot: 'bg-purple-500', labelEn: 'Work from Home', labelAr: 'عمل من المنزل' },
  sick: { dot: 'bg-orange-500', labelEn: 'Sick Day', labelAr: 'إجازة مرضية' },
  holiday: { dot: 'bg-green-500', labelEn: 'Holiday', labelAr: 'عطلة رسمية' },
  blackout: { dot: 'bg-red-500', labelEn: 'Blackout', labelAr: 'فترة محظورة' },
};

export default function VacationsPage() {
  const { locale } = useLanguage();
  const dateFnsLocale = locale === 'ar' ? ar : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  // Fetch teams
  const { data: teamsList = [] } = useTeams();

  // Fetch selected team details (for members)
  const { data: teamDetail } = useTeam(selectedTeamId);
  const teamMembers = useMemo(() => {
    const t = teamDetail as Team | undefined;
    return t?.members || [];
  }, [teamDetail]);

  // Date range for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Current year range for balance calculation
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfYear(currentMonth);

  // Fetch full-year approved requests for balance tab
  const { data: yearLeaveData } = useLeaveRequests(
    selectedTeamId
      ? {
          teamId: selectedTeamId,
          startDate: format(yearStart, 'yyyy-MM-dd'),
          endDate: format(yearEnd, 'yyyy-MM-dd'),
          status: 'approved',
          limit: 500,
        }
      : undefined
  );
  const yearApprovedRequests = useMemo(() => yearLeaveData?.requests || [], [yearLeaveData]);

  // Compute leave balance per member
  const memberBalances = useMemo(() => {
    const balances: Record<string, {
      name: string;
      email: string;
      role: string;
      used: Partial<Record<LeaveType, number>>;
    }> = {};

    // Initialize all team members
    for (const m of teamMembers) {
      const uid = m.user_id?._id;
      if (!uid) continue;
      balances[uid] = {
        name: m.user_id.name || m.user_id.email,
        email: m.user_id.email,
        role: m.role,
        used: {},
      };
    }

    // Sum approved days per member per type
    for (const req of yearApprovedRequests) {
      const uid = typeof req.userId === 'string' ? req.userId : req.userId?._id;
      if (!uid) continue;
      if (!balances[uid]) {
        // Member might have left the team but still has requests
        const u = typeof req.userId === 'string' ? null : req.userId;
        balances[uid] = {
          name: u?.profile?.firstName ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim() : (u?.name || u?.email || uid),
          email: u?.email || '',
          role: 'member',
          used: {},
        };
      }
      const days = differenceInCalendarDays(new Date(req.endDate), new Date(req.startDate)) + 1;
      balances[uid].used[req.type] = (balances[uid].used[req.type] || 0) + days;
    }

    return Object.entries(balances).map(([id, data]) => ({ id, ...data }));
  }, [teamMembers, yearApprovedRequests]);

  // Fetch leave requests for selected team + month
  const { data: leaveData, isLoading: leavesLoading } = useLeaveRequests(
    selectedTeamId
      ? {
          teamId: selectedTeamId,
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
          limit: 200,
        }
      : undefined
  );
  const leaveRequests = useMemo(() => leaveData?.requests || [], [leaveData]);

  // Pending requests for the panel
  const pendingRequests = useMemo(
    () => leaveRequests.filter((r) => r.status === 'pending'),
    [leaveRequests]
  );

  // Approved requests (for calendar display)
  const approvedRequests = useMemo(
    () => leaveRequests.filter((r) => r.status === 'approved'),
    [leaveRequests]
  );

  // Saudi public holidays for the current month view
  const monthHolidays = useMemo(
    () => getHolidaysInRange(format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')),
    [monthStart, monthEnd]
  );

  // Map: date string → public holiday(s)
  const holidayDayMap = useMemo(() => {
    const map: Record<string, PublicHoliday[]> = {};
    for (const h of monthHolidays) {
      const hStart = new Date(h.startDate);
      const hEnd = new Date(h.endDate);
      let d = new Date(hStart);
      while (d <= hEnd) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(h);
        d = new Date(d.getTime() + 86400000);
      }
    }
    return map;
  }, [monthHolidays]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Map: date string → leave requests on that day
  const dayLeaveMap = useMemo(() => {
    const map: Record<string, LeaveRequest[]> = {};
    for (const req of approvedRequests) {
      const start = parseISO(req.startDate);
      const end = parseISO(req.endDate);
      for (const day of calendarDays) {
        if (isWithinInterval(day, { start, end })) {
          const key = format(day, 'yyyy-MM-dd');
          if (!map[key]) map[key] = [];
          map[key].push(req);
        }
      }
    }
    return map;
  }, [approvedRequests, calendarDays]);

  // Leaves on selected day
  const selectedDayLeaves = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return dayLeaveMap[key] || [];
  }, [selectedDay, dayLeaveMap]);

  const weekDays = locale === 'ar'
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getUserName(user: LeaveRequest['userId']): string {
    if (!user) return '';
    if (user.profile?.firstName) return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    return user.name || user.email || '';
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {locale === 'ar' ? 'متتبع الإجازات' : 'Vacation Tracker'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {locale === 'ar' ? 'تقويم الفريق وإدارة الإجازات' : 'Team calendar and leave management'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Team Selector */}
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={locale === 'ar' ? 'اختر الفريق' : 'Select Team'} />
              </SelectTrigger>
              <SelectContent>
                {teamsList.map((team: Team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {locale === 'ar' ? team.name_ar || team.name : team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setRequestDialogOpen(true)} disabled={!selectedTeamId}>
              <Plus className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'طلب إجازة' : 'Request Leave'}
            </Button>
          </div>
        </div>

        {!selectedTeamId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'اختر فريقاً لعرض التقويم' : 'Select a team to view the calendar'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {locale === 'ar' ? 'اختر فريقاً من القائمة أعلاه' : 'Choose a team from the dropdown above'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {locale === 'ar' ? 'التقويم' : 'Calendar'}
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {locale === 'ar' ? 'الطلبات' : 'Requests'}
                {pendingRequests.length > 0 && (
                  <span className="ms-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {locale === 'ar' ? 'رصيد الإجازات' : 'Leave Balance'}
              </TabsTrigger>
              <TabsTrigger value="holidays" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                {locale === 'ar' ? 'العطل الرسمية' : 'Public Holidays'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <CardTitle className="text-lg">
                          {format(currentMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date())}
                          >
                            {locale === 'ar' ? 'اليوم' : 'Today'}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Week day headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {weekDays.map((day, idx) => (
                          <div key={day} className={`text-center text-xs font-medium py-2 ${idx === 5 || idx === 6 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar days */}
                      <div className="grid grid-cols-7">
                        {calendarDays.map((day) => {
                          const key = format(day, 'yyyy-MM-dd');
                          const dayLeaves = dayLeaveMap[key] || [];
                          const inMonth = isSameMonth(day, currentMonth);
                          const today = isToday(day);
                          const isSelected = selectedDay && isSameDay(day, selectedDay);

                          // Unique leave types on this day
                          const uniqueTypes = [...new Set(dayLeaves.map((l) => l.type))];
                          const dayHolidays = holidayDayMap[key] || [];
                          const isHoliday = dayHolidays.length > 0;
                          const dayOfWeek = day.getDay(); // 0=Sun, 5=Fri, 6=Sat
                          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedDay(day)}
                              className={`relative p-1 min-h-[72px] border border-gray-100 text-start transition-colors
                                ${!inMonth ? 'bg-gray-50 text-gray-300' : 'hover:bg-gray-50'}
                                ${isWeekend && inMonth && !isHoliday && !today ? 'bg-red-50/50' : ''}
                                ${today ? 'bg-blue-50' : ''}
                                ${isHoliday && inMonth ? 'bg-green-50' : ''}
                                ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${today ? 'text-blue-600' : ''} ${isWeekend && inMonth && !today && !isHoliday ? 'text-red-400' : ''} ${isHoliday && inMonth ? 'text-green-700' : ''}`}>
                                  {format(day, 'd')}
                                </span>
                                {isHoliday && inMonth && (
                                  <Flag className="h-2.5 w-2.5 text-green-600" />
                                )}
                              </div>
                              {/* Holiday name */}
                              {isHoliday && inMonth && (
                                <p className="text-[9px] text-green-700 font-medium leading-tight mt-0.5 truncate">
                                  {locale === 'ar' ? dayHolidays[0].nameAr : dayHolidays[0].nameEn}
                                </p>
                              )}
                              {/* Leave dots */}
                              {uniqueTypes.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                  {uniqueTypes.slice(0, 4).map((type) => (
                                    <span
                                      key={type}
                                      className={`w-2 h-2 rounded-full ${leaveTypeConfig[type]?.dot || 'bg-gray-400'}`}
                                      title={locale === 'ar' ? leaveTypeConfig[type]?.labelAr : leaveTypeConfig[type]?.labelEn}
                                    />
                                  ))}
                                </div>
                              )}
                              {dayLeaves.length > 0 && (
                                <span className="text-[10px] text-gray-400 mt-0.5 block">
                                  {dayLeaves.length} {locale === 'ar' ? 'إجازة' : 'off'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                        {(Object.keys(leaveTypeConfig) as LeaveType[]).map((type) => {
                          const cfg = leaveTypeConfig[type];
                          return (
                            <div key={type} className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                              <span className="text-xs text-gray-600">
                                {locale === 'ar' ? cfg.labelAr : cfg.labelEn}
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-1.5">
                          <Flag className="w-2.5 h-2.5 text-green-600" />
                          <span className="text-xs text-gray-600">
                            {locale === 'ar' ? 'عطلة رسمية (السعودية)' : 'Public Holiday (SA)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" />
                          <span className="text-xs text-gray-600">
                            {locale === 'ar' ? 'عطلة نهاية الأسبوع (جمعة - سبت)' : 'Weekend (Fri - Sat)'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Side panel: selected day details */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {selectedDay
                          ? format(selectedDay, 'EEEE, d MMMM', { locale: dateFnsLocale })
                          : (locale === 'ar' ? 'اختر يوماً' : 'Select a day')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedDay ? (
                        <p className="text-xs text-muted-foreground">
                          {locale === 'ar' ? 'انقر على يوم في التقويم لعرض التفاصيل' : 'Click a day on the calendar to see details'}
                        </p>
                      ) : (() => {
                        const selKey = format(selectedDay, 'yyyy-MM-dd');
                        const selHolidays = holidayDayMap[selKey] || [];
                        const hasContent = selectedDayLeaves.length > 0 || selHolidays.length > 0;
                        if (!hasContent) return (
                          <p className="text-xs text-muted-foreground">
                            {locale === 'ar' ? 'لا توجد إجازات في هذا اليوم' : 'No leaves on this day'}
                          </p>
                        );
                        return (
                          <div className="space-y-2">
                            {selHolidays.map((h) => (
                              <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                                <Flag className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-green-800 truncate">
                                    {locale === 'ar' ? h.nameAr : h.nameEn}
                                  </p>
                                  <p className="text-[10px] text-green-600">
                                    {locale === 'ar' ? 'عطلة رسمية' : 'Public Holiday'}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {selectedDayLeaves.map((req) => {
                              const cfg = leaveTypeConfig[req.type];
                              return (
                                <div key={req._id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg?.dot || 'bg-gray-400'}`} />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{getUserName(req.userId)}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {locale === 'ar' ? cfg?.labelAr : cfg?.labelEn}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() }
                    </CardContent>
                  </Card>

                  {/* Pending requests summary */}
                  {pendingRequests.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {locale === 'ar' ? 'طلبات معلقة' : 'Pending Requests'}
                          <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {pendingRequests.length}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LeaveRequestsPanel
                          requests={pendingRequests.slice(0, 5)}
                          isLoading={false}
                          showActions={true}
                        />
                        {pendingRequests.length > 5 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setActiveTab('requests')}
                          >
                            {locale === 'ar' ? `عرض الكل (${pendingRequests.length})` : `View all (${pendingRequests.length})`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === 'ar' ? 'جميع الطلبات' : 'All Requests'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaveRequestsPanel
                    requests={leaveRequests}
                    isLoading={leavesLoading}
                    showActions={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    {locale === 'ar'
                      ? `رصيد الإجازات — ${format(yearStart, 'yyyy')}`
                      : `Leave Balance — ${format(yearStart, 'yyyy')}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {memberBalances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'لا يوجد أعضاء في الفريق' : 'No team members found'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Header row */}
                      <div className="hidden md:grid md:grid-cols-[1fr_repeat(3,minmax(0,120px))] gap-4 px-4 pb-2 border-b text-xs font-medium text-muted-foreground">
                        <span>{locale === 'ar' ? 'العضو' : 'Member'}</span>
                        {(Object.entries(ANNUAL_ENTITLEMENTS) as [LeaveType, { days: number; labelEn: string; labelAr: string }][]).map(([type, ent]) => (
                          <span key={type} className="text-center">
                            {locale === 'ar' ? ent.labelAr : ent.labelEn}
                          </span>
                        ))}
                      </div>

                      {/* Member rows */}
                      {memberBalances.map((member) => (
                        <div
                          key={member.id}
                          className="grid grid-cols-1 md:grid-cols-[1fr_repeat(3,minmax(0,120px))] gap-4 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                        >
                          {/* Member info */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                            </div>
                            {member.role === 'leader' && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                                {locale === 'ar' ? 'قائد' : 'Leader'}
                              </span>
                            )}
                          </div>

                          {/* Balance columns */}
                          {(Object.entries(ANNUAL_ENTITLEMENTS) as [LeaveType, { days: number; labelEn: string; labelAr: string }][]).map(([type, ent]) => {
                            const used = member.used[type] || 0;
                            const total = ent.days;
                            const remaining = Math.max(0, total - used);
                            const pct = Math.min(100, (used / total) * 100);
                            const isOver = used > total;

                            return (
                              <div key={type} className="flex flex-col items-center gap-1">
                                {/* Mobile label */}
                                <span className="md:hidden text-[10px] text-muted-foreground">
                                  {locale === 'ar' ? ent.labelAr : ent.labelEn}
                                </span>
                                {/* Progress bar */}
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isOver ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : leaveTypeConfig[type]?.dot || 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                {/* Numbers */}
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-700'}`}>
                                    {used}
                                  </span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-500">{total}</span>
                                  <span className="text-muted-foreground ms-1">
                                    ({locale === 'ar' ? `${remaining} متبقي` : `${remaining} left`})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Summary footer */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-[11px] text-muted-foreground">
                          {locale === 'ar'
                            ? `الرصيد السنوي: إجازة ${ANNUAL_ENTITLEMENTS.vacation?.days} يوم • مرضية ${ANNUAL_ENTITLEMENTS.sick?.days} أيام • عمل من المنزل ${ANNUAL_ENTITLEMENTS.wfh?.days} يوم`
                            : `Annual entitlement: Vacation ${ANNUAL_ENTITLEMENTS.vacation?.days}d • Sick ${ANNUAL_ENTITLEMENTS.sick?.days}d • WFH ${ANNUAL_ENTITLEMENTS.wfh?.days}d`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holidays">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-green-600" />
                    {locale === 'ar' ? 'العطل الرسمية في المملكة العربية السعودية' : 'Saudi Arabia Public Holidays'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const years = [...new Set(SAUDI_PUBLIC_HOLIDAYS.map((h) => h.year))].sort();
                    return (
                      <div className="space-y-6">
                        {years.map((year) => {
                          const yearHolidays = SAUDI_PUBLIC_HOLIDAYS.filter((h) => h.year === year);
                          return (
                            <div key={year}>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{year}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {yearHolidays.map((h) => {
                                  const start = new Date(h.startDate);
                                  const end = new Date(h.endDate);
                                  const isSingleDay = h.startDate === h.endDate;
                                  const days = isSingleDay ? 1 : Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
                                  const isPast = end < new Date();

                                  return (
                                    <div
                                      key={h.id}
                                      className={`flex items-start gap-3 p-4 rounded-lg border ${isPast ? 'bg-gray-50 opacity-60' : 'bg-green-50 border-green-200'}`}
                                    >
                                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${isPast ? 'bg-gray-200' : 'bg-green-100'}`}>
                                        <Flag className={`h-5 w-5 ${isPast ? 'text-gray-400' : 'text-green-600'}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${isPast ? 'text-gray-500' : 'text-green-800'}`}>
                                          {locale === 'ar' ? h.nameAr : h.nameEn}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {start.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric' })}
                                          {!isSingleDay && (
                                            <>
                                              {' → '}
                                              {end.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric' })}
                                            </>
                                          )}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                          {days} {days === 1
                                            ? (locale === 'ar' ? 'يوم' : 'day')
                                            : (locale === 'ar' ? 'أيام' : 'days')}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Request Leave Dialog */}
        {selectedTeamId && (
          <RequestLeaveDialog
            open={requestDialogOpen}
            onOpenChange={setRequestDialogOpen}
            teamId={selectedTeamId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
