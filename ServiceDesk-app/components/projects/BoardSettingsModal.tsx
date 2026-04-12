'use client';

import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BoardSettings {
 groupBy: 'status' | 'assignee' | 'type' | 'priority';
 compactView: boolean;
 showSubtasks: boolean;
 showLabels: boolean;
 showStoryPoints: boolean;
}

interface BoardSettingsModalProps {
 isOpen: boolean;
 onClose: () => void;
 currentSettings: BoardSettings;
 onSave: (settings: BoardSettings) => void;
 onReset: () => void;
}

export function BoardSettingsModal({
 isOpen,
 onClose,
 currentSettings,
 onSave,
 onReset,
}: BoardSettingsModalProps) {
 const { t } = useLanguage();
 const [settings, setSettings] = useState<BoardSettings>(currentSettings);

 if (!isOpen) return null;

 const handleSave = () => {
 onSave(settings);
 onClose();
 };

 const handleReset = () => {
 onReset();
 onClose();
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-background rounded-lg w-full max-w-md shadow-xl">
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <div className="flex items-center gap-2">
 <Settings className="h-5 w-5 text-muted-foreground" />
 <h2 className="text-xl font-semibold text-foreground">
 {t('projects.board.boardSettings') || 'Board Settings'}
 </h2>
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="px-6 py-4 space-y-4">
 {/* Group By */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 {t('projects.board.groupBy') || 'Group By'}
 </label>
 <select
 value={settings.groupBy}
 onChange={(e) => setSettings({ ...settings, groupBy: e.target.value as 'status' | 'assignee' | 'type' | 'priority' })}
 className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 >
 <option value="status">Status</option>
 <option value="assignee">Assignee</option>
 <option value="type">Type</option>
 <option value="priority">Priority</option>
 </select>
 </div>

 {/* View Options */}
 <div className="space-y-3 pt-2">
 <h3 className="text-sm font-medium text-foreground">
 {t('projects.board.viewOptions') || 'View Options'}
 </h3>

 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={settings.compactView}
 onChange={(e) => setSettings({ ...settings, compactView: e.target.checked })}
 className="rounded border-border"
 />
 <span className="text-sm text-foreground">
 {t('projects.board.compactView') || 'Compact View'}
 </span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={settings.showSubtasks}
 onChange={(e) => setSettings({ ...settings, showSubtasks: e.target.checked })}
 className="rounded border-border"
 />
 <span className="text-sm text-foreground">
 {t('projects.board.showSubtasks') || 'Show Subtasks'}
 </span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={settings.showLabels}
 onChange={(e) => setSettings({ ...settings, showLabels: e.target.checked })}
 className="rounded border-border"
 />
 <span className="text-sm text-foreground">
 {t('projects.board.showLabels') || 'Show Labels'}
 </span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={settings.showStoryPoints}
 onChange={(e) => setSettings({ ...settings, showStoryPoints: e.target.checked })}
 className="rounded border-border"
 />
 <span className="text-sm text-foreground">
 {t('projects.board.showStoryPoints') || 'Show Story Points'}
 </span>
 </label>
 </div>
 </div>

 <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/50">
 <button
 onClick={handleReset}
 className="text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 {t('projects.board.resetToDefaults') || 'Reset to Defaults'}
 </button>
 <div className="flex items-center gap-3">
 <button
 onClick={onClose}
 className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 {t('projects.common.cancel') || 'Cancel'}
 </button>
 <button
 onClick={handleSave}
 className="px-4 py-2 bg-brand hover:bg-brand-strong text-brand-foreground rounded-lg transition-colors"
 >
 {t('projects.common.save') || 'Save'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
