'use client';

import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  PROJECT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type ProjectTemplate,
  type TemplateCategory,
} from '../templates/projectTemplates';
import TemplateCard from '../templates/TemplateCard';

interface StepTemplateProps {
  selectedTemplateId: string | null;
  onSelect: (template: ProjectTemplate | null) => void;
}

export default function StepTemplate({ selectedTemplateId, onSelect }: StepTemplateProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');

  const filtered = activeCategory === 'All'
    ? PROJECT_TEMPLATES
    : PROJECT_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Start from a template</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick a template to pre-fill your project details, or start blank.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              activeCategory === cat
                ? 'bg-brand text-brand-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Compact list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {/* Blank option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
            selectedTemplateId === null
              ? 'border-brand bg-brand-soft'
              : 'border-dashed border-border bg-background hover:bg-muted/50'
          }`}
        >
          <div className="p-2 rounded-lg bg-muted shrink-0">
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Start blank</p>
            <p className="text-xs text-muted-foreground">Build from scratch</p>
          </div>
        </button>

        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplateId === template.id}
            compact
            onClick={() => onSelect(template)}
          />
        ))}
      </div>
    </div>
  );
}
