/**
 * Timer Manager - مدير المؤقتات
 * Workflow Engine
 *
 * مسؤول عن:
 * - فحص المؤقتات المستحقة (SLA warning, breach, escalation, auto-transition)
 * - تنفيذ الإجراءات عند انتهاء المؤقت
 * - تسجيل الأحداث
 */

import {
  WFTimerStatus,
  WFEventType,
  WFActorType,
  WFInstanceStatus,
  type IWFInstance,
  type IWFActiveTimer,
} from '../../types/workflow-engine.types';

import type { IWFInstanceStore, IWFEventStore, IWFDefinitionStore } from './GenericWorkflowEngine';
import type { IWFNotificationService } from './ActionExecutor';

export interface ITimerManagerOptions {
  instanceStore: IWFInstanceStore;
  definitionStore: IWFDefinitionStore;
  eventStore: IWFEventStore;
  notificationService?: IWFNotificationService;
}

export class TimerManager {
  private instanceStore: IWFInstanceStore;
  private definitionStore: IWFDefinitionStore;
  private eventStore: IWFEventStore;
  private notificationService?: IWFNotificationService;

  constructor(options: ITimerManagerOptions) {
    this.instanceStore = options.instanceStore;
    this.definitionStore = options.definitionStore;
    this.eventStore = options.eventStore;
    this.notificationService = options.notificationService;
  }

  /**
   * فحص ومعالجة جميع المؤقتات المستحقة
   * يُستدعى بواسطة cron job كل دقيقة
   */
  async processDueTimers(): Promise<{
    processed: number;
    errors: number;
    details: Array<{ instanceId: string; timerId: string; type: string; success: boolean; error?: string }>;
  }> {
    const now = new Date();
    let processed = 0;
    let errors = 0;
    const details: Array<{ instanceId: string; timerId: string; type: string; success: boolean; error?: string }> = [];

    try {
      // جلب جميع الـ instances التي لديها timers مستحقة
      // نستخدم الـ store مباشرة لأنه لا يوجد method مخصص — نبحث عبر الـ instances النشطة
      const WorkflowInstance = (await import('../../../models/workflow/WorkflowInstance')).default;

      const instances = await WorkflowInstance.find({
        status: WFInstanceStatus.ACTIVE,
        'timers.status': WFTimerStatus.PENDING,
        'timers.dueAt': { $lte: now },
      }).lean() as IWFInstance[];

      for (const instance of instances) {
        const dueTimers = (instance.timers || []).filter(
          t => t.status === WFTimerStatus.PENDING && new Date(t.dueAt) <= now
        );

        for (const timer of dueTimers) {
          try {
            await this.processTimer(instance, timer);
            processed++;
            details.push({
              instanceId: instance._id.toString(),
              timerId: timer.timerId,
              type: timer.type,
              success: true,
            });
          } catch (error: any) {
            errors++;
            details.push({
              instanceId: instance._id.toString(),
              timerId: timer.timerId,
              type: timer.type,
              success: false,
              error: error.message,
            });
            console.error(`[TimerManager] Error processing timer ${timer.timerId}:`, error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('[TimerManager] Error fetching due timers:', error.message);
    }

    return { processed, errors, details };
  }

  /**
   * معالجة مؤقت واحد
   */
  private async processTimer(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    switch (timer.type) {
      case 'sla_warning':
        await this.handleSLAWarning(instance, timer);
        break;

      case 'sla_breach':
        await this.handleSLABreach(instance, timer);
        break;

      case 'escalation':
        await this.handleEscalation(instance, timer);
        break;

      case 'auto_transition':
        await this.handleAutoTransition(instance, timer);
        break;

      case 'scheduled':
        await this.handleScheduled(instance, timer);
        break;

      default:
        console.warn(`[TimerManager] Unknown timer type: ${timer.type}`);
    }

    // تحديث حالة المؤقت إلى fired
    await this.markTimerFired(instance._id.toString(), timer.timerId);
  }

  /**
   * معالجة تحذير SLA
   */
  private async handleSLAWarning(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    // تحديث حالة SLA
    if (instance.sla && !instance.sla.warningNotified) {
      await this.instanceStore.update(instance._id.toString(), {
        'sla.warningNotified': true,
      } as any);
    }

    // إرسال إشعار
    if (this.notificationService) {
      const assignee = instance.assignment?.userId || instance.startedBy;
      await this.notificationService.send({
        to: assignee,
        template: 'sla_warning',
        data: {
          instanceId: instance._id.toString(),
          entityType: instance.entityType,
          entityId: instance.entityId,
          currentState: instance.currentState,
          slaResolutionDue: instance.sla?.resolutionDue,
        },
        channel: 'in_app',
      });
    }

    // تسجيل حدث
    await this.eventStore.record({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.SLA_WARNING,
      fromState: instance.currentState,
      actorType: WFActorType.TIMER,
      data: {
        timerId: timer.timerId,
        resolutionDue: instance.sla?.resolutionDue,
      },
      timestamp: new Date(),
    });
  }

  /**
   * معالجة اختراق SLA
   */
  private async handleSLABreach(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    // تحديث حالة SLA
    await this.instanceStore.update(instance._id.toString(), {
      'sla.breached': true,
    } as any);

    // إرسال إشعار
    if (this.notificationService) {
      const assignee = instance.assignment?.userId || instance.startedBy;
      await this.notificationService.send({
        to: assignee,
        template: 'sla_breach',
        data: {
          instanceId: instance._id.toString(),
          entityType: instance.entityType,
          entityId: instance.entityId,
          currentState: instance.currentState,
        },
        channel: 'email',
      });
    }

    // تسجيل حدث
    await this.eventStore.record({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.SLA_BREACH,
      fromState: instance.currentState,
      actorType: WFActorType.TIMER,
      data: { timerId: timer.timerId },
      timestamp: new Date(),
    });
  }

  /**
   * معالجة التصعيد
   */
  private async handleEscalation(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    const config = timer.config || {};
    const action = config.action || {};

    // تنفيذ إجراء التصعيد
    switch (action.type) {
      case 'notify':
        if (this.notificationService && action.targetUserId) {
          await this.notificationService.send({
            to: action.targetUserId,
            template: action.notificationTemplate || 'workflow_escalation',
            data: {
              instanceId: instance._id.toString(),
              entityType: instance.entityType,
              entityId: instance.entityId,
              currentState: instance.currentState,
              escalationLevel: timer.escalationLevel,
            },
          });
        }
        break;

      case 'reassign':
        if (action.targetUserId) {
          await this.instanceStore.update(instance._id.toString(), {
            assignment: {
              userId: action.targetUserId,
              assignedAt: new Date(),
              assignedBy: 'system:escalation',
              assignmentType: 'auto',
            },
          } as any);
        }
        break;

      case 'escalate_to_manager':
        // placeholder — يتطلب UserService للحصول على المدير
        console.log(`[TimerManager] Escalate to manager for instance ${instance._id}`);
        break;

      case 'auto_transition':
        if (action.transitionId) {
          // يتم استدعاء المحرك لتنفيذ الانتقال
          const { GenericWorkflowEngine } = await import('./GenericWorkflowEngine');
          // Note: في التطبيق الحقيقي يُستخدم الـ singleton من الـ factory
          console.log(`[TimerManager] Auto-transition ${action.transitionId} for instance ${instance._id}`);
        }
        break;
    }

    // إنشاء مؤقت تكرار إن كان مطلوباً
    if (config.repeat && config.repeatIntervalHours) {
      const currentLevel = timer.escalationLevel || 1;
      const maxEscalations = config.maxEscalations || 5;

      if (currentLevel < maxEscalations) {
        const newTimer: IWFActiveTimer = {
          timerId: `esc-repeat-${timer.config.ruleId}-${Date.now()}`,
          type: 'escalation',
          dueAt: new Date(Date.now() + config.repeatIntervalHours * 60 * 60 * 1000),
          status: WFTimerStatus.PENDING,
          escalationLevel: currentLevel + 1,
          config: timer.config,
          createdAt: new Date(),
        };

        const WorkflowInstance = (await import('../../../models/workflow/WorkflowInstance')).default;
        await WorkflowInstance.findByIdAndUpdate(instance._id, {
          $push: { timers: newTimer },
        });
      }
    }

    // تسجيل حدث
    await this.eventStore.record({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.TIMER_FIRED,
      fromState: instance.currentState,
      actorType: WFActorType.TIMER,
      data: {
        timerId: timer.timerId,
        timerType: 'escalation',
        escalationLevel: timer.escalationLevel,
        action: action.type,
      },
      timestamp: new Date(),
    });
  }

  /**
   * معالجة الانتقال التلقائي
   */
  private async handleAutoTransition(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    const config = timer.config || {};
    const transitionId = config.transitionId;

    if (!transitionId) {
      console.warn(`[TimerManager] Auto-transition timer has no transitionId`);
      return;
    }

    // تسجيل حدث
    await this.eventStore.record({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.TIMER_FIRED,
      fromState: instance.currentState,
      actorType: WFActorType.TIMER,
      data: {
        timerId: timer.timerId,
        timerType: 'auto_transition',
        transitionId,
      },
      timestamp: new Date(),
    });

    // ملاحظة: الانتقال الفعلي يتم من خلال الـ cron job الذي يستدعي المحرك مباشرة
    console.log(`[TimerManager] Auto-transition "${transitionId}" triggered for instance ${instance._id}`);
  }

  /**
   * معالجة المؤقت المجدول
   */
  private async handleScheduled(
    instance: IWFInstance,
    timer: IWFActiveTimer
  ): Promise<void> {
    await this.eventStore.record({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.TIMER_FIRED,
      fromState: instance.currentState,
      actorType: WFActorType.TIMER,
      data: {
        timerId: timer.timerId,
        timerType: 'scheduled',
        config: timer.config,
      },
      timestamp: new Date(),
    });
  }

  /**
   * تحديث حالة المؤقت إلى fired
   */
  private async markTimerFired(instanceId: string, timerId: string): Promise<void> {
    const WorkflowInstance = (await import('../../../models/workflow/WorkflowInstance')).default;
    await WorkflowInstance.updateOne(
      { _id: instanceId, 'timers.timerId': timerId },
      { $set: { 'timers.$.status': WFTimerStatus.FIRED } }
    );
  }
}

export default TimerManager;
