'use client';

import { TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Sprint {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  velocity?: number;
}

interface Task {
  _id: string;
  status: {
    category: string;
  };
  storyPoints?: number;
}

interface SprintInsightsProps {
  sprint: Sprint;
  tasks: Task[];
  averageVelocity?: number;
}

export function SprintInsights({ sprint, tasks, averageVelocity = 0 }: SprintInsightsProps) {
  const { t } = useLanguage();

  const completedTasks = tasks.filter(task => task.status.category === 'done');
  const inProgressTasks = tasks.filter(task => task.status.category === 'in_progress');
  const todoTasks = tasks.filter(task => task.status.category === 'todo');

  const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  const currentVelocity = completedStoryPoints;

  const daysTotal = Math.ceil(
    (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPassed = Math.ceil(
    (new Date().getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, daysTotal - daysPassed);

  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const storyPointsPercentage = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

  const velocityComparison = averageVelocity > 0 
    ? Math.round(((currentVelocity - averageVelocity) / averageVelocity) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        {t('projects.board.sprintInsights') || 'Sprint Insights'}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Completed Tasks */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">
              {t('projects.board.completed') || 'Completed'}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {completedTasks.length}
          </div>
          <div className="text-xs text-green-600">
            {completedStoryPoints} {t('projects.board.points') || 'points'}
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">
              {t('projects.board.inProgress') || 'In Progress'}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {inProgressTasks.length}
          </div>
          <div className="text-xs text-blue-600">
            {inProgressTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} {t('projects.board.points') || 'points'}
          </div>
        </div>

        {/* To Do */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-900">
              {t('projects.board.toDo') || 'To Do'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-700">
            {todoTasks.length}
          </div>
          <div className="text-xs text-gray-600">
            {todoTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} {t('projects.board.points') || 'points'}
          </div>
        </div>

        {/* Velocity */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">
              {t('projects.board.velocity') || 'Velocity'}
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {currentVelocity}
          </div>
          {averageVelocity > 0 && (
            <div className={`text-xs ${velocityComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {velocityComparison >= 0 ? '+' : ''}{velocityComparison}% vs avg
            </div>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{t('projects.board.taskCompletion') || 'Task Completion'}</span>
            <span className="font-medium text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{t('projects.board.storyPointsCompletion') || 'Story Points'}</span>
            <span className="font-medium text-gray-900">{completedStoryPoints}/{totalStoryPoints}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${storyPointsPercentage}%` }}
            />
          </div>
        </div>

        {/* Time Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{t('projects.board.timeProgress') || 'Time Progress'}</span>
            <span className="font-medium text-gray-900">
              {daysPassed}/{daysTotal} {t('projects.board.days') || 'days'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (daysPassed / daysTotal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 text-sm mb-2">
          {t('projects.board.insights') || 'Insights'}
        </h4>
        <ul className="space-y-1 text-sm">
          {completionPercentage < 50 && daysPassed > daysTotal / 2 && (
            <li className="text-orange-700">
              ⚠️ {t('projects.board.behindSchedule') || 'Sprint is behind schedule'}
            </li>
          )}
          {completionPercentage >= 80 && (
            <li className="text-green-700">
              ✓ {t('projects.board.onTrack') || 'Sprint is on track for completion'}
            </li>
          )}
          {velocityComparison > 20 && (
            <li className="text-green-700">
              📈 {t('projects.board.aboveAverageVelocity') || 'Team velocity is above average'}
            </li>
          )}
          {velocityComparison < -20 && (
            <li className="text-red-700">
              📉 {t('projects.board.belowAverageVelocity') || 'Team velocity is below average'}
            </li>
          )}
          {inProgressTasks.length > completedTasks.length && daysPassed > daysTotal * 0.7 && (
            <li className="text-orange-700">
              ⚠️ {t('projects.board.tooManyInProgress') || 'Too many tasks still in progress'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
