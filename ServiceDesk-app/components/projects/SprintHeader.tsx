'use client';

import { Calendar, Users, CheckCircle2, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Sprint {
 _id: string;
 name: string;
 startDate: string;
 endDate: string;
 goal?: string;
 status: 'planning' | 'active' | 'completed';
}

interface SprintHeaderProps {
 sprint: Sprint | null;
 totalTasks: number;
 completedTasks: number;
 weightedProgress?: number;
 onCompleteSprint?: () => void;
}

export function SprintHeader({ sprint, totalTasks, completedTasks, weightedProgress, onCompleteSprint }: SprintHeaderProps) {
 const { t } = useLanguage();

 if (!sprint) {
 return (
 <div className="bg-brand-surface border border-brand-border rounded-lg p-4 mb-4">
 <div className="flex items-center gap-2 text-brand">
 <Circle className="h-5 w-5" />
 <span className="font-medium">{t('projects.board.noActiveSprint') || 'No active sprint'}</span>
 </div>
 <p className="text-sm text-brand mt-2">
 {t('projects.board.startSprintMessage') || 'Start a sprint to begin tracking work'}
 </p>
 </div>
 );
 }

 const daysRemaining = Math.ceil(
 (new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
 );
 const progress = weightedProgress ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

 return (
 <div className="bg-background border border-border rounded-lg p-4 mb-4">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-foreground text-lg">{sprint.name}</span>
 <span className={`text-xs px-2 py-0.5 rounded-full ${
 sprint.status === 'active' ? 'bg-success-soft text-success' :
 sprint.status === 'completed' ? 'bg-muted text-foreground' :
 'bg-brand-soft text-brand'
 }`}>
 {sprint.status}
 </span>
 </div>

 <div className="grid grid-cols-4 gap-4 mb-3">
 
 <div className="flex items-center gap-2 text-sm">
 {/* <Calendar className="h-4 w-4 text-muted-foreground shrink-0" /> */}
 <div className="text-muted-foreground">{t('projects.board.sprintGoal') || 'Sprint Goal'}</div>
 <div className="font-medium text-foreground truncate">
 {sprint.goal || '—'}
 </div>
 </div>

 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
 <div className="text-muted-foreground">{t('projects.board.duration') || 'Duration'}</div>
 <div className="font-medium text-foreground">
 {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
 </div>
 </div>

 <div className="flex items-center gap-2 text-sm">
 <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
 <div className="text-muted-foreground">{t('projects.board.progress') || 'Progress'}</div>
 <div className="font-medium text-foreground">
 {completedTasks}/{totalTasks} {t('projects.board.tasks') || 'tasks'} ({progress}%)
 </div>
 </div>

 <div className="flex items-center gap-2 text-sm">
 <Users className="h-4 w-4 text-muted-foreground shrink-0" />
 <div className="text-muted-foreground">{t('projects.board.daysRemaining') || 'Days Remaining'}</div>
 <div className={`font-medium ${daysRemaining < 0 ? 'text-destructive' : daysRemaining < 3 ? 'text-warning' : 'text-foreground'}`}>
 {daysRemaining < 0 ? `${Math.abs(daysRemaining)} ${t('projects.board.overdue') || 'overdue'}` :
 daysRemaining === 0 ? t('projects.board.today') || 'Today' :
 `${daysRemaining} ${t('projects.board.days') || 'days'}`}
 </div>
 </div>
 </div>


 {onCompleteSprint && sprint.status === 'active' && (
 <button
 onClick={onCompleteSprint}
 className="px-3 py-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-sm rounded-lg transition-colors"
 >
 {t('projects.board.completeSprint') || 'Complete Sprint'}
 </button>
 )}
 </div>

 

 <div className="relative">
 <div className="w-full bg-muted rounded-full h-2">
 <div
 className="bg-brand h-2 rounded-full transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 </div>
 );
}
