'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectCard from './ProjectCard';

interface Project {
  _id: string;
  name: string;
  key: string;
  methodology: {
    code: string;
  };
  status: string;
  lead?: {
    name: string;
    email: string;
  };
  createdBy?: {
    name: string;
  };
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function ProjectsTable({
  projects,
  onProjectClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: ProjectsTableProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="w-10 px-4 py-3"></th>
              <th className="text-start px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-400">
                {t('projects.projectName') || 'Name'}
              </th>
              <th className="text-start px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hidden sm:table-cell">
                {t('projects.projectKey') || 'Key'}
              </th>
              <th className="text-start px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hidden md:table-cell">
                {t('projects.methodology') || 'Methodology'}
              </th>
              <th className="text-start px-4 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hidden lg:table-cell">
                {t('projects.lead') || 'Lead'}
              </th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                id={project._id}
                name={project.name}
                projectKey={project.key}
                methodology={project.methodology}
                lead={project.lead}
                createdBy={project.createdBy}
                onClick={() => onProjectClick(project)}
                variant="table"
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden p-4 space-y-3">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            id={project._id}
            name={project.name}
            projectKey={project.key}
            methodology={project.methodology}
            lead={project.lead}
            createdBy={project.createdBy}
            onClick={() => onProjectClick(project)}
            variant="card"
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button 
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
