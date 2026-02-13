'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectsHeaderProps {
  onSearchClick?: () => void;
  onCreateClick?: () => void;
}

export default function ProjectsHeader({ onSearchClick, onCreateClick }: ProjectsHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Title Section */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {t('projects.title') || 'Projects'}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
          {t('projects.subtitle') || 'Manage your projects'}
        </p>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-3">
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 transition-colors"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{t('projects.searchPlaceholder') || 'Search'}</span>
          <kbd className="hidden md:inline ml-2 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">
            ⌘K
          </kbd>
        </button>

        {/* New Project Button */}
        {onCreateClick ? (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{t('projects.newProject') || 'New Project'}</span>
          </button>
        ) : (
          <Link
            href="/projects/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{t('projects.newProject') || 'New Project'}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
