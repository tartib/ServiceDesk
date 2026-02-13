'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay, eachHourOfInterval, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTaskStatusColor, formatTime } from '@/lib/utils';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type CalendarViewMode = 'month' | 'day' | 'hour';

export default function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const { locale } = useLanguage();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledAt);
      return isSameDay(taskDate, day);
    });
  };

  const getTasksForHour = (hour: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledAt);
      return taskDate.getHours() === hour.getHours() && isSameDay(taskDate, hour);
    });
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = locale === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render different views based on viewMode
  const renderMonthView = () => (
    <>
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Week Day Headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm py-2 text-gray-600 border-b"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isTodayDate ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-50 transition-colors`}
              >
                {/* Date Number */}
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-blue-600 font-bold' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>

                {/* Tasks for this day */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                        getTaskStatusColor(task.status)
                      } truncate`}
                      title={task.productName}
                    >
                      {task.productName}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayTasks.length - 3} {locale === 'ar' ? 'أخرى' : 'more'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-800">
            {locale === 'ar' ? 'مجدولة' : 'Scheduled'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            {locale === 'ar' ? 'قيد العمل' : 'In Progress'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            {locale === 'ar' ? 'مكتملة' : 'Completed'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-100 text-red-800">
            {locale === 'ar' ? 'متأخرة' : 'Late'}
          </Badge>
        </div>
      </div>
    </>
  );

  // Render Day View
  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });
    const dayTasks = getTasksForDay(currentDate);

    return (
      <>
        <Card className="p-4">
          <div className="space-y-2">
            {hours.map((hour) => {
              const hourTasks = getTasksForHour(hour);
              return (
                <div key={hour.toString()} className="flex gap-2 border-b pb-2">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {format(hour, 'HH:mm')}
                  </div>
                  <div className="flex-1 space-y-1">
                    {hourTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                          getTaskStatusColor(task.status)
                        }`}
                      >
                        <div className="font-medium">{task.productName}</div>
                        <div className="text-xs">{formatTime(task.scheduledAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </>
    );
  };

  // Render Hour View (detailed)
  const renderHourView = () => {
    const dayTasks = getTasksForDay(currentDate);

    return (
      <>
        <Card className="p-4">
          <div className="space-y-3">
            {dayTasks.length > 0 ? (
              dayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-all ${
                    getTaskStatusColor(task.status)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.productName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(task.scheduledAt)}</span>
                      </div>
                      {task.assignedToName && (
                        <div className="text-sm mt-1 text-gray-600">
                          {locale === 'ar' ? 'المسؤول' : 'Assigned to'}: {task.assignedToName}
                        </div>
                      )}
                    </div>
                    <Badge className="font-medium">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                {locale === 'ar' ? 'لا توجد مهام في هذا اليوم' : 'No tasks for this day'}
              </div>
            )}
          </div>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">
          {viewMode === 'month'
            ? format(currentDate, 'MMMM yyyy', { locale: locale === 'ar' ? ar : undefined })
            : format(currentDate, 'EEEE, MMMM d, yyyy', { locale: locale === 'ar' ? ar : undefined })}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {/* View Mode Buttons */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              size="sm"
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              onClick={() => setViewMode('month')}
              className="gap-1"
            >
              <CalendarIcon className="h-4 w-4" />
              {locale === 'ar' ? 'شهر' : 'Month'}
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              onClick={() => setViewMode('day')}
              className="gap-1"
            >
              <Clock className="h-4 w-4" />
              {locale === 'ar' ? 'يوم' : 'Day'}
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'hour' ? 'default' : 'ghost'}
              onClick={() => setViewMode('hour')}
              className="gap-1"
            >
              <Clock className="h-4 w-4" />
              {locale === 'ar' ? 'ساعة' : 'Hour'}
            </Button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleToday} variant="outline" size="sm">
              {locale === 'ar' ? 'اليوم' : 'Today'}
            </Button>
            <Button onClick={handlePrev} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleNext} variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Render appropriate view */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'hour' && renderHourView()}
    </div>
  );
}
