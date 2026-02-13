'use client';

import { LucideIcon, FolderKanban, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'default' | 'minimal';
}

export default function EmptyState({
  icon: Icon = FolderKanban,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const ActionButton = () => {
    const buttonClasses = variant === 'default'
      ? 'inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium'
      : 'inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors';

    const content = (
      <>
        <Plus className="h-5 w-5" />
        {actionLabel}
      </>
    );

    if (actionHref) {
      return (
        <Link href={actionHref} className={buttonClasses}>
          {content}
        </Link>
      );
    }

    if (onAction) {
      return (
        <button onClick={onAction} className={buttonClasses}>
          {content}
        </button>
      );
    }

    return null;
  };

  if (variant === 'minimal') {
    return (
      <div className="text-center py-8 px-4">
        <Icon className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm mb-3">{title}</p>
        {description && (
          <p className="text-slate-500 text-xs mb-4">{description}</p>
        )}
        <ActionButton />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 md:p-12 text-center shadow-sm">
      <Icon className="h-12 w-12 md:h-16 md:w-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      <ActionButton />
    </div>
  );
}
