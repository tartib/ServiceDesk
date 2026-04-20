/**
 * solutions/itsm — Solution Stub (Phase 6)
 *
 * Canonical entry point for ITSM solution code that needs to interact
 * with the forms/records platform.
 *
 * Architecture (ADR 001):
 *   solutions/itsm → platform interfaces only
 *                  → modules/forms/domain/platform-interfaces
 *                  → modules/forms/domain/record-interfaces
 *
 * TODO (Phase 6+):
 *   - IncidentFormBinding: links Incident entity to a FormDefinition
 *   - ChangeRequestFormBinding: links ChangeRequest to a FormDefinition
 *   - ITSMRecordFacade: wraps RecordService with ITSM-specific policies (SLA, priority)
 */

export * from './types';
export { IncidentFormBinding } from './IncidentFormBinding';
export { ITSMRecordFacade } from './ITSMRecordFacade';
export type { CreateITSMRecordDTO, ITSMPriority, ITSMEntityType } from './ITSMRecordFacade';
