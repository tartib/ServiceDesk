'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Command,
  Bug,
  Lightbulb,
  Zap,
  Palette,
  Megaphone,
  FileText,
  ImageIcon,
  MessageSquare,
  Briefcase,
  Package,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRequestTypes } from '@/hooks/useRequestTypes';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';

const ICON_MAP: Record<string, React.ElementType> = {
  bug: Bug,
  lightbulb: Lightbulb,
  zap: Zap,
  palette: Palette,
  megaphone: Megaphone,
  'file-text': FileText,
  image: ImageIcon,
  'message-square': MessageSquare,
  briefcase: Briefcase,
  package: Package,
  clock: Clock,
  'alert-circle': AlertCircle,
};

interface QuickCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickCreateDialog({ isOpen, onClose }: QuickCreateDialogProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { workspaceType } = useWorkspaceContext();
  const { data: requestTypesData } = useRequestTypes({ workspaceType: (workspaceType as any) ?? undefined });
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isAr = locale === 'ar';

  const requestTypes = useMemo(() => {
    const types = requestTypesData?.items ?? [];
    if (!search.trim()) return types;
    const q = search.toLowerCase();
    return types.filter(
      (rt: any) =>
        rt.name?.toLowerCase().includes(q) ||
        rt.nameAr?.toLowerCase().includes(q) ||
        rt.category?.toLowerCase().includes(q),
    );
  }, [requestTypesData, search]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (requestType: any) => {
    onClose();
    router.push(`/records/new?requestTypeId=${requestType._id || requestType.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, requestTypes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && requestTypes[selectedIndex]) {
      e.preventDefault();
      handleSelect(requestTypes[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('workspace.quickCreate.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto p-2">
            {requestTypes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t('workspace.quickCreate.noResults')}
              </div>
            ) : (
              <div className="space-y-0.5">
                {requestTypes.map((rt: any, index: number) => {
                  const Icon = ICON_MAP[rt.icon] ?? Plus;
                  return (
                    <button
                      key={rt._id || rt.id || rt.name}
                      type="button"
                      onClick={() => handleSelect(rt)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        index === selectedIndex
                          ? 'bg-brand-surface text-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {isAr ? (rt.nameAr || rt.name) : rt.name}
                        </div>
                        {rt.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {isAr ? (rt.descriptionAr || rt.description) : rt.description}
                          </div>
                        )}
                      </div>
                      {rt.category && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {isAr ? (rt.categoryAr || rt.category) : rt.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{t('workspace.quickCreate.shortcut')}</span>
            <div className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                <Command className="h-3 w-3" />
              </kbd>
              <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px]">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
