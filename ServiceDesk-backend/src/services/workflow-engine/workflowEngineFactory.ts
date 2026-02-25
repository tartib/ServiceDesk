/**
 * Workflow Engine Factory
 * مصنع محرك سير العمل — يربط الخدمات مع المحرك
 */

import { GenericWorkflowEngine } from '../../core/engines/workflow/GenericWorkflowEngine';
import workflowDefinitionService from './workflowDefinition.service';
import workflowInstanceService from './workflowInstance.service';
import workflowEventService from './workflowEvent.service';

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
