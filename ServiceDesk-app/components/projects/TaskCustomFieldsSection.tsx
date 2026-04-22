'use client';

import type { TaskFieldDefinition } from '@/types/task-fields';

interface TaskCustomFieldsSectionProps {
  definitions: TaskFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  issueType?: string;
  readOnly?: boolean;
  variant?: 'form' | 'detail-row';
}

export default function TaskCustomFieldsSection({
  definitions,
  values,
  onChange,
  errors,
  issueType,
  readOnly = false,
  variant = 'form',
}: TaskCustomFieldsSectionProps) {
  // Filter active + applicable definitions, sorted by position
  const visibleFields = definitions
    .filter(d => !d.archived)
    .filter(d => {
      if (!d.appliesTo || d.appliesTo.length === 0) return true;
      if (!issueType) return true;
      return d.appliesTo.includes(issueType);
    })
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  if (visibleFields.length === 0) return null;

  const handleChange = (fieldId: string, value: unknown) => {
    onChange({ ...values, [fieldId]: value });
  };

  // ── Detail-row variant (matches Assignee / Priority / Labels layout) ──
  if (variant === 'detail-row') {
    return (
      <>
        {visibleFields.map(def => {
          const value = values[def.id];
          const error = errors?.[def.id];

          return (
            <div key={def.id}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {def.name}
                  {def.required && <span className="text-destructive ml-0.5">*</span>}
                </span>
                <div className="flex items-center">
                  {renderInlineControl(def, value, (v) => handleChange(def.id, v), readOnly)}
                </div>
              </div>
              {error && (
                <p className="mt-0.5 text-xs text-destructive text-end">{error}</p>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // ── Form variant (default — used in CreateTaskModal) ──
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Custom Fields
      </h4>
      {visibleFields.map(def => {
        const value = values[def.id];
        const error = errors?.[def.id];

        return (
          <div key={def.id}>
            <label className="block text-sm font-medium text-foreground mb-1">
              {def.name}
              {def.required && <span className="text-destructive ml-0.5">*</span>}
            </label>

            {renderFormControl(def, value, (v) => handleChange(def.id, v), readOnly)}

            {error && (
              <p className="mt-0.5 text-xs text-destructive">{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Inline controls for detail-row variant ──────────────────────

function renderInlineControl(
  def: TaskFieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void,
  readOnly: boolean,
) {
  const inlineInputClass =
    'bg-transparent text-sm text-foreground text-end border-0 border-b border-transparent hover:border-border focus:border-brand-border focus:outline-none px-2 py-1 max-w-[180px] transition-colors';

  switch (def.type) {
    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="—"
          className={inlineInputClass}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          disabled={readOnly}
          placeholder="—"
          className={inlineInputClass}
        />
      );

    case 'phone':
      return (
        <input
          type="tel"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="—"
          className={inlineInputClass}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={typeof value === 'string' ? value.split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          disabled={readOnly}
          className={`${inlineInputClass} cursor-pointer`}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-2 py-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
            className="rounded border-border h-4 w-4"
          />
          <span className="text-sm text-foreground">{value ? 'Yes' : 'No'}</span>
        </label>
      );

    case 'select':
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={readOnly}
          className="bg-transparent text-sm text-foreground text-end border-0 hover:bg-muted rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-border appearance-none max-w-[180px]"
        >
          <option value="">—</option>
          {(def.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    default:
      return <span className="text-xs text-muted-foreground">—</span>;
  }
}

// ── Full-width controls for form variant ────────────────────────

function renderFormControl(
  def: TaskFieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void,
  readOnly: boolean,
) {
  const inputClass =
    'w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border disabled:opacity-60';

  switch (def.type) {
    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={inputClass}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          disabled={readOnly}
          className={inputClass}
        />
      );

    case 'phone':
      return (
        <input
          type="tel"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="+966..."
          className={inputClass}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={typeof value === 'string' ? value.split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          disabled={readOnly}
          className={inputClass}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
            className="rounded border-border h-4 w-4"
          />
          <span className="text-sm text-foreground">{def.name}</span>
        </label>
      );

    case 'select':
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={readOnly}
          className={inputClass}
        >
          <option value="">— Select —</option>
          {(def.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    default:
      return <span className="text-xs text-muted-foreground">Unsupported type: {def.type}</span>;
  }
}
