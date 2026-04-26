import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Task, ZoomLevel, TimelineColumn, TimelineRange, TimelineSettings, TaskBarStyle } from './types';

export function useRoadmapTimeline(tasks: Task[], projectId: string) {
 const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
 const timelineRef = useRef<HTMLDivElement>(null);
 const previousZoomLevel = useRef<ZoomLevel>('month');

 const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>(() => {
 if (typeof window !== 'undefined') {
 try {
 const saved = localStorage.getItem(`roadmap_settings_${projectId}`);
 if (saved) return JSON.parse(saved);
 } catch {}
 }
 return { showWeekends: true, colorBy: 'status' as const, showProgress: true, showLabels: true };
 });

 // Persist timeline settings
 useEffect(() => {
 try { localStorage.setItem(`roadmap_settings_${projectId}`, JSON.stringify(timelineSettings)); } catch {}
 }, [timelineSettings, projectId]);

 // Timeline date range based on zoom level AND task dates
 const timelineRange: TimelineRange = useMemo(() => {
 const now = new Date();
 
 // Find earliest and latest dates from all tasks
 let earliestDate = new Date(now);
 let latestDate = new Date(now);
 
 tasks.forEach(task => {
 const taskStart = task.startDate ? new Date(task.startDate) : 
 task.startDateRFC3339 ? new Date(task.startDateRFC3339) : null;
 const taskEnd = task.dueDate ? new Date(task.dueDate) : 
 task.dueDateRFC3339 ? new Date(task.dueDateRFC3339) : null;
 
 // Update earliest date
 if (taskStart && taskStart.getTime() < earliestDate.getTime()) {
 earliestDate = new Date(taskStart);
 }
 // Update latest date
 if (taskEnd && taskEnd.getTime() > latestDate.getTime()) {
 latestDate = new Date(taskEnd);
 }
 // Also check start date for latest (in case no due date)
 if (taskStart && taskStart.getTime() > latestDate.getTime()) {
 latestDate = new Date(taskStart);
 }
 });
 
 // Add padding around the range
 let startDate: Date;
 let endDate: Date;
 let totalDays: number;
 
 switch (zoomLevel) {
 case 'day':
 // Start 7 days before earliest task
 startDate = new Date(earliestDate);
 startDate.setDate(startDate.getDate() - 7);
 startDate.setHours(0, 0, 0, 0);
 // End 14 days after latest task
 endDate = new Date(latestDate);
 endDate.setDate(endDate.getDate() + 14);
 endDate.setHours(23, 59, 59, 999);
 totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
 if (totalDays < 30) {
 endDate = new Date(startDate);
 endDate.setDate(endDate.getDate() + 30);
 endDate.setHours(23, 59, 59, 999);
 totalDays = 30;
 }
 break;
 case 'week':
 // Start 2 weeks before earliest task
 startDate = new Date(earliestDate);
 startDate.setDate(startDate.getDate() - startDate.getDay() - 14);
 startDate.setHours(0, 0, 0, 0);
 // End 4 weeks after latest task
 endDate = new Date(latestDate);
 endDate.setDate(endDate.getDate() + 28);
 endDate.setHours(23, 59, 59, 999);
 totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
 if (totalDays < 56) {
 endDate = new Date(startDate);
 endDate.setDate(endDate.getDate() + 56);
 endDate.setHours(23, 59, 59, 999);
 totalDays = 56;
 }
 break;
 case 'month':
 // Start 1 month before earliest task
 startDate = new Date(earliestDate);
 startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
 // End 2 months after latest task
 endDate = new Date(latestDate);
 endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 3, 0);
 totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
 break;
 case 'quarter':
 default:
 // Start 1 quarter before earliest task
 startDate = new Date(earliestDate);
 startDate = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3 - 3, 1);
 // End 2 quarters after latest task
 endDate = new Date(latestDate);
 endDate = new Date(endDate.getFullYear(), Math.floor(endDate.getMonth() / 3) * 3 + 9, 0);
 totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
 break;
 }
 
 return { startDate, endDate, totalDays, now };
 }, [zoomLevel, tasks]);

 // Calculate position and width for a task bar based on dates
 const getTaskBarStyle = useCallback((task: Task, columnsCount: number): TaskBarStyle => {
 const { startDate: rangeStart, totalDays } = timelineRange;
 
 // Check if dates are missing
 const hasMissingDates = !task.startDate && !task.startDateRFC3339 && !task.dueDate && !task.dueDateRFC3339;
 
 // Use any available date, fallback to today
 let taskStart = task.startDate ? new Date(task.startDate) : 
 task.startDateRFC3339 ? new Date(task.startDateRFC3339) : new Date();
 let taskEnd = task.dueDate ? new Date(task.dueDate) : 
 task.dueDateRFC3339 ? new Date(task.dueDateRFC3339) : 
 new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);
 
 // Normalize to start of day for consistent calculation
 taskStart = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
 taskEnd = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());
 const rangeStartNorm = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
 
 // For day view, use columnsCount (number of days shown)
 // For other views, use totalDays
 const effectiveTotalDays = zoomLevel === 'day' ? columnsCount : totalDays;
 
 // Calculate actual start offset in days
 const startOffsetDays = Math.floor((taskStart.getTime() - rangeStartNorm.getTime()) / (1000 * 60 * 60 * 24));
 const endOffsetDays = Math.floor((taskEnd.getTime() - rangeStartNorm.getTime()) / (1000 * 60 * 60 * 24)) + 1;
 
 // Clamp to visible range
 const visibleStart = Math.max(0, startOffsetDays);
 const visibleEnd = Math.min(effectiveTotalDays, endOffsetDays);
 const visibleDuration = Math.max(1, visibleEnd - visibleStart);
 
 // Check if task is visible in current range
 const isVisible = endOffsetDays > 0 && startOffsetDays < effectiveTotalDays;
 
 // Check for continuation arrows
 const showLeftArrow = startOffsetDays < 0;
 const showRightArrow = endOffsetDays > effectiveTotalDays;
 
 const leftPercent = (visibleStart / effectiveTotalDays) * 100;
 const widthPercent = (visibleDuration / effectiveTotalDays) * 100;
 
 // Always show tasks, but position them at start if before range or end if after range
 if (!isVisible) {
 if (endOffsetDays <= 0) {
 return { left: '0%', width: '2%', opacity: 0.5, hasMissingDates, showLeftArrow: true, showRightArrow: false };
 } else {
 return { left: '98%', width: '2%', opacity: 0.5, hasMissingDates, showLeftArrow: false, showRightArrow: true };
 }
 }
 
 return {
 left: `${Math.max(0, Math.min(100, leftPercent))}%`,
 width: `${Math.max(2, Math.min(100 - leftPercent, widthPercent))}%`,
 hasMissingDates,
 showLeftArrow,
 showRightArrow,
 };
 }, [timelineRange, zoomLevel]);

 // Calculate today line position and visibility
 const getTodayPosition = useCallback(() => {
 const { startDate: rangeStart, endDate: rangeEnd, totalDays, now } = timelineRange;
 const daysSinceStart = (now.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
 
 // Check if today is within the visible range
 const isVisible = now >= rangeStart && now <= rangeEnd;
 
 return {
 left: `${(daysSinceStart / totalDays) * 100}%`,
 isVisible,
 };
 }, [timelineRange]);

 // Generate timeline columns based on zoom level and timelineRange
 const timelineColumns: TimelineColumn[] = useMemo(() => {
 const columns: TimelineColumn[] = [];
 const now = new Date();
 const { startDate: rangeStart, totalDays } = timelineRange;
 
 switch (zoomLevel) {
 case 'day': {
 let lastMonth = -1;
 for (let i = 0; i < totalDays; i++) {
 const date = new Date(rangeStart);
 date.setDate(date.getDate() + i);
 const isFirstOfMonth = date.getMonth() !== lastMonth;
 lastMonth = date.getMonth();
 columns.push({
 label: date.getDate().toString(),
 sublabel: undefined,
 isCurrent: date.toDateString() === now.toDateString(),
 date,
 monthLabel: date.toLocaleDateString('en-US', { month: 'short' }),
 isFirstOfMonth,
 });
 }
 break;
 }
 case 'week': {
 const numWeeks = Math.ceil(totalDays / 7);
 for (let i = 0; i < numWeeks; i++) {
 const date = new Date(rangeStart);
 date.setDate(date.getDate() + (i * 7));
 const weekOfYear = Math.ceil((((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
 columns.push({
 label: `W${weekOfYear}`,
 sublabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
 isCurrent: now >= date && now < new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
 date,
 });
 }
 break;
 }
 case 'month': {
 const startMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
 const endMonth = new Date(timelineRange.endDate.getFullYear(), timelineRange.endDate.getMonth(), 1);
 const currentMonthDate = new Date(startMonth);
 while (currentMonthDate <= endMonth) {
 const monthDate = new Date(currentMonthDate);
 columns.push({
 label: monthDate.toLocaleDateString('en-US', { month: 'long' }),
 sublabel: monthDate.getFullYear() !== now.getFullYear() ? monthDate.getFullYear().toString() : '',
 isCurrent: monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear(),
 date: monthDate,
 });
 currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
 }
 break;
 }
 case 'quarter': {
 const startQuarterMonth = Math.floor(rangeStart.getMonth() / 3) * 3;
 const startQuarterDate = new Date(rangeStart.getFullYear(), startQuarterMonth, 1);
 const endQuarterDate = new Date(timelineRange.endDate.getFullYear(), Math.floor(timelineRange.endDate.getMonth() / 3) * 3, 1);
 const currentQuarterDate = new Date(startQuarterDate);
 while (currentQuarterDate <= endQuarterDate) {
 const quarterDate = new Date(currentQuarterDate);
 const quarterIndex = Math.floor(quarterDate.getMonth() / 3);
 const isCurrentQuarter = quarterIndex === Math.floor(now.getMonth() / 3) && quarterDate.getFullYear() === now.getFullYear();
 columns.push({
 label: `Q${quarterIndex + 1}`,
 sublabel: quarterDate.getFullYear().toString(),
 isCurrent: isCurrentQuarter,
 date: quarterDate,
 });
 currentQuarterDate.setMonth(currentQuarterDate.getMonth() + 3);
 }
 break;
 }
 }
 
 return columns;
 }, [zoomLevel, timelineRange]);

 // Handle zoom level change with scroll position preservation
 const handleZoomChange = useCallback((newZoom: ZoomLevel) => {
 if (!timelineRef.current) {
 setZoomLevel(newZoom);
 return;
 }
 
 const scrollContainer = timelineRef.current;
 const scrollLeft = scrollContainer.scrollLeft;
 const scrollWidth = scrollContainer.scrollWidth;
 const clientWidth = scrollContainer.clientWidth;
 
 // Calculate scroll ratio (0 to 1) representing position in timeline
 const scrollRatio = scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0;
 
 // Store previous zoom for transition
 previousZoomLevel.current = zoomLevel;
 
 // Update zoom level
 setZoomLevel(newZoom);
 
 // Restore scroll position after render
 requestAnimationFrame(() => {
 if (timelineRef.current) {
 const newScrollWidth = timelineRef.current.scrollWidth;
 const newClientWidth = timelineRef.current.clientWidth;
 const newScrollLeft = scrollRatio * (newScrollWidth - newClientWidth);
 timelineRef.current.scrollLeft = Math.max(0, newScrollLeft);
 }
 });
 }, [zoomLevel]);

 return {
 zoomLevel,
 timelineRef,
 timelineRange,
 timelineColumns,
 timelineSettings,
 setTimelineSettings,
 getTaskBarStyle,
 getTodayPosition,
 handleZoomChange,
 };
}
