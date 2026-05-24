'use client';

import { cn } from '@/lib/utils';

interface InventoryFormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive layout wrapper for inventory forms.
 * - Desktop: 2-column grid
 * - Mobile: single column
 */
export function InventoryFormLayout({ children, className }: InventoryFormLayoutProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
