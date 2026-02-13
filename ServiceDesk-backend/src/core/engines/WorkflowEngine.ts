/**
 * Workflow Engine - محرك سير العمل
 * Smart Forms System
 * 
 * مسؤول عن:
 * - بدء سير العمل
 * - تنفيذ الإجراءات والانتقالات
 * - إدارة حالات الخطوات
 * - تنفيذ الإجراءات التلقائية
 */

import {
  IFormSubmission,
  IWorkflowConfig,
  IWorkflowStep,
  IWorkflowAction,
  IWorkflowTransition,
  IWorkflowState,
  IAssignee,
  ITimelineEvent,
  IAutoAction,
  SubmissionStatus,
  RuleActionType,
} from '../types/smart-forms.types';

// ============================================
// INTERFACES
// ============================================

export interface IWorkflowTransitionResult {
  success: boolean;
  newStep: IWorkflowStep;
  newStatus: SubmissionStatus;
  assignedTo: IAssignee | null;
  error?: string;
}

export interface IWorkflowActionContext {
  submission: IFormSubmission;
  workflow: IWorkflowConfig;
  currentStep: IWorkflowStep;
  userId: string;
  userName: string;
  comments?: string;
  signature?: string;
}

export interface INotificationService {
  send(params: {
    to: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void>;
}

export interface IAssignmentEngine {
  determineAssignee(
    submission: IFormSubmission,
    assignment: IWorkflowStep['assignment']
  ): Promise<IAssignee | null>;
}

// ============================================
// WORKFLOW ENGINE
// ============================================

export class WorkflowEngine {
  private notificationService?: INotificationService;
  private assignmentEngine?: IAssignmentEngine;

  constructor(options?: {
    notificationService?: INotificationService;
    assignmentEngine?: IAssignmentEngine;
  }) {
    this.notificationService = options?.notificationService;
    this.assignmentEngine = options?.assignmentEngine;
  }

  /**
   * بدء سير العمل
   */
  async startWorkflow(
    submission: IFormSubmission,
    workflow: IWorkflowConfig
  ): Promise<IWorkflowState> {
    // 1. الحصول على الخطوة الأولى
    const initialStep = workflow.steps.find(
      s => s.step_id === workflow.initial_step_id
    );

    if (!initialStep) {
      throw new Error('Initial workflow step not found');
    }

    // 2. تحديد المعين
    const assignee = await this.determineAssignee(submission, initialStep);

    // 3. إنشاء حالة سير العمل
    const workflowState: IWorkflowState = {
      current_step_id: initialStep.step_id,
      status: SubmissionStatus.SUBMITTED,
      assigned_to: assignee || undefined,
      approvals: [],
      sla: initialStep.sla ? this.initializeSLA(initialStep.sla) : undefined,
    };

    // 4. تنفيذ إجراءات الدخول
    if (initialStep.auto_actions?.on_enter) {
      await this.executeAutoActions(
        initialStep.auto_actions.on_enter,
        submission,
        workflow
      );
    }

    // 5. إرسال الإشعارات
    if (assignee && this.notificationService) {
      await this.notifyAssignee(assignee, submission, initialStep);
    }

    return workflowState;
  }

  /**
   * تنفيذ إجراء في سير العمل
   */
  async executeAction(
    context: IWorkflowActionContext,
    actionId: string
  ): Promise<IWorkflowTransitionResult> {
    const { submission, workflow, currentStep, userId, userName, comments, signature } = context;

    // 1. البحث عن الإجراء
    const action = currentStep.available_actions.find(a => a.action_id === actionId);
    if (!action) {
      return {
        success: false,
        newStep: currentStep,
        newStatus: submission.workflow_state.status,
        assignedTo: submission.workflow_state.assigned_to || null,
        error: 'Action not found',
      };
    }

    // 2. التحقق من المتطلبات
    if (action.requires_comment && !comments) {
      return {
        success: false,
        newStep: currentStep,
        newStatus: submission.workflow_state.status,
        assignedTo: submission.workflow_state.assigned_to || null,
        error: 'Comment is required',
      };
    }

    if (action.requires_signature && !signature) {
      return {
        success: false,
        newStep: currentStep,
        newStatus: submission.workflow_state.status,
        assignedTo: submission.workflow_state.assigned_to || null,
        error: 'Signature is required',
      };
    }

    // 3. تنفيذ إجراءات الخروج
    if (currentStep.auto_actions?.on_exit) {
      await this.executeAutoActions(
        currentStep.auto_actions.on_exit,
        submission,
        workflow
      );
    }

    // 4. البحث عن الانتقال
    const transition = this.findTransition(workflow, currentStep.step_id, action);
    if (!transition) {
      return {
        success: false,
        newStep: currentStep,
        newStatus: submission.workflow_state.status,
        assignedTo: submission.workflow_state.assigned_to || null,
        error: 'No transition found for this action',
      };
    }

    // 5. الحصول على الخطوة التالية
    const nextStep = workflow.steps.find(s => s.step_id === transition.to_step_id);
    if (!nextStep) {
      return {
        success: false,
        newStep: currentStep,
        newStatus: submission.workflow_state.status,
        assignedTo: submission.workflow_state.assigned_to || null,
        error: 'Next step not found',
      };
    }

    // 6. تنفيذ إجراءات الانتقال
    if (transition.on_transition && transition.on_transition.length > 0) {
      await this.executeAutoActions(transition.on_transition, submission, workflow);
    }

    // 7. تحديد الحالة الجديدة
    const newStatus = this.determineStatus(nextStep, action);

    // 8. تحديد المعين الجديد
    let newAssignee: IAssignee | null = null;
    if (!nextStep.is_final) {
      newAssignee = await this.determineAssignee(submission, nextStep);
    }

    // 9. تنفيذ إجراءات الدخول للخطوة الجديدة
    if (nextStep.auto_actions?.on_enter) {
      await this.executeAutoActions(
        nextStep.auto_actions.on_enter,
        submission,
        workflow
      );
    }

    // 10. إرسال الإشعارات
    if (newAssignee && this.notificationService) {
      await this.notifyAssignee(newAssignee, submission, nextStep);
    }

    // 11. تسجيل حدث في الجدول الزمني
    const timelineEvent = this.createTimelineEvent(
      'action_executed',
      `Action "${action.name}" executed`,
      `تم تنفيذ الإجراء "${action.name_ar}"`,
      userId,
      userName,
      { actionId, fromStep: currentStep.step_id, toStep: nextStep.step_id }
    );
    submission.timeline = submission.timeline || [];
    submission.timeline.push(timelineEvent);

    return {
      success: true,
      newStep: nextStep,
      newStatus,
      assignedTo: newAssignee,
    };
  }

  /**
   * الحصول على الإجراءات المتاحة للمستخدم
   */
  getAvailableActions(
    submission: IFormSubmission,
    workflow: IWorkflowConfig,
    userId: string,
    _userRole?: string
  ): IWorkflowAction[] {
    const currentStep = this.getCurrentStep(workflow, submission);
    if (!currentStep) return [];

    return currentStep.available_actions.filter(action => {
      // التحقق من صلاحية المستخدم
      if (!this.canUserExecuteAction(submission, userId, _userRole, currentStep)) {
        return false;
      }

      // التحقق من شرط الظهور
      if (action.visible_when) {
        // يمكن إضافة تقييم الشروط هنا
        return true;
      }

      return true;
    });
  }

  /**
   * الحصول على الخطوة الحالية
   */
  getCurrentStep(
    workflow: IWorkflowConfig,
    submission: IFormSubmission
  ): IWorkflowStep | null {
    return workflow.steps.find(
      s => s.step_id === submission.workflow_state.current_step_id
    ) || null;
  }

  /**
   * التحقق من صلاحية المستخدم لتنفيذ إجراء
   */
  canUserExecuteAction(
    submission: IFormSubmission,
    userId: string,
    userRole: string | undefined,
    step: IWorkflowStep
  ): boolean {
    const assignedTo = submission.workflow_state.assigned_to;

    // إذا كان المستخدم هو المعين
    if (assignedTo?.user_id === userId) {
      return true;
    }

    // إذا كان التعيين بالدور
    if (step.assignment.type === 'role' && userRole === step.assignment.value) {
      return true;
    }

    // إذا كان المستخدم في قائمة الموافقين
    const pendingApproval = submission.workflow_state.approvals.find(
      a => a.approver_id === userId && a.status === 'pending'
    );
    if (pendingApproval) {
      return true;
    }

    return false;
  }

  /**
   * تحديد المعين
   */
  private async determineAssignee(
    submission: IFormSubmission,
    step: IWorkflowStep
  ): Promise<IAssignee | null> {
    if (this.assignmentEngine) {
      return this.assignmentEngine.determineAssignee(submission, step.assignment);
    }

    // تعيين بسيط إذا لم يكن هناك محرك تعيين
    switch (step.assignment.type) {
      case 'user':
        if (step.assignment.value) {
          return {
            user_id: step.assignment.value,
            name: step.assignment.value, // يجب جلب الاسم من قاعدة البيانات
            assigned_at: new Date(),
          };
        }
        break;

      case 'requester_manager':
        // يجب جلب مدير مقدم الطلب
        break;

      case 'role':
      case 'group':
      case 'dynamic':
        // يحتاج إلى محرك تعيين
        break;
    }

    return null;
  }

  /**
   * البحث عن الانتقال المناسب
   */
  private findTransition(
    workflow: IWorkflowConfig,
    fromStepId: string,
    action: IWorkflowAction
  ): IWorkflowTransition | null {
    return workflow.transitions.find(t => {
      if (t.from_step_id !== fromStepId) return false;

      if (t.trigger.type === 'action' && t.trigger.action_id === action.action_id) {
        return true;
      }

      // يمكن إضافة تقييم الشروط هنا
      return false;
    }) || null;
  }

  /**
   * تحديد الحالة بناءً على الخطوة والإجراء
   */
  private determineStatus(
    step: IWorkflowStep,
    action: IWorkflowAction
  ): SubmissionStatus {
    if (step.is_final) {
      switch (action.type) {
        case 'approve':
        case 'complete':
          return SubmissionStatus.COMPLETED;
        case 'reject':
          return SubmissionStatus.REJECTED;
        case 'cancel':
          return SubmissionStatus.CANCELLED;
        default:
          return SubmissionStatus.COMPLETED;
      }
    }

    if (step.is_approval_step) {
      return SubmissionStatus.PENDING_APPROVAL;
    }

    return SubmissionStatus.IN_PROGRESS;
  }

  /**
   * تهيئة SLA
   */
  private initializeSLA(slaConfig: NonNullable<IWorkflowStep['sla']>): IWorkflowState['sla'] {
    const now = new Date();
    const responseDue = new Date(now.getTime() + slaConfig.response_hours * 60 * 60 * 1000);
    const resolutionDue = new Date(now.getTime() + slaConfig.response_hours * 2 * 60 * 60 * 1000);

    return {
      sla_id: `SLA-${Date.now()}`,
      started_at: now,
      response_due: responseDue,
      resolution_due: resolutionDue,
      breach_flag: false,
      paused_duration_minutes: 0,
      is_paused: false,
    };
  }

  /**
   * تنفيذ الإجراءات التلقائية
   */
  private async executeAutoActions(
    actions: IAutoAction[],
    submission: IFormSubmission,
    workflow: IWorkflowConfig
  ): Promise<void> {
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        await this.executeAutoAction(action, submission, workflow);
      } catch (error) {
        console.error(`Auto action ${action.action_id} failed:`, error);
      }
    }
  }

  /**
   * تنفيذ إجراء تلقائي واحد
   */
  private async executeAutoAction(
    action: IAutoAction,
    submission: IFormSubmission,
    workflow: IWorkflowConfig
  ): Promise<void> {
    switch (action.type) {
      case RuleActionType.SEND_EMAIL:
        if (this.notificationService) {
          await this.notificationService.send({
            to: action.config.to,
            template: action.config.template,
            data: { submission, workflow },
          });
        }
        break;

      case RuleActionType.CREATE_TASK:
        // يمكن إضافة إنشاء مهمة هنا
        console.log('Create task:', action.config);
        break;

      case RuleActionType.CALL_WEBHOOK:
        await this.callWebhook(action.config, submission);
        break;

      case RuleActionType.SET_FIELD_VALUE:
        submission.data[action.config.field_id] = action.config.value;
        break;

      default:
        console.log(`Unhandled auto action type: ${action.type}`);
    }
  }

  /**
   * استدعاء Webhook
   */
  private async callWebhook(
    config: Record<string, any>,
    submission: IFormSubmission
  ): Promise<void> {
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          submission_id: submission.submission_id,
          data: submission.data,
          status: submission.workflow_state.status,
          ...config.payload,
        }),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  /**
   * إشعار المعين
   */
  private async notifyAssignee(
    assignee: IAssignee,
    submission: IFormSubmission,
    step: IWorkflowStep
  ): Promise<void> {
    if (!this.notificationService) return;

    await this.notificationService.send({
      to: assignee.user_id,
      template: 'workflow_assignment',
      data: {
        submission_id: submission.submission_id,
        step_name: step.name,
        step_name_ar: step.name_ar,
      },
    });
  }

  /**
   * إنشاء حدث في الجدول الزمني
   */
  createTimelineEvent(
    type: string,
    description: string,
    descriptionAr: string,
    userId?: string,
    userName?: string,
    data?: Record<string, any>
  ): ITimelineEvent {
    return {
      event_id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      description_ar: descriptionAr,
      user_id: userId,
      user_name: userName,
      data,
      created_at: new Date(),
    };
  }

  /**
   * التحقق من انتهاء SLA
   */
  checkSLABreach(submission: IFormSubmission): {
    isBreached: boolean;
    isWarning: boolean;
    timeRemaining: number;
  } {
    const sla = submission.workflow_state.sla;
    if (!sla) {
      return { isBreached: false, isWarning: false, timeRemaining: -1 };
    }

    const now = new Date();
    const resolutionDue = new Date(sla.resolution_due);
    const timeRemaining = resolutionDue.getTime() - now.getTime();

    const isBreached = timeRemaining < 0;
    const totalTime = resolutionDue.getTime() - new Date(sla.started_at).getTime();
    const warningThreshold = totalTime * 0.2; // 20% remaining
    const isWarning = !isBreached && timeRemaining < warningThreshold;

    return {
      isBreached,
      isWarning,
      timeRemaining: Math.floor(timeRemaining / (1000 * 60)), // minutes
    };
  }

  /**
   * إيقاف SLA مؤقتاً
   */
  pauseSLA(submission: IFormSubmission): void {
    if (!submission.workflow_state.sla || submission.workflow_state.sla.is_paused) {
      return;
    }

    submission.workflow_state.sla.is_paused = true;
    submission.workflow_state.sla.paused_at = new Date();
  }

  /**
   * استئناف SLA
   */
  resumeSLA(submission: IFormSubmission): void {
    const sla = submission.workflow_state.sla;
    if (!sla || !sla.is_paused || !sla.paused_at) {
      return;
    }

    const pausedDuration = Date.now() - new Date(sla.paused_at).getTime();
    const pausedMinutes = Math.floor(pausedDuration / (1000 * 60));

    sla.paused_duration_minutes += pausedMinutes;
    sla.is_paused = false;
    sla.paused_at = undefined;

    // تمديد أوقات الاستحقاق
    const responseDue = new Date(sla.response_due);
    const resolutionDue = new Date(sla.resolution_due);

    responseDue.setMinutes(responseDue.getMinutes() + pausedMinutes);
    resolutionDue.setMinutes(resolutionDue.getMinutes() + pausedMinutes);

    sla.response_due = responseDue;
    sla.resolution_due = resolutionDue;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const workflowEngine = new WorkflowEngine();

export default WorkflowEngine;
