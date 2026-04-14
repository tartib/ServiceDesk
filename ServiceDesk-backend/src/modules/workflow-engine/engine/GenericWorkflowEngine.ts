/**
 * Generic Workflow Engine - محرك سير العمل العام
 * Workflow Engine
 *
 * المحرك الرئيسي المسؤول عن:
 * - بدء سير العمل على أي كيان
 * - تنفيذ الانتقالات مع Guards + Actions
 * - إدارة الخطوات المتوازية (Fork/Join)
 * - تسجيل الأحداث (Audit Trail)
 * - إدارة SLA والمؤقتات
 */

import {
  WFStateType,
  WFInstanceStatus,
  WFEventType,
  WFActorType,
  WFTimerStatus,
  WFGuardType,
  type IWFDefinition,
  type IWFInstance,
  type IWFEvent,
  type IWFStateDefinition,
  type IWFTransitionDefinition,
  type IWFTransitionResult,
  type IWFAvailableTransition,
  type IWFExecutionContext,
  type IWFActionResult,
  type IWFActiveTimer,
  type IWFExternalTaskConfig,
} from '../../../core/types/workflow-engine.types';

import { GuardEvaluator } from './GuardEvaluator';

/**
 * Optional hook for ITSM automation rules.
 * Allows the engine to fire automation rules after transitions
 * without tight coupling to the ITSM module.
 */
export interface IRuleExecutionHook {
  onTransitionCompleted(params: {
    instanceId: string;
    definitionId: string;
    organizationId: string;
    entityType: string;
    entityId: string;
    fromState: string;
    toState: string;
    transitionId: string;
    actorId: string;
    actorName?: string;
    actorRoles?: string[];
    variables: Record<string, any>;
  }): Promise<void>;
}
import { ActionExecutor, type IWFNotificationService, type IWFWebhookService, type IWFEntityService } from './ActionExecutor';
import type { IWFTaskService } from '../adapters/TaskServiceAdapter';
import { ParallelStepManager } from './ParallelStepManager';

// ============================================
// INTERFACES
// ============================================

export interface IWFEventStore {
  record(event: Omit<IWFEvent, '_id'>): Promise<void>;
  getByInstance(instanceId: string, limit?: number): Promise<IWFEvent[]>;
}

export interface IWFInstanceStore {
  create(instance: Omit<IWFInstance, '_id' | 'createdAt' | 'updatedAt'>): Promise<IWFInstance>;
  findById(id: string): Promise<IWFInstance | null>;
  findByEntity(entityType: string, entityId: string): Promise<IWFInstance | null>;
  update(id: string, updates: Partial<IWFInstance>): Promise<IWFInstance | null>;
}

export interface IWFDefinitionStore {
  findById(id: string): Promise<IWFDefinition | null>;
  findLatestPublished(organizationId: string, entityType: string): Promise<IWFDefinition | null>;
}

export interface IWFExternalTaskStore {
  create(task: {
    instanceId: any;
    definitionId: any;
    organizationId: any;
    topic: string;
    stateCode: string;
    variables: Record<string, any>;
    retries: number;
    retriesLeft: number;
    priority: number;
    errorHandling: 'retry' | 'fail_instance' | 'skip';
  }): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAvailableByTopic(topic: string, maxTasks: number): Promise<any[]>;
  lockTask(taskId: string, workerId: string, lockDuration: number): Promise<any | null>;
  completeTask(taskId: string, resultVariables?: Record<string, any>): Promise<any | null>;
  failTask(taskId: string, errorMessage: string, errorDetails?: string): Promise<any | null>;
  resetExpiredLocks(): Promise<number>;
  cancelByInstance(instanceId: string): Promise<number>;
}

export interface IGenericWorkflowEngineOptions {
  instanceStore: IWFInstanceStore;
  definitionStore: IWFDefinitionStore;
  eventStore: IWFEventStore;
  externalTaskStore?: IWFExternalTaskStore;
  notificationService?: IWFNotificationService;
  webhookService?: IWFWebhookService;
  entityService?: IWFEntityService;
  taskService?: IWFTaskService;
  ruleExecutionHook?: IRuleExecutionHook;
}

// ============================================
// ENGINE
// ============================================

export class GenericWorkflowEngine {
  private instanceStore: IWFInstanceStore;
  private definitionStore: IWFDefinitionStore;
  private eventStore: IWFEventStore;
  private externalTaskStore?: IWFExternalTaskStore;
  private guardEvaluator: GuardEvaluator;
  private actionExecutor: ActionExecutor;
  private parallelManager: ParallelStepManager;
  private entityService?: IWFEntityService;
  private ruleExecutionHook?: IRuleExecutionHook;

  constructor(options: IGenericWorkflowEngineOptions) {
    this.instanceStore = options.instanceStore;
    this.definitionStore = options.definitionStore;
    this.eventStore = options.eventStore;
    this.externalTaskStore = options.externalTaskStore;
    this.entityService = options.entityService;

    this.guardEvaluator = new GuardEvaluator();
    this.actionExecutor = new ActionExecutor({
      guardEvaluator: this.guardEvaluator,
      notificationService: options.notificationService,
      webhookService: options.webhookService,
      entityService: options.entityService,
      taskService: options.taskService,
    });
    this.parallelManager = new ParallelStepManager();
    this.ruleExecutionHook = options.ruleExecutionHook;
  }

  // ============================================
  // START WORKFLOW
  // ============================================

  /**
   * بدء سير عمل جديد على كيان
   */
  async startWorkflow(params: {
    definitionId: string;
    organizationId: string;
    entityType: string;
    entityId: string;
    actorId: string;
    actorName?: string;
    actorRoles?: string[];
    initialVariables?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<IWFInstance> {
    // 1. جلب التعريف
    const definition = await this.definitionStore.findById(params.definitionId);
    if (!definition) {
      throw new Error(`Workflow definition "${params.definitionId}" not found`);
    }

    if (definition.status !== 'published') {
      throw new Error(`Workflow definition "${params.definitionId}" is not published (status: ${definition.status})`);
    }

    // 2. التحقق من عدم وجود instance نشط لنفس الكيان
    const existing = await this.instanceStore.findByEntity(params.entityType, params.entityId);
    if (existing && existing.status === WFInstanceStatus.ACTIVE) {
      throw new Error(`An active workflow instance already exists for ${params.entityType}:${params.entityId}`);
    }

    // 3. التحقق من الحالة الأولية
    const initialState = definition.states.find(s => s.code === definition.initialState);
    if (!initialState) {
      throw new Error(`Initial state "${definition.initialState}" not found in definition`);
    }

    // 4. إنشاء الـ instance
    const instance = await this.instanceStore.create({
      definitionId: definition._id,
      definitionVersion: definition.version,
      organizationId: params.organizationId as any,
      entityType: params.entityType as any,
      entityId: params.entityId,
      currentState: definition.initialState,
      status: WFInstanceStatus.ACTIVE,
      parallelBranches: [],
      variables: params.initialVariables || {},
      timers: [],
      startedAt: new Date(),
      startedBy: params.actorId,
      metadata: params.metadata,
    });

    // 5. بناء السياق
    const context = await this.buildContext(instance, definition, {
      id: params.actorId,
      type: WFActorType.USER,
      name: params.actorName,
      roles: params.actorRoles,
    });

    // 6. تسجيل حدث البدء
    await this.recordEvent({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.INSTANCE_STARTED,
      toState: definition.initialState,
      actorId: params.actorId,
      actorType: WFActorType.USER,
      actorName: params.actorName,
      data: { initialVariables: params.initialVariables },
      timestamp: new Date(),
    });

    // 7. تنفيذ onEnter actions للحالة الأولية
    if (initialState.onEnter && initialState.onEnter.length > 0) {
      await this.actionExecutor.executeActions(initialState.onEnter, context);
    }

    // 8. إعداد SLA إن وُجد
    if (initialState.sla && definition.settings.trackSLA) {
      await this.initializeSLA(instance, initialState);
    }

    // 9. إذا كانت الحالة الأولية FORK
    if (initialState.type === WFStateType.FORK) {
      await this.handleFork(instance, definition, initialState, context);
    }

    return instance;
  }

  // ============================================
  // EXECUTE TRANSITION
  // ============================================

  /**
   * تنفيذ انتقال على instance
   */
  async executeTransition(params: {
    instanceId: string;
    transitionId: string;
    actorId: string;
    actorName?: string;
    actorRoles?: string[];
    actorType?: WFActorType;
    data?: Record<string, any>;
    comment?: string;
    signature?: string;
  }): Promise<IWFTransitionResult> {
    // 1. جلب الـ instance
    const instance = await this.instanceStore.findById(params.instanceId);
    if (!instance) {
      return this.failResult(params.instanceId, '', '', params.transitionId, 'Instance not found');
    }

    if (instance.status !== WFInstanceStatus.ACTIVE) {
      return this.failResult(
        params.instanceId,
        instance.currentState,
        '',
        params.transitionId,
        `Instance is not active (status: ${instance.status})`
      );
    }

    // 2. جلب التعريف
    const definition = await this.definitionStore.findById(instance.definitionId.toString());
    if (!definition) {
      return this.failResult(params.instanceId, instance.currentState, '', params.transitionId, 'Definition not found');
    }

    // 3. البحث عن الانتقال
    const transition = definition.transitions.find(t => t.transitionId === params.transitionId);
    if (!transition) {
      return this.failResult(
        params.instanceId,
        instance.currentState,
        '',
        params.transitionId,
        `Transition "${params.transitionId}" not found`
      );
    }

    // 4. التحقق أن الانتقال من الحالة الحالية
    if (transition.fromState !== instance.currentState && transition.fromState !== '*') {
      return this.failResult(
        params.instanceId,
        instance.currentState,
        transition.toState,
        params.transitionId,
        `Transition "${params.transitionId}" is from "${transition.fromState}" but current state is "${instance.currentState}"`
      );
    }

    // 5. بناء السياق
    const context = await this.buildContext(
      instance,
      definition,
      {
        id: params.actorId,
        type: params.actorType || WFActorType.USER,
        name: params.actorName,
        roles: params.actorRoles,
      },
      params.data,
      params.comment,
      params.signature
    );

    // 6. تقييم الحراس
    const guardResult = this.guardEvaluator.evaluateGuards(transition.guards, context);
    if (!guardResult.passed) {
      await this.recordEvent({
        instanceId: instance._id,
        definitionId: definition._id,
        organizationId: instance.organizationId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        type: WFEventType.GUARD_FAILED,
        fromState: instance.currentState,
        toState: transition.toState,
        transitionId: params.transitionId,
        actorId: params.actorId,
        actorType: params.actorType || WFActorType.USER,
        actorName: params.actorName,
        data: { guard: guardResult.failedGuard, reason: guardResult.reason },
        timestamp: new Date(),
      });

      return this.failResult(
        params.instanceId,
        instance.currentState,
        transition.toState,
        params.transitionId,
        guardResult.reason || 'Guard check failed'
      );
    }

    // 7. التحقق من المدققين (Validators)
    if (transition.validators && transition.validators.length > 0) {
      const validationError = this.validateTransition(transition, context);
      if (validationError) {
        return this.failResult(
          params.instanceId,
          instance.currentState,
          transition.toState,
          params.transitionId,
          validationError
        );
      }
    }

    // 8. الحصول على الحالة المصدر والهدف
    const fromState = definition.states.find(s => s.code === instance.currentState);
    const toState = definition.states.find(s => s.code === transition.toState);
    if (!toState) {
      return this.failResult(
        params.instanceId,
        instance.currentState,
        transition.toState,
        params.transitionId,
        `Target state "${transition.toState}" not found in definition`
      );
    }

    // 9. تنفيذ onExit للحالة الحالية
    const exitActionResults: IWFActionResult[] = [];
    if (fromState?.onExit && fromState.onExit.length > 0) {
      const results = await this.actionExecutor.executeActions(fromState.onExit, context);
      exitActionResults.push(...results);
    }

    // 10. تنفيذ onTransition actions
    const transitionActionResults: IWFActionResult[] = [];
    if (transition.onTransition && transition.onTransition.length > 0) {
      const results = await this.actionExecutor.executeActions(transition.onTransition, context);
      transitionActionResults.push(...results);
    }

    // 11. تنفيذ transition actions
    const actionResults: IWFActionResult[] = [];
    if (transition.actions && transition.actions.length > 0) {
      const results = await this.actionExecutor.executeActions(transition.actions, context);
      actionResults.push(...results);
    }

    // 12. إلغاء المؤقتات القديمة
    this.cancelActiveTimers(instance);

    // 13. تحديث الحالة
    const previousState = instance.currentState;
    instance.currentState = transition.toState;
    instance.previousState = previousState;

    // 14. دمج البيانات إن وُجدت
    if (params.data) {
      instance.variables = { ...instance.variables, ...params.data };
    }

    // 15. تحديد الحالة النهائية
    let newStatus: WFInstanceStatus = instance.status;
    if (definition.finalStates.includes(transition.toState)) {
      newStatus = WFInstanceStatus.COMPLETED;
      instance.status = newStatus;
      instance.completedAt = new Date();
    }

    // 16. تنفيذ onEnter للحالة الجديدة
    const enterActionResults: IWFActionResult[] = [];
    if (toState.onEnter && toState.onEnter.length > 0) {
      // تحديث السياق بالحالة الجديدة
      context.instance = instance;
      const results = await this.actionExecutor.executeActions(toState.onEnter, context);
      enterActionResults.push(...results);
    }

    // 17. إعداد SLA للحالة الجديدة
    if (toState.sla && definition.settings.trackSLA && newStatus === WFInstanceStatus.ACTIVE) {
      await this.initializeSLA(instance, toState);
    }

    // 18. التعامل مع Fork/Join/ExternalTask
    if (toState.type === WFStateType.FORK) {
      await this.handleFork(instance, definition, toState, context);
    } else if (toState.type === WFStateType.JOIN) {
      await this.handleJoin(instance, definition, toState, context);
    } else if (toState.type === WFStateType.EXTERNAL_TASK) {
      await this.handleExternalTask(instance, definition, toState, context);
      newStatus = WFInstanceStatus.WAITING;
      instance.status = newStatus;
    }

    // 19. حفظ الـ instance
    await this.instanceStore.update(instance._id.toString(), {
      currentState: instance.currentState,
      previousState: instance.previousState,
      status: instance.status,
      variables: instance.variables,
      assignment: instance.assignment,
      sla: instance.sla,
      timers: instance.timers,
      parallelBranches: instance.parallelBranches,
      completedAt: instance.completedAt,
    });

    // 20. تسجيل الأحداث
    await this.recordEvent({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.TRANSITION_EXECUTED,
      fromState: previousState,
      toState: transition.toState,
      transitionId: params.transitionId,
      actorId: params.actorId,
      actorType: params.actorType || WFActorType.USER,
      actorName: params.actorName,
      data: {
        comment: params.comment,
        transitionData: params.data,
      },
      timestamp: new Date(),
    });

    if (newStatus === WFInstanceStatus.COMPLETED) {
      await this.recordEvent({
        instanceId: instance._id,
        definitionId: definition._id,
        organizationId: instance.organizationId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        type: WFEventType.INSTANCE_COMPLETED,
        fromState: previousState,
        toState: transition.toState,
        actorId: params.actorId,
        actorType: params.actorType || WFActorType.USER,
        actorName: params.actorName,
        timestamp: new Date(),
      });
    }

    const result: IWFTransitionResult = {
      success: true,
      instanceId: instance._id.toString(),
      fromState: previousState,
      toState: transition.toState,
      transitionId: params.transitionId,
      newStatus,
      actionResults: [...exitActionResults, ...transitionActionResults, ...actionResults, ...enterActionResults],
    };

    // 21. Fire automation rules hook (async, non-blocking)
    if (this.ruleExecutionHook) {
      this.ruleExecutionHook.onTransitionCompleted({
        instanceId: instance._id.toString(),
        definitionId: definition._id.toString(),
        organizationId: instance.organizationId?.toString(),
        entityType: instance.entityType,
        entityId: instance.entityId,
        fromState: previousState,
        toState: transition.toState,
        transitionId: params.transitionId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRoles: params.actorRoles,
        variables: instance.variables,
      }).catch((err) => {
        console.error('[GenericWorkflowEngine] Rule execution hook error:', err.message);
      });
    }

    return result;
  }

  // ============================================
  // AVAILABLE TRANSITIONS
  // ============================================

  /**
   * الحصول على الانتقالات المتاحة للمستخدم
   */
  async getAvailableTransitions(params: {
    instanceId: string;
    actorId: string;
    actorRoles?: string[];
    actorDepartment?: string;
  }): Promise<IWFAvailableTransition[]> {
    const instance = await this.instanceStore.findById(params.instanceId);
    if (!instance || instance.status !== WFInstanceStatus.ACTIVE) {
      return [];
    }

    const definition = await this.definitionStore.findById(instance.definitionId.toString());
    if (!definition) {
      return [];
    }

    // الانتقالات من الحالة الحالية
    const outTransitions = definition.transitions.filter(
      t => t.fromState === instance.currentState || t.fromState === '*'
    );

    const context = await this.buildContext(instance, definition, {
      id: params.actorId,
      type: WFActorType.USER,
      roles: params.actorRoles,
      department: params.actorDepartment,
    });

    const available: IWFAvailableTransition[] = [];

    for (const transition of outTransitions) {
      // تقييم الحراس بصمت
      const guardResult = this.guardEvaluator.evaluateGuards(transition.guards, context);
      if (guardResult.passed) {
        const toState = definition.states.find(s => s.code === transition.toState);
        available.push({
          transitionId: transition.transitionId,
          name: transition.name,
          nameAr: transition.nameAr,
          toState: transition.toState,
          toStateName: toState?.name || transition.toState,
          toStateNameAr: toState?.nameAr,
          ui: transition.ui,
        });
      }
    }

    return available;
  }

  // ============================================
  // CANCEL / SUSPEND / RESUME
  // ============================================

  /**
   * إلغاء سير العمل
   */
  async cancelWorkflow(params: {
    instanceId: string;
    actorId: string;
    actorName?: string;
    reason?: string;
  }): Promise<IWFInstance | null> {
    const instance = await this.instanceStore.findById(params.instanceId);
    if (!instance || instance.status !== WFInstanceStatus.ACTIVE) {
      return null;
    }

    this.cancelActiveTimers(instance);

    const updated = await this.instanceStore.update(params.instanceId, {
      status: WFInstanceStatus.CANCELLED,
      cancelledAt: new Date(),
      timers: instance.timers,
    });

    await this.recordEvent({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.INSTANCE_CANCELLED,
      fromState: instance.currentState,
      actorId: params.actorId,
      actorType: WFActorType.USER,
      actorName: params.actorName,
      data: { reason: params.reason },
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * تعليق سير العمل
   */
  async suspendWorkflow(params: {
    instanceId: string;
    actorId: string;
    actorName?: string;
    reason?: string;
  }): Promise<IWFInstance | null> {
    const instance = await this.instanceStore.findById(params.instanceId);
    if (!instance || instance.status !== WFInstanceStatus.ACTIVE) {
      return null;
    }

    // إيقاف SLA مؤقتاً
    if (instance.sla && !instance.sla.isPaused) {
      instance.sla.isPaused = true;
      instance.sla.pausedAt = new Date();
    }

    const updated = await this.instanceStore.update(params.instanceId, {
      status: WFInstanceStatus.SUSPENDED,
      sla: instance.sla,
    });

    await this.recordEvent({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.INSTANCE_SUSPENDED,
      fromState: instance.currentState,
      actorId: params.actorId,
      actorType: WFActorType.USER,
      actorName: params.actorName,
      data: { reason: params.reason },
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * استئناف سير العمل
   */
  async resumeWorkflow(params: {
    instanceId: string;
    actorId: string;
    actorName?: string;
  }): Promise<IWFInstance | null> {
    const instance = await this.instanceStore.findById(params.instanceId);
    if (!instance || instance.status !== WFInstanceStatus.SUSPENDED) {
      return null;
    }

    // استئناف SLA
    if (instance.sla?.isPaused && instance.sla.pausedAt) {
      const pausedMs = Date.now() - new Date(instance.sla.pausedAt).getTime();
      const pausedMinutes = Math.floor(pausedMs / (1000 * 60));
      instance.sla.pausedDurationMinutes += pausedMinutes;
      instance.sla.isPaused = false;
      instance.sla.pausedAt = undefined;

      // تمديد أوقات الاستحقاق
      if (instance.sla.responseDue) {
        instance.sla.responseDue = new Date(
          new Date(instance.sla.responseDue).getTime() + pausedMs
        );
      }
      if (instance.sla.resolutionDue) {
        instance.sla.resolutionDue = new Date(
          new Date(instance.sla.resolutionDue).getTime() + pausedMs
        );
      }
    }

    const updated = await this.instanceStore.update(params.instanceId, {
      status: WFInstanceStatus.ACTIVE,
      sla: instance.sla,
    });

    await this.recordEvent({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.INSTANCE_RESUMED,
      fromState: instance.currentState,
      actorId: params.actorId,
      actorType: WFActorType.USER,
      actorName: params.actorName,
      timestamp: new Date(),
    });

    return updated;
  }

  // ============================================
  // QUERY HELPERS
  // ============================================

  /**
   * الحصول على الحالة الحالية مع تفاصيلها
   */
  async getCurrentState(instanceId: string): Promise<{
    instance: IWFInstance;
    state: IWFStateDefinition;
    definition: IWFDefinition;
  } | null> {
    const instance = await this.instanceStore.findById(instanceId);
    if (!instance) return null;

    const definition = await this.definitionStore.findById(instance.definitionId.toString());
    if (!definition) return null;

    const state = definition.states.find(s => s.code === instance.currentState);
    if (!state) return null;

    return { instance, state, definition };
  }

  /**
   * الحصول على سجل أحداث Instance
   */
  async getInstanceEvents(instanceId: string, limit?: number): Promise<IWFEvent[]> {
    return this.eventStore.getByInstance(instanceId, limit);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * بناء سياق التنفيذ
   */
  private async buildContext(
    instance: IWFInstance,
    definition: IWFDefinition,
    actor: {
      id: string;
      type: WFActorType;
      name?: string;
      roles?: string[];
      department?: string;
    },
    transitionData?: Record<string, any>,
    comment?: string,
    signature?: string
  ): Promise<IWFExecutionContext> {
    let entity: Record<string, any> | undefined;
    if (this.entityService) {
      entity = (await this.entityService.getEntity(instance.entityType, instance.entityId)) || undefined;
    }

    return {
      instance,
      definition,
      actor,
      entity,
      transitionData,
      comment,
      signature,
    };
  }

  /**
   * تهيئة SLA للحالة
   */
  private async initializeSLA(
    instance: IWFInstance,
    state: IWFStateDefinition
  ): Promise<void> {
    if (!state.sla) return;

    const now = new Date();
    const sla: IWFInstance['sla'] = {
      startedAt: now,
      breached: false,
      warningNotified: false,
      pausedDurationMinutes: 0,
      isPaused: false,
    };

    if (state.sla.responseHours) {
      sla.responseDue = new Date(now.getTime() + state.sla.responseHours * 60 * 60 * 1000);
    }
    if (state.sla.resolutionHours) {
      sla.resolutionDue = new Date(now.getTime() + state.sla.resolutionHours * 60 * 60 * 1000);
    }

    instance.sla = sla;

    // إنشاء timers
    const timers: IWFActiveTimer[] = [];

    if (sla.resolutionDue) {
      // Warning timer
      const warningPercent = state.sla.warningPercent || 80;
      const totalMs = sla.resolutionDue.getTime() - now.getTime();
      const warningMs = totalMs * (warningPercent / 100);

      timers.push({
        timerId: `sla-warn-${Date.now()}`,
        type: 'sla_warning',
        dueAt: new Date(now.getTime() + warningMs),
        status: WFTimerStatus.PENDING,
        config: { stateCode: state.code },
        createdAt: now,
      });

      // Breach timer
      timers.push({
        timerId: `sla-breach-${Date.now()}`,
        type: 'sla_breach',
        dueAt: sla.resolutionDue,
        status: WFTimerStatus.PENDING,
        config: { stateCode: state.code },
        createdAt: now,
      });
    }

    // Escalation timers
    if (state.sla.escalationRules) {
      for (const rule of state.sla.escalationRules) {
        if (rule.trigger.type === 'time' && rule.trigger.afterHours) {
          timers.push({
            timerId: `esc-${rule.ruleId}-${Date.now()}`,
            type: 'escalation',
            dueAt: new Date(now.getTime() + rule.trigger.afterHours * 60 * 60 * 1000),
            status: WFTimerStatus.PENDING,
            escalationLevel: 1,
            config: {
              ruleId: rule.ruleId,
              action: rule.action,
              repeat: rule.repeat,
              repeatIntervalHours: rule.repeatIntervalHours,
              maxEscalations: rule.maxEscalations,
            },
            createdAt: now,
          });
        }
      }
    }

    instance.timers = [...(instance.timers || []), ...timers];
  }

  // ============================================
  // EXTERNAL TASK HANDLING
  // ============================================

  /**
   * التعامل مع حالة مهمة خارجية — إنشاء مهمة خارجية ووضع الـ instance في حالة انتظار
   */
  private async handleExternalTask(
    instance: IWFInstance,
    definition: IWFDefinition,
    state: IWFStateDefinition,
    context: IWFExecutionContext
  ): Promise<void> {
    if (!this.externalTaskStore) {
      console.error('[WorkflowEngine] External task store not configured');
      return;
    }

    const config = state.externalTask;
    if (!config) {
      console.error(`[WorkflowEngine] State "${state.code}" is EXTERNAL_TASK but has no externalTask config`);
      return;
    }

    const externalTask = await this.externalTaskStore.create({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      topic: config.topic,
      stateCode: state.code,
      variables: instance.variables || {},
      retries: config.retries || 3,
      retriesLeft: config.retries || 3,
      priority: config.priority || 0,
      errorHandling: config.errorHandling || 'retry',
    });

    await this.recordEvent({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.EXTERNAL_TASK_CREATED,
      fromState: state.code,
      actorId: context.actor.id,
      actorType: WFActorType.SYSTEM,
      data: {
        externalTaskId: externalTask._id?.toString(),
        topic: config.topic,
        priority: config.priority,
      },
      timestamp: new Date(),
    });
  }

  /**
   * إكمال مهمة خارجية واستئناف سير العمل
   */
  async completeExternalTask(params: {
    externalTaskId: string;
    workerId: string;
    variables?: Record<string, any>;
  }): Promise<IWFTransitionResult> {
    if (!this.externalTaskStore) {
      throw new Error('External task store not configured');
    }

    // 1. Find and complete the external task
    const externalTask = await this.externalTaskStore.findById(params.externalTaskId);
    if (!externalTask) {
      throw new Error(`External task "${params.externalTaskId}" not found`);
    }
    if (externalTask.status !== 'locked') {
      throw new Error(`External task is not locked (status: ${externalTask.status})`);
    }
    if (externalTask.workerId !== params.workerId) {
      throw new Error(`External task is locked by a different worker`);
    }

    await this.externalTaskStore.completeTask(params.externalTaskId, params.variables);

    // 2. Get the workflow instance
    const instance = await this.instanceStore.findById(externalTask.instanceId.toString());
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const definition = await this.definitionStore.findById(instance.definitionId.toString());
    if (!definition) {
      throw new Error('Workflow definition not found');
    }

    // 3. Merge result variables into instance
    if (params.variables) {
      instance.variables = { ...instance.variables, ...params.variables };
    }

    // 4. Record completion event
    await this.recordEvent({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.EXTERNAL_TASK_COMPLETED,
      fromState: instance.currentState,
      actorId: params.workerId,
      actorType: WFActorType.API,
      actorName: params.workerId,
      data: {
        externalTaskId: params.externalTaskId,
        resultVariables: params.variables,
      },
      timestamp: new Date(),
    });

    // 5. Set instance back to active
    instance.status = WFInstanceStatus.ACTIVE;
    await this.instanceStore.update(instance._id.toString(), {
      status: WFInstanceStatus.ACTIVE,
      variables: instance.variables,
    });

    // 6. Auto-advance: find the outgoing transition from this external task state and execute it
    const outTransitions = definition.transitions.filter(
      t => t.fromState === instance.currentState || t.fromState === '*'
    );

    if (outTransitions.length > 0) {
      // Take the first available transition (external tasks typically have one outgoing path)
      const transition = outTransitions[0];
      return this.executeTransition({
        instanceId: instance._id.toString(),
        transitionId: transition.transitionId,
        actorId: params.workerId,
        actorName: params.workerId,
        actorType: WFActorType.API,
        data: params.variables,
      });
    }

    return {
      success: true,
      instanceId: instance._id.toString(),
      fromState: instance.currentState,
      toState: instance.currentState,
      transitionId: 'external_task_complete',
      newStatus: WFInstanceStatus.ACTIVE,
      actionResults: [],
    };
  }

  /**
   * فشل مهمة خارجية — إعادة المحاولة أو إنهاء سير العمل
   */
  async failExternalTask(params: {
    externalTaskId: string;
    workerId: string;
    errorMessage: string;
    errorDetails?: string;
    retries?: number;
  }): Promise<void> {
    if (!this.externalTaskStore) {
      throw new Error('External task store not configured');
    }

    const externalTask = await this.externalTaskStore.findById(params.externalTaskId);
    if (!externalTask) {
      throw new Error(`External task "${params.externalTaskId}" not found`);
    }
    if (externalTask.status !== 'locked') {
      throw new Error(`External task is not locked (status: ${externalTask.status})`);
    }
    if (externalTask.workerId !== params.workerId) {
      throw new Error(`External task is locked by a different worker`);
    }

    // Update retries if provided
    const retriesLeft = params.retries !== undefined
      ? params.retries
      : externalTask.retriesLeft - 1;

    await this.externalTaskStore.failTask(
      params.externalTaskId,
      params.errorMessage,
      params.errorDetails
    );

    const instance = await this.instanceStore.findById(externalTask.instanceId.toString());
    if (!instance) return;

    const definition = await this.definitionStore.findById(instance.definitionId.toString());

    // Record failure event
    await this.recordEvent({
      instanceId: instance._id,
      definitionId: instance.definitionId,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.EXTERNAL_TASK_FAILED,
      fromState: instance.currentState,
      actorId: params.workerId,
      actorType: WFActorType.API,
      actorName: params.workerId,
      data: {
        externalTaskId: params.externalTaskId,
        errorMessage: params.errorMessage,
        retriesLeft,
      },
      timestamp: new Date(),
    });

    if (retriesLeft > 0) {
      // Reset task to available for retry — the store's failTask already handles this
      // based on retriesLeft > 0, it sets status back to 'available'
      return;
    }

    // No retries left — handle based on errorHandling config
    const errorHandling = externalTask.errorHandling || 'retry';

    if (errorHandling === 'fail_instance') {
      // Mark instance as error
      instance.status = WFInstanceStatus.ERROR;
      await this.instanceStore.update(instance._id.toString(), {
        status: WFInstanceStatus.ERROR,
      });

      await this.recordEvent({
        instanceId: instance._id,
        definitionId: instance.definitionId,
        organizationId: instance.organizationId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        type: WFEventType.INSTANCE_ERROR,
        fromState: instance.currentState,
        actorId: params.workerId,
        actorType: WFActorType.API,
        data: { reason: `External task failed: ${params.errorMessage}` },
        timestamp: new Date(),
      });
    } else if (errorHandling === 'skip' && definition) {
      // Skip: set instance back to active and auto-advance
      instance.status = WFInstanceStatus.ACTIVE;
      await this.instanceStore.update(instance._id.toString(), {
        status: WFInstanceStatus.ACTIVE,
      });

      const outTransitions = definition.transitions.filter(
        t => t.fromState === instance.currentState || t.fromState === '*'
      );

      if (outTransitions.length > 0) {
        await this.executeTransition({
          instanceId: instance._id.toString(),
          transitionId: outTransitions[0].transitionId,
          actorId: params.workerId,
          actorName: params.workerId,
          actorType: WFActorType.API,
        });
      }
    }
    // errorHandling === 'retry' with no retries left: task stays failed, instance stays waiting
  }

  /**
   * التعامل مع Fork
   */
  private async handleFork(
    instance: IWFInstance,
    definition: IWFDefinition,
    forkState: IWFStateDefinition,
    context: IWFExecutionContext
  ): Promise<void> {
    const forkResult = this.parallelManager.fork(instance, definition, forkState);
    if (!forkResult.success) {
      console.error(`[WorkflowEngine] Fork failed: ${forkResult.error}`);
      return;
    }

    await this.recordEvent({
      instanceId: instance._id,
      definitionId: definition._id,
      organizationId: instance.organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      type: WFEventType.PARALLEL_FORK,
      fromState: forkState.code,
      actorId: context.actor.id,
      actorType: context.actor.type,
      data: { branches: forkResult.branches.map(b => b.stateCode) },
      timestamp: new Date(),
    });
  }

  /**
   * التعامل مع Join
   */
  private async handleJoin(
    instance: IWFInstance,
    definition: IWFDefinition,
    joinState: IWFStateDefinition,
    context: IWFExecutionContext
  ): Promise<void> {
    const joinResult = this.parallelManager.checkJoin(instance, definition, joinState);

    if (joinResult.allCompleted) {
      this.parallelManager.clearBranches(instance);

      await this.recordEvent({
        instanceId: instance._id,
        definitionId: definition._id,
        organizationId: instance.organizationId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        type: WFEventType.PARALLEL_JOIN,
        toState: joinState.code,
        actorId: context.actor.id,
        actorType: context.actor.type,
        data: { completedCount: joinResult.completedCount, totalCount: joinResult.totalCount },
        timestamp: new Date(),
      });
    }
  }

  /**
   * إلغاء المؤقتات النشطة
   */
  private cancelActiveTimers(instance: IWFInstance): void {
    if (instance.timers) {
      instance.timers = instance.timers.map(t => {
        if (t.status === WFTimerStatus.PENDING) {
          return { ...t, status: WFTimerStatus.CANCELLED };
        }
        return t;
      });
    }
  }

  /**
   * التحقق من المدققين
   */
  private validateTransition(
    transition: IWFTransitionDefinition,
    context: IWFExecutionContext
  ): string | null {
    // التحقق من الحقول المطلوبة (comment / signature)
    if (transition.ui.requireComment && !context.comment) {
      return transition.ui.confirmationMessage || 'Comment is required for this transition';
    }

    if (transition.ui.requireSignature && !context.signature) {
      return 'Signature is required for this transition';
    }

    // تنفيذ validators
    for (const validator of transition.validators) {
      switch (validator.type) {
        case 'required_field': {
          const value = this.getFieldValue(context, validator.config.fieldPath);
          if (value === null || value === undefined || value === '') {
            return validator.errorMessage;
          }
          break;
        }
        case 'field_value': {
          if (validator.config.fieldPath && validator.config.operator) {
            const value = this.getFieldValue(context, validator.config.fieldPath);
            const result = this.guardEvaluator.evaluateGuard(
              {
                guardId: validator.validatorId,
                type: WFGuardType.FIELD_VALUE,
                config: {
                  fieldPath: validator.config.fieldPath,
                  operator: validator.config.operator,
                  value: validator.config.value,
                },
              },
              context
            );
            if (!result.passed) {
              return validator.errorMessage;
            }
          }
          break;
        }
        case 'expression': {
          if (validator.config.expression) {
            const result = this.guardEvaluator.evaluateGuard(
              {
                guardId: validator.validatorId,
                type: WFGuardType.EXPRESSION,
                config: { expression: validator.config.expression },
              },
              context
            );
            if (!result.passed) {
              return validator.errorMessage;
            }
          }
          break;
        }
      }
    }

    return null;
  }

  /**
   * الحصول على قيمة حقل من السياق
   */
  private getFieldValue(context: IWFExecutionContext, fieldPath?: string): any {
    if (!fieldPath) return undefined;
    const parts = fieldPath.split('.');
    const root = parts[0];
    const rest = parts.slice(1);

    let current: any;
    switch (root) {
      case 'entity':
        current = context.entity;
        break;
      case 'variables':
        current = context.instance.variables;
        break;
      case 'transitionData':
        current = context.transitionData;
        break;
      default:
        current = context.instance.variables?.[root] ?? context.entity?.[root];
        return current;
    }

    for (const part of rest) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * تسجيل حدث
   */
  private async recordEvent(event: Omit<IWFEvent, '_id'>): Promise<void> {
    try {
      await this.eventStore.record(event);
    } catch (error) {
      console.error('[WorkflowEngine] Failed to record event:', error);
    }
  }

  /**
   * إنشاء نتيجة فشل
   */
  private failResult(
    instanceId: string,
    fromState: string,
    toState: string,
    transitionId: string,
    error: string
  ): IWFTransitionResult {
    return {
      success: false,
      instanceId,
      fromState,
      toState,
      transitionId,
      newStatus: WFInstanceStatus.ACTIVE,
      actionResults: [],
      error,
    };
  }
}

export default GenericWorkflowEngine;
