/**
 * RecordWorkflowService — Auto-Workflow Attachment
 *
 * When a RecordItem is created with a RequestType that has a
 * workflowTemplateId, this service starts a WorkflowInstance
 * and binds it to the RecordItem.
 *
 * Uses the workflow-engine internal API (IWorkflowApi).
 */

import RecordItem, { type IRecordItemDocument } from '../models/RecordItem';
import RequestType from '../models/RequestType';
import InternalApiRegistry from '../../../shared/internal-api/InternalApiRegistry';
import { recordActivityService } from './RecordActivityService';
import logger from '../../../utils/logger';

class RecordWorkflowService {
  /**
   * Attempt to auto-attach a workflow to a newly created record.
   *
   * @returns true if a workflow was attached, false otherwise.
   */
  async autoAttachWorkflow(
    recordItem: IRecordItemDocument,
    actorId: string,
    actorName: string,
  ): Promise<boolean> {
    try {
      // If already has a workflow, skip
      if (recordItem.workflowInstanceId) {
        return false;
      }

      // Look up the request type for workflow template
      if (!recordItem.requestTypeId) {
        return false;
      }

      const requestType = await RequestType.findById(recordItem.requestTypeId);
      if (!requestType?.workflowTemplateId) {
        return false;
      }

      // Get the workflow API
      const workflowApi = InternalApiRegistry.get('workflow') as import('../../../shared/internal-api/types').IWorkflowApi | undefined;
      if (!workflowApi) {
        logger.warn('[RecordWorkflow] Workflow API not available');
        return false;
      }

      // Start workflow instance
      const instance = await workflowApi.startWorkflow(
        requestType.workflowTemplateId,
        {
          recordId: recordItem._id?.toString(),
          recordNumber: recordItem.recordNumber,
          requestTypeId: recordItem.requestTypeId,
          organizationId: recordItem.organizationId,
        },
        actorId,
      );

      if (!instance) {
        logger.warn('[RecordWorkflow] Failed to start workflow instance');
        return false;
      }

      // Bind workflow instance to record
      const instanceId = instance._id?.toString() ?? instance.id;
      await RecordItem.findByIdAndUpdate(recordItem._id, {
        $set: { workflowInstanceId: instanceId },
      });

      // Log activity
      if (recordItem.formSubmissionId) {
        await recordActivityService.onWorkflowStarted(
          recordItem.formSubmissionId,
          actorId,
          actorName,
          instanceId,
        );
      }

      logger.info('[RecordWorkflow] Workflow auto-attached', {
        recordId: recordItem._id,
        workflowInstanceId: instanceId,
        definitionId: requestType.workflowTemplateId,
      });

      return true;
    } catch (err) {
      logger.error('[RecordWorkflow] Auto-attach failed', {
        error: err,
        recordId: recordItem._id,
      });
      return false;
    }
  }
}

export const recordWorkflowService = new RecordWorkflowService();
export default recordWorkflowService;
