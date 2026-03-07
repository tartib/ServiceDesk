/**
 * Workflow Timer Job
 * وظيفة دورية لفحص ومعالجة مؤقتات سير العمل
 *
 * تعمل كل دقيقة لفحص:
 * - تحذيرات SLA
 * - اختراقات SLA
 * - التصعيدات
 * - الانتقالات التلقائية
 */

import { TimerManager } from '../modules/workflow-engine/engine/TimerManager';
import workflowDefinitionService from '../modules/workflow-engine/services/workflowDefinition.service';
import workflowInstanceService from '../modules/workflow-engine/services/workflowInstance.service';
import workflowEventService from '../modules/workflow-engine/services/workflowEvent.service';

let timerManager: TimerManager | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function getTimerManager(): TimerManager {
  if (!timerManager) {
    timerManager = new TimerManager({
      instanceStore: workflowInstanceService,
      definitionStore: workflowDefinitionService,
      eventStore: workflowEventService,
    });
  }
  return timerManager;
}

/**
 * بدء الوظيفة الدورية
 * @param intervalMs الفاصل الزمني بالمللي ثانية (افتراضي: 60 ثانية)
 */
export function startWorkflowTimerJob(intervalMs: number = 60_000): void {
  if (intervalId) {
    console.warn('[WorkflowTimerJob] Job already running');
    return;
  }

  console.log(`[WorkflowTimerJob] Starting with interval ${intervalMs / 1000}s`);

  intervalId = setInterval(async () => {
    try {
      const manager = getTimerManager();
      const result = await manager.processDueTimers();

      if (result.processed > 0 || result.errors > 0) {
        console.log(
          `[WorkflowTimerJob] Processed: ${result.processed}, Errors: ${result.errors}`
        );
      }
    } catch (error: any) {
      console.error('[WorkflowTimerJob] Unhandled error:', error.message);
    }
  }, intervalMs);
}

/**
 * إيقاف الوظيفة الدورية
 */
export function stopWorkflowTimerJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[WorkflowTimerJob] Stopped');
  }
}

/**
 * تشغيل يدوي لمرة واحدة (مفيد للاختبارات)
 */
export async function runWorkflowTimerJobOnce(): Promise<{
  processed: number;
  errors: number;
}> {
  const manager = getTimerManager();
  const result = await manager.processDueTimers();
  return { processed: result.processed, errors: result.errors };
}

export default { startWorkflowTimerJob, stopWorkflowTimerJob, runWorkflowTimerJobOnce };
