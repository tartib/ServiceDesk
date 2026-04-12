'use client';

import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IssueType } from '@/hooks/useProjectIssueTypes';

const ICON_OPTIONS = ['⚡', '📦', '✓', '📖', '🐛', '🔧', '🎯', '💡', '🚀', '📋', '🔒', '⚙️', '🏷️', '📌', '🛡️', '🔔'];

const COLOR_OPTIONS = [
 { id: 'text-info/80', label: 'Purple', preview: 'bg-info/70' },
 { id: 'text-warning', label: 'Orange', preview: 'bg-warning/70' },
 { id: 'text-brand', label: 'Blue', preview: 'bg-brand' },
 { id: 'text-success', label: 'Green', preview: 'bg-success/60' },
 { id: 'text-destructive', label: 'Red', preview: 'bg-destructive/60' },
 { id: 'text-warning', label: 'Yellow', preview: 'bg-warning/50' },
 { id: 'text-destructive/80', label: 'Pink', preview: 'bg-destructive/70' },
 { id: 'text-info/80', label: 'Cyan', preview: 'bg-info/70' },
 { id: 'text-info/80', label: 'Indigo', preview: 'bg-info/70' },
 { id: 'text-muted-foreground', label: 'Gray', preview: 'bg-muted-foreground/30' },
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
 color: 'text-brand',
 });
 const [saving, setSaving] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);

 if (!isOpen) return null;

 const resetForm = () => {
 setFormData({ id: '', name: '', icon: '✓', color: 'text-brand' });
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
 <div className="bg-background rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <h2 className="text-lg font-semibold text-foreground">
 {mode === 'add'
 ? (t('projects.board.addWorkType') || 'Add Work Type')
 : mode === 'edit'
 ? (t('projects.board.editWorkType') || 'Edit Work Type')
 : (t('projects.board.manageWorkTypes') || 'Manage Work Types')}
 </h2>
 <button onClick={onClose} className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Body */}
 <div className="px-6 py-4 overflow-y-auto flex-1">
 {error && (
 <div className="mb-4 px-3 py-2 bg-destructive-soft border border-destructive/30 rounded-lg flex items-center gap-2 text-sm text-destructive">
 <AlertTriangle className="h-4 w-4 flex-shrink-0" />
 {error}
 </div>
 )}

 {mode === 'list' ? (
 <div className="space-y-1">
 {issueTypes.map((type) => (
 <div
 key={type.id}
 className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 group"
 >
 <div className="flex items-center gap-3">
 <span className="text-lg w-7 text-center">{type.icon}</span>
 <div>
 <p className="text-sm font-medium text-foreground">{type.name}</p>
 <p className="text-xs text-muted-foreground font-mono">{type.id}</p>
 </div>
 <span className={`w-3 h-3 rounded-full ${type.color.replace('text-', 'bg-')}`} />
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => startEdit(type)}
 className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand-surface rounded"
 title={t('projects.board.editWorkType') || 'Edit'}
 >
 <Pencil className="h-3.5 w-3.5" />
 </button>
 {deleteConfirm === type.id ? (
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleDelete(type.id)}
 disabled={saving}
 className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
 >
 {t('projects.common.confirm') || 'Confirm'}
 </button>
 <button
 onClick={() => setDeleteConfirm(null)}
 className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded"
 >
 {t('projects.common.cancel') || 'Cancel'}
 </button>
 </div>
 ) : (
 <button
 onClick={() => setDeleteConfirm(type.id)}
 className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded"
 title={t('projects.common.delete') || 'Delete'}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 </div>
 ))}

 {issueTypes.length === 0 && (
 <p className="text-sm text-muted-foreground text-center py-6">
 {t('projects.board.noWorkTypes') || 'No work types defined'}
 </p>
 )}
 </div>
 ) : (
 /* Add / Edit Form */
 <div className="space-y-4">
 {/* Name */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 {t('projects.common.name') || 'Name'} <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-brand text-foreground"
 placeholder={t('projects.board.typeName') || 'e.g. Improvement'}
 autoFocus
 />
 </div>

 {/* ID (only for add) */}
 {mode === 'add' && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 {t('projects.board.typeId') || 'ID'}
 <span className="text-xs text-muted-foreground ml-1">({t('projects.board.autoGenerated') || 'auto-generated if empty'})</span>
 </label>
 <input
 type="text"
 value={formData.id}
 onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
 className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-brand text-foreground font-mono text-sm"
 placeholder="improvement"
 />
 </div>
 )}

 {/* Icon Picker */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 {t('projects.board.icon') || 'Icon'}
 </label>
 <div className="flex flex-wrap gap-1.5">
 {ICON_OPTIONS.map((icon) => (
 <button
 key={icon}
 onClick={() => setFormData({ ...formData, icon })}
 className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg border transition-colors ${
 formData.icon === icon
 ? 'border-brand bg-brand-surface ring-1 ring-ring'
 : 'border-border hover:border-border hover:bg-muted/50'
 }`}
 >
 {icon}
 </button>
 ))}
 </div>
 </div>

 {/* Color Picker */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 {t('projects.board.color') || 'Color'}
 </label>
 <div className="flex flex-wrap gap-2">
 {COLOR_OPTIONS.map((c) => (
 <button
 key={c.id}
 onClick={() => setFormData({ ...formData, color: c.id })}
 className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
 formData.color === c.id
 ? 'ring-2 ring-offset-2 ring-ring scale-110'
 : 'hover:scale-105'
 }`}
 title={c.label}
 />
 ))}
 </div>
 </div>

 {/* Preview */}
 <div className="pt-2 border-t border-border">
 <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase">
 {t('projects.board.preview') || 'Preview'}
 </label>
 <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg">
 <span className="text-lg">{formData.icon}</span>
 <span className="text-sm font-medium text-foreground">{formData.name || '—'}</span>
 <span className={`w-3 h-3 rounded-full ${formData.color.replace('text-', 'bg-')}`} />
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50 rounded-b-xl">
 {mode === 'list' ? (
 <>
 <button
 onClick={startAdd}
 className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand hover:bg-brand-surface rounded-lg transition-colors"
 >
 <Plus className="h-4 w-4" />
 {t('projects.board.addWorkType') || 'Add work type'}
 </button>
 <button
 onClick={onClose}
 className="px-4 py-1.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 {t('projects.common.close') || 'Close'}
 </button>
 </>
 ) : (
 <>
 <button
 onClick={() => { setMode('list'); resetForm(); }}
 className="px-4 py-1.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 {t('projects.common.back') || 'Back'}
 </button>
 <button
 onClick={handleSave}
 disabled={saving || !formData.name.trim()}
 className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong disabled:opacity-50 transition-colors"
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
