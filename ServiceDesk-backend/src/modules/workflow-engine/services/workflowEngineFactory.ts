/**
 * Workflow Engine Factory
 * مصنع محرك سير العمل — يربط الخدمات مع المحرك
 */

import { GenericWorkflowEngine, type IWFExternalTaskStore, type IRuleExecutionHook } from '../engine/GenericWorkflowEngine';
import { getRuleExecutionService } from '../../itsm/services/RuleExecutionService';
import { RuleTriggerType } from '../../itsm/models/AutomationRule';
import workflowDefinitionService from './workflowDefinition.service';
import workflowInstanceService from './workflowInstance.service';
import workflowEventService from './workflowEvent.service';
import ExternalTask, { ExternalTaskStatus } from '../models/ExternalTask';
import { webhookService } from '../../../integrations/services/webhookService';
import { isWfPostgres, getWfRepos } from '../infrastructure/repositories';
import { NotificationServiceAdapter } from '../adapters/NotificationServiceAdapter';
import { EntityServiceAdapter } from '../adapters/EntityServiceAdapter';
import { TaskServiceAdapter } from '../adapters/TaskServiceAdapter';

/**
 * مخزن المهام الخارجية — يربط الـ ExternalTask model بواجهة المحرك
 */
const externalTaskStore: IWFExternalTaskStore = {
  async create(task) {
    return ExternalTask.create(task);
  },
  async findById(id) {
    return ExternalTask.findById(id).lean();
  },
  async findAvailableByTopic(topic, maxTasks) {
    return ExternalTask.find({ topic, status: ExternalTaskStatus.AVAILABLE })
      .sort({ priority: -1, createdAt: 1 })
      .limit(maxTasks)
      .lean();
  },
  async lockTask(taskId, workerId, lockDuration) {
    return ExternalTask.findOneAndUpdate(
      { _id: taskId, status: ExternalTaskStatus.AVAILABLE },
      {
        $set: {
          status: ExternalTaskStatus.LOCKED,
          workerId,
          lockExpiresAt: new Date(Date.now() + lockDuration),
          lockedAt: new Date(),
        },
      },
      { new: true }
    ).lean();
  },
  async completeTask(taskId, resultVariables) {
    return ExternalTask.findByIdAndUpdate(
      taskId,
      {
        $set: {
          status: ExternalTaskStatus.COMPLETED,
          resultVariables: resultVariables || null,
          completedAt: new Date(),
        },
      },
      { new: true }
    ).lean();
  },
  async failTask(taskId, errorMessage, errorDetails) {
    const task = await ExternalTask.findById(taskId);
    if (!task) return null;

    const newRetriesLeft = task.retriesLeft - 1;
    const newStatus = newRetriesLeft > 0 ? ExternalTaskStatus.AVAILABLE : ExternalTaskStatus.FAILED;

    return ExternalTask.findByIdAndUpdate(
      taskId,
      {
        $set: {
          status: newStatus,
          errorMessage,
          errorDetails: errorDetails || null,
          retriesLeft: newRetriesLeft,
          workerId: null,
          lockExpiresAt: null,
          lockedAt: null,
        },
      },
      { new: true }
    ).lean();
  },
  async resetExpiredLocks() {
    const result = await ExternalTask.updateMany(
      { status: ExternalTaskStatus.LOCKED, lockExpiresAt: { $lte: new Date() } },
      { $set: { status: ExternalTaskStatus.AVAILABLE, workerId: null, lockExpiresAt: null, lockedAt: null } }
    );
    return result.modifiedCount || 0;
  },
  async cancelByInstance(instanceId) {
    const result = await ExternalTask.updateMany(
      { instanceId, status: { $in: [ExternalTaskStatus.AVAILABLE, ExternalTaskStatus.LOCKED] } },
      { $set: { status: ExternalTaskStatus.CANCELLED } }
    );
    return result.modifiedCount || 0;
  },
};

let engineInstance: GenericWorkflowEngine | null = null;

/**
 * إنشاء أو جلب نسخة واحدة من المحرك (Singleton)
 */
export function getWorkflowEngine(): GenericWorkflowEngine {
  if (!engineInstance) {
    // Definitions always stay in MongoDB (no PG table)
    const definitionStore = workflowDefinitionService;

    // Instance, Event, ExternalTask stores can use PG
    const usePg = isWfPostgres();
    const repos = usePg ? getWfRepos() : null;

    engineInstance = new GenericWorkflowEngine({
      definitionStore,
      instanceStore: usePg ? repos!.instance : workflowInstanceService,
      eventStore: usePg ? repos!.event : workflowEventService,
      externalTaskStore: usePg ? repos!.externalTask : externalTaskStore,
      webhookService,
      notificationService: new NotificationServiceAdapter(),
      entityService: new EntityServiceAdapter(),
      taskService: new TaskServiceAdapter(),
      ruleExecutionHook: createRuleExecutionHook(),
    });
  }
  return engineInstance;
}

/**
 * إعادة إنشاء المحرك (مفيد للاختبارات أو عند تغيير الخدمات)
 */
export function resetWorkflowEngine(): void {
  engineInstance = null;
}

/**
 * Adapter: bridges IRuleExecutionHook → RuleExecutionService
 */
function createRuleExecutionHook(): IRuleExecutionHook {
  return {
    async onTransitionCompleted(params) {
      try {
        const svc = getRuleExecutionService();
        await svc.executeRules({
          triggerType: RuleTriggerType.STATUS_CHANGED,
          entity: {
            ...params.variables,
            status: params.toState,
            previousStatus: params.fromState,
          },
          entityType: params.entityType,
          entityId: params.entityId,
          organizationId: params.organizationId,
          actor: params.actorId
            ? {
                id: params.actorId,
                name: params.actorName,
                roles: params.actorRoles,
              }
            : undefined,
          changes: {
            status: { old: params.fromState, new: params.toState },
          },
          metadata: {
            instanceId: params.instanceId,
            definitionId: params.definitionId,
            transitionId: params.transitionId,
          },
        });
      } catch (err: any) {
        console.error('[WorkflowEngineFactory] Rule execution hook failed:', err.message);
      }
    },
  };
}

export default getWorkflowEngine;
