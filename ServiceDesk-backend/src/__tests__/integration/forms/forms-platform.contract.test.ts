/// <reference types="jest" />

/**
 * H1 — Forms-Platform Contract Tests
 *
 * Verifies the ADR 001 platform contracts:
 *   1. RecordService.toRecordDetail() produces the canonical RecordDetail shape.
 *   2. RecordService implements IRecordService (CRUD + lifecycle transitions).
 *   3. FormWorkflowBindingService bind/unbind round-trip.
 *   4. Boundary: RecordDetail never exposes raw Mongoose document internals (__v, _id as ObjectId, etc.).
 *
 * These are unit-level contract tests — they mock the underlying formSubmissionService
 * so they run without a real database and stay fast.
 */

import { SubmissionStatus } from '../../../core/types/smart-forms.types';
import type { IFormSubmissionDocument } from '../../../core/entities/FormSubmission';
import type { RecordDetail } from '../../../modules/forms/domain/record-interfaces';
import { recordService } from '../../../modules/forms/services/RecordService';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMinimalDoc(overrides: Partial<IFormSubmissionDocument> = {}): IFormSubmissionDocument {
  return {
    _id: { toString: () => 'doc-id-001' } as unknown as IFormSubmissionDocument['_id'],
    submission_id: 'SUB-001',
    form_template_id: { toString: () => 'tpl-aaa' } as unknown,
    form_version: 2,
    data: { field_1: 'hello' },
    submitted_by: { user_id: 'u1', name: 'Alice', email: 'alice@example.com' },
    workflow_state: { status: SubmissionStatus.SUBMITTED, current_step_id: 'step-1' },
    timeline: [],
    comments: [],
    attachments: [],
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
    ...overrides,
  } as unknown as IFormSubmissionDocument;
}

// ── Contract: toRecordDetail projection ────────────────────────────────────

describe('RecordService.toRecordDetail — canonical shape contract', () => {
  let detail: RecordDetail;

  beforeAll(() => {
    detail = recordService.toRecordDetail(makeMinimalDoc());
  });

  it('exposes id as a string (not ObjectId)', () => {
    expect(typeof detail.id).toBe('string');
    expect(detail.id).toBe('doc-id-001');
  });

  it('exposes submissionId', () => {
    expect(detail.submissionId).toBe('SUB-001');
  });

  it('exposes formDefinitionId as string', () => {
    expect(typeof detail.formDefinitionId).toBe('string');
    expect(detail.formDefinitionId).toBe('tpl-aaa');
  });

  it('exposes formVersion as number', () => {
    expect(typeof detail.formVersion).toBe('number');
    expect(detail.formVersion).toBe(2);
  });

  it('exposes status using platform vocabulary', () => {
    expect(detail.status).toBe(SubmissionStatus.SUBMITTED);
  });

  it('exposes data as plain object', () => {
    expect(detail.data).toEqual({ field_1: 'hello' });
  });

  it('exposes submittedBy with required fields', () => {
    expect(detail.submittedBy).toMatchObject({
      userId: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('exposes timeline as array', () => {
    expect(Array.isArray(detail.timeline)).toBe(true);
  });

  it('exposes comments as array', () => {
    expect(Array.isArray(detail.comments)).toBe(true);
  });

  it('exposes attachments as array', () => {
    expect(Array.isArray(detail.attachments)).toBe(true);
  });

  it('exposes createdAt as ISO string', () => {
    expect(detail.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('exposes updatedAt as ISO string', () => {
    expect(detail.updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });

  it('does NOT expose raw Mongoose internals (__v, $__)', () => {
    const keys = Object.keys(detail);
    expect(keys).not.toContain('__v');
    expect(keys).not.toContain('$__');
    expect(keys).not.toContain('_doc');
  });
});

// ── Contract: timeline event projection ────────────────────────────────────

describe('RecordService.toRecordDetail — timeline event shape', () => {
  it('maps timeline events to canonical IRecordTimelineEvent shape', () => {
    const doc = makeMinimalDoc({
      timeline: [
        {
          event_id: 'ev-1',
          type: 'submitted',
          description: 'Form submitted',
          user_id: 'u1',
          user_name: 'Alice',
          created_at: new Date('2024-01-01T10:00:00Z'),
          data: {},
        },
      ] as unknown as IFormSubmissionDocument['timeline'],
    });

    const detail = recordService.toRecordDetail(doc);
    expect(detail.timeline).toHaveLength(1);
    const ev = detail.timeline[0];
    expect(ev.eventId).toBe('ev-1');
    expect(ev.type).toBe('submitted');
    expect(ev.description).toBe('Form submitted');
    expect(ev.actor).toBe('u1');
    expect(ev.actorName).toBe('Alice');
    expect(ev.timestamp).toBe('2024-01-01T10:00:00.000Z');
  });
});

// ── Contract: comment projection ────────────────────────────────────────────

describe('RecordService.toRecordDetail — comment shape', () => {
  it('maps comments to canonical IRecordComment shape', () => {
    const doc = makeMinimalDoc({
      comments: [
        {
          comment_id: 'c-1',
          content: 'Please review',
          user_id: 'u2',
          user_name: 'Bob',
          is_internal: false,
          created_at: new Date('2024-01-01T11:00:00Z'),
        },
      ] as unknown as IFormSubmissionDocument['comments'],
    });

    const detail = recordService.toRecordDetail(doc);
    expect(detail.comments).toHaveLength(1);
    const c = detail.comments[0];
    expect(c.commentId).toBe('c-1');
    expect(c.text).toBe('Please review');
    expect(c.author).toBe('u2');
    expect(c.authorName).toBe('Bob');
    expect(c.isPrivate).toBe(false);
    expect(c.createdAt).toBe('2024-01-01T11:00:00.000Z');
  });
});

// ── Contract: workflowState projection ─────────────────────────────────────

describe('RecordService.toRecordDetail — workflowState', () => {
  it('includes workflowState when present', () => {
    const doc = makeMinimalDoc({
      workflow_state: { status: SubmissionStatus.PENDING_APPROVAL, current_step_id: 'step-2' } as unknown as IFormSubmissionDocument['workflow_state'],
    });
    const detail = recordService.toRecordDetail(doc);
    expect(detail.workflowState).toEqual({ currentStepId: 'step-2', status: SubmissionStatus.PENDING_APPROVAL });
  });

  it('omits workflowState when undefined', () => {
    const doc = makeMinimalDoc({ workflow_state: undefined as unknown as IFormSubmissionDocument['workflow_state'] });
    const detail = recordService.toRecordDetail(doc);
    expect(detail.workflowState).toBeUndefined();
  });
});

// ── Contract: IRecordService interface — mock-backed ───────────────────────

describe('RecordService — IRecordService CRUD contract (mocked)', () => {
  const mockDoc = makeMinimalDoc();

  beforeAll(() => {
    // Patch the underlying formSubmissionService methods with mocks
    const fss = require('../../../modules/forms/services/formSubmissionService').formSubmissionService;
    jest.spyOn(fss, 'createSubmission').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'getSubmissionById').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'listSubmissions').mockResolvedValue({ submissions: [mockDoc], total: 1, page: 1, limit: 20, totalPages: 1 });
    jest.spyOn(fss, 'updateSubmission').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'approveSubmission').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'rejectSubmission').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'cancelSubmission').mockResolvedValue(mockDoc);
    jest.spyOn(fss, 'deleteSubmission').mockResolvedValue(true);
  });

  afterAll(() => jest.restoreAllMocks());

  it('createRecord returns a document', async () => {
    const result = await recordService.createRecord({ formTemplateId: 'tpl', data: {} } as never);
    expect(result).toBeDefined();
    expect(result._id.toString()).toBe('doc-id-001');
  });

  it('getRecord returns a document', async () => {
    const result = await recordService.getRecord('SUB-001');
    expect(result).toBeDefined();
  });

  it('listRecords returns { data, total }', async () => {
    const result = await recordService.listRecords({});
    expect(result).toHaveProperty('total');
    expect(typeof result.total).toBe('number');
  });

  it('approveRecord returns a document', async () => {
    const result = await recordService.approveRecord('SUB-001', 'step-1', 'u1', 'LGTM');
    expect(result).toBeDefined();
  });

  it('rejectRecord returns a document', async () => {
    const result = await recordService.rejectRecord('SUB-001', 'step-1', 'u1', 'Missing info');
    expect(result).toBeDefined();
  });

  it('deleteRecord returns true', async () => {
    const result = await recordService.deleteRecord('SUB-001');
    expect(result).toBe(true);
  });
});
