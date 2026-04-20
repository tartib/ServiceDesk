/**
 * ITSMRecordFacade — ITSM-specific record policies (ADR 001 Phase 6)
 *
 * Extends IRecordService with ITSM vocabulary: priority, SLA tagging,
 * and entity-type metadata. This is the single entry-point for creating
 * ITSM records (incidents, changes, service requests).
 *
 * Architecture:
 *   ITSM controllers → ITSMRecordFacade → IRecordService
 *                                       → IncidentFormBinding (resolves formDefinitionId)
 */

import type { IRecordService, RecordListOptions, RecordListResult, RecordDetail } from '../../modules/forms/domain/record-interfaces';
import type { IncidentFormBinding } from './IncidentFormBinding';

export type ITSMPriority = 'low' | 'medium' | 'high' | 'critical';
export type ITSMEntityType = 'incident' | 'change' | 'service_request' | 'problem';

export interface CreateITSMRecordDTO {
  entityType: ITSMEntityType;
  userId: string;
  userEmail?: string;
  userName?: string;
  data: Record<string, unknown>;
  priority?: ITSMPriority;
  siteId?: string;
}

const PRIORITY_METADATA: Record<ITSMPriority, { slaHours: number; label: string }> = {
  low: { slaHours: 72, label: 'Low' },
  medium: { slaHours: 24, label: 'Medium' },
  high: { slaHours: 8, label: 'High' },
  critical: { slaHours: 2, label: 'Critical' },
};

export class ITSMRecordFacade {
  constructor(
    private readonly recordService: IRecordService,
    private readonly formBinding: IncidentFormBinding,
  ) {}

  /**
   * Create an ITSM record.
   * Resolves the correct FormDefinition via IncidentFormBinding,
   * injects priority + SLA metadata into the record data.
   */
  async createITSMRecord(dto: CreateITSMRecordDTO): Promise<RecordDetail> {
    const definition = await this.formBinding.getDefinitionForEntityType(
      dto.entityType,
      dto.siteId,
    );
    if (!definition) {
      throw new Error(
        `No form binding found for ITSM entity type "${dto.entityType}"${
          dto.siteId ? ` on site "${dto.siteId}"` : ''
        }. Register a binding via IncidentFormBinding.bindEntityType() first.`,
      );
    }

    const priority = dto.priority ?? 'medium';
    const priorityMeta = PRIORITY_METADATA[priority];

    const enrichedData: Record<string, unknown> = {
      ...dto.data,
      _itsm_entity_type: dto.entityType,
      _itsm_priority: priority,
      _itsm_priority_label: priorityMeta.label,
      _itsm_sla_hours: priorityMeta.slaHours,
    };

    const doc = await this.recordService.createRecord({
      form_template_id: definition.form_id,
      submitted_by: {
        user_id: dto.userId,
        name: dto.userName ?? dto.userId,
        email: dto.userEmail ?? '',
      },
      data: enrichedData,
      site_id: dto.siteId,
      is_draft: false,
    });

    return this.recordService.toRecordDetail(doc);
  }

  /**
   * Get a single record, exposed with ITSM enrichment.
   */
  async getRecord(recordId: string): Promise<RecordDetail | null> {
    const doc = await this.recordService.getRecord(recordId);
    if (!doc) return null;
    return this.recordService.toRecordDetail(doc);
  }

  /**
   * List records filtered by ITSM entity type (stored in _itsm_entity_type data field).
   * Delegates to IRecordService with entity-type filter in options.
   */
  async listITSMRecords(
    entityType: ITSMEntityType,
    options: Omit<RecordListOptions, 'form_template_id'> = {},
  ): Promise<RecordListResult> {
    const definition = await this.formBinding.getDefinitionForEntityType(entityType);
    if (!definition) {
      return { submissions: [], total: 0, page: 1, limit: 20, total_pages: 0 } as RecordListResult;
    }
    return this.recordService.listRecords({
      ...options,
      form_template_id: definition.form_id,
    });
  }

  /**
   * Escalate an ITSM record — updates its priority metadata to critical.
   */
  async escalate(recordId: string, actorId: string): Promise<RecordDetail | null> {
    const doc = await this.recordService.updateRecordData(recordId, {
      updated_by: actorId,
      data: {
        _itsm_priority: 'critical',
        _itsm_priority_label: PRIORITY_METADATA.critical.label,
        _itsm_sla_hours: PRIORITY_METADATA.critical.slaHours,
        _itsm_escalated_by: actorId,
        _itsm_escalated_at: new Date().toISOString(),
      },
    });
    if (!doc) return null;
    return this.recordService.toRecordDetail(doc);
  }
}
