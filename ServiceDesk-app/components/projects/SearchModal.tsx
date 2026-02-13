'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, X, FileText, FolderKanban, Loader2 } from 'lucide-react';

interface SearchResult {
  tasks?: {
    _id: string;
    key: string;
    title: string;
    status: { name: string };
    projectId?: { name: string; key: string };
  }[];
  projects?: {
    _id: string;
    key: string;
    name: string;
    methodology: { code: string };
  }[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({});
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults({});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({});
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:5000/api/v1/pm/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setResults(data.data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type: 'task' | 'project', id: string, projectId?: string) => {
    onClose();
    if (type === 'project') {
      router.push(`/projects/${id}`);
    } else if (projectId) {
      router.push(`/projects/${projectId}?task=${id}`);
    }
  };

  if (!isOpen) return null;

  const hasResults = (results.tasks?.length || 0) + (results.projects?.length || 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('projects.common.searchPlaceholder') || 'Search tasks, projects...'}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
          />
          {isLoading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Type at least 2 characters to search</p>
              <p className="text-sm mt-2">Tip: Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">⌘K</kbd> to open search</p>
            </div>
          ) : !hasResults && !isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="p-2">
              {results.projects && results.projects.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Projects</p>
                  {results.projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => handleSelect('project', project._id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-left"
                    >
                      <FolderKanban className="h-5 w-5 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{project.name}</p>
                        <p className="text-sm text-gray-400">{project.key} • {project.methodology.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks && results.tasks.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Tasks</p>
                  {results.tasks.map((task) => (
                    <button
                      key={task._id}
                      onClick={() => handleSelect('task', task._id, (task.projectId as { _id?: string })?._id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg text-left"
                    >
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{task.title}</p>
                        <p className="text-sm text-gray-400">{task.key} • {task.status.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
