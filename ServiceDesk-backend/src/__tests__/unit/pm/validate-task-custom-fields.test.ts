import {
  validateTaskCustomFields,
  ValidateCustomFieldsInput,
} from '../../../modules/pm/validators/validate-task-custom-fields';
import type { TaskFieldDefinition } from '../../../modules/pm/domain/task-field-definition';

// ── helpers ────────────────────────────────────────────────────

function defs(...fields: Partial<TaskFieldDefinition>[]): TaskFieldDefinition[] {
  return fields.map((f, i) => ({
    id: f.id ?? `field_${i}`,
    name: f.name ?? `Field ${i}`,
    type: f.type ?? 'text',
    position: f.position ?? i,
    ...f,
  })) as TaskFieldDefinition[];
}

// ── tests ──────────────────────────────────────────────────────

describe('validateTaskCustomFields', () => {
  // ── text ──
  it('valid text field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'notes', type: 'text' }),
      values: { notes: 'hello' },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.notes).toBe('hello');
  });

  it('invalid text field (number given)', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'notes', type: 'text' }),
      values: { notes: 123 },
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].field).toBe('notes');
  });

  // ── number ──
  it('valid number field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'cost', type: 'number' }),
      values: { cost: 42 },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.cost).toBe(42);
  });

  it('invalid number field (string given)', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'cost', type: 'number' }),
      values: { cost: 'abc' },
    });
    expect(r.valid).toBe(false);
  });

  // ── boolean ──
  it('valid boolean field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'is_flagged', type: 'boolean' }),
      values: { is_flagged: true },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.is_flagged).toBe(true);
  });

  it('invalid boolean field (string given)', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'is_flagged', type: 'boolean' }),
      values: { is_flagged: 'yes' },
    });
    expect(r.valid).toBe(false);
  });

  // ── select ──
  it('valid select field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'env', type: 'select', options: ['dev', 'staging', 'prod'] }),
      values: { env: 'prod' },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.env).toBe('prod');
  });

  it('invalid select option', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'env', type: 'select', options: ['dev', 'staging'] }),
      values: { env: 'prod' },
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toContain('must be one of');
  });

  // ── phone ──
  it('valid phone with + prefix', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'mobile', type: 'phone' }),
      values: { mobile: '+966501234567' },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.mobile).toBe('+966501234567');
  });

  it('valid phone with leading zero', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'mobile', type: 'phone' }),
      values: { mobile: '0501234567' },
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.mobile).toBe('0501234567');
  });

  it('phone rejects number type', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'mobile', type: 'phone' }),
      values: { mobile: 501234567 },
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toContain('string');
  });

  // ── date ──
  it('valid date field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'due', type: 'date' }),
      values: { due: '2025-06-15T00:00:00.000Z' },
    });
    expect(r.valid).toBe(true);
  });

  it('invalid date field', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'due', type: 'date' }),
      values: { due: 'not-a-date' },
    });
    expect(r.valid).toBe(false);
  });

  // ── required fields ──
  it('missing required field fails', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'model', type: 'text', required: true }),
      values: {},
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toContain('required');
  });

  it('missing required field passes on partial update', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'model', type: 'text', required: true }),
      values: {},
      isPartialUpdate: true,
    });
    expect(r.valid).toBe(true);
  });

  // ── unknown field key ──
  it('rejects unknown field key', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'model', type: 'text' }),
      values: { unknown_field: 'value' },
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toContain('Unknown custom field');
  });

  // ── archived field ──
  it('rejects archived field submission', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'old_field', type: 'text', archived: true }),
      values: { old_field: 'value' },
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toContain('archived');
  });

  // ── default value ──
  it('applies default value when field omitted', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'env', type: 'select', options: ['dev', 'prod'], defaultValue: 'dev' }),
      values: {},
    });
    expect(r.valid).toBe(true);
    expect(r.sanitized.env).toBe('dev');
  });

  // ── appliesTo filtering ──
  it('skips field not applicable to issue type', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'severity', type: 'text', required: true, appliesTo: ['bug'] }),
      values: {},
      issueType: 'task',
    });
    // severity is required for bugs but we're a task — should pass
    expect(r.valid).toBe(true);
  });

  it('enforces field applicable to issue type', () => {
    const r = validateTaskCustomFields({
      definitions: defs({ id: 'severity', type: 'text', required: true, appliesTo: ['bug'] }),
      values: {},
      issueType: 'bug',
    });
    expect(r.valid).toBe(false);
    expect(r.errors[0].field).toBe('severity');
  });

  // ── empty definitions ──
  it('project with no definitions passes with empty values', () => {
    const r = validateTaskCustomFields({
      definitions: [],
      values: {},
    });
    expect(r.valid).toBe(true);
    expect(Object.keys(r.sanitized)).toHaveLength(0);
  });

  it('project with no definitions rejects any values', () => {
    const r = validateTaskCustomFields({
      definitions: [],
      values: { something: 'value' },
    });
    expect(r.valid).toBe(false);
  });
});
