import { IChange } from '../entities/Change';
import Counter from '../entities/Counter';
import {
  ChangeStatus,
  ChangeType,
  Priority,
  Impact,
  RiskLevel,
  ApprovalStatus,
} from '../types/itsm.types';
import changeRepository from '../repositories/ChangeRepository';
import logger from '../../utils/logger';
import ApiError from '../../utils/ApiError';

export interface CreateChangeDTO {
  type: ChangeType;
  title: string;
  description: string;
  priority: Priority;
  impact: Impact;
  risk: RiskLevel;
  risk_assessment: string;
  requested_by: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  implementation_plan: string;
  rollback_plan: string;
  test_plan?: string;
  communication_plan?: string;
  schedule: {
    planned_start: Date;
    planned_end: Date;
    maintenance_window?: string;
  };
  affected_services: string[];
  affected_cis?: string[];
  site_id: string;
  reason_for_change: string;
  business_justification?: string;
  linked_problems?: string[];
  linked_incidents?: string[];
  cab_members?: Array<{
    member_id: string;
    name: string;
    role: string;
  }>;
}

export interface UpdateChangeDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  impact?: Impact;
  risk?: RiskLevel;
  risk_assessment?: string;
  implementation_plan?: string;
  rollback_plan?: string;
  test_plan?: string;
  communication_plan?: string;
  affected_services?: string[];
  affected_cis?: string[];
  reason_for_change?: string;
  business_justification?: string;
}

export class ChangeService {
  /**
   * Create a new change request
   */
  async createChange(data: CreateChangeDTO): Promise<IChange> {
    const changeId = await Counter.generateId('CHG');

    // Determine if CAB is required based on type and risk
    const cabRequired = this.isCabRequired(data.type, data.risk);

    const change = await changeRepository.create({
      change_id: changeId,
      type: data.type,
      title: data.title,
      description: data.description,
      status: ChangeStatus.DRAFT,
      priority: data.priority,
      impact: data.impact,
      risk: data.risk,
      risk_assessment: data.risk_assessment,
      requested_by: data.requested_by,
      implementation_plan: data.implementation_plan,
      rollback_plan: data.rollback_plan,
      test_plan: data.test_plan,
      communication_plan: data.communication_plan,
      cab_required: cabRequired,
      approval: {
        cab_status: ApprovalStatus.PENDING,
        required_approvers: data.cab_members?.length || 0,
        current_approvers: 0,
        members: data.cab_members?.map((m) => ({
          ...m,
          decision: ApprovalStatus.PENDING,
        })) || [],
      },
      schedule: data.schedule,
      affected_services: data.affected_services,
      affected_cis: data.affected_cis || [],
      site_id: data.site_id,
      reason_for_change: data.reason_for_change,
      business_justification: data.business_justification,
      linked_problems: data.linked_problems || [],
      linked_incidents: data.linked_incidents || [],
      timeline: [],
      attachments: [],
    } as Partial<IChange>);

    logger.info(`Change request created: ${changeId}`, {
      type: data.type,
      priority: data.priority,
      cabRequired,
    });

    return change;
  }

  /**
   * Get change by ID
   */
  async getChange(changeId: string): Promise<IChange> {
    const change = await changeRepository.findByChangeId(changeId);
    if (!change) {
      throw new ApiError(404, `Change ${changeId} not found`);
    }
    return change;
  }

  /**
   * Update change request
   */
  async updateChange(
    changeId: string,
    data: UpdateChangeDTO,
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    // Can only update draft or rejected changes
    if (![ChangeStatus.DRAFT, ChangeStatus.REJECTED].includes(change.status)) {
      throw new ApiError(400, 'Can only update draft or rejected changes');
    }

    const updated = await changeRepository.update(change._id.toString(), data);
    if (!updated) {
      throw new ApiError(500, 'Failed to update change');
    }

    updated.timeline.push({
      event: 'Change Updated',
      by: userId,
      by_name: userName,
      time: new Date(),
      details: data,
    });
    await updated.save();

    logger.info(`Change updated: ${changeId}`, { updatedBy: userId });

    return updated;
  }

  /**
   * Submit change for approval
   */
  async submitForApproval(
    changeId: string,
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    if (change.status !== ChangeStatus.DRAFT) {
      throw new ApiError(400, 'Only draft changes can be submitted');
    }

    // Validate required fields
    this.validateChangeForSubmission(change);

    change.status = change.cab_required ? ChangeStatus.CAB_REVIEW : ChangeStatus.APPROVED;

    if (!change.cab_required) {
      change.approval.cab_status = ApprovalStatus.APPROVED;
      change.approval.approved_at = new Date();
    }

    change.timeline.push({
      event: change.cab_required ? 'Submitted for CAB Review' : 'Auto-approved (Standard Change)',
      by: userId,
      by_name: userName,
      time: new Date(),
    });

    await change.save();

    logger.info(`Change submitted: ${changeId}`, {
      cabRequired: change.cab_required,
    });

    return change;
  }

  /**
   * Add CAB approval
   */
  async addCabApproval(
    changeId: string,
    memberId: string,
    memberName: string,
    memberRole: string,
    decision: ApprovalStatus,
    comments?: string
  ): Promise<IChange> {
    const updated = await changeRepository.addCABApproval(
      changeId,
      memberId,
      memberName,
      memberRole,
      decision,
      comments
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to add CAB approval');
    }

    logger.info(`CAB approval added: ${changeId}`, {
      member: memberName,
      decision,
    });

    return updated;
  }

  /**
   * Schedule approved change
   */
  async scheduleChange(
    changeId: string,
    schedule: {
      planned_start: Date;
      planned_end: Date;
      maintenance_window?: string;
    },
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    if (change.status !== ChangeStatus.APPROVED) {
      throw new ApiError(400, 'Only approved changes can be scheduled');
    }

    const updated = await changeRepository.scheduleChange(
      changeId,
      schedule,
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to schedule change');
    }

    logger.info(`Change scheduled: ${changeId}`, {
      start: schedule.planned_start,
      end: schedule.planned_end,
    });

    return updated;
  }

  /**
   * Start change implementation
   */
  async startImplementation(
    changeId: string,
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    if (change.status !== ChangeStatus.SCHEDULED) {
      throw new ApiError(400, 'Only scheduled changes can be implemented');
    }

    const updated = await changeRepository.startImplementation(
      changeId,
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to start implementation');
    }

    logger.info(`Change implementation started: ${changeId}`);

    return updated;
  }

  /**
   * Complete change
   */
  async completeChange(
    changeId: string,
    success: boolean,
    notes: string,
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    if (change.status !== ChangeStatus.IMPLEMENTING) {
      throw new ApiError(400, 'Only implementing changes can be completed');
    }

    const updated = await changeRepository.completeChange(
      changeId,
      success,
      notes,
      userId,
      userName
    );

    if (!updated) {
      throw new ApiError(500, 'Failed to complete change');
    }

    logger.info(`Change completed: ${changeId}`, { success });

    return updated;
  }

  /**
   * Cancel change
   */
  async cancelChange(
    changeId: string,
    reason: string,
    userId: string,
    userName: string
  ): Promise<IChange> {
    const change = await this.getChange(changeId);

    if ([ChangeStatus.COMPLETED, ChangeStatus.CANCELLED].includes(change.status)) {
      throw new ApiError(400, 'Cannot cancel completed or already cancelled changes');
    }

    change.status = ChangeStatus.CANCELLED;
    change.closed_at = new Date();

    change.timeline.push({
      event: 'Change Cancelled',
      by: userId,
      by_name: userName,
      time: new Date(),
      details: { reason },
    });

    await change.save();

    logger.info(`Change cancelled: ${changeId}`, { reason });

    return change;
  }

  /**
   * Get changes by various filters
   */
  async getChanges(filters: {
    status?: ChangeStatus[];
    type?: ChangeType[];
    priority?: Priority[];
    requester?: string;
    owner?: string;
    site_id?: string;
    scheduled_from?: Date;
    scheduled_to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: IChange[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query: any = {};

    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }
    if (filters.type?.length) {
      query.type = { $in: filters.type };
    }
    if (filters.priority?.length) {
      query.priority = { $in: filters.priority };
    }
    if (filters.requester) {
      query['requested_by.id'] = filters.requester;
    }
    if (filters.owner) {
      query['owner.id'] = filters.owner;
    }
    if (filters.site_id) {
      query.site_id = filters.site_id;
    }
    if (filters.scheduled_from || filters.scheduled_to) {
      query['schedule.planned_start'] = {};
      if (filters.scheduled_from) {
        query['schedule.planned_start'].$gte = filters.scheduled_from;
      }
      if (filters.scheduled_to) {
        query['schedule.planned_start'].$lte = filters.scheduled_to;
      }
    }

    return changeRepository.findWithPagination(
      query,
      filters.page || 1,
      filters.limit || 20,
      { 'schedule.planned_start': 1, created_at: -1 }
    );
  }

  /**
   * Get change statistics
   */
  async getStats(siteId?: string) {
    return changeRepository.getChangeStats(siteId);
  }

  /**
   * Get pending CAB approval changes
   */
  async getPendingCabApproval(): Promise<IChange[]> {
    return changeRepository.findPendingCABApproval();
  }

  /**
   * Get scheduled changes for date range
   */
  async getScheduledChanges(startDate: Date, endDate: Date): Promise<IChange[]> {
    return changeRepository.findScheduledChanges(startDate, endDate);
  }

  /**
   * Get emergency changes
   */
  async getEmergencyChanges(): Promise<IChange[]> {
    return changeRepository.findEmergencyChanges();
  }

  /**
   * Determine if CAB approval is required
   */
  private isCabRequired(type: ChangeType, risk: RiskLevel): boolean {
    // Standard changes don't require CAB
    if (type === ChangeType.STANDARD) return false;

    // Emergency changes may bypass CAB but need post-implementation review
    if (type === ChangeType.EMERGENCY) return false;

    // Normal changes require CAB for medium and high risk
    return risk !== RiskLevel.LOW;
  }

  /**
   * Validate change before submission
   */
  private validateChangeForSubmission(change: IChange): void {
    const errors: string[] = [];

    if (!change.implementation_plan) {
      errors.push('Implementation plan is required');
    }
    if (!change.rollback_plan) {
      errors.push('Rollback plan is required');
    }
    if (!change.risk_assessment) {
      errors.push('Risk assessment is required');
    }
    if (!change.affected_services?.length) {
      errors.push('At least one affected service is required');
    }
    if (!change.schedule?.planned_start || !change.schedule?.planned_end) {
      errors.push('Schedule is required');
    }

    if (errors.length > 0) {
      throw new ApiError(400, `Validation failed: ${errors.join(', ')}`);
    }
  }
}

export default new ChangeService();
