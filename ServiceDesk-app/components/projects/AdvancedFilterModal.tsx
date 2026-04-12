'use client';

import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FilterState {
 types: string[];
 priorities: string[];
 assignees: string[];
 statuses: string[];
}

interface AdvancedFilterModalProps {
 isOpen: boolean;
 onClose: () => void;
 onApply: (filters: FilterState) => void;
 currentFilters: FilterState;
 availableTypes?: string[];
 availablePriorities?: string[];
 availableAssignees?: Array<{ _id: string; name: string }>;
 availableStatuses?: Array<{ id: string; name: string }>;
}

export function AdvancedFilterModal({
 isOpen,
 onClose,
 onApply,
 currentFilters,
 availableTypes = ['epic', 'feature', 'story', 'task', 'bug'],
 availablePriorities = ['critical', 'high', 'medium', 'low'],
 availableAssignees = [],
 availableStatuses = [],
}: AdvancedFilterModalProps) {
 const { t } = useLanguage();
 const [filters, setFilters] = useState<FilterState>(currentFilters);

 if (!isOpen) return null;

 const toggleFilter = (category: keyof FilterState, value: string) => {
 setFilters((prev) => ({
 ...prev,
 [category]: prev[category].includes(value)
 ? prev[category].filter((v) => v !== value)
 : [...prev[category], value],
 }));
 };

 const clearAll = () => {
 setFilters({
 types: [],
 priorities: [],
 assignees: [],
 statuses: [],
 });
 };

 const handleApply = () => {
 onApply(filters);
 onClose();
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-background rounded-lg w-full max-w-3xl max-h-[80vh] shadow-xl flex flex-col">
 <div className="flex items-center justify-between px-6 py-4 border-b border-border">
 <div className="flex items-center gap-2">
 <Filter className="h-5 w-5 text-muted-foreground" />
 <h2 className="text-xl font-semibold text-foreground">
 {t('projects.board.advancedFilters') || 'Advanced Filters'}
 </h2>
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto px-6 py-4">
 <div className="space-y-6">
 {/* Type Filter */}
 <div>
 <h3 className="font-medium text-foreground mb-3">
 {t('projects.board.workType') || 'Work Type'}
 </h3>
 <div className="flex flex-wrap gap-2">
 {availableTypes.map((type) => (
 <button
 key={type}
 onClick={() => toggleFilter('types', type)}
 className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
 filters.types.includes(type)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-foreground hover:bg-muted'
 }`}
 >
 {type.charAt(0).toUpperCase() + type.slice(1)}
 </button>
 ))}
 </div>
 </div>

 {/* Priority Filter */}
 <div>
 <h3 className="font-medium text-foreground mb-3">
 {t('projects.board.priority') || 'Priority'}
 </h3>
 <div className="flex flex-wrap gap-2">
 {availablePriorities.map((priority) => (
 <button
 key={priority}
 onClick={() => toggleFilter('priorities', priority)}
 className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
 filters.priorities.includes(priority)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-foreground hover:bg-muted'
 }`}
 >
 {priority.charAt(0).toUpperCase() + priority.slice(1)}
 </button>
 ))}
 </div>
 </div>

 {/* Assignee Filter */}
 <div>
 <h3 className="font-medium text-foreground mb-3">
 {t('projects.board.assignee') || 'Assignee'}
 </h3>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => toggleFilter('assignees', 'unassigned')}
 className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
 filters.assignees.includes('unassigned')
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-foreground hover:bg-muted'
 }`}
 >
 {t('projects.board.unassigned') || 'Unassigned'}
 </button>
 {availableAssignees.map((assignee) => (
 <button
 key={assignee._id}
 onClick={() => toggleFilter('assignees', assignee._id)}
 className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
 filters.assignees.includes(assignee._id)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-foreground hover:bg-muted'
 }`}
 >
 {assignee.name}
 </button>
 ))}
 </div>
 </div>

 {/* Status Filter */}
 {availableStatuses.length > 0 && (
 <div>
 <h3 className="font-medium text-foreground mb-3">
 {t('projects.common.status') || 'Status'}
 </h3>
 <div className="flex flex-wrap gap-2">
 {availableStatuses.map((status) => (
 <button
 key={status.id}
 onClick={() => toggleFilter('statuses', status.id)}
 className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
 filters.statuses.includes(status.id)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-foreground hover:bg-muted'
 }`}
 >
 {status.name}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/50">
 <button
 onClick={clearAll}
 className="text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 {t('projects.board.clearAll') || 'Clear All'}
 </button>
 <div className="flex items-center gap-3">
 <button
 onClick={onClose}
 className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
 >
 {t('projects.common.cancel') || 'Cancel'}
 </button>
 <button
 onClick={handleApply}
 className="px-4 py-2 bg-brand hover:bg-brand-strong text-brand-foreground rounded-lg transition-colors"
 >
 {t('projects.board.applyFilters') || 'Apply Filters'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
