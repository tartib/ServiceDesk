'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { getTypeIcon } from './utils';

interface RoadmapInlineCreateProps {
 isCreating: boolean;
 onSetCreating: (creating: boolean) => void;
 onCreateTask: (summary: string, type: string, assignee: string | null) => Promise<boolean>;
 t: (key: string) => string;
}

export function RoadmapInlineCreate({
 isCreating,
 onSetCreating,
 onCreateTask,
 t,
}: RoadmapInlineCreateProps) {
 const [newItemSummary, setNewItemSummary] = useState('');
 const [newItemType, setNewItemType] = useState<'epic' | 'story' | 'task' | 'bug'>('epic');

 return (
 <div className="border-t border-border bg-background px-4 py-3">
 {!isCreating ? (
 <button 
 onClick={() => onSetCreating(true)}
 className="flex items-center gap-2 text-muted-foreground hover:text-brand hover:bg-brand-surface px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full"
 aria-label="Create new epic"
 >
 <Plus className="h-4 w-4" />
 <span>{t('roadmap.create.button')}</span>
 <kbd className="ms-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">C</kbd>
 </button>
 ) : (
 <div className="flex items-center gap-3">
 <button
 onClick={() => {
 const types: ('epic' | 'story' | 'task' | 'bug')[] = ['epic', 'story', 'task', 'bug'];
 const currentIndex = types.indexOf(newItemType);
 setNewItemType(types[(currentIndex + 1) % types.length]);
 }}
 className="w-8 h-8 rounded-lg bg-info-soft flex items-center justify-center text-lg hover:bg-info-soft transition-colors shrink-0"
 title={`Type: ${newItemType}`}
 >
 {getTypeIcon(newItemType)}
 </button>
 <input
 type="text"
 value={newItemSummary}
 onChange={(e) => setNewItemSummary(e.target.value)}
 onKeyDown={async (e) => {
 if (e.key === 'Enter' && newItemSummary.trim()) {
 const success = await onCreateTask(newItemSummary, newItemType, null);
 if (success) {
 setNewItemSummary('');
 onSetCreating(false);
 }
 } else if (e.key === 'Escape') {
 onSetCreating(false);
 setNewItemSummary('');
 }
 }}
 placeholder="What needs to be done? (Enter to create, Esc to cancel)"
 autoFocus
 className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 <button
 onClick={() => {
 onSetCreating(false);
 setNewItemSummary('');
 }}
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 ✕
 </button>
 </div>
 )}
 </div>
 );
}
