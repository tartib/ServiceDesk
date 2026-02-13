import { ISLA } from '../entities/SLA';
import { IIncident } from '../entities/Incident';
import { ISLAConfig, Priority, IEscalationLevel } from '../types/itsm.types';
import slaRepository from '../repositories/SLARepository';
import logger from '../../utils/logger';

export interface SLACalculationResult {
  sla_id: string;
  response_due: Date;
  resolution_due: Date;
  breach_flag: boolean;
  escalation_level: number;
}

export interface SLABreachCheck {
  is_breached: boolean;
  breach_type: 'response' | 'resolution' | null;
  time_remaining_minutes: number;
  escalation_level: number;
  next_escalation?: IEscalationLevel;
}

export class SLAEngine {
  /**
   * Calculate SLA due dates for a new incident
   */
  async calculateSLA(
    priority: Priority,
    categoryId?: string,
    siteId?: string,
    createdAt: Date = new Date()
  ): Promise<SLACalculationResult> {
    // Find applicable SLA
    const sla = await slaRepository.findApplicableSLA(priority, categoryId, siteId);

    if (!sla) {
      // Use default values if no SLA found
      logger.warn(`No SLA found for priority ${priority}, using defaults`);
      return this.getDefaultSLAConfig(priority, createdAt);
    }

    const responseDue = this.calculateDueDate(
      createdAt,
      sla.response_time.hours,
      sla.response_time.business_hours_only,
      sla.business_hours
    );

    const resolutionDue = this.calculateDueDate(
      createdAt,
      sla.resolution_time.hours,
      sla.resolution_time.business_hours_only,
      sla.business_hours
    );

    return {
      sla_id: sla.sla_id,
      response_due: responseDue,
      resolution_due: resolutionDue,
      breach_flag: false,
      escalation_level: 0,
    };
  }

  /**
   * Calculate due date considering business hours
   */
  private calculateDueDate(
    startDate: Date,
    hours: number,
    businessHoursOnly: boolean,
    businessHours?: ISLA['business_hours']
  ): Date {
    if (!businessHoursOnly || !businessHours) {
      // Simple calculation - add hours directly
      return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    }

    // Business hours calculation
    let remainingMinutes = hours * 60;
    let currentDate = new Date(startDate);

    while (remainingMinutes > 0) {
      const daySchedule = businessHours.schedule.find(
        (s) => s.day === currentDate.getDay()
      );

      if (daySchedule && daySchedule.is_working) {
        // Check if current time is within business hours
        const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
        const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);

        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, startMin, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMin, 0, 0);

        // Check if it's a holiday
        const isHoliday = businessHours.holidays.some(
          (h) => new Date(h).toDateString() === currentDate.toDateString()
        );

        if (!isHoliday) {
          if (currentDate < dayStart) {
            currentDate = dayStart;
          }

          if (currentDate >= dayStart && currentDate < dayEnd) {
            const availableMinutes = Math.floor(
              (dayEnd.getTime() - currentDate.getTime()) / (60 * 1000)
            );

            if (availableMinutes >= remainingMinutes) {
              return new Date(currentDate.getTime() + remainingMinutes * 60 * 1000);
            }

            remainingMinutes -= availableMinutes;
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return currentDate;
  }

  /**
   * Check SLA breach status
   */
  checkBreach(incident: IIncident): SLABreachCheck {
    const now = new Date();
    const sla = incident.sla;

    // Check response breach
    if (!sla.response_met && now > sla.response_due) {
      return {
        is_breached: true,
        breach_type: 'response',
        time_remaining_minutes: 0,
        escalation_level: this.calculateEscalationLevel(incident),
      };
    }

    // Check resolution breach
    if (!sla.resolution_met && now > sla.resolution_due) {
      return {
        is_breached: true,
        breach_type: 'resolution',
        time_remaining_minutes: 0,
        escalation_level: this.calculateEscalationLevel(incident),
      };
    }

    // Calculate time remaining
    const timeRemainingMs = sla.resolution_due.getTime() - now.getTime();
    const timeRemainingMinutes = Math.floor(timeRemainingMs / (60 * 1000));

    return {
      is_breached: false,
      breach_type: null,
      time_remaining_minutes: Math.max(0, timeRemainingMinutes),
      escalation_level: sla.escalation_level,
    };
  }

  /**
   * Calculate escalation level based on time elapsed
   */
  private calculateEscalationLevel(incident: IIncident): number {
    const now = new Date();
    const createdAt = new Date(incident.created_at);
    const elapsedMinutes = Math.floor(
      (now.getTime() - createdAt.getTime()) / (60 * 1000)
    );

    // Default escalation thresholds if no SLA matrix
    const defaultThresholds = [60, 120, 240]; // 1h, 2h, 4h

    for (let i = defaultThresholds.length - 1; i >= 0; i--) {
      if (elapsedMinutes >= defaultThresholds[i]) {
        return i + 1;
      }
    }

    return 0;
  }

  /**
   * Get escalation details for a given level
   */
  async getEscalationDetails(
    slaId: string,
    level: number
  ): Promise<IEscalationLevel | null> {
    const sla = await slaRepository.findBySLAId(slaId);
    if (!sla) return null;

    return sla.escalation_matrix.find((e) => e.level === level) || null;
  }

  /**
   * Get next escalation level
   */
  async getNextEscalation(
    slaId: string,
    currentLevel: number
  ): Promise<IEscalationLevel | null> {
    const sla = await slaRepository.findBySLAId(slaId);
    if (!sla) return null;

    return sla.escalation_matrix.find((e) => e.level === currentLevel + 1) || null;
  }

  /**
   * Default SLA configuration when no SLA is defined
   */
  private getDefaultSLAConfig(priority: Priority, createdAt: Date): SLACalculationResult {
    const defaults: Record<Priority, { response: number; resolution: number }> = {
      [Priority.CRITICAL]: { response: 0.5, resolution: 4 },
      [Priority.HIGH]: { response: 2, resolution: 8 },
      [Priority.MEDIUM]: { response: 4, resolution: 24 },
      [Priority.LOW]: { response: 8, resolution: 72 },
    };

    const config = defaults[priority];

    return {
      sla_id: 'DEFAULT',
      response_due: new Date(createdAt.getTime() + config.response * 60 * 60 * 1000),
      resolution_due: new Date(createdAt.getTime() + config.resolution * 60 * 60 * 1000),
      breach_flag: false,
      escalation_level: 0,
    };
  }

  /**
   * Pause SLA timer (e.g., when waiting for customer)
   */
  pauseSLA(slaConfig: ISLAConfig): ISLAConfig {
    return {
      ...slaConfig,
      paused_at: new Date(),
    };
  }

  /**
   * Resume SLA timer
   */
  resumeSLA(slaConfig: ISLAConfig): ISLAConfig {
    if (!slaConfig.paused_at) return slaConfig;

    const pausedDuration = Date.now() - slaConfig.paused_at.getTime();
    const pausedMinutes = Math.floor(pausedDuration / (60 * 1000));

    // Extend due dates by paused duration
    const newResponseDue = new Date(
      slaConfig.response_due.getTime() + pausedDuration
    );
    const newResolutionDue = new Date(
      slaConfig.resolution_due.getTime() + pausedDuration
    );

    return {
      ...slaConfig,
      response_due: newResponseDue,
      resolution_due: newResolutionDue,
      paused_at: undefined,
      paused_duration_minutes: (slaConfig.paused_duration_minutes || 0) + pausedMinutes,
    };
  }

  /**
   * Mark response as met
   */
  markResponseMet(slaConfig: ISLAConfig): ISLAConfig {
    const now = new Date();
    return {
      ...slaConfig,
      response_met: now <= slaConfig.response_due,
      response_at: now,
    };
  }

  /**
   * Mark resolution as met
   */
  markResolutionMet(slaConfig: ISLAConfig): ISLAConfig {
    const now = new Date();
    return {
      ...slaConfig,
      resolution_met: now <= slaConfig.resolution_due,
      resolved_at: now,
      breach_flag: now > slaConfig.resolution_due,
    };
  }

  /**
   * Get SLA compliance percentage for a set of incidents
   */
  calculateCompliance(incidents: IIncident[]): {
    total: number;
    met: number;
    breached: number;
    compliancePercent: number;
  } {
    const closedIncidents = incidents.filter(
      (i) => i.sla.resolution_met !== undefined
    );

    const met = closedIncidents.filter((i) => i.sla.resolution_met === true).length;
    const breached = closedIncidents.filter(
      (i) => i.sla.resolution_met === false || i.sla.breach_flag
    ).length;

    return {
      total: closedIncidents.length,
      met,
      breached,
      compliancePercent:
        closedIncidents.length > 0
          ? Math.round((met / closedIncidents.length) * 100)
          : 100,
    };
  }
}

export default new SLAEngine();
