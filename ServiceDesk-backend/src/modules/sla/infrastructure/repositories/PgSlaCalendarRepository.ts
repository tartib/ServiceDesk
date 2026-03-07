/**
 * PostgreSQL SLA Calendar Repository
 *
 * Handles CRUD for sla_calendars, sla_calendar_working_hours, and sla_calendar_holidays.
 * Also provides the `resolve()` method that returns a fully hydrated calendar for clock calculations.
 */

import { getPool } from '../../../../shared/database/PostgresConnectionManager';
import {
  ISlaCalendarEntity,
  ISlaWorkingHours,
  ISlaHoliday,
  ISlaCalendarResolved,
} from '../../domain';
import logger from '../../../../utils/logger';

export class PgSlaCalendarRepository {
  // ── Calendar CRUD ──────────────────────────────────────────

  async create(data: Partial<ISlaCalendarEntity>): Promise<ISlaCalendarEntity> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_calendars (tenant_id, name, name_ar, timezone, is_default, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.tenantId, data.name, data.nameAr, data.timezone || 'Asia/Riyadh', data.isDefault ?? false, data.isActive ?? true, data.createdBy]
    );
    return this.mapRow(res.rows[0]);
  }

  async findById(id: string): Promise<ISlaCalendarEntity | null> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM sla_calendars WHERE id = $1', [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByTenant(tenantId: string): Promise<ISlaCalendarEntity[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_calendars WHERE tenant_id = $1 ORDER BY name',
      [tenantId]
    );
    return res.rows.map(this.mapRow);
  }

  async findDefault(tenantId: string): Promise<ISlaCalendarEntity | null> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_calendars WHERE tenant_id = $1 AND is_default = TRUE AND is_active = TRUE LIMIT 1',
      [tenantId]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async update(id: string, data: Partial<ISlaCalendarEntity>): Promise<ISlaCalendarEntity | null> {
    const pool = getPool();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(data.name); }
    if (data.nameAr !== undefined) { sets.push(`name_ar = $${idx++}`); vals.push(data.nameAr); }
    if (data.timezone !== undefined) { sets.push(`timezone = $${idx++}`); vals.push(data.timezone); }
    if (data.isDefault !== undefined) { sets.push(`is_default = $${idx++}`); vals.push(data.isDefault); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); vals.push(data.isActive); }

    if (sets.length === 0) return this.findById(id);

    vals.push(id);
    const res = await pool.query(
      `UPDATE sla_calendars SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const pool = getPool();
    const res = await pool.query('DELETE FROM sla_calendars WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ── Working Hours ──────────────────────────────────────────

  async setWorkingHours(calendarId: string, hours: Partial<ISlaWorkingHours>[]): Promise<ISlaWorkingHours[]> {
    const pool = getPool();
    // Delete existing then insert
    await pool.query('DELETE FROM sla_calendar_working_hours WHERE calendar_id = $1', [calendarId]);

    const result: ISlaWorkingHours[] = [];
    for (const h of hours) {
      const res = await pool.query(
        `INSERT INTO sla_calendar_working_hours (calendar_id, day_of_week, start_time, end_time, is_working_day)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [calendarId, h.dayOfWeek, h.startTime, h.endTime, h.isWorkingDay ?? true]
      );
      result.push(this.mapWorkingHoursRow(res.rows[0]));
    }
    return result;
  }

  async getWorkingHours(calendarId: string): Promise<ISlaWorkingHours[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_calendar_working_hours WHERE calendar_id = $1 ORDER BY day_of_week',
      [calendarId]
    );
    return res.rows.map(this.mapWorkingHoursRow);
  }

  // ── Holidays ───────────────────────────────────────────────

  async setHolidays(calendarId: string, holidays: Partial<ISlaHoliday>[]): Promise<ISlaHoliday[]> {
    const pool = getPool();
    await pool.query('DELETE FROM sla_calendar_holidays WHERE calendar_id = $1', [calendarId]);

    const result: ISlaHoliday[] = [];
    for (const h of holidays) {
      const res = await pool.query(
        `INSERT INTO sla_calendar_holidays (calendar_id, holiday_date, name, name_ar)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [calendarId, h.holidayDate, h.name, h.nameAr]
      );
      result.push(this.mapHolidayRow(res.rows[0]));
    }
    return result;
  }

  async getHolidays(calendarId: string): Promise<ISlaHoliday[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM sla_calendar_holidays WHERE calendar_id = $1 ORDER BY holiday_date',
      [calendarId]
    );
    return res.rows.map(this.mapHolidayRow);
  }

  async addHoliday(calendarId: string, holiday: Partial<ISlaHoliday>): Promise<ISlaHoliday> {
    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO sla_calendar_holidays (calendar_id, holiday_date, name, name_ar)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (calendar_id, holiday_date) DO UPDATE SET name = $3, name_ar = $4
       RETURNING *`,
      [calendarId, holiday.holidayDate, holiday.name, holiday.nameAr]
    );
    return this.mapHolidayRow(res.rows[0]);
  }

  async removeHoliday(calendarId: string, holidayDate: string): Promise<boolean> {
    const pool = getPool();
    const res = await pool.query(
      'DELETE FROM sla_calendar_holidays WHERE calendar_id = $1 AND holiday_date = $2',
      [calendarId, holidayDate]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // ── Resolve (hydrated calendar for clock engine) ───────────

  async resolve(calendarId: string): Promise<ISlaCalendarResolved | null> {
    const cal = await this.findById(calendarId);
    if (!cal) return null;

    const [workingHours, holidays] = await Promise.all([
      this.getWorkingHours(calendarId),
      this.getHolidays(calendarId),
    ]);

    return {
      id: cal.id!,
      timezone: cal.timezone,
      workingHours,
      holidays,
    };
  }

  async resolveDefault(tenantId: string): Promise<ISlaCalendarResolved | null> {
    const cal = await this.findDefault(tenantId);
    if (!cal) return null;
    return this.resolve(cal.id!);
  }

  // ── Row mappers ────────────────────────────────────────────

  private mapRow(row: any): ISlaCalendarEntity {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      nameAr: row.name_ar,
      timezone: row.timezone,
      isDefault: row.is_default,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapWorkingHoursRow(row: any): ISlaWorkingHours {
    return {
      id: row.id,
      calendarId: row.calendar_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      isWorkingDay: row.is_working_day,
    };
  }

  private mapHolidayRow(row: any): ISlaHoliday {
    return {
      id: row.id,
      calendarId: row.calendar_id,
      holidayDate: row.holiday_date,
      name: row.name,
      nameAr: row.name_ar,
    };
  }
}
