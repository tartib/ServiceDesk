'use client';

import React from 'react';
import {
  GitBranch, Code2, Megaphone, Palette, TrendingUp,
  Users, Server, DollarSign, Check,
} from 'lucide-react';
import type { ProjectTemplate } from './projectTemplates';

const ICON_MAP: Record<string, React.ElementType> = {
  GitBranch, Code2, Megaphone, Palette, TrendingUp,
  Users, Server, DollarSign,
};

const METHODOLOGY_LABEL: Record<string, string> = {
  scrum: 'Scrum',
  kanban: 'Kanban',
  waterfall: 'Waterfall',
  itil: 'ITIL',
  lean: 'Lean',
  okr: 'OKR',
};

interface TemplateCardProps {
  template: ProjectTemplate;
  selected?: boolean;
  compact?: boolean;
  onClick: () => void;
}

export default function TemplateCard({
  template,
  selected = false,
  compact = false,
  onClick,
}: TemplateCardProps) {
  const Icon = ICON_MAP[template.iconName] ?? GitBranch;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
          selected
            ? 'border-brand bg-brand-soft'
            : `border-border bg-background hover:bg-muted/50 ${template.accentClass}`
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${template.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{template.name}</p>
          <p className="text-xs text-muted-foreground truncate">{template.description}</p>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
        selected
          ? 'border-brand bg-brand-soft shadow-md'
          : `border-border bg-card ${template.accentClass}`
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${template.color}`}>
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="font-semibold text-foreground mb-1 group-hover:text-brand transition-colors">
        {template.name}
      </h3>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
        {template.description}
      </p>

      <div className="mt-auto space-y-2">
        <div className="flex flex-wrap gap-1">
          {template.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
            >
              {f}
            </span>
          ))}
          {template.features.length > 3 && (
            <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
              +{template.features.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">{template.category}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {METHODOLOGY_LABEL[template.methodology] ?? template.methodology}
          </span>
        </div>
      </div>
    </button>
  );
}
