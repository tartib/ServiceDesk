'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Megaphone,
  Briefcase,
  Calculator,
  Scale,
  Check,
} from 'lucide-react';
import type { WorkspaceTemplate } from './workspaceTemplates';

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  megaphone: Megaphone,
  briefcase: Briefcase,
  calculator: Calculator,
  scale: Scale,
};

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string }> = {
  brand: { bg: 'bg-brand-surface', border: 'border-brand', icon: 'text-brand' },
  success: { bg: 'bg-success-soft', border: 'border-success', icon: 'text-success' },
  info: { bg: 'bg-info-soft', border: 'border-info', icon: 'text-info' },
  warning: { bg: 'bg-warning-soft', border: 'border-warning', icon: 'text-warning' },
  neutral: { bg: 'bg-muted', border: 'border-muted-foreground', icon: 'text-muted-foreground' },
};

interface WorkspaceTemplateCardProps {
  template: WorkspaceTemplate;
  isSelected: boolean;
  onSelect: (type: WorkspaceTemplate['type']) => void;
  locale?: 'en' | 'ar';
}

export default function WorkspaceTemplateCard({
  template,
  isSelected,
  onSelect,
  locale = 'en',
}: WorkspaceTemplateCardProps) {
  const Icon = ICON_MAP[template.icon] ?? Briefcase;
  const colors = COLOR_MAP[template.color] ?? COLOR_MAP.neutral;
  const isAr = locale === 'ar';

  return (
    <button
      type="button"
      disabled={!template.isAvailable}
      onClick={() => template.isAvailable && onSelect(template.type)}
      className={cn(
        'relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-200',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border',
        template.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
        isSelected
          ? `${colors.border} ${colors.bg} shadow-sm`
          : 'border-border bg-background hover:border-muted-foreground/40',
      )}
    >
      {isSelected && (
        <div className="absolute top-3 ltr:right-3 rtl:left-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', colors.bg)}>
        <Icon className={cn('h-6 w-6', colors.icon)} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {isAr ? template.nameAr : template.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isAr ? template.descriptionAr : template.description}
        </p>
      </div>

      {template.isAvailable && template.defaultRequestTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {template.defaultRequestTypes.slice(0, 3).map((rt) => (
            <span
              key={rt.name}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {isAr ? rt.nameAr : rt.name}
            </span>
          ))}
          {template.defaultRequestTypes.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              +{template.defaultRequestTypes.length - 3}
            </span>
          )}
        </div>
      )}

      {!template.isAvailable && (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {isAr ? 'قريباً' : 'Coming Soon'}
        </span>
      )}
    </button>
  );
}
