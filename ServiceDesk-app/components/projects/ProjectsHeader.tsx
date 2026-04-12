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
 <h1 className="text-xl md:text-2xl font-bold text-foreground dark:text-white">
 {t('projects.title') || 'Projects'}
 </h1>
 <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-0.5">
 {t('projects.subtitle') || 'Manage your projects'}
 </p>
 </div>

 {/* Actions Section */}
 <div className="flex items-center gap-3">
 {/* Search Button */}
 <button
 onClick={onSearchClick}
 className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-background dark:bg-muted border border-border dark:border-border/60 rounded-lg text-muted-foreground dark:text-muted-foreground hover:border-border dark:hover:border-border/50 transition-colors"
 >
 <Search className="h-4 w-4 sm:h-5 sm:w-5" />
 <span className="hidden sm:inline">{t('projects.searchPlaceholder') || 'Search'}</span>
 <kbd className="hidden md:inline ml-2 px-2 py-0.5 bg-muted dark:bg-muted rounded text-xs">
 ⌘K
 </kbd>
 </button>

 {/* New Project Button */}
 {onCreateClick ? (
 <button
 onClick={onCreateClick}
 className="flex items-center gap-2 bg-brand hover:bg-brand-strong text-brand-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium"
 >
 <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
 <span className="hidden sm:inline">{t('projects.newProject') || 'New Project'}</span>
 </button>
 ) : (
 <Link
 href="/projects/new"
 className="flex items-center gap-2 bg-brand hover:bg-brand-strong text-brand-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium"
 >
 <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
 <span className="hidden sm:inline">{t('projects.newProject') || 'New Project'}</span>
 </Link>
 )}
 </div>
 </div>
 );
}
