/**
 * Approval Engine - محرك الموافقات
 * Smart Forms System
 * 
 * مسؤول عن:
 * - إدارة سلاسل الموافقات
 * - معالجة الموافقات المتتالية والمتوازية
 * - التفويض والتصعيد
 * - تتبع حالات الموافقات
 */

import {
  IFormSubmission,
  IApprovalConfig,
  IApprovalLevel,
  IApprovalRecord,
  IEvaluationContext,
  ApprovalType,
} from '../types/smart-forms.types';
import { ConditionalLogicEngine } from './ConditionalLogicEngine';

// ============================================
// INTERFACES
// ============================================

export interface IApprovalResult {
  success: boolean;
  isFullyApproved: boolean;
  isRejected: boolean;
  nextApprovers: string[];
  approvals?: IApprovalRecord[];
  newStatus?: string;
  error?: string;
}

export interface IApprovalContext {
  submission: IFormSubmission;
  approvalConfig: IApprovalConfig;
  approverId: string;
  approverName: string;
  decision: 'approve' | 'reject' | 'delegate' | 'return';
  comments?: string;
  delegateTo?: string;
}

export interface IUserService {
  getUserById(userId: string): Promise<{ id: string; name: string; email: string; role: string; department?: string; manager_id?: string } | null>;
  getUsersByRole(role: string): Promise<{ id: string; name: string }[]>;
  getUsersByDepartment(department: string): Promise<{ id: string; name: string }[]>;
  getManagerOf(userId: string): Promise<{ id: string; name: string } | null>;
}

export interface INotificationService {
  send(params: {
    to: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void>;
}

// ============================================
// APPROVAL ENGINE
// ============================================

export class ApprovalEngine {
  private conditionalLogicEngine: ConditionalLogicEngine;
  private userService?: IUserService;
  private notificationService?: INotificationService;

  constructor(options?: {
    conditionalLogicEngine?: ConditionalLogicEngine;
    userService?: IUserService;
    notificationService?: INotificationService;
  }) {
    this.conditionalLogicEngine = options?.conditionalLogicEngine || new ConditionalLogicEngine();
    this.userService = options?.userService;
    this.notificationService = options?.notificationService;
  }

  /**
   * بدء عملية الموافقة
   */
  async initializeApproval(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig
  ): Promise<IApprovalRecord[]> {
    const approvals: IApprovalRecord[] = [];

    // التحقق مما إذا كانت الموافقة مطلوبة
    if (!this.isApprovalRequired(submission, approvalConfig)) {
      return approvals;
    }

    // الحصول على الموافقين بناءً على نوع الموافقة
    switch (approvalConfig.type) {
      case ApprovalType.SEQUENTIAL: {
        // في الموافقة المتتالية، نبدأ بالمستوى الأول فقط
        const firstLevel = approvalConfig.levels[0];
        if (firstLevel) {
          const approvers = await this.getApproversForLevel(firstLevel, submission);
          for (const approver of approvers) {
            approvals.push(this.createApprovalRecord(1, approver.id, approver.name));
          }
        }
        break;
      }

      case ApprovalType.PARALLEL: {
        // في الموافقة المتوازية، نضيف جميع الموافقين من جميع المستويات
        for (let i = 0; i < approvalConfig.levels.length; i++) {
          const level = approvalConfig.levels[i];
          const approvers = await this.getApproversForLevel(level, submission);
          for (const approver of approvers) {
            approvals.push(this.createApprovalRecord(i + 1, approver.id, approver.name));
          }
        }
        break;
      }

      case ApprovalType.HIERARCHICAL: {
        // في الموافقة الهرمية، نبدأ بالمدير المباشر
        const manager = await this.getRequesterManager(submission);
        if (manager) {
          approvals.push(this.createApprovalRecord(1, manager.id, manager.name));
        }
        break;
      }

      case ApprovalType.CONDITIONAL: {
        // في الموافقة الشرطية، نحدد الموافقين بناءً على الشروط
        const conditionalApprovers = await this.getConditionalApprovers(submission, approvalConfig);
        for (let i = 0; i < conditionalApprovers.length; i++) {
          approvals.push(this.createApprovalRecord(i + 1, conditionalApprovers[i].id, conditionalApprovers[i].name));
        }
        break;
      }

      default: {
        // الافتراضي: المستوى الأول
        const defaultLevel = approvalConfig.levels[0];
        if (defaultLevel) {
          const approvers = await this.getApproversForLevel(defaultLevel, submission);
          for (const approver of approvers) {
            approvals.push(this.createApprovalRecord(1, approver.id, approver.name));
          }
        }
      }
    }

    // إرسال إشعارات للموافقين
    await this.notifyApprovers(approvals.filter(a => a.status === 'pending'), submission);

    return approvals;
  }

  /**
   * معالجة قرار الموافقة
   */
  async processApproval(context: IApprovalContext): Promise<IApprovalResult> {
    const { submission, approvalConfig, approverId, decision, comments, delegateTo } = context;

    // البحث عن سجل الموافقة المعلق للموافق
    const approvalIndex = submission.workflow_state.approvals.findIndex(
      a => a.approver_id === approverId && a.status === 'pending'
    );

    if (approvalIndex === -1) {
      return {
        success: false,
        isFullyApproved: false,
        isRejected: false,
        nextApprovers: [],
        error: 'No pending approval found for this user',
      };
    }

    const approval = submission.workflow_state.approvals[approvalIndex];

    switch (decision) {
      case 'approve':
        return this.handleApprove(submission, approvalConfig, approval, approvalIndex, comments);

      case 'reject':
        return this.handleReject(submission, approval, approvalIndex, comments);

      case 'delegate':
        if (!delegateTo) {
          return {
            success: false,
            isFullyApproved: false,
            isRejected: false,
            nextApprovers: [],
            error: 'Delegate target is required',
          };
        }
        return this.handleDelegate(submission, approval, approvalIndex, approverId, delegateTo, comments);

      case 'return':
        return this.handleReturn(submission, approval, approvalIndex, comments);

      default:
        return {
          success: false,
          isFullyApproved: false,
          isRejected: false,
          nextApprovers: [],
          error: 'Invalid decision',
        };
    }
  }

  /**
   * معالجة الموافقة
   */
  private async handleApprove(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig,
    approval: IApprovalRecord,
    approvalIndex: number,
    comments?: string
  ): Promise<IApprovalResult> {
    // تحديث سجل الموافقة
    submission.workflow_state.approvals[approvalIndex] = {
      ...approval,
      status: 'approved',
      decision_at: new Date(),
      comments,
    };

    // التحقق من اكتمال الموافقات
    const { isFullyApproved, nextApprovers } = await this.checkApprovalCompletion(
      submission,
      approvalConfig
    );

    // إذا كانت هناك موافقات إضافية مطلوبة
    if (!isFullyApproved && nextApprovers.length > 0) {
      // إضافة الموافقين الجدد
      for (const approver of nextApprovers) {
        const newApproval = this.createApprovalRecord(
          approval.step + 1,
          approver.id,
          approver.name
        );
        submission.workflow_state.approvals.push(newApproval);
      }

      // إرسال إشعارات
      await this.notifyApprovers(
        nextApprovers.map(a => this.createApprovalRecord(approval.step + 1, a.id, a.name)),
        submission
      );
    }

    return {
      success: true,
      isFullyApproved,
      isRejected: false,
      nextApprovers: nextApprovers.map(a => a.id),
      approvals: submission.workflow_state.approvals,
      newStatus: isFullyApproved ? 'completed' : 'pending_approval',
    };
  }

  /**
   * معالجة الرفض
   */
  private async handleReject(
    submission: IFormSubmission,
    approval: IApprovalRecord,
    approvalIndex: number,
    comments?: string
  ): Promise<IApprovalResult> {
    // تحديث سجل الموافقة
    submission.workflow_state.approvals[approvalIndex] = {
      ...approval,
      status: 'rejected',
      decision_at: new Date(),
      comments,
    };

    // إلغاء جميع الموافقات المعلقة الأخرى
    submission.workflow_state.approvals = submission.workflow_state.approvals.map(a => {
      if (a.status === 'pending') {
        return { ...a, status: 'skipped' as const };
      }
      return a;
    });

    // إشعار مقدم الطلب
    if (this.notificationService) {
      await this.notificationService.send({
        to: submission.submitted_by.user_id,
        template: 'approval_rejected',
        data: {
          submission_id: submission.submission_id,
          rejector: approval.approver_name,
          comments,
        },
      });
    }

    return {
      success: true,
      isFullyApproved: false,
      isRejected: true,
      nextApprovers: [],
      approvals: submission.workflow_state.approvals,
      newStatus: 'rejected',
    };
  }

  /**
   * معالجة التفويض
   */
  private async handleDelegate(
    submission: IFormSubmission,
    approval: IApprovalRecord,
    approvalIndex: number,
    delegatorId: string,
    delegateTo: string,
    comments?: string
  ): Promise<IApprovalResult> {
    // الحصول على معلومات المفوض إليه
    let delegateName = delegateTo;
    if (this.userService) {
      const user = await this.userService.getUserById(delegateTo);
      if (user) {
        delegateName = user.name;
      }
    }

    // تحديث سجل الموافقة الأصلي
    submission.workflow_state.approvals[approvalIndex] = {
      ...approval,
      status: 'delegated',
      decision_at: new Date(),
      comments,
      delegated_to: delegateTo,
      delegated_by: delegatorId,
    };

    // إنشاء سجل موافقة جديد للمفوض إليه
    const newApproval = this.createApprovalRecord(approval.step, delegateTo, delegateName);
    newApproval.delegated_by = delegatorId;
    submission.workflow_state.approvals.push(newApproval);

    // إشعار المفوض إليه
    if (this.notificationService) {
      await this.notificationService.send({
        to: delegateTo,
        template: 'approval_delegated',
        data: {
          submission_id: submission.submission_id,
          delegator: approval.approver_name,
          comments,
        },
      });
    }

    return {
      success: true,
      isFullyApproved: false,
      isRejected: false,
      nextApprovers: [delegateTo],
      approvals: submission.workflow_state.approvals,
      newStatus: 'pending_approval',
    };
  }

  /**
   * معالجة الإرجاع
   */
  private async handleReturn(
    submission: IFormSubmission,
    approval: IApprovalRecord,
    approvalIndex: number,
    comments?: string
  ): Promise<IApprovalResult> {
    // تحديث سجل الموافقة
    submission.workflow_state.approvals[approvalIndex] = {
      ...approval,
      status: 'rejected',
      decision_at: new Date(),
      comments,
    };

    // إشعار مقدم الطلب
    if (this.notificationService) {
      await this.notificationService.send({
        to: submission.submitted_by.user_id,
        template: 'approval_returned',
        data: {
          submission_id: submission.submission_id,
          returner: approval.approver_name,
          comments,
        },
      });
    }

    return {
      success: true,
      isFullyApproved: false,
      isRejected: false,
      nextApprovers: [],
      approvals: submission.workflow_state.approvals,
      newStatus: 'pending_approval',
    };
  }

  /**
   * التحقق من اكتمال الموافقات
   */
  private async checkApprovalCompletion(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig
  ): Promise<{ isFullyApproved: boolean; nextApprovers: { id: string; name: string }[] }> {
    const approvals = submission.workflow_state.approvals;

    switch (approvalConfig.type) {
      case ApprovalType.SEQUENTIAL: {
        // في الموافقة المتتالية، نتحقق من اكتمال المستوى الحالي
        const currentStep = Math.max(...approvals.map(a => a.step));
        const currentStepApprovals = approvals.filter(a => a.step === currentStep);
        const allApproved = currentStepApprovals.every(a => a.status === 'approved');

        if (allApproved) {
          // التحقق من وجود مستوى تالي
          const nextLevel = approvalConfig.levels[currentStep];
          if (nextLevel) {
            const nextApprovers = await this.getApproversForLevel(nextLevel, submission);
            return { isFullyApproved: false, nextApprovers };
          }
          return { isFullyApproved: true, nextApprovers: [] };
        }
        return { isFullyApproved: false, nextApprovers: [] };
      }

      case ApprovalType.PARALLEL: {
        // في الموافقة المتوازية، نتحقق من اكتمال جميع الموافقات
        const pendingCount = approvals.filter(a => a.status === 'pending').length;
        const approvedCount = approvals.filter(a => a.status === 'approved').length;
        const totalRequired = approvalConfig.min_approvals || approvals.length;

        if (approvedCount >= totalRequired) {
          return { isFullyApproved: true, nextApprovers: [] };
        }
        return { isFullyApproved: pendingCount === 0, nextApprovers: [] };
      }

      case ApprovalType.HIERARCHICAL: {
        // في الموافقة الهرمية، نتحقق من الوصول للمستوى المطلوب
        const approvedLevels = approvals.filter(a => a.status === 'approved').length;
        const requiredLevels = approvalConfig.levels.length || 1;

        if (approvedLevels >= requiredLevels) {
          return { isFullyApproved: true, nextApprovers: [] };
        }

        // الحصول على المدير التالي
        const lastApprover = approvals.find(a => a.status === 'approved' && a.step === approvedLevels);
        if (lastApprover && this.userService) {
          const nextManager = await this.userService.getManagerOf(lastApprover.approver_id);
          if (nextManager) {
            return { isFullyApproved: false, nextApprovers: [nextManager] };
          }
        }
        return { isFullyApproved: true, nextApprovers: [] };
      }

      default: {
        const allApproved = approvals.every(a => a.status === 'approved' || a.status === 'skipped');
        return { isFullyApproved: allApproved, nextApprovers: [] };
      }
    }
  }

  /**
   * التحقق مما إذا كانت الموافقة مطلوبة
   */
  private isApprovalRequired(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig
  ): boolean {
    if (!approvalConfig.enabled) {
      return false;
    }

    // التحقق من الشروط
    if (approvalConfig.skip_conditions && approvalConfig.skip_conditions.length > 0) {
      const context: IEvaluationContext = {
        formData: submission.data,
        user: submission.submitted_by,
      };

      for (const condition of approvalConfig.skip_conditions) {
        if (this.conditionalLogicEngine.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * الحصول على الموافقين لمستوى معين
   */
  private async getApproversForLevel(
    level: IApprovalLevel,
    submission: IFormSubmission
  ): Promise<{ id: string; name: string }[]> {
    const approvers: { id: string; name: string }[] = [];

    switch (level.approver_type) {
      case 'user':
        if (level.approver_id) {
          let name = level.approver_id;
          if (this.userService) {
            const user = await this.userService.getUserById(level.approver_id);
            if (user) name = user.name;
          }
          approvers.push({ id: level.approver_id, name });
        }
        break;

      case 'role':
        if (level.approver_role && this.userService) {
          const users = await this.userService.getUsersByRole(level.approver_role);
          approvers.push(...users);
        }
        break;

      case 'manager': {
        const manager = await this.getRequesterManager(submission);
        if (manager) {
          approvers.push(manager);
        }
        break;
      }

      case 'dynamic':
        if (level.dynamic_approver_field) {
          const approverId = submission.data[level.dynamic_approver_field] as string;
          if (approverId) {
            let name = approverId;
            if (this.userService) {
              const user = await this.userService.getUserById(approverId);
              if (user) name = user.name;
            }
            approvers.push({ id: approverId, name });
          }
        }
        break;
    }

    return approvers;
  }

  /**
   * الحصول على الموافقين الشرطيين
   */
  private async getConditionalApprovers(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig
  ): Promise<{ id: string; name: string }[]> {
    const approvers: { id: string; name: string }[] = [];
    const context: IEvaluationContext = {
      formData: submission.data,
      user: submission.submitted_by,
    };

    for (const level of approvalConfig.levels) {
      if (level.condition) {
        const shouldInclude = this.conditionalLogicEngine.evaluateCondition(level.condition, context);
        if (shouldInclude) {
          const levelApprovers = await this.getApproversForLevel(level, submission);
          approvers.push(...levelApprovers);
        }
      } else {
        const levelApprovers = await this.getApproversForLevel(level, submission);
        approvers.push(...levelApprovers);
      }
    }

    return approvers;
  }

  /**
   * الحصول على مدير مقدم الطلب
   */
  private async getRequesterManager(
    submission: IFormSubmission
  ): Promise<{ id: string; name: string } | null> {
    if (!this.userService) return null;
    return this.userService.getManagerOf(submission.submitted_by.user_id);
  }

  /**
   * إنشاء سجل موافقة
   */
  private createApprovalRecord(
    step: number,
    approverId: string,
    approverName: string
  ): IApprovalRecord {
    return {
      step,
      approver_id: approverId,
      approver_name: approverName,
      status: 'pending',
    };
  }

  /**
   * إشعار الموافقين
   */
  private async notifyApprovers(
    approvals: IApprovalRecord[],
    submission: IFormSubmission
  ): Promise<void> {
    if (!this.notificationService) return;

    for (const approval of approvals) {
      await this.notificationService.send({
        to: approval.approver_id,
        template: 'approval_request',
        data: {
          submission_id: submission.submission_id,
          requester: submission.submitted_by.name,
        },
      });
    }
  }

  /**
   * الحصول على حالة الموافقة
   */
  getApprovalStatus(submission: IFormSubmission): {
    status: 'pending' | 'approved' | 'rejected' | 'partial';
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    totalCount: number;
  } {
    const approvals = submission.workflow_state.approvals;
    const approvedCount = approvals.filter(a => a.status === 'approved').length;
    const rejectedCount = approvals.filter(a => a.status === 'rejected').length;
    const pendingCount = approvals.filter(a => a.status === 'pending').length;
    const totalCount = approvals.length;

    let status: 'pending' | 'approved' | 'rejected' | 'partial';
    if (rejectedCount > 0) {
      status = 'rejected';
    } else if (pendingCount === 0 && approvedCount === totalCount) {
      status = 'approved';
    } else if (approvedCount > 0) {
      status = 'partial';
    } else {
      status = 'pending';
    }

    return { status, approvedCount, rejectedCount, pendingCount, totalCount };
  }

  /**
   * التحقق من صلاحية المستخدم للموافقة
   */
  canUserApprove(submission: IFormSubmission, userId: string): boolean {
    return submission.workflow_state.approvals.some(
      a => a.approver_id === userId && a.status === 'pending'
    );
  }

  /**
   * تصعيد الموافقة
   */
  async escalateApproval(
    submission: IFormSubmission,
    approvalConfig: IApprovalConfig,
    reason: string
  ): Promise<void> {
    const pendingApprovals = submission.workflow_state.approvals.filter(
      a => a.status === 'pending'
    );

    for (const approval of pendingApprovals) {
      // الحصول على مدير الموافق
      if (this.userService) {
        const manager = await this.userService.getManagerOf(approval.approver_id);
        if (manager) {
          // تفويض للمدير
          await this.handleDelegate(
            submission,
            approval,
            submission.workflow_state.approvals.indexOf(approval),
            'system',
            manager.id,
            `Escalated: ${reason}`
          );
        }
      }
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const approvalEngine = new ApprovalEngine();

export default ApprovalEngine;
