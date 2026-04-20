/**
 * RecordServiceAdapter — Platform Form Record Adapter (Phase 4)
 *
 * Bridges IWFEntityService → RecordService for form submission records.
 * Registered in ActionExecutor as the handler for entityType = 'form_record'.
 *
 * Architecture (ADR 001, Phase 4):
 *   workflow-engine (ActionExecutor)
 *     → RecordServiceAdapter (this file)
 *       → RecordService (platform facade)
 *         → formSubmissionService (implementation, unchanged)
 *
 * entityType keys handled: 'form_record', 'form_submission'
 */

import type { IWFEntityService } from '../engine/ActionExecutor';
import { recordService } from '../../forms/services/RecordService';
import { SubmissionStatus } from '../../../core/types/smart-forms.types';
import logger from '../../../utils/logger';

const HANDLED_TYPES = ['form_record', 'form_submission'];

export class RecordServiceAdapter implements IWFEntityService {
  async updateEntity(
    entityType: string,
    entityId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    if (!HANDLED_TYPES.includes(entityType)) {
      throw new Error(
        `[RecordServiceAdapter] Unsupported entity type "${entityType}". Handled: ${HANDLED_TYPES.join(', ')}`,
      );
    }

    const { status, data, assignee, note } = updates;

    if (status) {
      await recordService.updateRecordStatus(
        entityId,
        status as SubmissionStatus,
        (updates.actorId ?? 'workflow-engine') as string,
        note as string | undefined,
      );
      logger.info(`[RecordServiceAdapter] Status → ${status} for record ${entityId}`);
    }

    if (data && typeof data === 'object') {
      const record = await recordService.getRecord(entityId);
      if (record) {
        await recordService.updateRecordData(entityId, {
          data: { ...(record.data as Record<string, unknown>), ...(data as Record<string, unknown>) },
          updated_by: (updates.actorId ?? 'workflow-engine') as string,
        });
        logger.info(`[RecordServiceAdapter] Data updated for record ${entityId}`);
      }
    }

    if (assignee) {
      logger.info(
        `[RecordServiceAdapter] Assignee update requested for ${entityId} → ${assignee} (not yet implemented via RecordService)`,
      );
    }
  }

  async getEntity(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!HANDLED_TYPES.includes(entityType)) {
      throw new Error(
        `[RecordServiceAdapter] Unsupported entity type "${entityType}". Handled: ${HANDLED_TYPES.join(', ')}`,
      );
    }

    const record = await recordService.getRecord(entityId);
    if (!record) return null;

    return recordService.toRecordDetail(record) as unknown as Record<string, unknown>;
  }
}

export const recordServiceAdapter = new RecordServiceAdapter();
