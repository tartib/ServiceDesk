'use client';

import { useState } from 'react';
import { X, Plus, GripVertical, Archive, Pencil } from 'lucide-react';
import { useProjectTaskFields } from '@/hooks/useProjectTaskFields';
import type { TaskFieldDefinition, TaskCustomFieldType } from '@/types/task-fields';
import { ALLOWED_FIELD_TYPES } from '@/types/task-fields';
import { toast } from 'sonner';

interface ManageTaskFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const TYPE_LABELS: Record<TaskCustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Select',
  boolean: 'Boolean',
  phone: 'Phone',
  date: 'Date',
};

interface FieldFormState {
  id: string;
  name: string;
  type: TaskCustomFieldType;
  required: boolean;
  options: string[];
  defaultValue: string;
  appliesTo: string[];
}

const EMPTY_FORM: FieldFormState = {
  id: '',
  name: '',
  type: 'text',
  required: false,
  options: [],
  defaultValue: '',
  appliesTo: [],
};

export default function ManageTaskFieldsModal({ isOpen, onClose, projectId }: ManageTaskFieldsModalProps) {
  const { activeFields, isLoading, createField, updateField, archiveField } = useProjectTaskFields(projectId);
  const [showForm, setShowForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldFormState>(EMPTY_FORM);
  const [newOption, setNewOption] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingFieldId(null);
    setShowForm(false);
    setNewOption('');
  };

  const startEdit = (field: TaskFieldDefinition) => {
    setForm({
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required || false,
      options: field.options || [],
      defaultValue: field.defaultValue != null ? String(field.defaultValue) : '',
      appliesTo: field.appliesTo || [],
    });
    setEditingFieldId(field.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim()) {
      toast.error('ID and Name are required');
      return;
    }
    if (form.type === 'select' && form.options.length === 0) {
      toast.error('Select fields must have at least one option');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<TaskFieldDefinition> & { id: string; name: string; type: TaskCustomFieldType } = {
        id: form.id.trim(),
        name: form.name.trim(),
        type: form.type,
        required: form.required,
        options: form.type === 'select' ? form.options : undefined,
        defaultValue: form.defaultValue || undefined,
        appliesTo: form.appliesTo.length > 0 ? form.appliesTo : undefined,
      };

      let ok: boolean;
      if (editingFieldId) {
        ok = await updateField(editingFieldId, payload);
      } else {
        ok = await createField(payload);
      }

      if (ok) {
        toast.success(editingFieldId ? 'Field updated' : 'Field created');
        resetForm();
      } else {
        toast.error('Failed to save field');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (fieldId: string) => {
    const ok = await archiveField(fieldId);
    if (ok) {
      toast.success('Field archived');
    } else {
      toast.error('Failed to archive field');
    }
  };

  const addOption = () => {
    const val = newOption.trim();
    if (!val) return;
    if (form.options.includes(val)) {
      toast.error('Option already exists');
      return;
    }
    setForm(prev => ({ ...prev, options: [...prev.options, val] }));
    setNewOption('');
  };

  const removeOption = (opt: string) => {
    setForm(prev => ({ ...prev, options: prev.options.filter(o => o !== opt) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Manage Task Custom Fields</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* Field list */}
              {activeFields.length === 0 && !showForm && (
                <div className="text-center py-8 text-muted-foreground">
                  No custom fields defined yet. Click &quot;Add Field&quot; to create one.
                </div>
              )}

              {activeFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{field.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {TYPE_LABELS[field.type]}
                      </span>
                      {field.required && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ID: {field.id}
                      {field.options && field.options.length > 0 && (
                        <span className="ml-2">Options: {field.options.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(field)}
                    className="p-1.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleArchive(field.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}

              {/* Add/Edit form */}
              {showForm && (
                <div className="border border-brand-border rounded-lg p-4 space-y-3 bg-card">
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingFieldId ? 'Edit Field' : 'New Field'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* ID */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Machine ID
                      </label>
                      <input
                        type="text"
                        value={form.id}
                        onChange={(e) => setForm(prev => ({ ...prev, id: e.target.value.replace(/[^a-z0-9_]/g, '') }))}
                        disabled={!!editingFieldId}
                        placeholder="e.g. mobile_number"
                        className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border disabled:opacity-50"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Mobile Number"
                        className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Type
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as TaskCustomFieldType, options: [] }))}
                        disabled={!!editingFieldId}
                        className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border disabled:opacity-50"
                      >
                        {ALLOWED_FIELD_TYPES.map(t => (
                          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Required */}
                    <div className="flex items-end gap-2 pb-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.required}
                          onChange={(e) => setForm(prev => ({ ...prev, required: e.target.checked }))}
                          className="rounded border-border"
                        />
                        <span className="text-foreground">Required</span>
                      </label>
                    </div>
                  </div>

                  {/* Options (select type) */}
                  {form.type === 'select' && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Options
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.options.map(opt => (
                          <span
                            key={opt}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted text-foreground"
                          >
                            {opt}
                            <button
                              onClick={() => removeOption(opt)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                          placeholder="Add option..."
                          className="flex-1 px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border"
                        />
                        <button
                          onClick={addOption}
                          className="px-3 py-1.5 text-sm rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Default value */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Default Value (optional)
                    </label>
                    <input
                      type="text"
                      value={form.defaultValue}
                      onChange={(e) => setForm(prev => ({ ...prev, defaultValue: e.target.value }))}
                      placeholder="Leave empty for no default"
                      className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={resetForm}
                      className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-sm rounded bg-brand text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : editingFieldId ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between">
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-brand text-brand-foreground hover:bg-brand-strong transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted text-foreground transition-colors ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
