import ChangeCalendar, { IChangeCalendarEvent } from '../entities/ChangeCalendar';
import Change from '../entities/Change';
import Counter from '../entities/Counter';
import { ChangeCalendarEventType, ChangeStatus, ChangeType, RiskLevel, Impact } from '../types/itsm.types';
import ApiError from '../../utils/ApiError';
import logger from '../../utils/logger';

export interface CreateCalendarEventDTO {
  type: ChangeCalendarEventType;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  site_id?: string;
  created_by: string;
  created_by_name: string;
}

export interface ScheduleConflict {
  conflicting_event_id: string;
  conflicting_event_title: string;
  type: ChangeCalendarEventType;
  start_date: Date;
  end_date: Date;
  is_freeze_window: boolean;
}

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  breakdown: {
    impact_score: number;
    change_type_score: number;
    affected_cis_score: number;
    rollback_score: number;
  };
}

export class ChangeCalendarService {
  /**
   * Compute risk score for a change (0-100)
   */
  computeRiskScore(data: {
    impact: Impact;
    type: ChangeType;
    affected_cis?: string[];
    rollback_plan?: string;
  }): RiskScoreResult {
    // Impact score (0-40)
    const impactScores: Record<Impact, number> = {
      [Impact.HIGH]: 40,
      [Impact.MEDIUM]: 20,
      [Impact.LOW]: 10,
    };
    const impact_score = impactScores[data.impact] || 20;

    // Change type score (0-30)
    const typeScores: Record<ChangeType, number> = {
      [ChangeType.EMERGENCY]: 30,
      [ChangeType.NORMAL]: 15,
      [ChangeType.STANDARD]: 5,
    };
    const change_type_score = typeScores[data.type] || 15;

    // Affected CIs score (0-20)
    const ciCount = data.affected_cis?.length || 0;
    const affected_cis_score = Math.min(ciCount * 4, 20);

    // Rollback plan score (0-10) — no rollback = higher risk
    const rollback_score = data.rollback_plan && data.rollback_plan.trim().length > 20 ? 0 : 10;

    const score = impact_score + change_type_score + affected_cis_score + rollback_score;

    let level: RiskLevel;
    if (score >= 60) {
      level = RiskLevel.HIGH;
    } else if (score >= 30) {
      level = RiskLevel.MEDIUM;
    } else {
      level = RiskLevel.LOW;
    }

    return {
      score,
      level,
      breakdown: { impact_score, change_type_score, affected_cis_score, rollback_score },
    };
  }

  /**
   * Validate schedule: check for freeze windows and overlapping changes
   */
  async validateSchedule(
    changeId: string,
    plannedStart: Date,
    plannedEnd: Date,
    siteId?: string
  ): Promise<{ valid: boolean; conflicts: ScheduleConflict[] }> {
    const query: any = {
      $or: [
        { start_date: { $lte: plannedEnd }, end_date: { $gte: plannedStart } },
      ],
    };
    if (siteId) query.site_id = { $in: [siteId, null] };

    const conflictingEvents = await ChangeCalendar.find(query);

    const conflicts: ScheduleConflict[] = conflictingEvents.map((e) => ({
      conflicting_event_id: e.event_id,
      conflicting_event_title: e.title,
      type: e.type,
      start_date: e.start_date,
      end_date: e.end_date,
      is_freeze_window: e.type === ChangeCalendarEventType.FREEZE_WINDOW,
    }));

    const hasFreezeConflict = conflicts.some((c) => c.is_freeze_window);

    logger.info(`Schedule validation for change ${changeId}`, {
      conflicts: conflicts.length,
      hasFreezeConflict,
    });

    return {
      valid: !hasFreezeConflict,
      conflicts,
    };
  }

  /**
   * Validate SoD: requester cannot be an approver
   */
  validateSoD(requesterId: string, approverIds: string[]): boolean {
    return !approverIds.includes(requesterId);
  }

  /**
   * Create a calendar event (freeze window, maintenance window, CAB meeting)
   */
  async createEvent(data: CreateCalendarEventDTO): Promise<IChangeCalendarEvent> {
    if (data.end_date <= data.start_date) {
      throw new ApiError(400, 'end_date must be after start_date');
    }

    const eventId = await Counter.generateId('CCAL');

    const event = await ChangeCalendar.create({
      event_id: eventId,
      ...data,
    });

    logger.info(`Change calendar event created: ${eventId}`, { type: data.type });
    return event;
  }

  /**
   * Get calendar events in a date range
   */
  async getEvents(filters: {
    from?: Date;
    to?: Date;
    type?: ChangeCalendarEventType;
    site_id?: string;
  }): Promise<IChangeCalendarEvent[]> {
    const query: any = {};

    if (filters.from || filters.to) {
      query.start_date = {};
      if (filters.from) query.start_date.$gte = filters.from;
      if (filters.to) query.start_date.$lte = filters.to;
    }
    if (filters.type) query.type = filters.type;
    if (filters.site_id) query.site_id = { $in: [filters.site_id, null] };

    return ChangeCalendar.find(query).sort({ start_date: 1 });
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const event = await ChangeCalendar.findOne({ event_id: eventId });
    if (!event) throw new ApiError(404, `Calendar event not found: ${eventId}`);

    await ChangeCalendar.deleteOne({ event_id: eventId });
    logger.info(`Calendar event deleted: ${eventId}`, { deletedBy: userId });
  }

  /**
   * Route approvals based on change type and risk
   * Standard → auto-approved; Normal → CAB; Emergency → retrospective
   */
  routeApprovals(type: ChangeType, riskLevel: RiskLevel): {
    requires_cab: boolean;
    auto_approve: boolean;
    retrospective: boolean;
    minimum_approvers: number;
  } {
    if (type === ChangeType.STANDARD) {
      return { requires_cab: false, auto_approve: true, retrospective: false, minimum_approvers: 0 };
    }

    if (type === ChangeType.EMERGENCY) {
      return { requires_cab: false, auto_approve: false, retrospective: true, minimum_approvers: 1 };
    }

    // NORMAL — depends on risk
    return {
      requires_cab: riskLevel === RiskLevel.HIGH,
      auto_approve: false,
      retrospective: false,
      minimum_approvers: riskLevel === RiskLevel.HIGH ? 3 : riskLevel === RiskLevel.MEDIUM ? 2 : 1,
    };
  }
}

export default new ChangeCalendarService();
