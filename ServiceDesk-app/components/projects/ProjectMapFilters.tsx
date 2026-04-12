'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export interface MapFilters {
 status?: string;
 priority?: string;
 type?: string;
 assignee?: string;
 labels?: string;
}

interface ProjectMapFiltersProps {
 filters: MapFilters;
 onChange: (filters: MapFilters) => void;
 availableLabels?: string[];
 availableAssignees?: { id: string; name: string }[];
}

const STATUS_OPTIONS = [
 { value: '', label: 'All Statuses' },
 { value: 'todo', label: 'To Do' },
 { value: 'in_progress', label: 'In Progress' },
 { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
 { value: '', label: 'All Priorities' },
 { value: 'critical', label: 'Critical' },
 { value: 'high', label: 'High' },
 { value: 'medium', label: 'Medium' },
 { value: 'low', label: 'Low' },
];

const TYPE_OPTIONS = [
 { value: '', label: 'All Types' },
 { value: 'epic', label: 'Epic' },
 { value: 'story', label: 'Story' },
 { value: 'task', label: 'Task' },
 { value: 'bug', label: 'Bug' },
 { value: 'subtask', label: 'Subtask' },
];

export default function ProjectMapFilters({
 filters,
 onChange,
 availableLabels = [],
 availableAssignees = [],
}: ProjectMapFiltersProps) {
 const { t } = useLanguage();

 const update = (key: keyof MapFilters, value: string) => {
 onChange({ ...filters, [key]: value });
 };

 const selectClass =
 'text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-border';

 return (
 <div className="flex items-center gap-2 flex-wrap">
 <select
 value={filters.status || ''}
 onChange={(e) => update('status', e.target.value)}
 className={selectClass}
 aria-label={t('common.status') || 'Status'}
 >
 {STATUS_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>

 <select
 value={filters.priority || ''}
 onChange={(e) => update('priority', e.target.value)}
 className={selectClass}
 aria-label={t('common.priority') || 'Priority'}
 >
 {PRIORITY_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>

 <select
 value={filters.type || ''}
 onChange={(e) => update('type', e.target.value)}
 className={selectClass}
 aria-label={t('common.type') || 'Type'}
 >
 {TYPE_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>

 {availableAssignees.length > 0 && (
 <select
 value={filters.assignee || ''}
 onChange={(e) => update('assignee', e.target.value)}
 className={selectClass}
 aria-label={t('common.assignee') || 'Assignee'}
 >
 <option value="">All Assignees</option>
 {availableAssignees.map((a) => (
 <option key={a.id} value={a.id}>{a.name}</option>
 ))}
 </select>
 )}

 {availableLabels.length > 0 && (
 <select
 value={filters.labels || ''}
 onChange={(e) => update('labels', e.target.value)}
 className={selectClass}
 aria-label={t('common.labels') || 'Labels'}
 >
 <option value="">All Labels</option>
 {availableLabels.map((l) => (
 <option key={l} value={l}>{l}</option>
 ))}
 </select>
 )}

 {Object.values(filters).some((v) => v) && (
 <button
 onClick={() => onChange({})}
 className="text-xs text-brand hover:text-brand-strong hover:underline transition-colors"
 >
 {t('common.clearFilters') || 'Clear'}
 </button>
 )}
 </div>
 );
}
