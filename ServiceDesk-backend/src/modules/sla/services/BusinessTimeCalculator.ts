/**
 * Business Time Calculator
 *
 * Pure-function service for computing business-hours-aware durations.
 * All calculations respect timezone, working hours, and holidays from the calendar.
 */

import { ISlaCalendarResolved, ISlaWorkingHours } from '../domain';

interface DaySchedule {
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  isWorkingDay: boolean;
}

/**
 * Parse "HH:mm" to minutes from midnight
 */
function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Get the local date string (YYYY-MM-DD) in a timezone
 */
function getLocalDateStr(date: Date, tz: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD
}

/**
 * Get the local day of week (0=Sun) in a timezone
 */
function getLocalDayOfWeek(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).formatToParts(date);
  const wd = parts.find((p) => p.type === 'weekday')?.value || '';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

/**
 * Get the local time in minutes from midnight in a timezone
 */
function getLocalMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return h * 60 + m;
}

/**
 * Build a schedule map from working hours: dayOfWeek → DaySchedule
 */
function buildScheduleMap(wh: ISlaWorkingHours[]): Map<number, DaySchedule> {
  const map = new Map<number, DaySchedule>();
  for (const h of wh) {
    map.set(h.dayOfWeek, {
      startMinutes: parseTime(h.startTime),
      endMinutes: parseTime(h.endTime),
      isWorkingDay: h.isWorkingDay,
    });
  }
  return map;
}

/**
 * Build a Set of holiday date strings for fast lookup
 */
function buildHolidaySet(calendar: ISlaCalendarResolved): Set<string> {
  return new Set(calendar.holidays.map((h) => h.holidayDate));
}

/**
 * Check if a specific date (in the calendar's timezone) is a holiday
 */
function isHoliday(date: Date, tz: string, holidays: Set<string>): boolean {
  return holidays.has(getLocalDateStr(date, tz));
}

export class BusinessTimeCalculator {
  /**
   * Add business minutes to a start date, returning the resulting date.
   * Walks forward through business hours, skipping non-working days and holidays.
   */
  addBusinessMinutes(start: Date, minutes: number, calendar: ISlaCalendarResolved): Date {
    if (minutes <= 0) return new Date(start);

    const tz = calendar.timezone;
    const schedule = buildScheduleMap(calendar.workingHours);
    const holidays = buildHolidaySet(calendar);

    let remaining = minutes;
    let cursor = new Date(start);

    // Maximum 365 * 2 iterations as safety valve
    for (let safety = 0; safety < 730 && remaining > 0; safety++) {
      const dow = getLocalDayOfWeek(cursor, tz);
      const sched = schedule.get(dow);

      // Skip non-working days or holidays
      if (!sched || !sched.isWorkingDay || isHoliday(cursor, tz, holidays)) {
        cursor = this.advanceToNextDay(cursor, tz);
        continue;
      }

      const localMin = getLocalMinutes(cursor, tz);

      // If before business hours start, snap to start
      if (localMin < sched.startMinutes) {
        cursor = new Date(cursor.getTime() + (sched.startMinutes - localMin) * 60_000);
      }

      const currentMin = getLocalMinutes(cursor, tz);

      // If past business hours end, skip to next day
      if (currentMin >= sched.endMinutes) {
        cursor = this.advanceToNextDay(cursor, tz);
        continue;
      }

      // Available minutes in current business day
      const available = sched.endMinutes - currentMin;

      if (available >= remaining) {
        // Done: add remaining minutes
        return new Date(cursor.getTime() + remaining * 60_000);
      }

      // Consume the rest of this business day and move on
      remaining -= available;
      cursor = this.advanceToNextDay(cursor, tz);
    }

    return cursor;
  }

  /**
   * Calculate elapsed business seconds between two dates.
   */
  getElapsedBusinessSeconds(start: Date, end: Date, calendar: ISlaCalendarResolved): number {
    if (end <= start) return 0;

    const tz = calendar.timezone;
    const schedule = buildScheduleMap(calendar.workingHours);
    const holidays = buildHolidaySet(calendar);

    let totalSeconds = 0;
    let cursor = new Date(start);

    for (let safety = 0; safety < 730 && cursor < end; safety++) {
      const dow = getLocalDayOfWeek(cursor, tz);
      const sched = schedule.get(dow);

      if (!sched || !sched.isWorkingDay || isHoliday(cursor, tz, holidays)) {
        cursor = this.advanceToNextDay(cursor, tz);
        continue;
      }

      let localMin = getLocalMinutes(cursor, tz);

      // Snap to business start if early
      if (localMin < sched.startMinutes) {
        cursor = new Date(cursor.getTime() + (sched.startMinutes - localMin) * 60_000);
        localMin = sched.startMinutes;
      }

      // Past end of business? Next day
      if (localMin >= sched.endMinutes) {
        cursor = this.advanceToNextDay(cursor, tz);
        continue;
      }

      // Calculate overlap between [cursor, end] and [bizStart, bizEnd]
      const bizEndDate = new Date(cursor.getTime() + (sched.endMinutes - localMin) * 60_000);
      const segmentEnd = end < bizEndDate ? end : bizEndDate;

      const segmentMs = segmentEnd.getTime() - cursor.getTime();
      if (segmentMs > 0) {
        totalSeconds += Math.floor(segmentMs / 1000);
      }

      if (end <= bizEndDate) break;

      cursor = this.advanceToNextDay(cursor, tz);
    }

    return totalSeconds;
  }

  /**
   * Check if a date falls within business hours.
   */
  isWithinBusinessHours(date: Date, calendar: ISlaCalendarResolved): boolean {
    const tz = calendar.timezone;
    const schedule = buildScheduleMap(calendar.workingHours);
    const holidays = buildHolidaySet(calendar);

    if (isHoliday(date, tz, holidays)) return false;

    const dow = getLocalDayOfWeek(date, tz);
    const sched = schedule.get(dow);
    if (!sched || !sched.isWorkingDay) return false;

    const localMin = getLocalMinutes(date, tz);
    return localMin >= sched.startMinutes && localMin < sched.endMinutes;
  }

  /**
   * Get the next business hours start after a given date.
   */
  getNextBusinessStart(date: Date, calendar: ISlaCalendarResolved): Date {
    const tz = calendar.timezone;
    const schedule = buildScheduleMap(calendar.workingHours);
    const holidays = buildHolidaySet(calendar);

    let cursor = new Date(date);

    for (let safety = 0; safety < 365; safety++) {
      const dow = getLocalDayOfWeek(cursor, tz);
      const sched = schedule.get(dow);

      if (sched && sched.isWorkingDay && !isHoliday(cursor, tz, holidays)) {
        const localMin = getLocalMinutes(cursor, tz);

        if (localMin < sched.startMinutes) {
          // Business hasn't started yet today — snap to start
          return new Date(cursor.getTime() + (sched.startMinutes - localMin) * 60_000);
        }

        if (localMin < sched.endMinutes) {
          // Already within business hours
          return cursor;
        }
      }

      cursor = this.advanceToNextDay(cursor, tz);
    }

    return cursor;
  }

  /**
   * Advance to midnight (local) of the next day.
   */
  private advanceToNextDay(date: Date, tz: string): Date {
    // Add 24 hours then snap to midnight in the tz
    const next = new Date(date.getTime() + 24 * 60 * 60_000);
    const localMin = getLocalMinutes(next, tz);
    return new Date(next.getTime() - localMin * 60_000);
  }
}

export const businessTimeCalculator = new BusinessTimeCalculator();
