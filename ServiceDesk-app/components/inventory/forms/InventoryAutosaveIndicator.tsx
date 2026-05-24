'use client';

import { CheckCircle, AlertCircle, Loader2, CloudOff } from 'lucide-react';
import type { AutosaveStatus } from './types/inventory-form.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface InventoryAutosaveIndicatorProps {
  status: AutosaveStatus;
  className?: string;
}

const statusIcons: Record<AutosaveStatus, { icon: React.ElementType; color: string }> = {
  idle: { icon: CloudOff, color: 'text-muted-foreground/50' },
  saving: { icon: Loader2, color: 'text-muted-foreground' },
  saved: { icon: CheckCircle, color: 'text-success' },
  error: { icon: AlertCircle, color: 'text-destructive' },
};

/**
 * Small status badge showing autosave state.
 */
export function InventoryAutosaveIndicator({ status, className }: InventoryAutosaveIndicatorProps) {
  const { t } = useLanguage();
  if (status === 'idle') return null;

  const labels: Record<Exclude<AutosaveStatus, 'idle'>, string> = {
    saving: t('inventory.autosave.saving'),
    saved: t('inventory.autosave.saved'),
    error: t('inventory.autosave.error'),
  };

  const config = statusIcons[status];
  const Icon = config.icon;
  const label = labels[status as Exclude<AutosaveStatus, 'idle'>];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', config.color, className)}>
      <Icon className={cn('w-3.5 h-3.5', status === 'saving' && 'animate-spin')} aria-hidden="true" />
      {label}
    </span>
  );
}
