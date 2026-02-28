'use client';

import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IssueType } from '@/hooks/useProjectIssueTypes';

const ICON_OPTIONS = ['⚡', '📦', '✓', '📖', '🐛', '🔧', '🎯', '💡', '🚀', '📋', '🔒', '⚙️', '🏷️', '📌', '🛡️', '🔔'];

const COLOR_OPTIONS = [
  { id: 'text-purple-400', label: 'Purple', preview: 'bg-purple-400' },
  { id: 'text-orange-400', label: 'Orange', preview: 'bg-orange-400' },
  { id: 'text-blue-400', label: 'Blue', preview: 'bg-blue-400' },
  { id: 'text-green-400', label: 'Green', preview: 'bg-green-400' },
  { id: 'text-red-400', label: 'Red', preview: 'bg-red-400' },
  { id: 'text-yellow-400', label: 'Yellow', preview: 'bg-yellow-400' },
  { id: 'text-pink-400', label: 'Pink', preview: 'bg-pink-400' },
  { id: 'text-cyan-400', label: 'Cyan', preview: 'bg-cyan-400' },
  { id: 'text-indigo-400', label: 'Indigo', preview: 'bg-indigo-400' },
  { id: 'text-gray-400', label: 'Gray', preview: 'bg-gray-400' },
];

interface ManageWorkTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueTypes: IssueType[];
  onAdd: (issueType: IssueType) => Promise<boolean>;
  onUpdate: (typeId: string, updates: Partial<IssueType>) => Promise<boolean>;
  onDelete: (typeId: string) => Promise<{ success: boolean; error?: string }>;
  initialMode?: 'list' | 'add' | 'edit';
  initialEditTypeId?: string;
}

export default function ManageWorkTypesModal({
  isOpen,
  onClose,
  issueTypes,
  onAdd,
  onUpdate,
  onDelete,
  initialMode = 'list',
  initialEditTypeId,
}: ManageWorkTypesModalProps) {
  const { t } = useLanguage();

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>(initialMode);
  const [editingType, setEditingType] = useState<IssueType | null>(
    initialEditTypeId ? issueTypes.find(t => t.id === initialEditTypeId) || null : null
  );
  const [formData, setFormData] = useState<IssueType>({
    id: '',
    name: '',
    icon: '✓',
    color: 'text-blue-400',
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({ id: '', name: '', icon: '✓', color: 'text-blue-400' });
    setEditingType(null);
    setError(null);
  };

  const startAdd = () => {
    resetForm();
    setMode('add');
  };

  const startEdit = (type: IssueType) => {
    setEditingType(type);
    setFormData({ ...type });
    setMode('edit');
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError(t('projects.board.nameRequired') || 'Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === 'add') {
        const id = formData.id.trim() || formData.name.trim().toLowerCase().replace(/\s+/g, '_');
        const success = await onAdd({ ...formData, id });
        if (success) {
          setMode('list');
          resetForm();
        } else {
          setError(t('projects.board.addTypeFailed') || 'Failed to add work type. ID may already exist.');
        }
      } else if (mode === 'edit' && editingType) {
        const success = await onUpdate(editingType.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          description: formData.description,
        });
        if (success) {
          setMode('list');
          resetForm();
        } else {
          setError(t('projects.board.updateTypeFailed') || 'Failed to update work type');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (typeId: string) => {
    setSaving(true);
    const result = await onDelete(typeId);
    setSaving(false);
    if (result.success) {
      setDeleteConfirm(null);
    } else {
      setError(result.error || 'Failed to delete');
      setDeleteConfirm(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'add'
              ? (t('projects.board.addWorkType') || 'Add Work Type')
              : mode === 'edit'
              ? (t('projects.board.editWorkType') || 'Edit Work Type')
              : (t('projects.board.manageWorkTypes') || 'Manage Work Types')}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-1">
              {issueTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">{type.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{type.id}</p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${type.color.replace('text-', 'bg-')}`} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(type)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title={t('projects.board.editWorkType') || 'Edit'}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {deleteConfirm === type.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(type.id)}
                          disabled={saving}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {t('projects.common.confirm') || 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                          {t('projects.common.cancel') || 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(type.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title={t('projects.common.delete') || 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {issueTypes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  {t('projects.board.noWorkTypes') || 'No work types defined'}
                </p>
              )}
            </div>
          ) : (
            /* Add / Edit Form */
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.common.name') || 'Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder={t('projects.board.typeName') || 'e.g. Improvement'}
                  autoFocus
                />
              </div>

              {/* ID (only for add) */}
              {mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('projects.board.typeId') || 'ID'}
                    <span className="text-xs text-gray-400 ml-1">({t('projects.board.autoGenerated') || 'auto-generated if empty'})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-mono text-sm"
                    placeholder="improvement"
                  />
                </div>
              )}

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.board.icon') || 'Icon'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg border transition-colors ${
                        formData.icon === icon
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.board.color') || 'Color'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFormData({ ...formData, color: c.id })}
                      className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                        formData.color === c.id
                          ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">
                  {t('projects.board.preview') || 'Preview'}
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">{formData.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{formData.name || '—'}</span>
                  <span className={`w-3 h-3 rounded-full ${formData.color.replace('text-', 'bg-')}`} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {mode === 'list' ? (
            <>
              <button
                onClick={startAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t('projects.board.addWorkType') || 'Add work type'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('projects.common.close') || 'Close'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setMode('list'); resetForm(); }}
                className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('projects.common.back') || 'Back'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                {saving
                  ? (t('projects.common.saving') || 'Saving...')
                  : mode === 'add'
                  ? (t('projects.board.addWorkType') || 'Add')
                  : (t('projects.common.save') || 'Save')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
