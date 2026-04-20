'use client';

import React, { useState } from 'react';
import { PlusCircle, LayoutTemplate } from 'lucide-react';
import { PROJECT_TEMPLATES, TEMPLATE_CATEGORIES, type ProjectTemplate, type TemplateCategory } from './projectTemplates';
import TemplateCard from './TemplateCard';

interface TemplateGalleryProps {
  onSelectTemplate: (template: ProjectTemplate | null) => void;
}

export default function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selectedCategory === 'All'
    ? PROJECT_TEMPLATES
    : PROJECT_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelect = (template: ProjectTemplate) => {
    setSelected(template.id);
    onSelectTemplate(template);
  };

  const handleBlank = () => {
    setSelected(null);
    onSelectTemplate(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hero */}
      <div className="text-center py-10 px-6 border-b border-border bg-linear-to-b from-muted/60 to-background">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-soft mb-4">
          <LayoutTemplate className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Choose a project template
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          No need to start from scratch — choose from dozens of ready-made templates and get your project started quickly.
        </p>
      </div>

      {/* Category filter */}
      <div className="sticky top-0 bg-background border-b border-border px-6 py-3 z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Blank card — always first */}
          <button
            type="button"
            onClick={handleBlank}
            className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all duration-200 min-h-[180px] ${
              selected === null
                ? 'border-brand bg-brand-soft'
                : 'border-border bg-card hover:border-brand-border hover:bg-muted/50'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center group-hover:bg-brand-soft transition-colors">
              <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-brand transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Start blank</p>
              <p className="text-xs text-muted-foreground mt-0.5">Build from scratch</p>
            </div>
          </button>

          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selected === template.id}
              onClick={() => handleSelect(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
