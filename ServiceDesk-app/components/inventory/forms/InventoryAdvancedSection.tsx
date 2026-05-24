'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryAdvancedSectionProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Collapsible "Advanced options" section.
 */
export function InventoryAdvancedSection({
  children,
  label = 'Advanced Options',
  className,
  defaultOpen = false,
}: InventoryAdvancedSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('col-span-full', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {label}
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 border-t border-border/50 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
