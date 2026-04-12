'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddStatusModalProps {
 isOpen: boolean;
 onClose: () => void;
 onAdd: (name: string, category: 'todo' | 'in_progress' | 'done', color: string) => void;
}

const predefinedColors = [
 { name: 'Blue', value: '#ffffff' },
 { name: 'Green', value: '#10B981' },
 { name: 'Yellow', value: '#F59E0B' },
 { name: 'Red', value: '#EF4444' },
 { name: 'Purple', value: '#8B5CF6' },
 { name: 'Pink', value: '#EC4899' },
 { name: 'Indigo', value: '#6366F1' },
 { name: 'Gray', value: '#6B7280' },
 { name: 'Orange', value: '#F97316' },
 { name: 'Teal', value: '#14B8A6' },
];

export function AddStatusModal({ isOpen, onClose, onAdd }: AddStatusModalProps) {
 const { t } = useLanguage();
 const [statusName, setStatusName] = useState('');
 const [statusCategory, setStatusCategory] = useState<'todo' | 'in_progress' | 'done'>('todo');
 const [statusColor, setStatusColor] = useState('#ffffff');

 const handleSubmit = () => {
 if (!statusName.trim()) return;
 
 onAdd(statusName.trim(), statusCategory, statusColor);
 
 // Reset form
 setStatusName('');
 setStatusCategory('todo');
 setStatusColor('#ffffff');
 onClose();
 };

 const handleClose = () => {
 setStatusName('');
 setStatusCategory('todo');
 setStatusColor('#ffffff');
 onClose();
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <h2 className="text-xl font-semibold text-foreground">
 {t('projects.board.createNewStatus') || 'Create New Status'}
 </h2>
 <button
 onClick={handleClose}
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 aria-label={t('common.close') || 'Close'}
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6 space-y-4">
 {/* Status Name */}
 <div>
 <label htmlFor="status-name" className="block text-sm font-medium text-foreground mb-2">
 {t('projects.board.statusName') || 'Status Name'}
 </label>
 <input
 id="status-name"
 type="text"
 value={statusName}
 onChange={(e) => setStatusName(e.target.value)}
 placeholder={t('projects.board.enterStatusName') || 'Enter status name...'}
 className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 autoFocus
 />
 </div>

 {/* Category */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 {t('projects.board.statusCategory') || 'Category'}
 </label>
 <div className="grid grid-cols-3 gap-2">
 <button
 onClick={() => setStatusCategory('todo')}
 className={`px-4 py-2 rounded-lg border-2 transition-colors ${
 statusCategory === 'todo'
 ? 'border-brand bg-brand-surface text-brand'
 : 'border-border hover:border-border'
 }`}
 >
 {t('projects.board.statusCatTodo') || 'To Do'}
 </button>
 <button
 onClick={() => setStatusCategory('in_progress')}
 className={`px-4 py-2 rounded-lg border-2 transition-colors ${
 statusCategory === 'in_progress'
 ? 'border-brand bg-brand-surface text-brand'
 : 'border-border hover:border-border'
 }`}
 >
 {t('projects.board.statusCatInProgress') || 'In Progress'}
 </button>
 <button
 onClick={() => setStatusCategory('done')}
 className={`px-4 py-2 rounded-lg border-2 transition-colors ${
 statusCategory === 'done'
 ? 'border-brand bg-brand-surface text-brand'
 : 'border-border hover:border-border'
 }`}
 >
 {t('projects.board.statusCatDone') || 'Done'}
 </button>
 </div>
 </div>

 {/* Color */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 {t('projects.board.statusColor') || 'Color'}
 </label>
 <div className="grid grid-cols-5 gap-2">
 {predefinedColors.map((color) => (
 <button
 key={color.value}
 onClick={() => setStatusColor(color.value)}
 className={`w-full h-10 rounded-lg border-2 transition-all ${
 statusColor === color.value
 ? 'border-foreground scale-110'
 : 'border-border hover:border-border'
 }`}
 style={{ backgroundColor: color.value }}
 title={color.name}
 aria-label={color.name}
 />
 ))}
 </div>
 </div>

 {/* Preview */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 {t('common.preview') || 'Preview'}
 </label>
 <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
 <div
 className="w-4 h-4 rounded"
 style={{ backgroundColor: statusColor }}
 />
 <span className="font-medium text-foreground">
 {statusName || (t('projects.board.statusName') || 'Status Name')}
 </span>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/50">
 <button
 onClick={handleClose}
 className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 {t('common.cancel') || 'Cancel'}
 </button>
 <button
 onClick={handleSubmit}
 disabled={!statusName.trim()}
 className="px-4 py-2 bg-brand hover:bg-brand-strong disabled:bg-brand-soft text-brand-foreground rounded-lg transition-colors"
 >
 {t('projects.board.create') || 'Create'}
 </button>
 </div>
 </div>
 </div>
 );
}
