'use client';

import { useState } from 'react';
import {
 ChevronDown,
 Search,
 Filter,
 Settings,
 Download,
 Share2,
 Eye,
 Maximize2,
 FileText,
 X,
} from 'lucide-react';
import type { TimelineSettings } from './types';

interface RoadmapToolbarProps {
 searchQuery: string;
 onSearchChange: (query: string) => void;
 selectedAssignees: string[];
 onAssigneesChange: (assignees: string[]) => void;
 selectedTypes: string[];
 onTypesChange: (types: string[]) => void;
 selectedStatuses: string[];
 onStatusesChange: (statuses: string[]) => void;
 onClearFilters: () => void;
 showDependencies: boolean;
 onToggleDependencies: () => void;
 onExportCSV: () => void;
 onExportJSON: () => void;
 timelineSettings: TimelineSettings;
 onTimelineSettingsChange: (settings: TimelineSettings) => void;
 t: (key: string) => string;
}

export function RoadmapToolbar({
 searchQuery,
 onSearchChange,
 selectedAssignees,
 onAssigneesChange,
 selectedTypes,
 onTypesChange,
 selectedStatuses,
 onStatusesChange,
 onClearFilters,
 showDependencies,
 onToggleDependencies,
 onExportCSV,
 onExportJSON,
 timelineSettings,
 onTimelineSettingsChange,
 t,
}: RoadmapToolbarProps) {
 const [activeFilter, setActiveFilter] = useState<string | null>(null);
 const [showExportMenu, setShowExportMenu] = useState(false);
 const [showSettingsPanel, setShowSettingsPanel] = useState(false);

 const hasActiveFilters = selectedAssignees.length > 0 || selectedTypes.length > 0 || selectedStatuses.length > 0;

 return (
 <>
 <div className="bg-background border-b border-border px-4 py-2">
 <div className="flex items-center justify-between gap-4">
 {/* Search */}
 <div className="flex items-center gap-3 flex-1">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder={t('roadmap.filters.search')}
 aria-describedby="search-hint"
 className="w-full ps-9 pe-4 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 <span id="search-hint" className="sr-only">Results filtered as you type</span>
 </div>
 
 {/* Filters */}
 <div className="flex items-center gap-2 relative">
 {/* Assignee Filter */}
 <div className="relative">
 <button
 onClick={() => setActiveFilter(activeFilter === 'assignee' ? null : 'assignee')}
 aria-haspopup="listbox"
 aria-expanded={activeFilter === 'assignee'}
 className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
 selectedAssignees.length > 0 
 ? 'border-brand bg-brand-surface text-brand' 
 : 'border-border text-foreground hover:bg-muted/50'
 }`}
 >
 <Filter className="h-4 w-4" />
 <span>{t('roadmap.filters.assignee')} {selectedAssignees.length > 0 && `(${selectedAssignees.length})`}</span>
 <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'assignee' ? 'rotate-180' : ''}`} />
 </button>
 {activeFilter === 'assignee' && (
 <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50 py-2">
 <div className="px-3 py-2 border-b border-border">
 <input
 type="text"
 placeholder={t('roadmap.filters.search')}
 className="w-full px-2 py-1 text-sm border border-border rounded"
 />
 </div>
 {['Sarah Johnson', 'Mike Chen', 'Emily Davis', 'John Doe'].map((name) => (
 <label key={name} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer">
 <input
 type="checkbox"
 checked={selectedAssignees.includes(name)}
 onChange={(e) => {
 if (e.target.checked) {
 onAssigneesChange([...selectedAssignees, name]);
 } else {
 onAssigneesChange(selectedAssignees.filter(a => a !== name));
 }
 }}
 className="w-4 h-4 rounded border-border text-brand"
 />
 <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center text-xs text-white">
 {name.split(' ').map(n => n[0]).join('')}
 </div>
 <span className="text-sm text-foreground">{name}</span>
 </label>
 ))}
 </div>
 )}
 </div>

 {/* Type Filter */}
 <div className="relative">
 <button
 onClick={() => setActiveFilter(activeFilter === 'type' ? null : 'type')}
 aria-haspopup="listbox"
 aria-expanded={activeFilter === 'type'}
 className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
 selectedTypes.length > 0 
 ? 'border-brand bg-brand-surface text-brand' 
 : 'border-border text-foreground hover:bg-muted/50'
 }`}
 >
 <span>{t('roadmap.filters.type')} {selectedTypes.length > 0 && `(${selectedTypes.length})`}</span>
 <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'type' ? 'rotate-180' : ''}`} />
 </button>
 {activeFilter === 'type' && (
 <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-2">
 {[
 { value: 'epic', label: t('roadmap.types.epic'), icon: '⚡' },
 { value: 'story', label: t('roadmap.types.story'), icon: '📖' },
 { value: 'task', label: t('roadmap.types.task'), icon: '✓' },
 { value: 'bug', label: t('roadmap.types.bug'), icon: '🐛' },
 ].map((type) => (
 <label key={type.value} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer">
 <input
 type="checkbox"
 checked={selectedTypes.includes(type.value)}
 onChange={(e) => {
 if (e.target.checked) {
 onTypesChange([...selectedTypes, type.value]);
 } else {
 onTypesChange(selectedTypes.filter(t => t !== type.value));
 }
 }}
 className="w-4 h-4 rounded border-border text-brand"
 />
 <span>{type.icon}</span>
 <span className="text-sm text-foreground">{type.label}</span>
 </label>
 ))}
 </div>
 )}
 </div>

 {/* Status Filter */}
 <div className="relative">
 <button
 onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')}
 aria-haspopup="listbox"
 aria-expanded={activeFilter === 'status'}
 className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
 selectedStatuses.length > 0 
 ? 'border-brand bg-brand-surface text-brand' 
 : 'border-border text-foreground hover:bg-muted/50'
 }`}
 >
 <span>{t('roadmap.filters.status')} {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}</span>
 <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === 'status' ? 'rotate-180' : ''}`} />
 </button>
 {activeFilter === 'status' && (
 <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-2">
 {[
 { value: 'todo', label: t('roadmap.status.todo'), color: 'bg-muted-foreground/30' },
 { value: 'in_progress', label: t('roadmap.status.inProgress'), color: 'bg-brand' },
 { value: 'done', label: t('roadmap.status.done'), color: 'bg-success' },
 ].map((status) => (
 <label key={status.value} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer">
 <input
 type="checkbox"
 checked={selectedStatuses.includes(status.value)}
 onChange={(e) => {
 if (e.target.checked) {
 onStatusesChange([...selectedStatuses, status.value]);
 } else {
 onStatusesChange(selectedStatuses.filter(s => s !== status.value));
 }
 }}
 className="w-4 h-4 rounded border-border text-brand"
 />
 <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
 <span className="text-sm text-foreground">{status.label}</span>
 </label>
 ))}
 </div>
 )}
 </div>

 {/* Clear Filters */}
 {hasActiveFilters && (
 <button
 onClick={() => {
 onClearFilters();
 setActiveFilter(null);
 }}
 className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
 >
 {t('roadmap.filters.clearAll')}
 </button>
 )}
 </div>
 </div>

 {/* View Settings & Actions */}
 <div className="flex items-center gap-2">
 <button
 onClick={onToggleDependencies}
 aria-label="Toggle dependencies"
 className={`p-2 rounded-lg transition-colors ${
 showDependencies 
 ? 'bg-brand-soft text-brand' 
 : 'text-muted-foreground hover:text-foreground hover:bg-muted'
 }`}
 title={showDependencies ? 'Hide dependencies' : 'Show dependencies'}
 >
 <Eye className="h-4 w-4" />
 </button>
 <div className="relative">
 <button
 onClick={() => { setShowExportMenu(!showExportMenu); setShowSettingsPanel(false); }}
 aria-label="Export timeline"
 className={`p-2 rounded-lg transition-colors ${showExportMenu ? 'bg-brand-soft text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
 title="Export"
 >
 <Download className="h-4 w-4" />
 </button>
 {showExportMenu && (
 <div className="absolute end-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-dropdown py-1">
 <button onClick={() => { onExportCSV(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-start text-sm hover:bg-muted flex items-center gap-2">
 <FileText className="h-4 w-4" />
 Export as CSV
 </button>
 <button onClick={() => { onExportJSON(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-start text-sm hover:bg-muted flex items-center gap-2">
 <Download className="h-4 w-4" />
 Export as JSON
 </button>
 </div>
 )}
 </div>
 <button
 onClick={() => {
 navigator.clipboard.writeText(window.location.href);
 alert('Link copied to clipboard!');
 }}
 aria-label="Share timeline"
 className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
 title="Share"
 >
 <Share2 className="h-4 w-4" />
 </button>
 <div className="relative">
 <button
 onClick={() => { setShowSettingsPanel(!showSettingsPanel); setShowExportMenu(false); }}
 aria-label="Timeline settings"
 aria-haspopup="menu"
 aria-expanded={showSettingsPanel}
 className={`p-2 rounded-lg transition-colors ${showSettingsPanel ? 'bg-brand-soft text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
 title="Settings"
 >
 <Settings className="h-4 w-4" />
 </button>
 {showSettingsPanel && (
 <div className="absolute end-0 top-full mt-1 w-64 bg-background border border-border rounded-xl shadow-lg z-dropdown p-4 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold">Timeline Settings</span>
 <button onClick={() => setShowSettingsPanel(false)} className="p-1 hover:bg-muted rounded">
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 <label className="flex items-center justify-between text-sm cursor-pointer">
 <span>Show weekends</span>
 <input type="checkbox" checked={timelineSettings.showWeekends}
 onChange={e => onTimelineSettingsChange({ ...timelineSettings, showWeekends: e.target.checked })}
 className="rounded border-border" />
 </label>
 <label className="flex items-center justify-between text-sm cursor-pointer">
 <span>Show progress bars</span>
 <input type="checkbox" checked={timelineSettings.showProgress}
 onChange={e => onTimelineSettingsChange({ ...timelineSettings, showProgress: e.target.checked })}
 className="rounded border-border" />
 </label>
 <label className="flex items-center justify-between text-sm cursor-pointer">
 <span>Show labels</span>
 <input type="checkbox" checked={timelineSettings.showLabels}
 onChange={e => onTimelineSettingsChange({ ...timelineSettings, showLabels: e.target.checked })}
 className="rounded border-border" />
 </label>
 <div className="space-y-1">
 <span className="text-sm">Color by</span>
 <select value={timelineSettings.colorBy}
 onChange={e => onTimelineSettingsChange({ ...timelineSettings, colorBy: e.target.value as 'status' | 'priority' | 'type' })}
 className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
 <option value="status">Status</option>
 <option value="priority">Priority</option>
 <option value="type">Type</option>
 </select>
 </div>
 </div>
 )}
 </div>
 <button
 onClick={() => {
 if (document.fullscreenElement) {
 document.exitFullscreen();
 } else {
 document.documentElement.requestFullscreen();
 }
 }}
 aria-label="Fullscreen"
 className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
 title="Fullscreen"
 >
 <Maximize2 className="h-4 w-4" />
 </button>
 </div>
 </div>
 </div>

 {/* Click outside to close filters */}
 {activeFilter && (
 <div 
 className="fixed inset-0 z-40" 
 onClick={() => setActiveFilter(null)}
 />
 )}
 </>
 );
}
