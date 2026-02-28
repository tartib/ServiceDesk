/**
 * Workflow Engine Factory
 * مصنع محرك سير العمل — يربط الخدمات مع المحرك
 */

import { GenericWorkflowEngine, type IWFExternalTaskStore } from '../../core/engines/workflow/GenericWorkflowEngine';
import workflowDefinitionService from './workflowDefinition.service';
import workflowInstanceService from './workflowInstance.service';
import workflowEventService from './workflowEvent.service';
import ExternalTask, { ExternalTaskStatus } from '../../models/workflow/ExternalTask';

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
    engineInstance = new GenericWorkflowEngine({
      definitionStore: workflowDefinitionService,
      instanceStore: workflowInstanceService,
      eventStore: workflowEventService,
      externalTaskStore,
      // notificationService, webhookService, entityService يتم ربطها لاحقاً
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

export default getWorkflowEngine;
