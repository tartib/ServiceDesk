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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-blue-700">
          <Circle className="h-5 w-5" />
          <span className="font-medium">{t('projects.board.noActiveSprint') || 'No active sprint'}</span>
        </div>
        <p className="text-sm text-blue-600 mt-2">
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-lg">{sprint.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            sprint.status === 'active' ? 'bg-green-100 text-green-700' :
            sprint.status === 'completed' ? 'bg-gray-100 text-gray-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {sprint.status}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-3">
        
        <div className="flex items-center gap-2 text-sm">
          {/* <Calendar className="h-4 w-4 text-gray-400 shrink-0" /> */}
            <div className="text-gray-500">{t('projects.board.sprintGoal') || 'Sprint Goal'}</div>
            <div className="font-medium text-gray-900 truncate">
              {sprint.goal || '—'}
            </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="text-gray-500">{t('projects.board.duration') || 'Duration'}</div>
            <div className="font-medium text-gray-900">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="text-gray-500">{t('projects.board.progress') || 'Progress'}</div>
            <div className="font-medium text-gray-900">
              {completedTasks}/{totalTasks} {t('projects.board.tasks') || 'tasks'} ({progress}%)
            </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="text-gray-500">{t('projects.board.daysRemaining') || 'Days Remaining'}</div>
            <div className={`font-medium ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 3 ? 'text-orange-600' : 'text-gray-900'}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} ${t('projects.board.overdue') || 'overdue'}` :
               daysRemaining === 0 ? t('projects.board.today') || 'Today' :
               `${daysRemaining} ${t('projects.board.days') || 'days'}`}
            </div>
        </div>
      </div>


        {onCompleteSprint && sprint.status === 'active' && (
          <button
            onClick={onCompleteSprint}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            {t('projects.board.completeSprint') || 'Complete Sprint'}
          </button>
        )}
      </div>

      

      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
