import { FilterQuery } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import Change, { IChange } from '../entities/Change';
import { ChangeStatus, ChangeType, ApprovalStatus } from '../types/itsm.types';

export class ChangeRepository extends BaseRepository<IChange> {
  constructor() {
    super(Change);
  }

  async findByChangeId(changeId: string): Promise<IChange | null> {
    return this.model.findOne({ change_id: changeId }).exec();
  }

  async findByRequester(requesterId: string): Promise<IChange[]> {
    return this.model.find({ 'requested_by.id': requesterId }).sort({ created_at: -1 }).exec();
  }

  async findByOwner(ownerId: string): Promise<IChange[]> {
    return this.model.find({ 'owner.id': ownerId }).sort({ created_at: -1 }).exec();
  }

  async findBySite(siteId: string, status?: ChangeStatus[]): Promise<IChange[]> {
    const filter: FilterQuery<IChange> = { site_id: siteId };
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }
    return this.model.find(filter).sort({ created_at: -1 }).exec();
  }

  async findPendingCABApproval(): Promise<IChange[]> {
    return this.model
      .find({
        status: ChangeStatus.CAB_REVIEW,
        cab_required: true,
        'approval.cab_status': ApprovalStatus.PENDING,
      })
      .sort({ 'schedule.planned_start': 1 })
      .exec();
  }

  async findScheduledChanges(startDate: Date, endDate: Date): Promise<IChange[]> {
    return this.model
      .find({
        status: ChangeStatus.SCHEDULED,
        'schedule.planned_start': { $gte: startDate, $lte: endDate },
      })
      .sort({ 'schedule.planned_start': 1 })
      .exec();
  }

  async findEmergencyChanges(): Promise<IChange[]> {
    return this.model
      .find({
        type: ChangeType.EMERGENCY,
        status: { $nin: [ChangeStatus.COMPLETED, ChangeStatus.CANCELLED, ChangeStatus.FAILED] },
      })
      .sort({ created_at: -1 })
      .exec();
  }

  async findByRelease(releaseId: string): Promise<IChange[]> {
    return this.model.find({ release_id: releaseId }).sort({ created_at: -1 }).exec();
  }

  async addCABApproval(
    changeId: string,
    memberId: string,
    memberName: string,
    memberRole: string,
    decision: ApprovalStatus,
    comments?: string
  ): Promise<IChange | null> {
    const change = await this.model.findOne({ change_id: changeId });
    if (!change) return null;

    // Update or add member decision
    const memberIndex = change.approval.members.findIndex((m) => m.member_id === memberId);
    
    if (memberIndex >= 0) {
      change.approval.members[memberIndex].decision = decision;
      change.approval.members[memberIndex].decision_at = new Date();
      change.approval.members[memberIndex].comments = comments;
    } else {
      change.approval.members.push({
        member_id: memberId,
        name: memberName,
        role: memberRole,
        decision,
        decision_at: new Date(),
        comments,
      });
    }

    // Count approvals
    const approvedCount = change.approval.members.filter(
      (m) => m.decision === ApprovalStatus.APPROVED
    ).length;
    const rejectedCount = change.approval.members.filter(
      (m) => m.decision === ApprovalStatus.REJECTED
    ).length;

    change.approval.current_approvers = approvedCount;

    // Check if fully approved or rejected
    if (rejectedCount > 0) {
      change.approval.cab_status = ApprovalStatus.REJECTED;
      change.approval.rejected_at = new Date();
      change.status = ChangeStatus.REJECTED;
    } else if (approvedCount >= change.approval.required_approvers) {
      change.approval.cab_status = ApprovalStatus.APPROVED;
      change.approval.approved_at = new Date();
      change.status = ChangeStatus.APPROVED;
    }

    // Add timeline event
    change.timeline.push({
      event: `CAB ${decision} by ${memberName}`,
      by: memberId,
      by_name: memberName,
      time: new Date(),
      details: { decision, comments },
    });

    return change.save();
  }

  async scheduleChange(
    changeId: string,
    schedule: {
      planned_start: Date;
      planned_end: Date;
      maintenance_window?: string;
    },
    userId: string,
    userName: string
  ): Promise<IChange | null> {
    return this.model
      .findOneAndUpdate(
        { change_id: changeId },
        {
          status: ChangeStatus.SCHEDULED,
          'schedule.planned_start': schedule.planned_start,
          'schedule.planned_end': schedule.planned_end,
          'schedule.maintenance_window': schedule.maintenance_window,
          $push: {
            timeline: {
              event: 'Change Scheduled',
              by: userId,
              by_name: userName,
              time: new Date(),
              details: schedule,
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async startImplementation(
    changeId: string,
    userId: string,
    userName: string
  ): Promise<IChange | null> {
    return this.model
      .findOneAndUpdate(
        { change_id: changeId },
        {
          status: ChangeStatus.IMPLEMENTING,
          'schedule.actual_start': new Date(),
          $push: {
            timeline: {
              event: 'Implementation Started',
              by: userId,
              by_name: userName,
              time: new Date(),
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async completeChange(
    changeId: string,
    success: boolean,
    notes: string,
    userId: string,
    userName: string
  ): Promise<IChange | null> {
    const status = success ? ChangeStatus.COMPLETED : ChangeStatus.FAILED;
    
    return this.model
      .findOneAndUpdate(
        { change_id: changeId },
        {
          status,
          'schedule.actual_end': new Date(),
          closed_at: new Date(),
          $push: {
            timeline: {
              event: success ? 'Change Completed Successfully' : 'Change Failed',
              by: userId,
              by_name: userName,
              time: new Date(),
              details: { notes },
            },
          },
        },
        { new: true }
      )
      .exec();
  }

  async getChangeStats(siteId?: string): Promise<{
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    scheduled: number;
    implementing: number;
    completed: number;
    failed: number;
  }> {
    const baseFilter: FilterQuery<IChange> = siteId ? { site_id: siteId } : {};

    const [total, draft, pendingApproval, approved, scheduled, implementing, completed, failed] =
      await Promise.all([
        this.model.countDocuments(baseFilter),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.DRAFT }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.CAB_REVIEW }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.APPROVED }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.SCHEDULED }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.IMPLEMENTING }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.COMPLETED }),
        this.model.countDocuments({ ...baseFilter, status: ChangeStatus.FAILED }),
      ]);

    return { total, draft, pendingApproval, approved, scheduled, implementing, completed, failed };
  }
}

export default new ChangeRepository();
