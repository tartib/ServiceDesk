/**
 * ITSM Solution — Domain Types (Phase 6 stub)
 *
 * References platform interfaces only — no module internals.
 */

import type { IFormDefinition } from '../../modules/forms/domain/platform-interfaces';
import type { IRecordService } from '../../modules/forms/domain/record-interfaces';

/** Links an ITSM entity type to a canonical FormDefinition */
export interface IITSMFormBinding {
  /** ITSM entity type, e.g. 'incident', 'change', 'service_request' */
  entityType: string;
  formDefinitionId: string;
  /** Resolved at query time */
  formDefinition?: IFormDefinition;
  isActive: boolean;
  siteId?: string;
}

/**
 * IITSMRecordFacade — ITSM-specific policies on top of IRecordService.
 * Stub: will be implemented in Phase 6 when SLA + priority integration is defined.
 */
export interface IITSMRecordFacade extends Pick<IRecordService, 'createRecord' | 'getRecord' | 'listRecords'> {
  /** Create a record with ITSM priority tagging */
  createITSMRecord(
    dto: Parameters<IRecordService['createRecord']>[0] & { priority?: 'low' | 'medium' | 'high' | 'critical' }
  ): ReturnType<IRecordService['createRecord']>;
}
